import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Sparkles, History, Brain, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const items = [
  { to: "/dashboard", label: "Overview", icon: Home, exact: true },
  { to: "/dashboard/generate", label: "Generate", icon: Sparkles },
  { to: "/dashboard/history", label: "History", icon: History },
];

export function Sidebar() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <aside className="w-60 shrink-0 hidden md:flex flex-col gap-2 p-4 sticky top-0 h-screen border-r border-white/5">
      <Link to="/" className="flex items-center gap-2.5 px-3 py-4 group">
        <div className="w-9 h-9 rounded-xl glow-button flex items-center justify-center transition-transform group-hover:scale-105">
          <Brain className="w-5 h-5" />
        </div>
        <div>
          <div className="font-display font-bold text-lg leading-none">
            Recall5<span className="gradient-text">AI</span>
          </div>
          <div className="text-[9px] uppercase tracking-[0.12em] text-muted-foreground mt-1">5-min revisions</div>
        </div>
      </Link>

      <div className="divider my-1" />

      <nav className="mt-2 flex flex-col gap-0.5">
        {items.map((it, i) => {
          const active = it.exact ? path === it.to : path.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all relative",
                active
                  ? "glass-card-strong text-foreground sidebar-active-bar"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/5",
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute inset-0 rounded-xl glass-card-strong -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <it.icon className={cn("w-4 h-4 shrink-0", active && "text-primary")} />
              <span className={active ? "font-medium" : ""}>{it.label}</span>
              {it.label === "Generate" && (
                <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 font-medium">AI</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="glass-card p-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-display text-foreground mb-1.5">
            <Zap className="w-3.5 h-3.5 text-accent" />
            AI tip
          </div>
          Upload handwritten notes — Recall5 reads them and turns them into instant revision packs.
        </div>
        <div className="text-center text-[10px] text-muted-foreground/50">v1.0 · Recall5 AI</div>
      </div>
    </aside>
  );
}
