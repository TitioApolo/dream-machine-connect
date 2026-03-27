import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  ArrowLeft, Cpu, MapPin, CheckCircle2, XCircle, Clock, DollarSign,
  CreditCard, Banknote, Gift, TrendingUp, Smartphone, CalendarIcon, RefreshCw
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface MaquinaData {
  id: string;
  nome?: string;
  descricao?: string;
  localizacao?: string;
  store_id?: string;
  maquininha_serial?: string;
  ultimoPagamentoRecebido?: string | null;
  ultimaRequisicao?: string | null;
  dataInclusao?: string;
  [key: string]: unknown;
}

interface PagamentoResumo {
  total?: number;
  pix?: number;
  especie?: number;
  debito?: number;
  creditoRemoto?: number;
  premios?: number;
  [key: string]: unknown;
}

interface Transacao {
  id?: string;
  data?: string;
  dataHora?: string;
  tipoPagamento?: string;
  valor?: number;
  [key: string]: unknown;
}

interface Premio {
  id?: string;
  dataHora?: string;
  quantidade?: number;
  observacao?: string;
  [key: string]: unknown;
}

export default function MaquinaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [maquina, setMaquina] = useState<MaquinaData | null>(null);
  const [pagamentos, setPagamentos] = useState<PagamentoResumo | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [premios, setPremios] = useState<Premio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDynamic = useCallback(async () => {
    if (!id) return;
    try {
      const [pagData, txData, prData] = await Promise.allSettled([
        apiFetch<PagamentoResumo>(`/pagamentos/${id}`),
        apiFetch<Transacao[]>(`/transacoes?maquinaId=${id}`),
        apiFetch<Premio[]>(`/premios?maquinaId=${id}`),
      ]);
      if (pagData.status === "fulfilled") setPagamentos(pagData.value);
      if (txData.status === "fulfilled") setTransacoes(Array.isArray(txData.value) ? txData.value : []);
      if (prData.status === "fulfilled") setPremios(Array.isArray(prData.value) ? prData.value : []);
      setLastUpdate(new Date());
    } catch (err) {
      console.warn("[MaquinaDetalhe] polling error:", err);
    }
  }, [id]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const path = isAdmin() ? `/maquina-adm/${id}` : `/maquina/${id}`;
        console.log("[MaquinaDetalhe] Fetching:", path);
        const data = await apiFetch<MaquinaData>(path);
        console.log("[MaquinaDetalhe] RESPONSE:", data);
        setMaquina(data);
        await fetchDynamic();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar máquina");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id, fetchDynamic]);

  useEffect(() => {
    intervalRef.current = setInterval(fetchDynamic, 5000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchDynamic]);

  if (loading) return <LoadingSpinner text="Carregando máquina..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;
  if (!maquina) return null;

  const isActive = !!maquina.ultimoPagamentoRecebido;
  const formatDate = (d?: string | null) => d ? new Date(d).toLocaleString("pt-BR") : "—";
  const formatCurrency = (v?: number) => v != null ? `R$ ${v.toFixed(2)}` : "R$ 0,00";

  // Filter transacoes by date range
  const filteredTransacoes = transacoes.filter((t) => {
    const dateStr = t.data || t.dataHora;
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo) {
      const endOfDay = new Date(dateTo);
      endOfDay.setHours(23, 59, 59, 999);
      if (d > endOfDay) return false;
    }
    return true;
  });

  // Chart data from filtered transacoes
  const chartData = filteredTransacoes.reduce<Record<string, number>>((acc, t) => {
    const dateStr = t.data || t.dataHora;
    if (!dateStr) return acc;
    const day = new Date(dateStr).toLocaleDateString("pt-BR");
    acc[day] = (acc[day] || 0) + (t.valor || 0);
    return acc;
  }, {});
  const chartEntries = Object.entries(chartData)
    .map(([dia, valor]) => ({ dia, valor }))
    .sort((a, b) => {
      const [dA, mA, yA] = a.dia.split("/").map(Number);
      const [dB, mB, yB] = b.dia.split("/").map(Number);
      return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime();
    });

  const cards = [
    { label: "Total", value: pagamentos?.total, icon: TrendingUp, color: "bg-primary/10 text-primary" },
    { label: "PIX", value: pagamentos?.pix, icon: Smartphone, color: "bg-accent/10 text-accent" },
    { label: "Espécie", value: pagamentos?.especie, icon: Banknote, color: "bg-success/10 text-success" },
    { label: "Débito", value: pagamentos?.debito, icon: CreditCard, color: "bg-warning/10 text-warning" },
    { label: "Crédito Remoto", value: pagamentos?.creditoRemoto, icon: CreditCard, color: "bg-secondary text-secondary-foreground" },
    { label: "Prêmios", value: pagamentos?.premios, icon: Gift, color: "bg-destructive/10 text-destructive" },
  ];

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="animate-fade-in space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} />
          {lastUpdate.toLocaleTimeString("pt-BR")}
        </div>
      </div>

      {/* Machine info card */}
      <div className="rounded-2xl bg-card p-4 shadow-card">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Cpu className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg font-bold text-foreground truncate">
              {maquina.nome || "Máquina"}
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              {isActive ? (
                <span className="flex items-center gap-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ativa
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <XCircle className="h-3.5 w-3.5" /> Inativa
                </span>
              )}
              {(maquina.descricao || maquina.localizacao) && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {maquina.descricao || maquina.localizacao}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-xl bg-secondary h-10">
          <TabsTrigger value="resumo" className="rounded-lg text-xs">Resumo</TabsTrigger>
          <TabsTrigger value="pagamentos" className="rounded-lg text-xs">Pagamentos</TabsTrigger>
          <TabsTrigger value="transacoes" className="rounded-lg text-xs">Transações</TabsTrigger>
          <TabsTrigger value="premios" className="rounded-lg text-xs">Prêmios</TabsTrigger>
        </TabsList>

        {/* TAB: Resumo */}
        <TabsContent value="resumo" className="mt-4 space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3">
            {cards.map((c) => (
              <div key={c.label} className="rounded-2xl bg-card p-3 shadow-card">
                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${c.color}`}>
                  <c.icon className="h-4 w-4" />
                </div>
                <p className="text-lg font-bold text-foreground">{formatCurrency(c.value)}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>

          {/* Machine details */}
          <div className="rounded-2xl bg-card p-4 shadow-card space-y-2">
            <h3 className="text-sm font-bold text-foreground mb-2">Detalhes</h3>
            {maquina.maquininha_serial && (
              <InfoRow icon={Cpu} label="Serial" value={maquina.maquininha_serial} />
            )}
            {maquina.store_id && (
              <InfoRow icon={Cpu} label="Store ID" value={maquina.store_id} />
            )}
            <InfoRow icon={DollarSign} label="Último pagamento" value={formatDate(maquina.ultimoPagamentoRecebido)} />
            <InfoRow icon={Clock} label="Última requisição" value={formatDate(maquina.ultimaRequisicao)} />
            {maquina.dataInclusao && (
              <InfoRow icon={Clock} label="Data inclusão" value={formatDate(maquina.dataInclusao)} />
            )}
          </div>
        </TabsContent>

        {/* TAB: Pagamentos (chart) */}
        <TabsContent value="pagamentos" className="mt-4 space-y-4">
          {chartEntries.length > 0 ? (
            <div className="rounded-2xl bg-card p-4 shadow-card">
              <h3 className="mb-3 text-sm font-bold text-foreground">Pagamentos por Dia</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartEntries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Valor"]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyState text="Nenhum dado de pagamento encontrado" />
          )}

          {/* Summary cards in pagamentos tab too */}
          <div className="grid grid-cols-3 gap-2">
            {cards.slice(0, 6).map((c) => (
              <div key={c.label} className="rounded-xl bg-card p-2.5 shadow-card text-center">
                <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
                <p className="text-sm font-bold text-foreground">{formatCurrency(c.value)}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB: Transações */}
        <TabsContent value="transacoes" className="mt-4 space-y-3">
          {/* Date filter */}
          <div className="rounded-2xl bg-card p-3 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Filtrar por data</span>
            </div>
            <div className="flex items-center gap-2">
              <DatePicker label="De" date={dateFrom} onSelect={setDateFrom} />
              <DatePicker label="Até" date={dateTo} onSelect={setDateTo} />
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-8 px-2">
                  Limpar
                </Button>
              )}
            </div>
            {(dateFrom || dateTo) && (
              <p className="mt-2 text-xs text-muted-foreground">
                {filteredTransacoes.length} de {transacoes.length} transações
              </p>
            )}
          </div>

          {/* Transaction list */}
          {filteredTransacoes.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filteredTransacoes.map((t, i) => (
                <div key={t.id || i} className="flex items-center justify-between rounded-xl bg-card px-4 py-3 shadow-card">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      t.tipoPagamento?.toLowerCase().includes("pix") ? "bg-accent/10" : "bg-primary/10"
                    )}>
                      {t.tipoPagamento?.toLowerCase().includes("pix") ? (
                        <Smartphone className="h-4 w-4 text-accent" />
                      ) : (
                        <DollarSign className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.tipoPagamento || "—"}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(t.data || t.dataHora)}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-foreground">{formatCurrency(t.valor)}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Nenhuma transação encontrada" />
          )}
        </TabsContent>

        {/* TAB: Prêmios */}
        <TabsContent value="premios" className="mt-4 space-y-3">
          {premios.length > 0 ? (
            <div className="flex flex-col gap-2">
              {premios.map((p, i) => (
                <div key={p.id || i} className="rounded-xl bg-card px-4 py-3 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                        <Gift className="h-4 w-4 text-warning" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Quantidade: {p.quantidade ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDate(p.dataHora)}</p>
                      </div>
                    </div>
                  </div>
                  {p.observacao && (
                    <p className="mt-2 text-xs text-muted-foreground pl-11">{p.observacao}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Nenhum prêmio encontrado" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DatePicker({ label, date, onSelect }: { label: string; date?: Date; onSelect: (d: Date | undefined) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "h-8 flex-1 justify-start text-left text-xs font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-1.5 h-3 w-3" />
          {date ? format(date, "dd/MM/yyyy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
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

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-secondary/50 px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl bg-card p-8 text-center shadow-card">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
