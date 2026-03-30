import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch, isAdmin, getUserId } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DollarSign, TrendingUp, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";

interface Maquina {
  id: string;
  nome?: string;
  descricao?: string;
}

interface MaquinaPagamento {
  maquina: Maquina;
  total: number;
  pix: number;
  especie: number;
  debito: number;
  creditoRemoto: number;
}

const toNum = (v?: unknown): number => {
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const fmt = (v: number) => {
  return `R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

export default function Pagamentos() {
  const [dados, setDados] = useState<MaquinaPagamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const userId = getUserId();
      
      // Buscar máquinas do usuário
      let maquinas: Maquina[] = [];
      if (isAdmin()) {
        const clientes = await apiFetch<{id: string; Maquina: Maquina[]}[]>("/clientes");
        maquinas = clientes.flatMap((c) => c.Maquina || []);
      } else {
        maquinas = await apiFetch<Maquina[]>("/maquinas");
      }

      const results: MaquinaPagamento[] = [];
      for (const m of maquinas) {
        try {
          const path = `/pagamentos/${m.id}`;
          const res = await apiFetch<Record<string, unknown>>(path);
          console.log(`[Pagamentos] ${m.nome}:`, res);
          results.push({
            maquina: m,
            total: toNum(res.total),
            pix: toNum(res.pix),
            especie: toNum(res.especie ?? res.cash),
            debito: toNum(res.debito),
            creditoRemoto: toNum(res.creditoRemoto ?? res.creditosRemotos),
          });
        } catch (err) {
          console.warn(`[Pagamentos] Erro ${m.nome}:`, err);
          results.push({ maquina: m, total: 0, pix: 0, especie: 0, debito: 0, creditoRemoto: 0 });
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
    // Atualizar a cada 5 segundos
    intervalRef.current = setInterval(fetchData, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Carregando pagamentos..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;

  const grandTotal = dados.reduce((s, d) => s + d.total, 0);

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">Resumo Financeiro</h1>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin text-primary/60" style={{ animationDuration: "3s" }} />
          {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Grand total card */}
      <Card className="border-primary/30 bg-primary/10 p-4 shadow-gold">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/20">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Geral</p>
            <p className="text-2xl font-display font-bold text-foreground">{fmt(grandTotal)}</p>
          </div>
        </div>
      </Card>

      {/* Máquinas list */}
      <div className="space-y-3">
        {dados.map((item) => (
          <Card key={item.maquina.id} className="border-primary/10 bg-card/60 p-4 backdrop-blur-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold tracking-wider text-foreground">{item.maquina.nome || "Máquina"}</h3>
              <span className="text-sm font-bold text-primary">{fmt(item.total)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-blue-400/10 p-2">
                <p className="text-xs text-muted-foreground">PIX</p>
                <p className="text-sm font-medium text-blue-400">{fmt(item.pix)}</p>
              </div>
              <div className="rounded-lg bg-green-400/10 p-2">
                <p className="text-xs text-muted-foreground">Espécie</p>
                <p className="text-sm font-medium text-green-400">{fmt(item.especie)}</p>
              </div>
              <div className="rounded-lg bg-yellow-400/10 p-2">
                <p className="text-xs text-muted-foreground">Débito</p>
                <p className="text-sm font-medium text-yellow-400">{fmt(item.debito)}</p>
              </div>
              <div className="rounded-lg bg-purple-400/10 p-2">
                <p className="text-xs text-muted-foreground">Crédito Remoto</p>
                <p className="text-sm font-medium text-purple-400">{fmt(item.creditoRemoto)}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
