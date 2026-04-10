import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DollarSign, CalendarIcon, RefreshCw, Undo2, Banknote, CreditCard, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";
import { PaymentTypeFilter, matchesPaymentType, type PaymentType } from "@/components/PaymentTypeFilter";

interface Transacao {
  id?: string;
  data?: string;
  dataHora?: string;
  valor?: string | number;
  tipo?: string;
  tipoPagamento?: string;
  tipoTransacao?: string;
  estornado?: boolean;
  removido?: boolean;
  operadora?: string;
  maquinaNome?: string;
  identificador?: string;
  [key: string]: unknown;
}

interface MaquinaItem {
  id: string;
  nome?: string;
  descricao?: string;
}

interface ClienteItem {
  id: string;
  nome: string;
  Maquina: MaquinaItem[];
}

interface PagamentosResponse {
  total?: number;
  pix?: number | string;
  especie?: number | string;
  cash?: number | string;
  debito?: number | string;
  creditoRemoto?: number | string;
  creditosRemotos?: number | string;
  dadosUnificados?: Transacao[];
  pagamentos?: Transacao[];
}

const toNum = (v?: unknown): number => {
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const fmt = (v: number) => {
  return `R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

export default function Transacoes() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [paymentFilter, setPaymentFilter] = useState<PaymentType>("all");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      let machines: (MaquinaItem & { estabelecimentoNome?: string })[] = [];
      if (isAdmin()) {
        const clientes = await apiFetch<ClienteItem[]>("/clientes");
        machines = Array.isArray(clientes) ? clientes.flatMap((c) => 
          (c.Maquina || []).map(m => ({ ...m, estabelecimentoNome: m.descricao || m.nome || c.nome }))
        ) : [];
      } else {
        const list = await apiFetch<MaquinaItem[]>("/maquinas");
        machines = Array.isArray(list) ? list : [];
      }

      const allTransacoes: Transacao[] = [];
      await Promise.allSettled(
        machines.map(async (m) => {
          try {
            const path = isAdmin() ? `/pagamentos-adm/${m.id}` : `/pagamentos/${m.id}`;
            const data = await apiFetch<PagamentosResponse>(path);
            const list = (data.pagamentos ?? data.dadosUnificados ?? []) as Transacao[];
            list.forEach((t) => {
              allTransacoes.push({ 
                ...t, 
                maquinaNome: m.nome || m.id,
                estabelecimentoNome: (m as any).estabelecimentoNome 
              });
            });
          } catch (err) {
            console.warn(`[Transacoes] Erro máquina ${m.id}:`, err);
          }
        })
      );

      allTransacoes.sort((a, b) => {
        const da = a.data || a.dataHora;
        const db = b.data || b.dataHora;
        return (db ? new Date(db).getTime() : 0) - (da ? new Date(da).getTime() : 0);
      });

      setTransacoes(allTransacoes);
      setLastUpdate(new Date());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar transações");
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Carregando transações..." />;

  const filtered = transacoes.filter((t) => {
    // Date filter
    const dateStr = t.data || t.dataHora;
    if (dateStr) {
      const d = new Date(dateStr);
      if (dateFrom && d < dateFrom) return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (d > end) return false;
      }
    }
    // Payment type filter
    if (!matchesPaymentType(t.tipo, t.tipoTransacao, t.estornado, paymentFilter)) return false;
    return true;
  });

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setPaymentFilter("all");
  };

  const getTypeLabel = (t: Transacao) => {
    if (t.tipoTransacao === "credito_remoto") return "Crédito Remoto";
    if (t.tipo === "bank_transfer" || t.tipo === "11") return "PIX";
    if (t.tipo === "CASH") return "Espécie";
    if (t.tipo === "debit_card") return "Débito";
    if (t.tipo === "credit_card" || t.tipo === "1") return "Crédito";
    return t.tipoPagamento || t.tipo || "Transação";
  };

  const getTypeIcon = (t: Transacao) => {
    if (t.estornado) return <Undo2 className="h-4 w-4 text-destructive" />;
    if (t.tipoTransacao === "credito_remoto") return <Smartphone className="h-4 w-4 text-cyan-400" />;
    if (t.tipo === "credit_card" || t.tipo === "1") return <CreditCard className="h-4 w-4 text-purple-400" />;
    if (t.tipo === "bank_transfer" || t.tipo === "11") return <Banknote className="h-4 w-4 text-blue-400" />;
    if (t.tipo === "debit_card") return <CreditCard className="h-4 w-4 text-yellow-400" />;
    return <DollarSign className="h-4 w-4 text-primary" />;
  };

  const formatDate = (t: Transacao) => {
    const d = t.data || t.dataHora;
    return d ? new Date(d).toLocaleString("pt-BR") : "—";
  };

  const hasActiveFilters = dateFrom || dateTo || paymentFilter !== "all";

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">Transações</h1>
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

      {/* Filters */}
      <Card className="border-primary/10 bg-card/60 p-3 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <CalendarIcon className="h-4 w-4 text-primary/60" />
          <span className="text-xs font-medium text-foreground">Filtros</span>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-6 px-2 text-primary ml-auto">
              Limpar
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DatePicker label="De" date={dateFrom} onSelect={setDateFrom} />
          <DatePicker label="Até" date={dateTo} onSelect={setDateTo} />
        </div>
        <PaymentTypeFilter
          selected={paymentFilter}
          onChange={setPaymentFilter}
          types={["all", "pix", "especie", "debito", "credito", "credito_remoto", "estorno"]}
        />
        {hasActiveFilters && (
          <p className="text-xs text-muted-foreground">
            {filtered.length} de {transacoes.length} registros
          </p>
        )}
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-border bg-card/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma transação encontrada</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.slice(0, 200).map((t, i) => (
            <Card
              key={t.id || i}
              className={cn("border-border/40 bg-card/60 p-4", t.estornado && "opacity-50")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                      t.estornado ? "bg-destructive/10" : "bg-primary/10"
                    )}
                  >
                    {getTypeIcon(t)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {getTypeLabel(t)}
                      {t.estornado && (
                        <span className="ml-1.5 text-xs text-destructive">(estornado)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(t)}</p>
                    {(t.maquinaNome || (t as any).estabelecimentoNome) && (
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                        {(t as any).estabelecimentoNome ? (t as any).estabelecimentoNome : t.maquinaNome}
                        {(t as any).estabelecimentoNome && t.maquinaNome && t.maquinaNome !== (t as any).estabelecimentoNome ? ` - ${t.maquinaNome}` : ""}
                      </p>
                    )}
                  </div>
                </div>
                <p
                  className={cn(
                    "text-sm font-bold shrink-0 ml-2",
                    t.estornado ? "text-destructive" : "text-primary"
                  )}
                >
                  {fmt(toNum(t.valor))}
                </p>
              </div>
            </Card>
          ))}
          {filtered.length > 200 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Mostrando 200 de {filtered.length} transações
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DatePicker({
  label,
  date,
  onSelect,
}: {
  label: string;
  date?: Date;
  onSelect: (d: Date | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 flex-1 justify-start text-left text-xs font-normal border-primary/20 bg-secondary/50",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-1.5 h-3 w-3" />
          {date ? format(date, "dd/MM/yyyy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-primary/20 bg-card" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={onSelect}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
