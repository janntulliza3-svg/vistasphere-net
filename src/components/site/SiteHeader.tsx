import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Search, User as UserIcon, PlayCircle, Menu as MenuIcon, Crown } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const settings = useSiteSettings();
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    (supabase as any).from("profiles").select("username,plan,plan_expires_at,avatar_url").eq("user_id", user.id).maybeSingle().then(({ data }: any) => setProfile(data));
  }, [user]);

  const isPaid = profile?.plan === "paid" && (!profile?.plan_expires_at || new Date(profile.plan_expires_at) > new Date());

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    navigate({ to: "/search", search: { q: q.trim() } as any });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center gap-4 px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <PlayCircle className="h-6 w-6 text-primary" />
          <span>{settings?.site_title ?? "StreamBD"}</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground ml-4">
          <Link to="/" activeProps={{ className: "text-foreground" }} activeOptions={{ exact: true }} className="hover:text-foreground transition">Home</Link>
          <Link to="/trending" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition">Trending</Link>
          <Link to="/watch-later" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition">Watch Later</Link>
          <Link to="/history" activeProps={{ className: "text-foreground" }} className="hover:text-foreground transition">History</Link>
        </nav>

        <form onSubmit={onSubmit} className="flex-1 max-w-xl mx-auto relative hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search videos..." className="pl-10" />
        </form>

        <div className="flex items-center gap-2 ml-auto">
          {user && !isPaid && (
            <Link to="/profile" hash="subscribe" className="hidden sm:block">
              <Button size="sm" className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold hover:opacity-90">
                <Crown className="h-4 w-4 mr-1" /> Subscribe
              </Button>
            </Link>
          )}
          {user ? (
            <Link to="/profile" className="flex items-center">
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold ${isPaid ? "bg-yellow-400 text-black ring-2 ring-yellow-300" : "bg-primary/20 text-primary"}`}>
                {(profile?.username || user.email || "?").slice(0,2).toUpperCase()}
              </div>
            </Link>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm"><UserIcon className="h-4 w-4 mr-1" /> Sign in</Button>
            </Link>
          )}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-full">
                <MenuIcon className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px]">
              <div className="flex flex-col gap-4 mt-8">
                <Link to="/" className="text-lg">Home</Link>
                <Link to="/trending" className="text-lg">Trending</Link>
                <Link to="/watch-later" className="text-lg">Watch Later</Link>
                <Link to="/history" className="text-lg">History</Link>
                {user ? <Link to="/profile" className="text-lg">Profile</Link> : <Link to="/auth" className="text-lg">Sign in</Link>}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}