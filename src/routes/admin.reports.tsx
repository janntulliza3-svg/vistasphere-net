import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/admin/reports")({ component: ReportsAdmin });

function ReportsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const load = () => (supabase as any).from("reports").select("*, videos(id,title)").order("created_at",{ascending:false}).limit(200).then(({data}: any) => setItems(data ?? []));
  useEffect(() => { load(); }, []);
  const remove = async (id: string) => {
    setItems(prev => prev.filter(r => r.id !== id));
    const { error } = await (supabase as any).from("reports").delete().eq("id", id);
    if (error) toast.error(error.message); else toast.success("Deleted");
  };
  const resolve = async (id: string) => {
    setItems(prev => prev.map(r => r.id === id ? { ...r, status: "resolved" } : r));
    const { error } = await (supabase as any).from("reports").update({ status: "resolved" }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Resolved");
  };
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Reports ({items.length})</h1>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground"><tr><th className="text-left p-3">Video</th><th className="text-left p-3">Reason</th><th className="text-left p-3">Status</th><th className="text-left p-3">When</th><th className="p-3"></th></tr></thead>
          <tbody>
            {items.map(r => (
              <tr key={r.id} className="border-t border-border">
                <td className="p-3">{r.videos?.id ? <Link to="/video/$id" params={{ id: r.videos.id }} className="text-primary hover:underline">{r.videos.title}</Link> : <span className="text-muted-foreground">deleted</span>}</td>
                <td className="p-3">{r.reason}</td>
                <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${r.status==="resolved"?"bg-green-500/20 text-green-400":"bg-yellow-500/20 text-yellow-400"}`}>{r.status}</span></td>
                <td className="p-3 text-muted-foreground">{timeAgo(r.created_at)}</td>
                <td className="p-3 text-right space-x-1">
                  {r.status !== "resolved" && <Button size="icon" variant="ghost" onClick={()=>resolve(r.id)} title="Resolve"><Check className="h-4 w-4" /></Button>}
                  <Button size="icon" variant="ghost" onClick={()=>remove(r.id)}><Trash2 className="h-4 w-4" /></Button>
                </td>
              </tr>
            ))}
            {items.length===0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No reports yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}