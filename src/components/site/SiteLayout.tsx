import { useEffect, useState, type ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { Maintenance } from "./Maintenance";

export function SiteLayout({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<{ live: boolean; title: string; message: string } | null>(null);

  useEffect(() => {
    supabase
      .from("settings")
      .select("site_status,maintenance_title,maintenance_message")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        setStatus({
          live: data?.site_status ?? true,
          title: data?.maintenance_title ?? "We will be back soon",
          message: data?.maintenance_message ?? "",
        });
      });
  }, []);

  if (status && !status.live) {
    return <Maintenance title={status.title} message={status.message} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 animate-fade-in">{children}</main>
      <SiteFooter />
    </div>
  );
}