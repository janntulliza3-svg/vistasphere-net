import { useEffect, useRef, useState } from "react";
import { PlayCircle, Film } from "lucide-react";

export function Maintenance({ title, message }: { title: string; message: string }) {
  const [typed, setTyped] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(title.slice(0, i));
      if (i >= title.length) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [title]);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    const resize = () => { c.width = window.innerWidth; c.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const pts = Array.from({ length: 70 }, () => ({
      x: Math.random() * c.width, y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4,
    }));
    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > c.width) p.vx *= -1;
        if (p.y < 0 || p.y > c.height) p.vy *= -1;
      }
      ctx.fillStyle = "rgba(233,69,96,0.6)";
      for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, 1.6, 0, Math.PI * 2); ctx.fill(); }
      ctx.strokeStyle = "rgba(233,69,96,0.12)";
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 120 * 120) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke(); }
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <div className="fixed inset-0 overflow-hidden bg-background">
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-background to-card animate-pulse-play" style={{ animationDuration: "8s" }} />
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* Floating icons */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <Film key={i} className="absolute text-primary/20" style={{
            left: `${(i * 13) % 100}%`,
            bottom: -40,
            animation: `float ${12 + i * 2}s linear infinite`,
            animationDelay: `${i * 1.5}s`,
          }} />
        ))}
      </div>
      <style>{`@keyframes float { to { transform: translateY(-110vh) rotate(360deg); } }`}</style>

      <div className="relative z-10 h-full w-full flex flex-col items-center justify-center text-center px-6">
        <div className="flex items-center gap-3 mb-8">
          <PlayCircle className="h-10 w-10 text-primary" />
          <span className="font-bold text-2xl">StreamBD</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-4 typing-cursor">{typed}</h1>
        <p className="text-muted-foreground max-w-md mb-2">{message || "Our team is working hard."}</p>
        <p className="text-sm text-muted-foreground">Approximately 2 hours remaining</p>
      </div>
    </div>
  );
}