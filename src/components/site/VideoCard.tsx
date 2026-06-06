import { Link } from "@tanstack/react-router";
import { Eye, Clock } from "lucide-react";
import { formatViews, timeAgo } from "@/lib/format";

export interface VideoCardData {
  id: string;
  title: string;
  thumbnail_url: string;
  views: number | null;
  duration?: string | null;
  created_at: string;
}

export function VideoCard({ v, onRemove }: { v: VideoCardData; onRemove?: () => void }) {
  return (
    <div className="card-hover rounded-xl bg-card border border-border overflow-hidden group relative">
      {onRemove && (
        <button
          onClick={(e) => { e.preventDefault(); onRemove(); }}
          className="absolute top-2 right-2 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center text-foreground/80 hover:text-primary"
          aria-label="Remove"
        >×</button>
      )}
      <Link to="/video/$id" params={{ id: v.id }} className="block">
        <div className="relative aspect-video bg-muted overflow-hidden">
          <img
            src={v.thumbnail_url}
            alt={v.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {v.duration && (
            <span className="absolute top-2 right-2 bg-background/85 text-foreground text-xs px-2 py-0.5 rounded">
              {v.duration}
            </span>
          )}
        </div>
        <div className="p-3">
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug mb-2">{v.title}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {formatViews(v.views)}</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {timeAgo(v.created_at)}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}