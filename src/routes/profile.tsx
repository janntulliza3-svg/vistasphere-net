import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Crown, LogOut, KeyRound, User as UserIcon } from "lucide-react";
import { buyPlanLink } from "@/lib/telegram";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile" }, { name: "robots", content: "noindex" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const settings = useSiteSettings();
  const [profile, setProfile] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const [newPass, setNewPass] = useState("");
  const [selected, setSelected] = useState<any | null>(null);

  useEffect(() => {
    if (!user) return;
    (supabase as any).from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }: any) => {
      setProfile(data);
      setUsername(data?.username ?? "");
    });
    (supabase as any).from("subscription_plans").select("*").eq("is_active", true).order("sort_order").then(({ data }: any) => setPlans(data ?? []));
  }, [user]);

  const isPaid = profile?.plan === "paid" && (!profile.plan_expires_at || new Date(profile.plan_expires_at) > new Date());

  const saveProfile = async () => {
    const { error } = await (supabase as any).from("profiles").update({ username, display_name: username }).eq("user_id", user!.id);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  };

  const changePassword = async () => {
    if (newPass.length < 6) return toast.error("Min 6 characters");
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) return toast.error(error.message);
    setNewPass("");
    toast.success("Password updated");
  };

  const logout = async () => { await supabase.auth.signOut(); navigate({ to: "/" }); };

  const goBuy = (plan: any) => {
    const url = buyPlanLink({
      bot: settings?.telegram_bot_username ?? "vipdesi_bot",
      plan: plan.name,
      price: `${plan.price} ${plan.currency}`,
      username: profile?.username ?? user?.email?.split("@")[0],
      email: user?.email,
    });
    window.open(url, "_blank");
  };

  const formatDDMMYYYY = (iso?: string | null) => {
    if (!iso) return "-";
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    return `${dd}/${mm}/${d.getFullYear()}`;
  };

  return (
    <SiteLayout requireAuth>
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Profile card */}
        <section className={`rounded-2xl border p-6 ${isPaid ? "border-yellow-400/60 bg-gradient-to-br from-yellow-500/10 via-amber-500/5 to-card shadow-[0_0_30px_-10px_rgba(250,204,21,0.5)]" : "border-border bg-card"}`}>
          <div className="flex items-center gap-4">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold ${isPaid ? "bg-yellow-400 text-black ring-2 ring-yellow-300" : "bg-primary/20 text-primary"}`}>
              {(profile?.username || user?.email || "?").slice(0,2).toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{profile?.display_name || profile?.username || "Profile"}</h1>
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-yellow-400 text-black"><Crown className="h-3 w-3" /> Gold Member</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">Free</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {isPaid && profile?.plan_expires_at && <p className="text-xs text-muted-foreground mt-1">Expires: {formatDDMMYYYY(profile.plan_expires_at)}</p>}
              {profile?.created_at && <p className="text-xs text-muted-foreground">Joined: {formatDDMMYYYY(profile.created_at)}</p>}
            </div>
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="h-4 w-4 mr-2" />Sign out</Button>
          </div>
        </section>

        {/* Subscription */}
        <section id="subscribe" className="rounded-2xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold mb-1 flex items-center gap-2"><Crown className="h-5 w-5 text-yellow-400" /> Subscription</h2>
          <p className="text-sm text-muted-foreground mb-4">Upgrade for gold membership benefits.</p>
          <div className="grid sm:grid-cols-3 gap-3">
            {plans.map(p => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="rounded-xl p-4 text-left bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 text-black font-semibold shadow-md hover:scale-[1.02] transition"
              >
                <div className="text-sm opacity-80">{p.duration_months} {p.duration_months === 1 ? "Month" : "Months"}</div>
                <div className="text-xl font-bold">{p.name}</div>
                <div className="text-lg mt-1">{p.price} {p.currency}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Edit profile */}
        <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2"><UserIcon className="h-5 w-5" /> Edit profile</h2>
          <div><Label>Username</Label><Input value={username} onChange={e=>setUsername(e.target.value)} /></div>
          <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
          <Button onClick={saveProfile}>Save</Button>
        </section>

        {/* Change password */}
        <section className="rounded-2xl border border-border bg-card p-6 space-y-3">
          <h2 className="text-lg font-bold flex items-center gap-2"><KeyRound className="h-5 w-5" /> Change password</h2>
          <div><Label>New password</Label><Input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} /></div>
          <Button onClick={changePassword}>Update password</Button>
        </section>
      </div>

      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-yellow-400" /> {selected?.name}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            <p>Duration: <strong>{selected?.duration_months} months</strong></p>
            <p>Price: <strong>{selected?.price} {selected?.currency}</strong></p>
            <p className="text-sm text-muted-foreground">Click Buy to message the admin on Telegram with your plan details. Admin will guide you to complete payment.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
            <Button className="bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-bold" onClick={() => { goBuy(selected); setSelected(null); }}>
              Buy via Telegram
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SiteLayout>
  );
}