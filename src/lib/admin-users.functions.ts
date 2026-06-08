import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function ensureAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (!data) throw new Error("Forbidden");
  return supabaseAdmin;
}

export const listUsers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const admin = await ensureAdmin(context.userId);
    const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const ids = list.users.map(u => u.id);
    const { data: profiles } = ids.length
      ? await admin.from("profiles").select("*").in("user_id", ids)
      : { data: [] as any[] };
    const { data: roles } = ids.length
      ? await admin.from("user_roles").select("user_id,role").in("user_id", ids)
      : { data: [] as any[] };
    const map = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
    const roleMap = new Map<string, string[]>();
    for (const r of (roles ?? []) as any[]) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }
    return list.users.map(u => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      profile: map.get(u.id) ?? null,
      roles: roleMap.get(u.id) ?? [],
    }));
  });

export const createUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; password: string }) =>
    z.object({ email: z.string().email(), password: z.string().min(6).max(72) }).parse(d))
  .handler(async ({ context, data }) => {
    const admin = await ensureAdmin(context.userId);
    const { data: created, error } = await admin.auth.admin.createUser({
      email: data.email, password: data.password, email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { id: created.user?.id };
  });

export const deleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const admin = await ensureAdmin(context.userId);
    const { error } = await admin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateUserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; status?: string; plan?: string; plan_expires_at?: string | null }) =>
    z.object({
      userId: z.string().uuid(),
      status: z.enum(["active","banned","restricted"]).optional(),
      plan: z.enum(["free","paid"]).optional(),
      plan_expires_at: z.string().nullable().optional(),
    }).parse(d))
  .handler(async ({ context, data }) => {
    const admin = await ensureAdmin(context.userId);
    const patch: any = {};
    if (data.status) patch.status = data.status;
    if (data.plan) patch.plan = data.plan;
    if (data.plan_expires_at !== undefined) patch.plan_expires_at = data.plan_expires_at;
    const { error } = await admin.from("profiles").update(patch).eq("user_id", data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const incrementVideoView = createServerFn({ method: "POST" })
  .inputValidator((d: { videoId: string }) => z.object({ videoId: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.rpc("increment_video_views", { _video_id: data.videoId });
    return { ok: true };
  });