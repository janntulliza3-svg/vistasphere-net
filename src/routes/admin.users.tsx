import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Ban, Crown, Shield, Plus } from "lucide-react";
import { listUsers, createUser, deleteUser, updateUserProfile } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/admin/users")({ component: UsersAdmin });

function UsersAdmin() {
  const _list = useServerFn(listUsers);
  const _create = useServerFn(createUser);
  const _delete = useServerFn(deleteUser);
  const _update = useServerFn(updateUserProfile);
  const [items, setItems] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try { setItems(await _list({} as any)); } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };
  useEffect(() => {
    load();
    (supabase as any).from("subscription_plans").select("*").eq("is_active", true).order("sort_order")
      .then(({ data }: any) => setPlans(data ?? []));
  }, []);

  // Optimistic local patch — no full reload
  const patchLocal = (id: string, patch: any) =>
    setItems(items => items.map(u => u.id === id ? { ...u, profile: { ...(u.profile ?? {}), ...patch } } : u));

  const add = async () => {
    try { await _create({ data: { email, password } }); setEmail(""); setPassword(""); toast.success("User added"); await load(); }
    catch (e: any) { toast.error(e.message); }
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try { await _delete({ data: { userId: id } }); setItems(items => items.filter(u => u.id !== id)); toast.success("Deleted"); } catch (e: any) { toast.error(e.message); }
  };
  const setStatus = async (id: string, status: string) => {
    patchLocal(id, { status });
    try { await _update({ data: { userId: id, status: status as any } }); toast.success("Status updated"); }
    catch (e: any) { toast.error(e.message); }
  };
  const assignPlan = async (id: string, planId: string) => {
    if (planId === "free") {
      patchLocal(id, { plan: "free", plan_expires_at: null });
      try { await _update({ data: { userId: id, plan: "free", plan_expires_at: null } }); toast.success("Set to Free"); }
      catch (e: any) { toast.error(e.message); }
      return;
    }
    const p = plans.find(x => x.id === planId);
    if (!p) return;
    const expires = new Date(Date.now() + p.duration_months * 30 * 24 * 3600 * 1000).toISOString();
    patchLocal(id, { plan: "paid", plan_expires_at: expires });
    try { await _update({ data: { userId: id, planId } }); toast.success(`Activated: ${p.name}`); }
    catch (e: any) { toast.error(e.message); }
  };

  const filtered = items.filter(u => !filter || (u.email ?? "").toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">Users ({items.length})</h1>
        <div className="flex gap-2 items-center">
          <Input placeholder="Filter by email" value={filter} onChange={e=>setFilter(e.target.value)} className="w-64" />
          <Dialog>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Add user</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add user</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Email</Label><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
                <div><Label>Password</Label><Input type="text" value={password} onChange={e=>setPassword(e.target.value)} /></div>
              </div>
              <DialogFooter><Button onClick={add}>Create</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {loading ? <p className="text-muted-foreground">Loading...</p> : (
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground">
              <tr><th className="text-left p-3">Email</th><th className="text-left p-3">Username</th><th className="text-left p-3">Plan</th><th className="text-left p-3">Status</th><th className="text-left p-3">Role</th><th className="p-3"></th></tr>
            </thead>
            <tbody>
              {filtered.map(u => {
                const isPaid = u.profile?.plan === "paid";
                return (
                  <tr key={u.id} className="border-t border-border">
                    <td className="p-3">{u.email}</td>
                    <td className="p-3 text-muted-foreground">{u.profile?.username ?? "-"}</td>
                    <td className="p-3">
                      <Select value={isPaid ? "__paid__" : "free"} onValueChange={(v) => assignPlan(u.id, v)}>
                        <SelectTrigger className="w-44"><SelectValue placeholder="Assign plan" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          {isPaid && <SelectItem value="__paid__" disabled>Paid (current)</SelectItem>}
                          {plans.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name} — {p.duration_months}m ({p.price} {p.currency})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isPaid && <div className="text-xs text-yellow-500 flex items-center gap-1 mt-1"><Crown className="h-3 w-3" /> Gold{u.profile?.plan_expires_at ? ` · until ${new Date(u.profile.plan_expires_at).toLocaleDateString("en-GB")}` : ""}</div>}
                    </td>
                    <td className="p-3">
                      <Select value={u.profile?.status ?? "active"} onValueChange={(v) => setStatus(u.id, v)}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="restricted">Restricted</SelectItem>
                          <SelectItem value="banned">Banned</SelectItem>
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-3">
                      {u.roles.includes("admin") ? <span className="inline-flex items-center gap-1 text-xs font-bold text-primary"><Shield className="h-3 w-3" />Admin</span> : <span className="text-xs text-muted-foreground">User</span>}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="icon" variant="ghost" onClick={() => remove(u.id)}><Trash2 className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No users.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}