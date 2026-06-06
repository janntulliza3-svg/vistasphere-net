import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/ads")({ component: AdsAdmin });

function AdsAdmin() {
  const [ads, setAds] = useState<any[]>([]);
  const load = () => supabase.from("ads").select("*").order("position").then(({data}) => setAds(data ?? []));
  useEffect(() => { load(); }, []);
  const save = async (a: any) => { const { error } = await supabase.from("ads").update({ ad_code:a.ad_code, is_active:a.is_active, popunder_url:a.popunder_url, once_per_user:a.once_per_user }).eq("id", a.id); if (error) toast.error(error.message); else toast.success("Saved"); };
  const update = (id: string, patch: any) => setAds(ads.map(a => a.id===id ? { ...a, ...patch } : a));
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Ads Manager</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ads.map(a => (
          <div key={a.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold capitalize">{a.position} Ad</h3>
              <Switch checked={a.is_active} onCheckedChange={v=>update(a.id, { is_active: v })} />
            </div>
            <Textarea value={a.ad_code ?? ""} onChange={e=>update(a.id, {ad_code:e.target.value})} placeholder="Ad HTML/JS code..." className="font-mono text-xs min-h-24" />
            {a.position === "popunder" && (
              <>
                <div><Label>Popunder URL</Label><Input value={a.popunder_url ?? ""} onChange={e=>update(a.id, {popunder_url:e.target.value})} /></div>
                <div className="flex items-center justify-between"><Label>Once per user</Label><Switch checked={a.once_per_user} onCheckedChange={v=>update(a.id,{once_per_user:v})} /></div>
              </>
            )}
            <Button size="sm" onClick={()=>save(a)}>Save</Button>
          </div>
        ))}
      </div>
    </div>
  );
}