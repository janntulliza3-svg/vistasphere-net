import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Video as VideoIcon, MessageSquare, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const [stats, setStats] = useState({ views: 0, videos: 0, comments: 0, reports: 0 });
  useEffect(() => {
    (async () => {
      const [{ data: v }, { count: vc }, { count: cc }, { count: rc }] = await Promise.all([
        supabase.from("videos").select("views"),
        supabase.from("videos").select("*",{count:"exact",head:true}),
        supabase.from("comments").select("*",{count:"exact",head:true}),
        supabase.from("reports").select("*",{count:"exact",head:true}).eq("status","pending"),
      ]);
      setStats({
        views: (v ?? []).reduce((s, x: any) => s + (x.views ?? 0), 0),
        videos: vc ?? 0, comments: cc ?? 0, reports: rc ?? 0,
      });
    })();
  }, []);

  const cards = [
    { label: "Total Views", value: stats.views, icon: Eye, color: "text-primary" },
    { label: "Total Videos", value: stats.videos, icon: VideoIcon, color: "text-primary" },
    { label: "Total Comments", value: stats.comments, icon: MessageSquare, color: "text-primary" },
    { label: "Pending Reports", value: stats.reports, icon: AlertTriangle, color: stats.reports>0?"text-warning":"text-muted-foreground" },
  ];
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{c.label}</span>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </div>
            <div className="text-3xl font-bold">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}