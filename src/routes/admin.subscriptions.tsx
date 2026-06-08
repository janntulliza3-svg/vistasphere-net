import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/subscriptions")({ component: SubsAdmin });

function SubsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const load = () => (supabase as any).from("subscription_plans").select("*").order("sort_order").then(({data}: any) => setItems(data ?? []));
  useEffect(() => { load(); }, []);
  const update = async (id: string, patch: any) => { const { error } = await (supabase as any).from("subscription_plans").update(patch).eq("id", id); if (error) toast.error(error.message); else load(); };
  const remove = async (id: string) => { await (supabase as any).from("subscription_plans").delete().eq("id", id); toast.success("Deleted"); load(); };
  const add = async () => { await (supabase as any).from("subscription_plans").insert({ name: "New Plan", duration_months: 1, price: 0, sort_order: items.length+1 }); load(); };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Subscription Plans</h1>
        <Button onClick={add}><Plus className="h-4 w-4 mr-1" />Add plan</Button>
      </div>
      <div className="space-y-3">
        {items.map(p => (
          <div key={p.id} className="bg-card border border-border rounded-xl p-4 grid sm:grid-cols-6 gap-3 items-end">
            <div className="sm:col-span-2"><Label>Name</Label><Input defaultValue={p.name} onBlur={e=>update(p.id,{name:e.target.value})} /></div>
            <div><Label>Months</Label><Input type="number" defaultValue={p.duration_months} onBlur={e=>update(p.id,{duration_months:Number(e.target.value)})} /></div>
            <div><Label>Price</Label><Input type="number" defaultValue={p.price} onBlur={e=>update(p.id,{price:Number(e.target.value)})} /></div>
            <div><Label>Currency</Label><Input defaultValue={p.currency} onBlur={e=>update(p.id,{currency:e.target.value})} /></div>
            <div className="flex items-center gap-2 justify-end">
              <Switch checked={p.is_active} onCheckedChange={v=>update(p.id,{is_active:v})} />
              <Button size="icon" variant="ghost" onClick={()=>remove(p.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}