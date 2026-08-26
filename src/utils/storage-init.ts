import { supabase } from "@/integrations/supabase/client";

export async function ensureBucketsExist() {
  // Since we've pre-created the buckets via tools, this is just a sanity check 
  // and we'll log errors if we can't reach them.
  const buckets = ['avatars', 'rewards'];
  
  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.getBucket(bucket);
    if (error) {
      console.warn(`Bucket ${bucket} check error (might not be an issue if RLS is tight):`, error.message);
    } else if (!data) {
      console.log(`Bucket ${bucket} not found in metadata.`);
    }
  }
}

