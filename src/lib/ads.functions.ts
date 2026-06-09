import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Updating ad rows via the browser Supabase client often gets blocked by
// Cloudflare/WAF when the body contains <script> tags ("TypeError: Failed
// to fetch"). Routing through a server function (Base64 encoded) avoids it.
export const updateAd = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; ad_code_b64?: string; popunder_url?: string | null; is_active?: boolean; once_per_user?: boolean }) =>
    z.object({
      id: z.string().uuid(),
      ad_code_b64: z.string().max(200_000).optional(),
      popunder_url: z.string().max(2000).nullable().optional(),
      is_active: z.boolean().optional(),
      once_per_user: z.boolean().optional(),
    }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
    if (!roleRow) throw new Error("Forbidden");
    const patch: { ad_code?: string | null; popunder_url?: string | null; is_active?: boolean; once_per_user?: boolean } = {};
    if (data.ad_code_b64 !== undefined) {
      patch.ad_code = data.ad_code_b64 ? Buffer.from(data.ad_code_b64, "base64").toString("utf-8") : null;
    }
    if (data.popunder_url !== undefined) patch.popunder_url = data.popunder_url;
    if (data.is_active !== undefined) patch.is_active = data.is_active;
    if (data.once_per_user !== undefined) patch.once_per_user = data.once_per_user;
    const { error } = await supabaseAdmin.from("ads").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });