import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Cpu, TrendingUp, Users, Wifi } from "lucide-react";

interface Maquina {
  id: string;
  nome: string;
  ultimoPagamentoRecebido: string | null;
  ultimaRequisicao: string | null;
}

interface ClienteResponse {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  Maquina: Maquina[];
}

interface DashboardData {
  totalMaquinas: number;
  totalClientes: number | string;
  totalAtivas: number | string;
  totalOnline: number | string;
  [key: string]: unknown;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isOnline = (m: Maquina) => {
    const last = m.ultimaRequisicao || m.ultimoPagamentoRecebido;
    if (!last) return false;
    return Date.now() - new Date(last).getTime() < 5 * 60 * 1000;
  };

  const fetchData = useCallback(async () => {
    try {
      if (isAdmin()) {
        try {
          const dashData = await apiFetch<DashboardData>("/dashboard");
          console.log("[Dashboard] /dashboard RESPONSE:", dashData);
          setData(dashData);
          return;
        } catch {
          console.warn("[Dashboard] /dashboard failed, using /clientes fallback");
        }
        const clientes = await apiFetch<ClienteResponse[]>("/clientes");
        const allMaquinas = clientes.flatMap((c) => c.Maquina || []);
        setData({
          totalClientes: clientes.length,
          totalMaquinas: allMaquinas.length,
          totalAtivas: allMaquinas.filter((m) => m.ultimoPagamentoRecebido).length,
          totalOnline: allMaquinas.filter(isOnline).length,
        });
      } else {
        const maquinas = await apiFetch<Maquina[]>("/maquinas");
        setData({
          totalClientes: "—",
          totalMaquinas: maquinas.length,
          totalAtivas: maquinas.filter((m) => m.ultimoPagamentoRecebido).length,
          totalOnline: maquinas.filter(isOnline).length,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dashboard");
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchData, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Carregando dashboard..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;
  if (!data) return null;

  const stats = [
    { label: "Máquinas", value: data.totalMaquinas, icon: Cpu, color: "border-primary/30 bg-primary/10 text-primary" },
    { label: "Online", value: data.totalOnline, icon: Wifi, color: "border-success/30 bg-success/10 text-success" },
    { label: "Ativas", value: data.totalAtivas, icon: TrendingUp, color: "border-accent/30 bg-accent/10 text-accent" },
    { label: "Clientes", value: data.totalClientes, icon: Users, color: "border-info/30 bg-info/10 text-info" },
  ];

  return (
    <div className="animate-fade-in">
      <h2 className="mb-4 font-display text-lg font-bold tracking-wider text-primary">Dashboard</h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <div key={s.label} className={`rounded-2xl border bg-card p-4 shadow-card ${s.color.split(' ')[0]}`}>
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
