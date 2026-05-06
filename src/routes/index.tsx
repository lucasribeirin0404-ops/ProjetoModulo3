import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-finance.jpg";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Sparkles,
  Wallet,
  TrendingUp,
  Target,
  PieChart,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur bg-background/70 border-b border-border/60">
        <div className="container mx-auto flex items-center justify-between py-4 px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-gradient-primary flex items-center justify-center shadow-soft">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Finly</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-primary transition-smooth">Recursos</a>
            <a href="#how" className="hover:text-primary transition-smooth">Como funciona</a>
            <a href="#pricing" className="hover:text-primary transition-smooth">Planos</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login"><Button variant="ghost">Entrar</Button></Link>
            <Link to="/login"><Button className="bg-gradient-primary hover:opacity-90 shadow-soft">Começar grátis</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-soft pointer-events-none" />
        <div className="container relative mx-auto px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/30 text-sm font-medium">
              <Sparkles className="size-4" /> Recomendações com IA personalizada
            </span>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
              Cuide do seu dinheiro com{" "}
              <span className="text-gradient-primary">leveza e clareza</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Registre gastos, visualize tudo em dashboards interativos, defina metas e receba recomendações inteligentes feitas para o seu perfil.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/login">
                <Button size="lg" className="bg-gradient-primary hover:opacity-90 shadow-glow">
                  Criar conta gratuita <ArrowRight className="ml-2 size-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline">Ver recursos</Button>
              </a>
            </div>
            <div className="flex items-center gap-6 pt-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-success" /> 100% privado</div>
              <div className="flex items-center gap-2"><Sparkles className="size-4 text-secondary" /> Sem cartão</div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-6 bg-gradient-primary opacity-20 blur-3xl rounded-full" />
            <img
              src={heroImg}
              alt="Pessoas felizes gerenciando finanças no Finly"
              width={1280}
              height={960}
              className="relative rounded-3xl shadow-pop"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="container mx-auto px-6 py-20">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-4xl font-bold mb-4">Tudo que você precisa, num só lugar</h2>
          <p className="text-muted-foreground">Ferramentas amigáveis para transformar seus hábitos financeiros.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Wallet, title: "Controle de gastos", desc: "Registre receitas e despesas em segundos com categorias coloridas.", grad: "bg-gradient-primary" },
            { icon: PieChart, title: "Dashboards interativos", desc: "Visualize tudo com gráficos vivos e fáceis de entender.", grad: "bg-gradient-accent" },
            { icon: Target, title: "Metas que motivam", desc: "Defina objetivos e acompanhe seu progresso visualmente.", grad: "bg-gradient-warm" },
            { icon: Sparkles, title: "Recomendações com IA", desc: "Análises personalizadas baseadas nos seus gastos reais.", grad: "bg-gradient-primary" },
            { icon: TrendingUp, title: "Relatórios claros", desc: "Entenda para onde seu dinheiro está indo a cada mês.", grad: "bg-gradient-accent" },
            { icon: ShieldCheck, title: "Privacidade total", desc: "Seus dados protegidos. Apenas você tem acesso a eles.", grad: "bg-gradient-warm" },
          ].map((f) => (
            <Card key={f.title} className="p-6 bg-gradient-card border-border/60 hover:shadow-pop transition-smooth hover:-translate-y-1">
              <div className={`size-12 rounded-2xl ${f.grad} flex items-center justify-center shadow-soft mb-4`}>
                <f.icon className="size-6 text-primary-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* How */}
      <section id="how" className="bg-muted/40 py-20">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-4xl font-bold mb-4">Comece em 3 passos</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Crie sua conta", d: "Cadastro rápido com e-mail. Sem cartão de crédito." },
              { n: "02", t: "Registre suas finanças", d: "Adicione receitas, despesas e crie categorias do seu jeito." },
              { n: "03", t: "Receba insights", d: "Veja dashboards e dicas personalizadas com IA." },
            ].map((s) => (
              <Card key={s.n} className="p-8 bg-card relative overflow-hidden">
                <div className="text-6xl font-extrabold text-gradient-primary opacity-30 mb-2">{s.n}</div>
                <h3 className="text-xl font-semibold mb-2">{s.t}</h3>
                <p className="text-muted-foreground">{s.d}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="container mx-auto px-6 py-20">
        <Card className="p-12 bg-gradient-hero text-center text-primary-foreground border-0 shadow-pop">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Pronto para mudar sua relação com o dinheiro?</h2>
          <p className="text-lg opacity-90 mb-8 max-w-xl mx-auto">Junte-se ao Finly grátis e comece hoje. Leva menos de 1 minuto.</p>
          <Link to="/login">
            <Button size="lg" variant="secondary" className="shadow-glow">
              Quero começar agora <ArrowRight className="ml-2 size-4" />
            </Button>
          </Link>
        </Card>
      </section>

      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Finly. Feito com carinho para você.
        </div>
      </footer>
    </div>
  );
}
