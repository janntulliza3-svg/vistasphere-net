import { useEffect, type ReactNode } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { Maintenance } from "./Maintenance";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings, loadSiteSettings } from "@/hooks/useSiteSettings";

export function SiteLayout({ children, requireAuth = false }: { children: ReactNode; requireAuth?: boolean }) {
  const settings = useSiteSettings();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: s => s.location.pathname });

  useEffect(() => { if (!settings) loadSiteSettings(); }, [settings]);

  useEffect(() => {
    if (!requireAuth) return;
    if (loading) return;
    if (!user) navigate({ to: "/auth", search: { redirect: path } as any });
  }, [requireAuth, loading, user, navigate, path]);

  if (settings && !settings.site_status) {
    return <Maintenance title={settings.maintenance_title} message={settings.maintenance_message} />;
  }

  if (requireAuth && (loading || !user)) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 animate-fade-in">{children}</main>
      <SiteFooter />
    </div>
  );
}