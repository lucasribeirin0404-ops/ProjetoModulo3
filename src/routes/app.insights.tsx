import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lightbulb, Loader2, Sparkles, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/insights")({
  component: InsightsPage,
});

type Rec = { id: string; focus: string; content: string; created_at: string };

const focusLabels: Record<string, string> = {
  general: "Visão geral",
  saving: "Como economizar",
  goals: "Atingir metas",
  organization: "Organizar orçamento",
  investing: "Começar a investir",
};

function InsightsPage() {
  const { user } = useAuth();
  const [focus, setFocus] = useState("general");
  const [busy, setBusy] = useState(false);
  const [recs, setRecs] = useState<Rec[]>([]);

  const load = async () => {
    const { data } = await supabase.from("ai_recommendations").select("*").order("created_at", { ascending: false });
    setRecs((data as Rec[]) ?? []);
  };
  useEffect(() => { if (user) load(); }, [user]);

  const generate = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-recommendations", { body: { focus } });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Recomendações geradas!");
      load();
    } catch (e: any) {
      toast.error(e.message ?? "Falha ao gerar");
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    await supabase.from("ai_recommendations").delete().eq("id", id);
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold flex items-center gap-2"><Sparkles className="size-7 text-primary" />Insights IA</h1>
        <p className="text-muted-foreground">Análise personalizada baseada nos seus registros financeiros.</p>
      </div>

      <Card className="p-6 bg-gradient-soft">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-2 flex-1 min-w-[240px]">
            <label className="text-sm font-medium">Foco da recomendação</label>
            <Select value={focus} onValueChange={setFocus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(focusLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generate} disabled={busy} className="bg-gradient-primary hover:opacity-90 shadow-soft">
            {busy ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Lightbulb className="size-4 mr-2" />}
            Gerar recomendações
          </Button>
        </div>
      </Card>

      <div className="space-y-4">
        {recs.length === 0 && (
          <Card className="p-8 text-center">
            <Lightbulb className="size-10 mx-auto mb-3 text-secondary" />
            <p className="text-muted-foreground">Nenhuma recomendação ainda. Clique em "Gerar recomendações" para começar!</p>
          </Card>
        )}
        {recs.map((r) => (
          <Card key={r.id} className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/30 text-xs font-medium">
                  <Sparkles className="size-3" />{focusLabels[r.focus] ?? r.focus}
                </span>
                <p className="text-xs text-muted-foreground mt-1.5">{new Date(r.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => del(r.id)}><Trash2 className="size-4 text-muted-foreground" /></Button>
            </div>
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-foreground leading-relaxed">{r.content}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
