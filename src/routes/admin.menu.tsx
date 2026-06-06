import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/menu")({ component: MenuAdmin });

function MenuAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ name:"", url:"", icon:"" });
  const load = () => supabase.from("menus").select("*").order("sort_order").then(({data}) => setItems(data ?? []));
  useEffect(() => { load(); }, []);
  const add = async () => {
    if (!form.name || !form.url) return;
    const { error } = await supabase.from("menus").insert({ ...form, sort_order: items.length });
    if (error) return toast.error(error.message);
    setForm({name:"",url:"",icon:""}); load();
  };
  const remove = async (id: string) => { await supabase.from("menus").delete().eq("id", id); load(); };
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Header Menu</h1>
      <div className="bg-card border border-border rounded-xl p-4 mb-6 flex gap-2 flex-wrap">
        <Input placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="max-w-xs" />
        <Input placeholder="URL" value={form.url} onChange={e=>setForm({...form,url:e.target.value})} className="max-w-xs" />
        <Input placeholder="Icon (optional)" value={form.icon} onChange={e=>setForm({...form,icon:e.target.value})} className="max-w-xs" />
        <Button onClick={add}><Plus className="h-4 w-4 mr-2" />Add</Button>
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground"><tr><th className="text-left p-3">Name</th><th className="text-left p-3">URL</th><th className="text-left p-3">Icon</th><th className="p-3"></th></tr></thead>
          <tbody>
            {items.map(m => (
              <tr key={m.id} className="border-t border-border">
                <td className="p-3">{m.name}</td><td className="p-3 text-muted-foreground">{m.url}</td><td className="p-3 text-muted-foreground">{m.icon ?? "—"}</td>
                <td className="p-3 text-right"><Button size="icon" variant="ghost" onClick={()=>remove(m.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}