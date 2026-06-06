import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, Video, Folder, MessageSquare, Megaphone, MenuIcon, Settings, Sparkles, BarChart3, LogOut, PlayCircle } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — StreamBD" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const nav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/videos", label: "Videos", icon: Video },
  { to: "/admin/categories", label: "Categories", icon: Folder },
  { to: "/admin/comments", label: "Comments", icon: MessageSquare },
  { to: "/admin/ads", label: "Ads Manager", icon: Megaphone },
  { to: "/admin/menu", label: "Header Menu", icon: MenuIcon },
  { to: "/admin/settings", label: "Site Settings", icon: Settings },
  { to: "/admin/fake", label: "Fake Settings", icon: Sparkles },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
] as const;

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: s => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [user, isAdmin, loading, navigate]);

  if (loading || !user || !isAdmin) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Checking access...</div>;

  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-60 bg-sidebar border-r border-sidebar-border flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-2 px-4 font-bold border-b border-sidebar-border">
          <PlayCircle className="h-5 w-5 text-primary" /> StreamBD
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map(n => {
            const active = n.exact ? path === n.to : path.startsWith(n.to);
            const Icon = n.icon;
            return (
              <Link key={n.to} to={n.to as any} className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition ${active?"bg-sidebar-accent text-primary border-l-2 border-primary":"text-sidebar-foreground/80 hover:bg-sidebar-accent"}`}>
                <Icon className="h-4 w-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <Button variant="ghost" className="m-2 justify-start" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Logout</Button>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}