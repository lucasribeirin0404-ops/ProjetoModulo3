import { Link, useLocation } from "@tanstack/react-router";
import { Sparkles, LayoutDashboard, ListPlus, Target, Lightbulb, LogOut, Repeat } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

const nav = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard },
  { to: "/app/transactions", label: "Transações", icon: ListPlus },
  { to: "/app/recurring", label: "Gastos fixos", icon: Repeat },
  { to: "/app/goals", label: "Metas", icon: Target },
  { to: "/app/insights", label: "Insights IA", icon: Lightbulb },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuth();
  const loc = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-border bg-card hidden lg:flex flex-col p-4">
        <Link to="/" className="flex items-center gap-2 px-2 py-3 mb-4">
          <div className="size-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
            <Sparkles className="size-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Finly</span>
        </Link>
        <nav className="flex-1 space-y-1">
          {nav.map((n) => {
            const active = loc.pathname === n.to;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-smooth ${
                  active
                    ? "bg-gradient-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <n.icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border pt-4 space-y-2">
          <div className="px-3 text-xs text-muted-foreground truncate">{user?.email}</div>
          <Button onClick={signOut} variant="ghost" className="w-full justify-start">
            <LogOut className="size-4 mr-2" /> Sair
          </Button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <header className="lg:hidden sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <span className="font-bold">Finly</span>
        </Link>
        <Button onClick={signOut} variant="ghost" size="sm"><LogOut className="size-4" /></Button>
      </header>
      <nav className="lg:hidden sticky top-[57px] z-20 border-b border-border bg-card/80 backdrop-blur flex overflow-x-auto px-2">
        {nav.map((n) => {
          const active = loc.pathname === n.to;
          return (
            <Link key={n.to} to={n.to} className={`flex items-center gap-2 px-3 py-2.5 text-sm whitespace-nowrap border-b-2 ${active ? "border-primary text-primary font-semibold" : "border-transparent text-muted-foreground"}`}>
              <n.icon className="size-4" />{n.label}
            </Link>
          );
        })}
      </nav>

      <main className="lg:pl-64">
        <div className="container mx-auto px-4 md:px-8 py-8 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
