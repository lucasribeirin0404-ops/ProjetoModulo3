// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return new Response(JSON.stringify({ error: "Não autenticado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { focus = "general" } = await req.json().catch(() => ({}));

    const { data: txs } = await supabase
      .from("transactions").select("type, amount, occurred_at, description, category_id").order("occurred_at", { ascending: false }).limit(200);
    const { data: cats } = await supabase.from("categories").select("id, name, type");
    const { data: goals } = await supabase.from("goals").select("title, target_amount, current_amount, deadline");

    const catMap = new Map((cats ?? []).map((c: any) => [c.id, c.name]));
    const summary = (txs ?? []).map((t: any) => ({
      tipo: t.type, valor: Number(t.amount), categoria: catMap.get(t.category_id) ?? "Outros",
      data: t.occurred_at, desc: t.description ?? "",
    }));

    const focusMap: Record<string, string> = {
      general: "uma análise geral das finanças com 4 a 6 recomendações práticas",
      saving: "como economizar mais e cortar despesas desnecessárias",
      goals: "como atingir as metas financeiras mais rápido",
      organization: "como organizar melhor o orçamento e categorias",
      investing: "ideias iniciantes de investimento e construção de patrimônio",
    };

    const systemPrompt = `Você é Finly, um auxiliador financeiro brasileiro, amigável, prático e empático.
Analise os registros do usuário e responda em português, com tom acolhedor e dicas acionáveis.
Use Markdown com títulos curtos, bullets e emojis sutis. Cite números reais quando útil. Foque em: ${focusMap[focus] ?? focusMap.general}.`;

    const userPrompt = `Transações recentes (até 200): ${JSON.stringify(summary)}
Metas: ${JSON.stringify(goals ?? [])}
Hoje: ${new Date().toISOString().slice(0, 10)}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (aiResp.status === 429) return new Response(JSON.stringify({ error: "Limite de uso atingido. Tente novamente em instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (aiResp.status === 402) return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos nas configurações da Cloud." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Falha ao gerar recomendações" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const data = await aiResp.json();
    const content = data.choices?.[0]?.message?.content ?? "Sem resposta.";

    await supabase.from("ai_recommendations").insert({ user_id: userData.user.id, focus, content });

    return new Response(JSON.stringify({ content }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("recommendations error", e);
    return new Response(JSON.stringify({ error: e.message ?? "Erro desconhecido" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
