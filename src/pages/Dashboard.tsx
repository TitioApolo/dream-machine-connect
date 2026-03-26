import { useEffect, useState } from "react";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Cpu, DollarSign, TrendingUp, Users } from "lucide-react";

interface ClienteResponse {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  Maquina: Array<{
    id: string;
    nome: string;
    descricao: string;
    ultimoPagamentoRecebido: string | null;
  }>;
}

interface DashboardData {
  totalMaquinas: number;
  totalClientes: number | string;
  totalAtivas: number | string;
  origem: string;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        if (isAdmin()) {
          console.log("[Dashboard] Admin: fetching /clientes");
          const clientes = await apiFetch<ClienteResponse[]>("/clientes");
          const allMaquinas = clientes.flatMap((c) => c.Maquina || []);
          setData({
            totalClientes: clientes.length,
            totalMaquinas: allMaquinas.length,
            totalAtivas: allMaquinas.filter((m) => m.ultimoPagamentoRecebido).length,
            origem: "/clientes (admin)",
          });
        } else {
          console.log("[Dashboard] Cliente: fetching /maquinas");
          const maquinas = await apiFetch<Array<{ id: string }>>("/maquinas");
          setData({
            totalClientes: "—",
            totalMaquinas: maquinas.length,
            totalAtivas: "—",
            origem: "/maquinas (cliente)",
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dashboard");
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
    { label: "Ativas", value: data.totalAtivas, icon: TrendingUp, color: "bg-accent/10 text-accent" },
    { label: "Clientes", value: data.totalClientes, icon: Users, color: "bg-success/10 text-success" },
  ];

  return (
    <div className="animate-fade-in">
      <h2 className="mb-4 font-display text-xl font-bold text-foreground">Dashboard</h2>
      <div className="mb-4 rounded-xl bg-secondary px-3 py-2 text-xs text-secondary-foreground">
        Origem: {data.origem}
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
