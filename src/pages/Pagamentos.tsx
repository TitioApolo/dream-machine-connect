import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch, isAdmin, getUserId } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DollarSign, Smartphone, Banknote, CreditCard, TrendingUp, RefreshCw } from "lucide-react";

interface Maquina {
  id: string;
  nome?: string;
  descricao?: string;
}

interface ClienteResponse {
  id: string;
  nome: string;
  Maquina: Maquina[];
}

interface MaquinaPagamento {
  maquina: Maquina;
  total: number;
  pix: number;
  cash: number;
  debito: number;
  creditosRemotos: number;
}

const toNum = (v?: string | number | null): number => {
  if (v == null) return 0;
  return typeof v === "string" ? parseFloat(v) || 0 : v;
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Pagamentos() {
  const [dados, setDados] = useState<MaquinaPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      let maquinas: Maquina[] = [];
      if (isAdmin()) {
        const clientes = await apiFetch<ClienteResponse[]>("/clientes");
        maquinas = clientes.flatMap((c) => c.Maquina || []);
      } else {
        maquinas = await apiFetch<Maquina[]>("/maquinas");
      }

      const results: MaquinaPagamento[] = [];
      for (const m of maquinas) {
        try {
          const path = isAdmin() ? `/pagamentos-adm/${m.id}` : `/pagamentos/${m.id}`;
          const res = await apiFetch<Record<string, unknown>>(path);
          console.log(`[Pagamentos] ${m.nome}:`, res);
          results.push({
            maquina: m,
            total: toNum(res.total as string | number),
            pix: toNum(res.pix as string | number),
            cash: toNum((res.cash ?? res.especie) as string | number),
            debito: toNum(res.debito as string | number),
            creditosRemotos: toNum((res.creditosRemotos ?? res.creditoRemoto) as string | number),
          });
        } catch (err) {
          console.warn(`[Pagamentos] Erro ${m.nome}:`, err);
          results.push({ maquina: m, total: 0, pix: 0, cash: 0, debito: 0, creditosRemotos: 0 });
        }
      }
      setDados(results);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar pagamentos");
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchData, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Carregando pagamentos..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;

  const grandTotal = dados.reduce((s, d) => s + d.total, 0);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">Pagamentos</h2>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} />
          {lastUpdate.toLocaleTimeString("pt-BR")}
        </div>
      </div>

      {/* Grand total card */}
      <div className="rounded-2xl bg-primary/10 border border-primary/20 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{fmt(grandTotal)}</p>
            <p className="text-xs text-muted-foreground">Total geral ({dados.length} máquinas)</p>
          </div>
        </div>
      </div>

      {dados.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum pagamento encontrado</p>
      ) : (
        <div className="flex flex-col gap-3">
          {dados.map((d) => (
            <div key={d.maquina.id} className="rounded-2xl bg-card p-4 shadow-card border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-1">{d.maquina.nome || "Máquina"}</h3>
              {d.maquina.descricao && <p className="text-xs text-muted-foreground mb-3">{d.maquina.descricao}</p>}
              <div className="grid grid-cols-2 gap-2">
                <StatRow icon={TrendingUp} label="Total" value={fmt(d.total)} color="text-primary" />
                <StatRow icon={Smartphone} label="PIX" value={fmt(d.pix)} color="text-accent" />
                <StatRow icon={Banknote} label="Espécie" value={fmt(d.cash)} color="text-success" />
                <StatRow icon={CreditCard} label="Débito" value={fmt(d.debito)} color="text-warning" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatRow({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-2.5 py-2">
      <Icon className={`h-3.5 w-3.5 ${color}`} />
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-semibold text-foreground">{value}</p>
      </div>
    </div>
  );
}
