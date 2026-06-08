import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { VideoCard, type VideoCardData } from "@/components/site/VideoCard";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { z } from "zod";

const searchSchema = z.object({ q: z.string().optional() });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Search — StreamBD" }, { name: "description", content: "Search videos on StreamBD." }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [query, setQuery] = useState(q ?? "");
  const [results, setResults] = useState<VideoCardData[]>([]);

  useEffect(() => { setQuery(q ?? ""); }, [q]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("videos")
        .select("id,title,thumbnail_url,views,duration,created_at")
        .eq("status", "active")
        .ilike("title", `%${query}%`)
        .limit(40);
      setResults(data ?? []);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <SiteLayout requireAuth>
      <div className="container mx-auto px-4 py-8">
        <Input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search videos..." className="text-lg h-12 mb-4" />
        <p className="text-sm text-muted-foreground mb-6">
          {query ? `Found ${results.length} result${results.length===1?"":"s"} for "${query}"` : "Type to search."}
        </p>
        {results.length === 0 && query ? (
          <div className="text-center py-16 text-muted-foreground">No results found. Try different keywords.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {results.map(v => <VideoCard key={v.id} v={v} />)}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}