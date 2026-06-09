import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Returns current user's profile status (active|restricted|banned).
export const getMyStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data } = await supabase.from("profiles").select("status").eq("user_id", context.userId).maybeSingle();
    return { status: (data?.status as string) ?? "active" };
  });

// Self-restrict: caller is restricted when they post a link in a comment.
export const selfRestrict = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").update({ status: "restricted" }).eq("user_id", context.userId);
    return { ok: true };
  });