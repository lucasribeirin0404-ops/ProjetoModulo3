import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Wallet, Plus, Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useCategories, useTransactions, useGoals, formatBRL } from "@/hooks/use-finance";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/")({
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { data: txs = [] } = useTransactions();
  const { data: cats = [] } = useCategories();
  const { data: goals = [] } = useGoals();

  const { data: recurring = [] } = useQuery({
    queryKey: ["recurring", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .select("amount,kind,is_active");
      if (error) throw error;
      return (data as any[]).map((r) => ({ ...r, amount: Number(r.amount) }));
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const monthTx = txs.filter((t) => {
      const d = new Date(t.occurred_at);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const recIncome = recurring.filter((r: any) => r.is_active && r.kind === "income").reduce((s: number, r: any) => s + r.amount, 0);
    const recExpense = recurring.filter((r: any) => r.is_active && r.kind === "expense").reduce((s: number, r: any) => s + r.amount, 0);
    const incomeTotal = income + recIncome;
    const expenseTotal = expense + recExpense;
    const balance = incomeTotal - expenseTotal;
    const totalIncome = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income: incomeTotal, expense: expenseTotal, balance, total: totalIncome - totalExpense + recIncome - recExpense };
  }, [txs, recurring]);

  const byCategory = useMemo(() => {
    const map = new Map<string, { name: string; value: number; color: string }>();
    txs.filter((t) => t.type === "expense").forEach((t) => {
      const cat = cats.find((c) => c.id === t.category_id);
      const key = cat?.id ?? "outros";
      const cur = map.get(key) ?? { name: cat?.name ?? "Outros", value: 0, color: cat?.color ?? "#94a3b8" };
      cur.value += t.amount;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [txs, cats]);

  const last30 = useMemo(() => {
    const days: { date: string; receita: number; despesa: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), receita: 0, despesa: 0 });
      const dayTx = txs.filter((t) => t.occurred_at === key);
      days[days.length - 1].receita = dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
      days[days.length - 1].despesa = dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    }
    return days;
  }, [txs]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Olá, {user?.user_metadata?.display_name ?? "amigo"} 👋</h1>
          <p className="text-muted-foreground">Aqui está como suas finanças estão neste mês.</p>
        </div>
        <Link to="/app/transactions"><Button className="bg-gradient-primary hover:opacity-90 shadow-soft"><Plus className="size-4 mr-2" />Nova transação</Button></Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Saldo do mês" value={formatBRL(stats.balance)} icon={<Wallet className="size-5" />} grad="bg-gradient-primary" />
        <StatCard label="Receitas (mês)" value={formatBRL(stats.income)} icon={<ArrowUpRight className="size-5" />} grad="bg-gradient-accent" />
        <StatCard label="Despesas (mês)" value={formatBRL(stats.expense)} icon={<ArrowDownRight className="size-5" />} grad="bg-gradient-warm" />
        <StatCard label="Patrimônio total" value={formatBRL(stats.total)} icon={<Wallet className="size-5" />} grad="bg-gradient-primary" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <h3 className="font-semibold mb-4">Últimos 30 dias</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={last30}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatBRL(v)} />
                <Line type="monotone" dataKey="receita" stroke="oklch(0.72 0.18 155)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="despesa" stroke="oklch(0.65 0.22 350)" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Gastos por categoria</h3>
          {byCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem despesas ainda.</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={85} paddingAngle={3}>
                    {byCategory.map((c, i) => (<Cell key={i} fill={c.color} />))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatBRL(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="space-y-1 mt-2">
            {byCategory.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: c.color }} />{c.name}</div>
                <span className="font-medium">{formatBRL(c.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Suas metas</h3>
            <Link to="/app/goals"><Button variant="ghost" size="sm">Gerenciar</Button></Link>
          </div>
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground">Defina sua primeira meta financeira para começar a acompanhar seu progresso.</p>
          ) : (
            <div className="space-y-4">
              {goals.slice(0, 3).map((g) => {
                const pct = Math.min(100, (g.current_amount / g.target_amount) * 100);
                return (
                  <div key={g.id}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">{g.title}</span>
                      <span className="text-muted-foreground">{formatBRL(g.current_amount)} / {formatBRL(g.target_amount)}</span>
                    </div>
                    <Progress value={pct} className="h-2.5" />
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-6 bg-gradient-soft">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
              <Lightbulb className="size-5 text-primary-foreground" />
            </div>
            <h3 className="font-semibold">Recomendações IA</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Receba dicas personalizadas analisando seus registros financeiros — economia, organização ou metas.
          </p>
          <Link to="/app/insights"><Button className="bg-gradient-primary hover:opacity-90">Gerar insights</Button></Link>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Receitas vs Despesas (últimos 7 dias)</h3>
        </div>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={last30.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0 0% 90%)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatBRL(v)} />
              <Bar dataKey="receita" fill="oklch(0.72 0.18 155)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="despesa" fill="oklch(0.65 0.22 350)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ label, value, icon, grad }: { label: string; value: string; icon: React.ReactNode; grad: string }) {
  return (
    <Card className="p-5 bg-gradient-card">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className={`size-9 rounded-xl ${grad} flex items-center justify-center text-primary-foreground shadow-soft`}>{icon}</div>
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
    </Card>
  );
}
