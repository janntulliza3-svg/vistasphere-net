import { Link } from "@tanstack/react-router";
import { PlayCircle, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border mt-16 bg-card/30">
      <div className="container mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div>
          <Link to="/" className="flex items-center gap-2 font-bold text-base mb-3">
            <PlayCircle className="h-5 w-5 text-primary" /> StreamBD
          </Link>
          <p className="text-muted-foreground">Professional video streaming platform.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Browse</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/" className="hover:text-foreground">Home</Link></li>
            <li><Link to="/trending" className="hover:text-foreground">Trending</Link></li>
            <li><Link to="/categories" className="hover:text-foreground">Categories</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Account</h4>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link to="/watch-later" className="hover:text-foreground">Watch Later</Link></li>
            <li><Link to="/history" className="hover:text-foreground">History</Link></li>
            <li><Link to="/auth" className="hover:text-foreground">Sign in</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Follow</h4>
          <div className="flex gap-3 text-muted-foreground">
            <a href="#" className="hover:text-foreground"><Facebook className="h-5 w-5" /></a>
            <a href="#" className="hover:text-foreground"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="hover:text-foreground"><Instagram className="h-5 w-5" /></a>
            <a href="#" className="hover:text-foreground"><Youtube className="h-5 w-5" /></a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} StreamBD. All rights reserved.
      </div>
    </footer>
  );
}