import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { TrendingUp, Cpu, Zap, BarChart3, CreditCard, RotateCcw, Smartphone, RefreshCw, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PaymentTypeFilter, type PaymentType } from "@/components/PaymentTypeFilter";

interface MaquinaItem {
  id: string;
  nome?: string;
  estabelecimentoNome?: string;
}

interface ClienteItem {
  id: string;
  nome: string;
  Maquina: MaquinaItem[];
}

interface PagamentosResponse {
  pagamentos?: Array<Record<string, unknown>>;
  total?: number | string;
  pix?: number | string;
  especie?: number | string;
  cash?: number | string;
  debito?: number | string;
  credito?: number | string;
  creditoRemoto?: number | string;
  creditosRemotos?: number | string;
  estornos?: number | string;
  estoque?: number | string;
  [key: string]: unknown;
}

const toNum = (v?: unknown): number => {
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const fmt = (v: number) =>
  `R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

interface DashTotals {
  total: number;
  pix: number;
  especie: number;
  debito: number;
  credito: number;
  creditoRemoto: number;
  estornos: number;
  premios: number;
}

export default function Dashboard() {
  const [totals, setTotals] = useState<DashTotals>({ total: 0, pix: 0, especie: 0, debito: 0, credito: 0, creditoRemoto: 0, estornos: 0, premios: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [filter, setFilter] = useState<PaymentType>("all");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      let machines: MaquinaItem[] = [];
      if (isAdmin()) {
        const clientes = await apiFetch<ClienteItem[]>("/clientes");
        machines = Array.isArray(clientes)
          ? clientes.flatMap((c) =>
              (c.Maquina || []).map((m) => ({ ...m, estabelecimentoNome: m.descricao || m.nome || c.nome }))
            )
          : [];
      } else {
        const list = await apiFetch<MaquinaItem[]>("/maquinas");
        machines = Array.isArray(list) ? list : [];
      }

      const sums: DashTotals = { total: 0, pix: 0, especie: 0, debito: 0, credito: 0, creditoRemoto: 0, estornos: 0, premios: 0 };

      await Promise.allSettled(
        machines.map(async (m) => {
          try {
            const path = isAdmin() ? `/pagamentos-adm/${m.id}` : `/pagamentos/${m.id}`;
            const data = await apiFetch<PagamentosResponse>(path);
            sums.total += toNum(data.total);
            sums.pix += toNum(data.pix);
            sums.especie += toNum(data.especie ?? data.cash);
            sums.debito += toNum(data.debito);
            sums.credito += toNum(data.credito);
            sums.creditoRemoto += toNum(data.creditoRemoto ?? data.creditosRemotos);
            sums.estornos += toNum(data.estornos);
            sums.premios += toNum(data.estoque);
          } catch (err) {
            console.warn(`[Dashboard] Erro máquina ${m.id}:`, err);
          }
        })
      );

      // premios already accumulated from estoque field above

      setTotals(sums);
      setLastUpdate(new Date());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dashboard");
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Carregando dashboard..." />;

  const allStats = [
    { label: "Total", value: fmt(totals.total), icon: TrendingUp, color: "text-primary", bgColor: "bg-primary/10", type: "all" as PaymentType },
    { label: "PIX", value: fmt(totals.pix), icon: Cpu, color: "text-blue-400", bgColor: "bg-blue-400/10", type: "pix" as PaymentType },
    { label: "Espécie", value: fmt(totals.especie), icon: Zap, color: "text-green-400", bgColor: "bg-green-400/10", type: "especie" as PaymentType },
    { label: "Débito", value: fmt(totals.debito), icon: BarChart3, color: "text-yellow-400", bgColor: "bg-yellow-400/10", type: "debito" as PaymentType },
    { label: "Crédito", value: fmt(totals.credito), icon: CreditCard, color: "text-purple-400", bgColor: "bg-purple-400/10", type: "credito" as PaymentType },
    { label: "Crédito Remoto", value: fmt(totals.creditoRemoto), icon: Smartphone, color: "text-cyan-400", bgColor: "bg-cyan-400/10", type: "credito_remoto" as PaymentType },
    { label: "Estornos", value: fmt(totals.estornos), icon: RotateCcw, color: "text-destructive", bgColor: "bg-destructive/10", type: "estorno" as PaymentType },
    { label: "Prêmios", value: fmt(totals.premios), icon: Trophy, color: "text-amber-400", bgColor: "bg-amber-400/10", type: "all" as PaymentType },
  ];

  const filteredStats = filter === "all"
    ? allStats
    : allStats.filter((s) => s.type === filter || s.type === "all");

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isAdmin() ? "Visão geral do administrador" : "Sua visão geral"}
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin text-primary/60" style={{ animationDuration: "3s" }} />
          {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Filter */}
      <PaymentTypeFilter
        selected={filter}
        onChange={setFilter}
        types={["all", "pix", "especie", "debito", "credito", "credito_remoto", "estorno"]}
      />

      <div className="grid grid-cols-2 gap-3">
        {filteredStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="border-primary/20 bg-card/60 p-4 backdrop-blur-sm hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
                  <p className="mt-2 font-display text-lg font-bold text-foreground">{stat.value}</p>
                </div>
                <div className={`rounded-lg p-2.5 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
