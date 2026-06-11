import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { slugify } from "@/lib/format";

export const Route = createFileRoute("/admin/categories")({ component: CatsAdmin });

function CatsAdmin() {
  const [cats, setCats] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const load = () => supabase.from("categories").select("*, videos(count)").order("sort_order").then(({data}) => setCats(data ?? []));
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!name.trim()) return;
    const { data, error } = await supabase.from("categories").insert({ name: name.trim(), slug: slugify(name), image_url: imageUrl.trim() || null }).select("*, videos(count)").single();
    if (error) return toast.error(error.message);
    setCats(prev => [...prev, data]);
    setName(""); setImageUrl(""); toast.success("Added");
  };
  const remove = async (id: string) => {
    if (!confirm("Delete category?")) return;
    setCats(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) toast.error(error.message);
  };
  const updateImage = async (id: string, current: string | null) => {
    const url = prompt("Paste image URL for this category:", current ?? "");
    if (url === null) return;
    const value = url.trim() || null;
    const { error } = await supabase.from("categories").update({ image_url: value }).eq("id", id);
    if (error) return toast.error(error.message);
    setCats(prev => prev.map(c => c.id === id ? { ...c, image_url: value } : c));
    toast.success("Image updated");
  };
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>
      <div className="grid gap-2 mb-6 max-w-xl">
        <div className="flex gap-2">
          <Input value={name} onChange={e=>setName(e.target.value)} placeholder="New category name" />
          <Button onClick={add}><Plus className="h-4 w-4 mr-2" />Add</Button>
        </div>
        <Input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="Category image URL (optional)" />
        {imageUrl && <img src={imageUrl} alt="" className="h-20 w-32 object-cover rounded-md border border-border" />}
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground"><tr><th className="text-left p-3">Image</th><th className="text-left p-3">Name</th><th className="text-left p-3">Slug</th><th className="text-left p-3">Videos</th><th className="p-3"></th></tr></thead>
          <tbody>
            {cats.map(c => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3">
                  {c.image_url ? (
                    <img src={c.image_url} alt="" className="h-10 w-16 object-cover rounded" />
                  ) : (
                    <div className="h-10 w-16 rounded bg-muted" />
                  )}
                </td>
                <td className="p-3">{c.name}</td>
                <td className="p-3 text-muted-foreground">{c.slug}</td>
                <td className="p-3">{c.videos?.[0]?.count ?? 0}</td>
                <td className="p-3 text-right">
                  <Button size="sm" variant="ghost" onClick={()=>updateImage(c.id, c.image_url)}>Image URL</Button>
                  <Button size="icon" variant="ghost" onClick={()=>remove(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}