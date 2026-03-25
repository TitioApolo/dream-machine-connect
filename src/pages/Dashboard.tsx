import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Cpu, DollarSign, TrendingUp, Package } from "lucide-react";

interface DashboardData {
  totalMaquinas?: number;
  totalTransacoes?: number;
  faturamento?: number;
  totalPremios?: number;
  [key: string]: unknown;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<DashboardData>("/dashboard")
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Carregando dashboard..." />;
  if (error) return <ErrorCard message={error} />;

  const stats = [
    { label: "Máquinas", value: data?.totalMaquinas ?? "—", icon: Cpu, color: "bg-primary/10 text-primary" },
    { label: "Transações", value: data?.totalTransacoes ?? "—", icon: TrendingUp, color: "bg-accent/10 text-accent" },
    { label: "Faturamento", value: data?.faturamento != null ? `R$ ${Number(data.faturamento).toFixed(2)}` : "—", icon: DollarSign, color: "bg-success/10 text-success" },
    { label: "Prêmios", value: data?.totalPremios ?? "—", icon: Package, color: "bg-warning/10 text-warning" },
  ];

  return (
    <div className="animate-fade-in">
      <h2 className="mb-4 font-display text-xl font-bold text-foreground">Dashboard</h2>
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

      {/* Raw data fallback */}
      {data && Object.keys(data).length > 0 && (
        <div className="mt-6 rounded-2xl bg-card p-4 shadow-card">
          <h3 className="mb-2 font-display text-sm font-semibold text-foreground">Dados do Backend</h3>
          <pre className="overflow-x-auto text-xs text-muted-foreground">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
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
