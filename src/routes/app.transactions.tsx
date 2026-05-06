import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useCategories, useTransactions, formatBRL } from "@/hooks/use-finance";
import { toast } from "sonner";

export const Route = createFileRoute("/app/transactions")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: cats = [] } = useCategories();
  const { data: txs = [] } = useTransactions();

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [busy, setBusy] = useState(false);

  const filteredCats = cats.filter((c) => c.type === type);

  const add = async () => {
    const value = parseFloat(amount.replace(",", "."));
    if (!value || value <= 0) return toast.error("Informe um valor válido");
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: user.id,
      type, amount: value, description: description || null,
      category_id: categoryId || null, occurred_at: date,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Transação adicionada!");
    setAmount(""); setDescription("");
    qc.invalidateQueries({ queryKey: ["transactions"] });
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("transactions").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removido");
    qc.invalidateQueries({ queryKey: ["transactions"] });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Transações</h1>
        <p className="text-muted-foreground">Registre suas receitas e despesas para manter tudo no controle.</p>
      </div>

      <Card className="p-6">
        <Tabs value={type} onValueChange={(v) => { setType(v as any); setCategoryId(""); }}>
          <TabsList className="mb-4">
            <TabsTrigger value="expense"><ArrowDownRight className="size-4 mr-1.5" />Despesa</TabsTrigger>
            <TabsTrigger value="income"><ArrowUpRight className="size-4 mr-1.5" />Receita</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid md:grid-cols-5 gap-3">
          <div className="space-y-2 md:col-span-1">
            <Label>Valor (R$)</Label>
            <Input type="number" inputMode="decimal" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label>Categoria</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
              <SelectContent>
                {filteredCats.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2.5 rounded-full" style={{ background: c.color }} />{c.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label>Data</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Descrição (opcional)</Label>
            <div className="flex gap-2">
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ex: Mercado da semana" />
              <Button onClick={add} disabled={busy} className="bg-gradient-primary hover:opacity-90"><Plus className="size-4" /></Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold mb-4">Histórico</h3>
        {txs.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma transação ainda. Adicione sua primeira acima!</p>
        ) : (
          <div className="divide-y divide-border">
            {txs.map((t) => {
              const cat = cats.find((c) => c.id === t.category_id);
              return (
                <div key={t.id} className="flex items-center gap-3 py-3">
                  <div className="size-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: (cat?.color ?? "#94a3b8") + "33" }}>
                    {t.type === "income" ? <ArrowUpRight className="size-5 text-success" /> : <ArrowDownRight className="size-5 text-primary" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{t.description || cat?.name || "Sem descrição"}</div>
                    <div className="text-xs text-muted-foreground">{cat?.name ?? "Sem categoria"} · {new Date(t.occurred_at).toLocaleDateString("pt-BR")}</div>
                  </div>
                  <div className={`font-semibold ${t.type === "income" ? "text-success" : "text-primary"}`}>
                    {t.type === "income" ? "+" : "-"} {formatBRL(t.amount)}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => del(t.id)}><Trash2 className="size-4 text-muted-foreground" /></Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
