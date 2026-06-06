import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({ component: SettingsAdmin });

function SettingsAdmin() {
  const [s, setS] = useState<any>(null);
  useEffect(() => { supabase.from("settings").select("*").eq("id",1).maybeSingle().then(({data}) => setS(data)); }, []);
  const save = async () => {
    const { id, updated_at, ...rest } = s ?? {};
    const { error } = await supabase.from("settings").update(rest).eq("id", 1);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };
  if (!s) return <div className="p-6 text-muted-foreground">Loading...</div>;
  const set = (k: string, v: any) => setS({ ...s, [k]: v });
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Site Settings</h1>
      <div className="space-y-6">
        <section className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Site Status</h2>
          <div className="flex items-center justify-between">
            <Label>{s.site_status ? "Site is LIVE" : "Site is in MAINTENANCE"}</Label>
            <Switch checked={s.site_status} onCheckedChange={v=>set("site_status",v)} />
          </div>
        </section>
        <section className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Maintenance Page</h2>
          <div><Label>Title</Label><Input value={s.maintenance_title} onChange={e=>set("maintenance_title",e.target.value)} /></div>
          <div><Label>Message</Label><Textarea value={s.maintenance_message} onChange={e=>set("maintenance_message",e.target.value)} /></div>
          <div className="flex items-center justify-between"><Label>Particles animation</Label><Switch checked={s.animation_particles} onCheckedChange={v=>set("animation_particles",v)} /></div>
          <div className="flex items-center justify-between"><Label>Gradient animation</Label><Switch checked={s.animation_gradient} onCheckedChange={v=>set("animation_gradient",v)} /></div>
          <div className="flex items-center justify-between"><Label>Floating icons</Label><Switch checked={s.animation_floating_icons} onCheckedChange={v=>set("animation_floating_icons",v)} /></div>
        </section>
        <section className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">SEO</h2>
          <div><Label>Site title</Label><Input value={s.site_title} onChange={e=>set("site_title",e.target.value)} /></div>
          <div><Label>Description</Label><Textarea value={s.site_description} onChange={e=>set("site_description",e.target.value)} /></div>
        </section>
        <Button onClick={save}>Save changes</Button>
      </div>
    </div>
  );
}