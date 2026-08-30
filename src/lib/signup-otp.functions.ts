import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Creates an unconfirmed account without invoking the auth provider's native
 * confirmation email, then sends the custom six-digit verification code.
 */
export const registerWithSignupOtp = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        email: z.string().trim().email().max(320),
        password: z.string().min(6).max(72),
        username: z
          .string()
          .trim()
          .min(3)
          .max(32)
          .regex(/^[a-z0-9_]+$/),
        fullName: z.string().trim().min(1).max(120),
        referralCode: z.string().trim().max(64).nullish(),
        fingerprint: z.string().trim().max(128).nullish(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const {
      generateOtpCode,
      hashOtpCode,
      sendOtpEmail,
      OTP_TTL_MINUTES,
    } = await import("./signup-otp.server");
    const { getClientIpFromRequest } = await import("./client-ip.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = data.email.toLowerCase();
    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: false,
      user_metadata: {
        username: data.username,
        full_name: data.fullName,
        referral_code_used: data.referralCode || null,
        fingerprint: data.fingerprint || null,
        ip_address: getClientIpFromRequest(),
      },
    });

    if (createError || !created.user) {
      const duplicate = createError?.message.toLowerCase().includes("already");
      throw new Error(
        duplicate
          ? "An account with this email already exists. Please sign in instead."
          : "Unable to create your account. Please try again.",
      );
    }

    const code = generateOtpCode();
    const codeHash = await hashOtpCode(email, code);
    const db = supabaseAdmin as unknown as { from: (table: string) => any };
    const { error: otpError } = await db.from("signup_otps").upsert({
      email,
      code_hash: codeHash,
      expires_at: new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString(),
      attempts: 0,
      created_at: new Date().toISOString(),
    });

    if (otpError) {
      console.error("Failed to store signup OTP:", otpError);
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error("Unable to send verification code. Please try again.");
    }

    try {
      await sendOtpEmail(email, code);
    } catch (error) {
      await db.from("signup_otps").delete().eq("email", email);
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw error;
    }

    return { created: true };
  });

/**
 * Sends a signup verification code to a freshly registered, unconfirmed account.
 * Always returns a neutral result so the endpoint cannot be used to enumerate accounts.
 */
export const sendSignupOtp = createServerFn({ method: "POST" })
  .validator((data) => z.object({ email: z.string().trim().email().max(320) }).parse(data))
  .handler(async ({ data }) => {
    const {
      generateOtpCode,
      hashOtpCode,
      sendOtpEmail,
      OTP_TTL_MINUTES,
      OTP_RESEND_COOLDOWN_SECONDS,
    } = await import("./signup-otp.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = data.email.trim().toLowerCase();
    const db = supabaseAdmin as unknown as {
      from: (table: string) => any;
    };

    const { data: existing } = await db
      .from("signup_otps")
      .select("created_at")
      .eq("email", email)
      .maybeSingle();

    if (existing?.created_at) {
      const elapsed = (Date.now() - new Date(existing.created_at).getTime()) / 1000;
      if (elapsed < OTP_RESEND_COOLDOWN_SECONDS) {
        return { sent: true, cooldown: Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsed) };
      }
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!profile?.id) {
      // Unknown account — stay neutral.
      return { sent: true, cooldown: 0 };
    }

    const { data: userResult } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    if (userResult?.user?.email_confirmed_at) {
      return { sent: true, cooldown: 0 };
    }

    const code = generateOtpCode();
    const codeHash = await hashOtpCode(email, code);

    const { error: upsertError } = await db.from("signup_otps").upsert({
      email,
      code_hash: codeHash,
      expires_at: new Date(Date.now() + OTP_TTL_MINUTES * 60_000).toISOString(),
      attempts: 0,
      created_at: new Date().toISOString(),
    });

    if (upsertError) {
      console.error("Failed to store signup OTP:", upsertError);
      throw new Error("Unable to send verification code. Please try again.");
    }

    await sendOtpEmail(email, code);

    return { sent: true, cooldown: 0 };
  });

/** Verifies a signup code and confirms the account's email address. */
export const verifySignupOtp = createServerFn({ method: "POST" })
  .validator((data) =>
    z
      .object({
        email: z.string().trim().email().max(320),
        code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { hashOtpCode, OTP_MAX_ATTEMPTS } = await import("./signup-otp.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = data.email.trim().toLowerCase();
    const db = supabaseAdmin as unknown as { from: (table: string) => any };

    const { data: record } = await db
      .from("signup_otps")
      .select("code_hash, expires_at, attempts")
      .eq("email", email)
      .maybeSingle();

    const invalid = new Error("Invalid or expired verification code.");

    if (!record) throw invalid;
    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await db.from("signup_otps").delete().eq("email", email);
      throw new Error("Too many attempts. Please request a new code.");
    }
    if (new Date(record.expires_at).getTime() < Date.now()) {
      await db.from("signup_otps").delete().eq("email", email);
      throw invalid;
    }

    const codeHash = await hashOtpCode(email, data.code);
    if (codeHash !== record.code_hash) {
      await db
        .from("signup_otps")
        .update({ attempts: (record.attempts ?? 0) + 1 })
        .eq("email", email);
      throw invalid;
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (!profile?.id) throw invalid;

    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(profile.id, {
      email_confirm: true,
    });

    if (confirmError) {
      console.error("Failed to confirm user email:", confirmError);
      throw new Error("Unable to verify your account. Please try again.");
    }

    await db.from("signup_otps").delete().eq("email", email);

    return { verified: true };
  });
