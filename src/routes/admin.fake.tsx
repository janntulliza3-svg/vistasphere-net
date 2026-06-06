import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/fake")({ component: FakeAdmin });

function FakeAdmin() {
  const [s, setS] = useState<any>(null);
  useEffect(() => { supabase.from("fake_settings").select("*").eq("id",1).maybeSingle().then(({data}) => setS(data)); }, []);
  const set = (k:string,v:any) => setS({...s,[k]:v});
  const save = async () => { const { id, updated_at, ...rest } = s; const { error } = await supabase.from("fake_settings").update(rest).eq("id",1); if (error) toast.error(error.message); else toast.success("Saved"); };
  if (!s) return <div className="p-6 text-muted-foreground">Loading...</div>;
  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Fake Settings</h1>
      <div className="space-y-6">
        <section className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Fake Likes</h2>
          <div className="flex items-center justify-between"><Label>Enable</Label><Switch checked={s.enable_fake_likes} onCheckedChange={v=>set("enable_fake_likes",v)} /></div>
          <div><Label>Multiplier</Label><Input type="number" min={1} max={100} value={s.like_multiplier} onChange={e=>set("like_multiplier",Number(e.target.value))} /></div>
          <div className="flex items-center justify-between"><Label>Random ±10% variation</Label><Switch checked={s.random_variation} onCheckedChange={v=>set("random_variation",v)} /></div>
        </section>
        <section className="bg-card border border-border rounded-xl p-5 space-y-3">
          <h2 className="font-semibold">Fake Comments</h2>
          <div className="flex items-center justify-between"><Label>Enable</Label><Switch checked={s.enable_fake_comments} onCheckedChange={v=>set("enable_fake_comments",v)} /></div>
          <div><Label>Per video count</Label><Input type="number" value={s.fake_comments_per_video} onChange={e=>set("fake_comments_per_video",Number(e.target.value))} /></div>
          <div><Label>Mix ratio: {s.mix_ratio}% fake</Label><Slider value={[s.mix_ratio]} max={100} step={5} onValueChange={([v])=>set("mix_ratio",v)} /></div>
          <div><Label>Templates (one per line)</Label><Textarea rows={6} value={s.templates} onChange={e=>set("templates",e.target.value)} /></div>
          <div className="flex items-center justify-between"><Label>Auto 4–5 star ratings</Label><Switch checked={s.auto_star_rating} onCheckedChange={v=>set("auto_star_rating",v)} /></div>
          <div className="flex items-center justify-between"><Label>Random usernames</Label><Switch checked={s.random_usernames} onCheckedChange={v=>set("random_usernames",v)} /></div>
          <div className="flex items-center justify-between"><Label>Random timestamps</Label><Switch checked={s.random_timestamps} onCheckedChange={v=>set("random_timestamps",v)} /></div>
        </section>
        <Button onClick={save}>Save changes</Button>
      </div>
    </div>
  );
}