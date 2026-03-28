import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Gift, Cpu, RefreshCw } from "lucide-react";

interface Maquina {
  id: string;
  nome?: string;
}

interface ClienteResponse {
  id: string;
  Maquina: Maquina[];
}

interface PremioItem {
  id?: string;
  data?: string;
  dataHora?: string;
  quantidade?: number;
  observacao?: string;
  tipo?: string;
  tipoTransacao?: string;
  maquinaNome?: string;
  [key: string]: unknown;
}

export default function Premios() {
  const [premios, setPremios] = useState<PremioItem[]>([]);
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

      const all: PremioItem[] = [];
      for (const m of maquinas) {
        try {
          // Try /premios?maquinaId= first
          try {
            const items = await apiFetch<PremioItem[]>(`/premios?maquinaId=${m.id}`);
            if (Array.isArray(items)) {
              items.forEach((p) => { p.maquinaNome = m.nome; });
              all.push(...items);
              continue;
            }
          } catch {
            // fallback: extract from pagamentos
          }

          const path = isAdmin() ? `/pagamentos-adm/${m.id}` : `/pagamentos/${m.id}`;
          const res = await apiFetch<{ pagamentos?: PremioItem[] }>(path);
          const pagamentos = res.pagamentos || [];
          const premioItems = pagamentos.filter(
            (p) => p.tipoTransacao === "premio" || (p.tipo || "").toLowerCase().includes("prêmio") || (p.tipo || "").toLowerCase().includes("premio")
          );
          premioItems.forEach((p) => { p.maquinaNome = m.nome; });
          all.push(...premioItems);
        } catch (err) {
          console.warn(`[Premios] Erro ${m.nome}:`, err);
        }
      }

      all.sort((a, b) => {
        const da = (a.data || a.dataHora) ? new Date(a.data || a.dataHora!).getTime() : 0;
        const db = (b.data || b.dataHora) ? new Date(b.data || b.dataHora!).getTime() : 0;
        return db - da;
      });

      console.log("[Premios] Total:", all.length);
      setPremios(all);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar prêmios");
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchData, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Carregando prêmios..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;

  const formatDate = (p: PremioItem) => {
    const d = p.data || p.dataHora;
    return d ? new Date(d).toLocaleString("pt-BR") : "—";
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">Prêmios</h2>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} />
          {lastUpdate.toLocaleTimeString("pt-BR")}
        </div>
      </div>

      {premios.length === 0 ? (
        <div className="rounded-2xl bg-card p-8 text-center shadow-card border border-border">
          <Gift className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum prêmio encontrado</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {premios.map((p, i) => (
            <div key={p.id || i} className="rounded-xl bg-card px-4 py-3 shadow-card border border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning/10">
                  <Gift className="h-4 w-4 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {p.quantidade != null ? `${p.quantidade}x prêmio` : "Prêmio entregue"}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(p)}</p>
                  {p.maquinaNome && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Cpu className="h-2.5 w-2.5" />{p.maquinaNome}
                    </p>
                  )}
                </div>
                {p.observacao && (
                  <p className="text-xs text-muted-foreground max-w-[120px] truncate">{p.observacao}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
