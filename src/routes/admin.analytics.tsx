import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatViews } from "@/lib/format";

export const Route = createFileRoute("/admin/analytics")({ component: Analytics });

function Analytics() {
  const [top, setTop] = useState<any[]>([]);
  useEffect(() => { supabase.from("videos").select("id,title,thumbnail_url,views").order("views",{ascending:false}).limit(10).then(({data}) => setTop(data ?? [])); }, []);
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <h2 className="p-4 font-semibold border-b border-border">Top Videos</h2>
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs uppercase text-muted-foreground"><tr><th className="text-left p-3">#</th><th className="text-left p-3">Video</th><th className="text-left p-3">Views</th></tr></thead>
          <tbody>
            {top.map((v,i) => (
              <tr key={v.id} className="border-t border-border">
                <td className="p-3 text-muted-foreground">{i+1}</td>
                <td className="p-3 flex items-center gap-3"><img src={v.thumbnail_url} className="h-10 w-16 object-cover rounded" /> {v.title}</td>
                <td className="p-3">{formatViews(v.views)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}