import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/slider")({ component: SliderAdmin });

function SliderAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const load = () => (supabase as any).from("hero_slides").select("*").order("sort_order").then(({data}: any) => setItems(data ?? []));
  useEffect(() => { load(); }, []);
  const update = async (id: string, patch: any) => {
    setItems(prev => prev.map((s: any) => s.id === id ? { ...s, ...patch } : s));
    const { error } = await (supabase as any).from("hero_slides").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  };
  const remove = async (id: string) => {
    setItems(prev => prev.filter((s: any) => s.id !== id));
    const { error } = await (supabase as any).from("hero_slides").delete().eq("id", id);
    if (error) toast.error(error.message);
  };
  const add = async () => {
    const { data, error } = await (supabase as any).from("hero_slides").insert({ title: "New slide", image_url: "https://picsum.photos/1600/700", sort_order: items.length+1 }).select().single();
    if (error) return toast.error(error.message);
    setItems(prev => [...prev, data]);
  };
  return (
    <div className="p-6 max-w-5xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Homepage Slider</h1>
        <Button onClick={add}><Plus className="h-4 w-4 mr-1" />Add slide</Button>
      </div>
      <div className="space-y-3">
        {items.map(s => (
          <div key={s.id} className="bg-card border border-border rounded-xl p-4 grid md:grid-cols-[120px_1fr_120px_80px_80px] gap-3 items-center">
            <img src={s.image_url} className="h-16 w-28 object-cover rounded" alt={s.title} />
            <div className="space-y-2">
              <div><Label>Title</Label><Input defaultValue={s.title} onBlur={e=>update(s.id,{title:e.target.value})} /></div>
              <div><Label>Subtitle</Label><Input defaultValue={s.subtitle ?? ""} onBlur={e=>update(s.id,{subtitle:e.target.value})} /></div>
              <div><Label>Image URL</Label><Input defaultValue={s.image_url} onBlur={e=>update(s.id,{image_url:e.target.value})} /></div>
              <div><Label>Link URL</Label><Input defaultValue={s.link_url ?? ""} onBlur={e=>update(s.id,{link_url:e.target.value})} placeholder="/video/uuid or https://..." /></div>
            </div>
            <div><Label>Sort</Label><Input type="number" defaultValue={s.sort_order} onBlur={e=>update(s.id,{sort_order:Number(e.target.value)})} /></div>
            <div className="flex flex-col items-center"><Label className="text-xs">Active</Label><Switch checked={s.is_active} onCheckedChange={v=>update(s.id,{is_active:v})} /></div>
            <Button size="icon" variant="ghost" onClick={()=>remove(s.id)}><Trash2 className="h-4 w-4" /></Button>
          </div>
        ))}
        {items.length===0 && <p className="text-muted-foreground">No slides yet. Click Add slide.</p>}
      </div>
    </div>
  );
}