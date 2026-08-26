import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const assignUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "moderator", "user", "task_manager", "tasker"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Server-side authorization: the caller must be an authenticated admin.
    // Verified with the caller's own JWT-scoped client before any privileged write.
    const { data: isAdmin, error: roleError } = await (supabase.rpc as any)("has_role", {
      _user_id: userId,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      throw new Error("Unauthorized: admin role required");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (data.role === "user") {
      // Remove specific roles to reset to 'user'
      const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);

      if (error) throw new Error(error.message);
      return { success: true };
    }

    // Upsert the role
    const { error } = await supabaseAdmin.from("user_roles").upsert(
      {
        user_id: data.userId,
        role: data.role,
      },
      { onConflict: "user_id,role" },
    );

    if (error) throw new Error(error.message);

    return { success: true };
  });
