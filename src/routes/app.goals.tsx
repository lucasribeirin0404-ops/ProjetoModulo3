import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useGoals, formatBRL } from "@/hooks/use-finance";
import { toast } from "sonner";

export const Route = createFileRoute("/app/goals")({
  component: GoalsPage,
});

function GoalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: goals = [] } = useGoals();
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");

  const add = async () => {
    const t = parseFloat(target.replace(",", "."));
    if (!title.trim() || !t || t <= 0) return toast.error("Preencha título e valor alvo");
    if (!user) return;
    const { error } = await supabase.from("goals").insert({
      user_id: user.id,
      title: title.trim(),
      target_amount: t,
      current_amount: parseFloat(current.replace(",", ".")) || 0,
      deadline: deadline || null,
    });
    if (error) return toast.error(error.message);
    toast.success("Meta criada!");
    setTitle(""); setTarget(""); setCurrent(""); setDeadline("");
    qc.invalidateQueries({ queryKey: ["goals"] });
  };

  const updateCurrent = async (id: string, value: number) => {
    const { error } = await supabase.from("goals").update({ current_amount: Math.max(0, value) }).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["goals"] });
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["goals"] });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold">Metas financeiras</h1>
        <p className="text-muted-foreground">Defina objetivos e acompanhe seu progresso visualmente.</p>
      </div>

      <Card className="p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Target className="size-4" />Nova meta</h3>
        <div className="grid md:grid-cols-5 gap-3">
          <div className="space-y-2 md:col-span-2"><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Viagem para a praia" /></div>
          <div className="space-y-2"><Label>Valor alvo</Label><Input type="number" step="0.01" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="0,00" /></div>
          <div className="space-y-2"><Label>Já tenho</Label><Input type="number" step="0.01" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="0,00" /></div>
          <div className="space-y-2"><Label>Prazo</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
        </div>
        <Button onClick={add} className="mt-4 bg-gradient-primary hover:opacity-90"><Plus className="size-4 mr-2" />Adicionar meta</Button>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {goals.length === 0 && (
          <Card className="p-8 text-center md:col-span-2 bg-gradient-soft">
            <Target className="size-10 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Crie sua primeira meta</h3>
            <p className="text-sm text-muted-foreground">Que tal começar com uma reserva de emergência?</p>
          </Card>
        )}
        {goals.map((g) => {
          const pct = Math.min(100, (g.current_amount / g.target_amount) * 100);
          return (
            <Card key={g.id} className="p-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-semibold text-lg">{g.title}</h4>
                  {g.deadline && <p className="text-xs text-muted-foreground">Até {new Date(g.deadline).toLocaleDateString("pt-BR")}</p>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => del(g.id)}><Trash2 className="size-4 text-muted-foreground" /></Button>
              </div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="font-medium">{formatBRL(g.current_amount)}</span>
                <span className="text-muted-foreground">{formatBRL(g.target_amount)}</span>
              </div>
              <Progress value={pct} className="h-3 mb-3" />
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                <span>{pct.toFixed(0)}% concluído</span>
                <span>Faltam {formatBRL(Math.max(0, g.target_amount - g.current_amount))}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => updateCurrent(g.id, g.current_amount + g.target_amount * 0.1)}>+10%</Button>
                <Button size="sm" variant="outline" onClick={() => updateCurrent(g.id, g.current_amount - g.target_amount * 0.1)}>-10%</Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
