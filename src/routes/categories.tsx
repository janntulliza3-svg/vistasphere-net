import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/categories")({
  head: () => ({ meta: [
    { title: "Categories — StreamBD" },
    { name: "description", content: "Browse all categories on StreamBD." },
  ], links: [{ rel: "canonical", href: "/categories" }] }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const [cats, setCats] = useState<any[]>([]);
  useEffect(() => { supabase.from("categories").select("*").order("sort_order").then(({data}) => setCats(data ?? [])); }, []);
  return (
    <SiteLayout requireAuth>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Categories</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cats.map(c => (
            <Link key={c.id} to="/category/$slug" params={{slug:c.slug}} className="card-hover relative h-40 rounded-xl overflow-hidden border border-border bg-card flex items-center justify-center text-xl font-semibold">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/30 to-card" />
              <span className="relative">{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </SiteLayout>
  );
}