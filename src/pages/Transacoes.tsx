import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  Cpu, Smartphone, Banknote, CreditCard, DollarSign, CalendarIcon, RefreshCw, Undo2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Maquina { id: string; nome?: string; }
interface ClienteResponse { id: string; Maquina: Maquina[]; }

interface Transacao {
  id?: string;
  data?: string;
  valor?: string | number;
  tipo?: string;
  tipoTransacao?: string;
  estornado?: boolean;
  operadora?: string;
  maquinaNome?: string;
  [key: string]: unknown;
}

const toNum = (v?: string | number | null): number => {
  if (v == null) return 0;
  return typeof v === "string" ? parseFloat(v) || 0 : v;
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Transacoes() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
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

      const all: Transacao[] = [];
      for (const m of maquinas) {
        try {
          const path = isAdmin() ? `/pagamentos-adm/${m.id}` : `/pagamentos/${m.id}`;
          const res = await apiFetch<{ pagamentos?: Transacao[] }>(path);
          const items = res.pagamentos || [];
          items.forEach((t) => { t.maquinaNome = m.nome; });
          all.push(...items);
        } catch (err) {
          console.warn(`[Transacoes] Erro ${m.nome}:`, err);
        }
      }

      all.sort((a, b) => {
        const da = a.data ? new Date(a.data).getTime() : 0;
        const db = b.data ? new Date(b.data).getTime() : 0;
        return db - da;
      });

      setTransacoes(all);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar transações");
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchData, 10000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Carregando transações..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;

  const filtered = transacoes.filter((t) => {
    if (!t.data) return true;
    const d = new Date(t.data);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  });

  const clearFilters = () => { setDateFrom(undefined); setDateTo(undefined); };

  const getTypeIcon = (t: Transacao) => {
    const tipo = (t.tipoTransacao || t.tipo || "").toLowerCase();
    if (tipo.includes("pix") || t.tipo === "bank_transfer") return <Smartphone className="h-4 w-4 text-accent" />;
    if (tipo.includes("remoto")) return <CreditCard className="h-4 w-4 text-info" />;
    if (tipo.includes("cash") || tipo.includes("espécie")) return <Banknote className="h-4 w-4 text-success" />;
    if (t.estornado) return <Undo2 className="h-4 w-4 text-destructive" />;
    return <DollarSign className="h-4 w-4 text-primary" />;
  };

  const getTypeLabel = (t: Transacao) => {
    if (t.tipoTransacao === "credito_remoto") return "Crédito Remoto";
    if (t.tipo === "bank_transfer") return "PIX";
    return t.tipo || t.tipoTransacao || "Pagamento";
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-bold tracking-wider text-primary">Transações</h2>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin text-primary/60" style={{ animationDuration: "3s" }} />
          {lastUpdate.toLocaleTimeString("pt-BR")}
        </div>
      </div>

      {/* Date filter */}
      <div className="rounded-2xl border border-primary/10 bg-card p-3 shadow-card">
        <div className="flex items-center gap-2 mb-2">
          <CalendarIcon className="h-4 w-4 text-primary/60" />
          <span className="text-xs font-medium text-foreground">Filtrar por data</span>
        </div>
        <div className="flex items-center gap-2">
          <DatePicker label="De" date={dateFrom} onSelect={setDateFrom} />
          <DatePicker label="Até" date={dateTo} onSelect={setDateTo} />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-8 px-2 text-primary">Limpar</Button>
          )}
        </div>
        {(dateFrom || dateTo) && (
          <p className="mt-2 text-xs text-muted-foreground">{filtered.length} de {transacoes.length} registros</p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
          <p className="text-sm text-muted-foreground">Nenhuma transação encontrada</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.slice(0, 100).map((t, i) => (
            <div
              key={t.id || i}
              className={cn(
                "flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-card",
                t.estornado && "opacity-50"
              )}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg",
                  t.estornado ? "bg-destructive/10" : "bg-primary/10"
                )}>
                  {getTypeIcon(t)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {getTypeLabel(t)}
                    {t.estornado && <span className="ml-1.5 text-xs text-destructive">(estornado)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t.data ? new Date(t.data).toLocaleString("pt-BR") : "—"}
                  </p>
                  {t.maquinaNome && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Cpu className="h-2.5 w-2.5" />{t.maquinaNome}
                    </p>
                  )}
                </div>
              </div>
              <p className={cn("text-sm font-bold", t.estornado ? "text-destructive" : "text-primary")}>
                {fmt(toNum(t.valor))}
              </p>
            </div>
          ))}
          {filtered.length > 100 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Mostrando 100 de {filtered.length} transações
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DatePicker({ label, date, onSelect }: { label: string; date?: Date; onSelect: (d: Date | undefined) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("h-8 flex-1 justify-start text-left text-xs font-normal border-primary/20", !date && "text-muted-foreground")}>
          <CalendarIcon className="mr-1.5 h-3 w-3" />
          {date ? format(date, "dd/MM/yyyy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-primary/20" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  );
}
