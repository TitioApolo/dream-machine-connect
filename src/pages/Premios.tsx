import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Gift, RefreshCw, Package } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PremioItem {
  id?: string;
  data?: string;
  dataHora?: string;
  valor?: string | number;
  quantidade?: number;
  observacao?: string;
  tipo?: string;
  tipoTransacao?: string;
  identificador?: string;
  maquinaNome?: string;
  estabelecimentoNome?: string;
  [key: string]: unknown;
}

interface MaquinaItem {
  id: string;
  nome?: string;
  descricao?: string;
  estabelecimentoNome?: string;
}

interface ClienteItem {
  id: string;
  nome: string;
  Maquina: MaquinaItem[];
}

interface PagamentosResponse {
  estoque?: number | string;
  pagamentos?: PremioItem[];
  dadosUnificados?: PremioItem[];
  [key: string]: unknown;
}

const toNum = (v?: unknown): number => {
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

export default function Premios() {
  const [premios, setPremios] = useState<PremioItem[]>([]);
  const [estoqueTotal, setEstoqueTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      let machines: MaquinaItem[] = [];
      if (isAdmin()) {
        const clientes = await apiFetch<ClienteItem[]>("/clientes");
        machines = Array.isArray(clientes) ? clientes.flatMap((c) =>
          (c.Maquina || []).map(m => ({ ...m, estabelecimentoNome: m.descricao || m.nome || c.nome }))
        ) : [];
      } else {
        const list = await apiFetch<MaquinaItem[]>("/maquinas");
        machines = Array.isArray(list) ? list : [];
      }

      const allPremios: PremioItem[] = [];
      let totalEstoque = 0;

      await Promise.allSettled(
        machines.map(async (m) => {
          try {
            const path = isAdmin() ? `/pagamentos-adm/${m.id}` : `/pagamentos/${m.id}`;
            const data = await apiFetch<PagamentosResponse>(path);
            totalEstoque += toNum(data.estoque);

            // Extract credito_remoto transactions as "premios"
            const list = (data.pagamentos ?? data.dadosUnificados ?? []) as PremioItem[];
            list.forEach((t) => {
              if (t.tipoTransacao === "credito_remoto") {
                allPremios.push({
                  ...t,
                  maquinaNome: m.nome || m.id,
                  estabelecimentoNome: m.estabelecimentoNome || m.descricao,
                });
              }
            });
          } catch (err) {
            console.warn(`[Premios] Erro máquina ${m.id}:`, err);
          }
        })
      );

      allPremios.sort((a, b) => {
        const da = a.data || a.dataHora;
        const db = b.data || b.dataHora;
        return (db ? new Date(db).getTime() : 0) - (da ? new Date(da).getTime() : 0);
      });

      setPremios(allPremios);
      setEstoqueTotal(totalEstoque);
      setLastUpdate(new Date());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar prêmios");
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Carregando prêmios..." />;

  const formatDate = (p: PremioItem) => {
    const d = p.data || p.dataHora;
    return d ? new Date(d).toLocaleString("pt-BR") : "—";
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">Prêmios</h1>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin text-primary/60" style={{ animationDuration: "3s" }} />
          {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Estoque summary */}
      <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-gold">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estoque Total</p>
            <p className="font-display text-2xl font-bold text-primary">{estoqueTotal}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Créditos entregues</p>
            <p className="font-display text-lg font-bold text-foreground">{premios.length}</p>
          </div>
        </div>
      </Card>

      {premios.length === 0 ? (
        <Card className="border-border bg-card/60 p-8 text-center">
          <Gift className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum prêmio entregue encontrado</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {premios.map((p, i) => (
            <Card key={p.id || i} className="border-border/40 bg-card/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Gift className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {p.valor ? `R$ ${toNum(p.valor).toFixed(2).replace(".", ",")}` : "Crédito remoto"}
                    {p.tipo && <span className="ml-1.5 text-xs text-muted-foreground">({p.tipo})</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(p)}</p>
                  {(p.estabelecimentoNome || p.maquinaNome) && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {p.estabelecimentoNome && `${p.estabelecimentoNome} · `}{p.maquinaNome}
                    </p>
                  )}
                  {p.identificador && (
                    <p className="text-[10px] text-muted-foreground/50 mt-0.5 truncate">{p.identificador}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
