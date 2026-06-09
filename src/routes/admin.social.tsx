import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import { Trash2, Plus, Save } from "lucide-react";

export const Route = createFileRoute("/admin/social")({
  head: () => ({ meta: [{ title: "Social Links — Admin" }, { name: "robots", content: "noindex" }] }),
  component: AdminSocialPage,
});

type SocialLink = {
  id: string;
  platform: string;
  url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

const ICON_SUGGESTIONS = ["Facebook", "Twitter", "Instagram", "Youtube", "Linkedin", "Github", "Twitch", "Send", "MessageCircle", "Link"];

function renderIcon(name: string) {
  const Icon = (Icons as any)[name] ?? Icons.Link;
  return <Icon className="h-4 w-4" />;
}

function AdminSocialPage() {
  const [items, setItems] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItem, setNewItem] = useState({ platform: "", url: "", icon: "Link" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("social_links").select("*").order("sort_order", { ascending: true });
    if (error) toast.error(error.message);
    else setItems((data as SocialLink[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const add = async () => {
    if (!newItem.platform.trim() || !newItem.url.trim()) {
      toast.error("Platform and URL are required");
      return;
    }
    const sort_order = items.length ? Math.max(...items.map(i => i.sort_order)) + 1 : 1;
    const { data, error } = await supabase.from("social_links").insert({
      platform: newItem.platform.trim(),
      url: newItem.url.trim(),
      icon: newItem.icon.trim() || "Link",
      sort_order,
      is_active: true,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setItems(prev => [...prev, data as SocialLink]);
    setNewItem({ platform: "", url: "", icon: "Link" });
    toast.success("Social link added");
  };

  const update = async (id: string, patch: Partial<SocialLink>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const save = async (item: SocialLink) => {
    const { error } = await supabase.from("social_links").update({
      platform: item.platform,
      url: item.url,
      icon: item.icon,
      sort_order: item.sort_order,
      is_active: item.is_active,
      updated_at: new Date().toISOString(),
    }).eq("id", item.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
  };

  const toggle = async (item: SocialLink, is_active: boolean) => {
    await update(item.id, { is_active });
    const { error } = await supabase.from("social_links").update({ is_active }).eq("id", item.id);
    if (error) toast.error(error.message);
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this social link?")) return;
    const { error } = await supabase.from("social_links").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    setItems(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Social Links</h1>
        <p className="text-sm text-muted-foreground">Manage the social media icons shown in the site footer.</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Add new link</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Platform</Label>
            <Input value={newItem.platform} onChange={e => setNewItem(s => ({ ...s, platform: e.target.value }))} placeholder="Facebook" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">URL</Label>
            <Input value={newItem.url} onChange={e => setNewItem(s => ({ ...s, url: e.target.value }))} placeholder="https://facebook.com/yourpage" />
          </div>
          <div>
            <Label className="text-xs">Icon</Label>
            <Input list="icon-list" value={newItem.icon} onChange={e => setNewItem(s => ({ ...s, icon: e.target.value }))} placeholder="Facebook" />
            <datalist id="icon-list">
              {ICON_SUGGESTIONS.map(n => <option key={n} value={n} />)}
            </datalist>
          </div>
        </div>
        <Button onClick={add} className="bg-primary hover:bg-primary/90"><Plus className="h-4 w-4 mr-2" />Add link</Button>
        <p className="text-xs text-muted-foreground">Icon name is a Lucide icon. Suggestions: {ICON_SUGGESTIONS.join(", ")}.</p>
      </div>

      <div className="rounded-lg border border-border bg-card divide-y divide-border">
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-sm text-muted-foreground">No social links yet.</div>
        ) : items.map(item => (
          <div key={item.id} className="p-4 grid grid-cols-1 md:grid-cols-[auto_1fr_2fr_1fr_auto_auto_auto] gap-3 items-center">
            <div className="h-9 w-9 rounded-md bg-secondary/50 flex items-center justify-center text-primary">
              {renderIcon(item.icon)}
            </div>
            <Input value={item.platform} onChange={e => update(item.id, { platform: e.target.value })} />
            <Input value={item.url} onChange={e => update(item.id, { url: e.target.value })} />
            <Input value={item.icon} onChange={e => update(item.id, { icon: e.target.value })} list="icon-list" />
            <Input type="number" className="w-20" value={item.sort_order} onChange={e => update(item.id, { sort_order: Number(e.target.value) || 0 })} />
            <div className="flex items-center gap-2">
              <Switch checked={item.is_active} onCheckedChange={(v) => toggle(item, v)} />
              <span className="text-xs text-muted-foreground">{item.is_active ? "Active" : "Off"}</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => save(item)}><Save className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => remove(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}