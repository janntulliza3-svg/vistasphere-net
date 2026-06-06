import { createServerFn } from "@tanstack/react-start";

export const getSiteStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("settings")
    .select("site_status, maintenance_title, maintenance_message, animation_particles, animation_gradient, animation_floating_icons, site_title")
    .eq("id", 1)
    .maybeSingle();
  return data ?? { site_status: true, maintenance_title: "We will be back soon", maintenance_message: "", animation_particles: true, animation_gradient: true, animation_floating_icons: true, site_title: "StreamBD" };
});