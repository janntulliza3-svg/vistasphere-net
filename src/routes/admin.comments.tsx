import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/admin/comments")({ component: CommentsAdmin });

function CommentsAdmin() {
  const [items, setItems] = useState<any[]>([]);
  const load = () => supabase.from("comments").select("*, videos(title)").order("created_at",{ascending:false}).limit(100).then(({data}) => setItems(data ?? []));
  useEffect(() => { load(); }, []);
  const remove = async (id: string) => {
    setItems(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) toast.error(error.message); else toast.success("Deleted");
  };
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Comments</h1>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground"><tr><th className="text-left p-3">User</th><th className="text-left p-3">Comment</th><th className="text-left p-3">Video</th><th className="text-left p-3">When</th><th className="p-3"></th></tr></thead>
          <tbody>
            {items.map(c => (
              <tr key={c.id} className={`border-t border-border ${c.has_link?"bg-destructive/10":""}`}>
                <td className="p-3">{c.username}</td>
                <td className="p-3 max-w-md truncate">{c.comment}</td>
                <td className="p-3 text-muted-foreground line-clamp-1">{c.videos?.title}</td>
                <td className="p-3 text-muted-foreground">{timeAgo(c.created_at)}</td>
                <td className="p-3 text-right"><Button size="icon" variant="ghost" onClick={()=>remove(c.id)}><Trash2 className="h-4 w-4" /></Button></td>
              </tr>
            ))}
            {items.length===0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No comments yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}