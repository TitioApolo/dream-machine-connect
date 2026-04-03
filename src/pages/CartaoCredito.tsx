import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { CreditCard, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PaymentTypeFilter, type PaymentType } from "@/components/PaymentTypeFilter";

interface Transacao {
  id?: string;
  data?: string;
  dataHora?: string;
  valor?: string | number;
  tipo?: string;
  tipoTransacao?: string;
  estornado?: boolean;
  removido?: boolean;
  identificador?: string;
  maquinaNome?: string;
  estabelecimentoNome?: string;
  [key: string]: unknown;
}

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
  pagamentos?: Transacao[];
  credito?: number | string;
  creditoRemoto?: number | string;
  creditosRemotos?: number | string;
  [key: string]: unknown;
}

const fmt = (v: number) =>
  `R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

const toNum = (v?: unknown): number => {
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

export default function CartaoCredito() {
  const [items, setItems] = useState<Transacao[]>([]);
  const [totalCredito, setTotalCredito] = useState(0);
  const [totalCreditoRemoto, setTotalCreditoRemoto] = useState(0);
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
              (c.Maquina || []).map((m) => ({ ...m, estabelecimentoNome: c.nome }))
            )
          : [];
      } else {
        const list = await apiFetch<MaquinaItem[]>("/maquinas");
        machines = Array.isArray(list) ? list : [];
      }

      const allItems: Transacao[] = [];
      let sumCredito = 0;
      let sumCreditoRemoto = 0;

      await Promise.allSettled(
        machines.map(async (m) => {
          try {
            const path = isAdmin()
              ? `/pagamentos-adm/${m.id}`
              : `/pagamentos/${m.id}`;
            const data = await apiFetch<PagamentosResponse>(path);

            sumCredito += toNum(data.credito);
            sumCreditoRemoto += toNum(data.creditoRemoto ?? data.creditosRemotos);

            const pagamentos = Array.isArray(data.pagamentos) ? data.pagamentos : [];
            // Include credit card AND credito remoto transactions
            const creditTransactions = pagamentos.filter(
              (p) => p.tipo === "credit_card" || p.tipo === "1" || p.tipoTransacao === "credito_remoto"
            );
            creditTransactions.forEach((t) => {
              allItems.push({
                ...t,
                maquinaNome: m.nome || m.id,
                estabelecimentoNome: m.estabelecimentoNome,
              });
            });
          } catch (err) {
            console.warn(`[CartaoCredito] Erro máquina ${m.id}:`, err);
          }
        })
      );

      allItems.sort((a, b) => {
        const da = a.data || a.dataHora;
        const db = b.data || b.dataHora;
        return (db ? new Date(db).getTime() : 0) - (da ? new Date(da).getTime() : 0);
      });

      setItems(allItems);
      setTotalCredito(sumCredito);
      setTotalCreditoRemoto(sumCreditoRemoto);
      setLastUpdate(new Date());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Carregando cartões..." />;

  const formatDate = (item: Transacao) => {
    const d = item.data || item.dataHora;
    return d ? new Date(d).toLocaleString("pt-BR") : "—";
  };

  const getLabel = (t: Transacao) => {
    if (t.tipoTransacao === "credito_remoto") return "Crédito Remoto";
    return "Cartão de Crédito";
  };

  const filtered = filter === "all" 
    ? items 
    : items.filter((t) => {
        if (filter === "credito") return t.tipo === "credit_card" || t.tipo === "1";
        if (filter === "credito_remoto") return t.tipoTransacao === "credito_remoto";
        return true;
      });

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">Cartão de Crédito</h1>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin text-primary/60" style={{ animationDuration: "3s" }} />
          {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Total cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-purple-400/30 bg-gradient-to-br from-purple-400/10 to-purple-400/5 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-400/20 border border-purple-400/30">
              <CreditCard className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Crédito</p>
              <p className="font-display text-lg font-bold text-purple-400">{fmt(totalCredito)}</p>
            </div>
          </div>
        </Card>
        <Card className="border-cyan-400/30 bg-gradient-to-br from-cyan-400/10 to-cyan-400/5 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/20 border border-cyan-400/30">
              <CreditCard className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Cred. Remoto</p>
              <p className="font-display text-lg font-bold text-cyan-400">{fmt(totalCreditoRemoto)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter */}
      <PaymentTypeFilter
        selected={filter}
        onChange={setFilter}
        types={["all", "credito", "credito_remoto"]}
      />

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="border-border bg-card/60 p-8 text-center">
          <CreditCard className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhuma transação encontrada</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((item, i) => {
            const isRemoto = item.tipoTransacao === "credito_remoto";
            return (
              <Card key={item.id || i} className="border-border/40 bg-card/60 p-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${isRemoto ? "bg-cyan-400/10 border-cyan-400/20" : "bg-purple-400/10 border-purple-400/20"}`}>
                    <CreditCard className={`h-4 w-4 ${isRemoto ? "text-cyan-400" : "text-purple-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">{getLabel(item)}</p>
                      <p className="text-sm font-bold text-primary">{fmt(toNum(item.valor))}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDate(item)}</p>
                    {(item.maquinaNome || item.estabelecimentoNome) && (
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {item.estabelecimentoNome && `${item.estabelecimentoNome} - `}{item.maquinaNome}
                      </p>
                    )}
                    {item.identificador && (
                      <p className="text-xs text-muted-foreground/70 mt-1">{String(item.identificador)}</p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
