import { useEffect, useState } from "react";
import { apiFetch, apiFetchFirst } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Cpu, DollarSign, TrendingUp, Package } from "lucide-react";

interface Maquina {
  id: string;
  [key: string]: unknown;
}

interface DashboardData {
  totalMaquinas: number;
  totalTransacoes: number | string;
  faturamento: number;
  totalPremios: number | string;
  origem: string;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const fallbackData = await apiFetchFirst<unknown>(["/maquinas"]);

        if (Array.isArray(fallbackData)) {
          const maquinas = fallbackData as Maquina[];
          let faturamento = 0;

          if (maquinas[0]?.id) {
            try {
              const pagamentos = await apiFetch<{ total?: number }>(`/pagamentos/${maquinas[0].id}`);
              faturamento = Number(pagamentos.total || 0);
            } catch (paymentError) {
              console.warn("[Dashboard] Falha ao buscar /pagamentos/:id", paymentError);
            }
          }

          setData({
            totalMaquinas: maquinas.length,
            totalTransacoes: "—",
            faturamento,
            totalPremios: "—",
            origem: "/maquinas + /pagamentos/:id",
          });
          return;
        }

        const dashboard = fallbackData as Record<string, unknown>;
        setData({
          totalMaquinas: Number(dashboard.totalMaquinas || 0),
          totalTransacoes: (dashboard.totalTransacoes as number) ?? "—",
          faturamento: Number(dashboard.faturamento || 0),
          totalPremios: (dashboard.totalPremios as number) ?? "—",
          origem: "/dashboard",
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao carregar dashboard";
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) return <LoadingSpinner text="Carregando dashboard..." />;
  if (error) return <ErrorCard message={error} />;
  if (!data) return <ErrorCard message="Sem dados no dashboard." />;

  const stats = [
    { label: "Máquinas", value: data.totalMaquinas, icon: Cpu, color: "bg-primary/10 text-primary" },
    { label: "Transações", value: data.totalTransacoes, icon: TrendingUp, color: "bg-accent/10 text-accent" },
    { label: "Faturamento", value: `R$ ${Number(data.faturamento).toFixed(2)}`, icon: DollarSign, color: "bg-success/10 text-success" },
    { label: "Prêmios", value: data.totalPremios, icon: Package, color: "bg-warning/10 text-warning" },
  ];

  return (
    <div className="animate-fade-in">
      <h2 className="mb-4 font-display text-xl font-bold text-foreground">Dashboard</h2>
      <div className="mb-4 rounded-xl bg-secondary px-3 py-2 text-xs text-secondary-foreground">
        Origem dos dados: {data.origem}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-4 shadow-card">
            <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorCard({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-destructive/10 p-6 text-center">
      <p className="text-sm font-medium text-destructive">{message}</p>
    </div>
  );
}
