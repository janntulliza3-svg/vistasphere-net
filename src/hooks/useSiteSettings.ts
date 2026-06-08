import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  site_title: string;
  site_description: string;
  favicon_url: string | null;
  telegram_bot_username: string;
  site_status: boolean;
  maintenance_title: string;
  maintenance_message: string;
};

let cache: SiteSettings | null = null;
const listeners = new Set<(s: SiteSettings) => void>();

export async function loadSiteSettings(): Promise<SiteSettings> {
  const { data } = await (supabase as any).from("settings").select("*").eq("id", 1).maybeSingle();
  cache = {
    site_title: data?.site_title ?? "StreamBD",
    site_description: data?.site_description ?? "",
    favicon_url: data?.favicon_url ?? null,
    telegram_bot_username: data?.telegram_bot_username ?? "vipdesi_bot",
    site_status: data?.site_status ?? true,
    maintenance_title: data?.maintenance_title ?? "We will be back soon",
    maintenance_message: data?.maintenance_message ?? "",
  };
  listeners.forEach(l => l(cache!));
  return cache;
}

export function useSiteSettings() {
  const [s, setS] = useState<SiteSettings | null>(cache);
  useEffect(() => {
    if (!cache) loadSiteSettings();
    listeners.add(setS);
    return () => { listeners.delete(setS); };
  }, []);
  return s;
}