import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DollarSign, CalendarIcon, RefreshCw, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Card } from "@/components/ui/card";

interface Transacao {
  id?: string;
  data?: string;
  valor?: string | number;
  tipo?: string;
  tipoPagamento?: string;
  tipoTransacao?: string;
  estornado?: boolean;
  operadora?: string;
  maquinaNome?: string;
  [key: string]: unknown;
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
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Buscar todos os transações do usuário
      const path = `/transacoes`;
      const data = await apiFetch<Transacao[]>(path);
      console.log("[Transacoes] RESPONSE:", data);
      
      const all = Array.isArray(data) ? data : [];
      all.sort((a, b) => {
        const da = a.data ? new Date(a.data).getTime() : 0;
        const db = b.data ? new Date(b.data).getTime() : 0;
        return db - da;
      });

      setTransacoes(all);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar transações");
      console.error("[Transacoes] Error:", err);
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

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const getTypeLabel = (t: Transacao) => {
    if (t.tipoTransacao === "credito_remoto") return "Crédito Remoto";
    if (t.tipo === "bank_transfer") return "PIX";
    return t.tipoPagamento || t.tipo || "Transação";
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">Transações</h1>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin text-primary/60" style={{ animationDuration: "3s" }} />
          {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {/* Date filter */}
      <Card className="border-primary/10 bg-card/60 p-3">
        <div className="flex items-center gap-2 mb-2">
          <CalendarIcon className="h-4 w-4 text-primary/60" />
          <span className="text-xs font-medium text-foreground">Filtrar por data</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <DatePicker label="De" date={dateFrom} onSelect={setDateFrom} />
          <DatePicker label="Até" date={dateTo} onSelect={setDateTo} />
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-8 px-2 text-primary">Limpar</Button>
          )}
        </div>
        {(dateFrom || dateTo) && (
          <p className="mt-2 text-xs text-muted-foreground">{filtered.length} de {transacoes.length} registros</p>
        )}
      </Card>

      {filtered.length === 0 ? (
        <Card className="border-border bg-card/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhuma transação encontrada</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((t, i) => (
            <Card
              key={t.id || i}
              className={cn(
                "border-border/40 bg-card/60 p-4",
                t.estornado && "opacity-50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
                    t.estornado ? "bg-destructive/10" : "bg-primary/10"
                  )}>
                    {t.estornado ? <Undo2 className="h-4 w-4 text-destructive" /> : <DollarSign className="h-4 w-4 text-primary" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {getTypeLabel(t)}
                      {t.estornado && <span className="ml-1.5 text-xs text-destructive">(estornado)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t.data ? new Date(t.data).toLocaleString("pt-BR") : "—"}
                    </p>
                  </div>
                </div>
                <p className={cn("text-sm font-bold shrink-0 ml-2", t.estornado ? "text-destructive" : "text-primary")}>
                  {fmt(toNum(t.valor))}
                </p>
              </div>
            </Card>
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
        <Button variant="outline" className={cn("h-8 flex-1 justify-start text-left text-xs font-normal border-primary/20 bg-secondary/50", !date && "text-muted-foreground")}>
          <CalendarIcon className="mr-1.5 h-3 w-3" />
          {date ? format(date, "dd/MM/yyyy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-primary/20 bg-card" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  );
}
