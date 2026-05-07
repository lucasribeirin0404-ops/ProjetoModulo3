import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Repeat, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCategories, formatBRL } from "@/hooks/use-finance";
import { toast } from "sonner";

export const Route = createFileRoute("/app/recurring")({
  component: RecurringPage,
});

type Recurring = {
  id: string;
  title: string;
  amount: number;
  due_day: number;
  category_id: string | null;
  notes: string | null;
  is_active: boolean;
};

function RecurringPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: cats = [] } = useCategories();

  const { data: items = [] } = useQuery({
    queryKey: ["recurring", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Recurring[]> => {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .select("*")
        .order("due_day", { ascending: true });
      if (error) throw error;
      return (data as any[]).map((r) => ({ ...r, amount: Number(r.amount) }));
    },
  });

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDay, setDueDay] = useState("5");
  const [categoryId, setCategoryId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const expenseCats = cats.filter((c) => c.type === "expense");
  const total = items.filter((i) => i.is_active).reduce((s, i) => s + i.amount, 0);

  const add = async () => {
    if (!title.trim()) return toast.error("Informe um título");
    const value = parseFloat(amount.replace(",", "."));
    if (!value || value <= 0) return toast.error("Informe um valor válido");
    const day = Math.min(31, Math.max(1, parseInt(dueDay) || 1));
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("recurring_expenses").insert({
      user_id: user.id,
      title: title.trim(),
      amount: value,
      due_day: day,
      category_id: categoryId || null,
      notes: notes.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Gasto fixo adicionado!");
    setTitle(""); setAmount(""); setNotes(""); setCategoryId("");
    qc.invalidateQueries({ queryKey: ["recurring"] });
  };

  const toggle = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("recurring_expenses").update({ is_active }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["recurring"] });
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    qc.invalidateQueries({ queryKey: ["recurring"] });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold flex items-center gap-2">
          <Repeat className="size-7 text-primary" /> Gastos fixos mensais
        </h1>
        <p className="text-muted-foreground">Aluguel, assinaturas, contas — registre tudo que se repete todo mês.</p>
      </div>

      <Card className="p-6 bg-gradient-soft border-border/60">
        <div className="text-sm text-muted-foreground">Total mensal estimado</div>
        <div className="text-4xl font-extrabold mt-1">{formatBRL(total)}</div>
        <div className="text-xs text-muted-foreground mt-1">{items.filter(i => i.is_active).length} compromisso(s) ativo(s)</div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Novo gasto fixo</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Título</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Aluguel, Netflix..." maxLength={80} />
          </div>
          <div className="space-y-2">
            <Label>Valor (R$)</Label>
            <Input type="number" inputMode="decimal" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-2">
            <Label>Dia do vencimento</Label>
            <Input type="number" min={1} max={31} value={dueDay} onChange={(e) => setDueDay(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                {expenseCats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: c.color }} />{c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Observações (opcional)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Detalhes, forma de pagamento..." maxLength={300} />
          </div>
        </div>
        <Button onClick={add} disabled={busy} className="mt-4 bg-gradient-primary hover:opacity-90">
          <Plus className="size-4 mr-1.5" /> Adicionar
        </Button>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Meus gastos fixos</h3>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum gasto fixo cadastrado ainda.</p>
        ) : (
          <div className="divide-y divide-border">
            {items.map((r) => {
              const cat = cats.find((c) => c.id === r.category_id);
              return (
                <div key={r.id} className="flex items-center gap-3 py-3">
                  <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: (cat?.color ?? "#94a3b8") + "33" }}>
                    <CalendarClock className="size-5" style={{ color: cat?.color ?? "#64748b" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{r.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {cat?.name ?? "Sem categoria"} · vence todo dia {r.due_day}
                      {r.notes ? ` · ${r.notes}` : ""}
                    </div>
                  </div>
                  <div className={`font-semibold ${r.is_active ? "text-primary" : "text-muted-foreground line-through"}`}>
                    {formatBRL(r.amount)}
                  </div>
                  <Switch checked={r.is_active} onCheckedChange={(v) => toggle(r.id, v)} />
                  <Button variant="ghost" size="icon" onClick={() => del(r.id)}><Trash2 className="size-4 text-muted-foreground" /></Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}