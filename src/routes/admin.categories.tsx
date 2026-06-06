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
  const load = () => supabase.from("categories").select("*, videos(count)").order("sort_order").then(({data}) => setCats(data ?? []));
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("categories").insert({ name: name.trim(), slug: slugify(name) });
    if (error) return toast.error(error.message);
    setName(""); toast.success("Added"); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete category?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Categories</h1>
      <div className="flex gap-2 mb-6 max-w-md">
        <Input value={name} onChange={e=>setName(e.target.value)} placeholder="New category name" />
        <Button onClick={add}><Plus className="h-4 w-4 mr-2" />Add</Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground"><tr><th className="text-left p-3">Name</th><th className="text-left p-3">Slug</th><th className="text-left p-3">Videos</th><th className="p-3"></th></tr></thead>
          <tbody>
            {cats.map(c => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3">{c.name}</td>
                <td className="p-3 text-muted-foreground">{c.slug}</td>
                <td className="p-3">{c.videos?.[0]?.count ?? 0}</td>
                <td className="p-3 text-right"><Button size="icon" variant="ghost" onClick={()=>remove(c.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}