import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  ArrowLeft, Cpu, MapPin, Wifi, WifiOff, Clock, DollarSign,
  CreditCard, Banknote, Gift, TrendingUp, CalendarIcon, RefreshCw,
  Undo2, Edit3, Save
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const toNum = (v?: unknown): number => {
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

const fmt = (v: number) => {
  return `R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
};

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

interface Transacao {
  id?: string;
  data?: string;
  dataHora?: string;
  valor?: string | number;
  tipo?: string;
  tipoPagamento?: string;
  tipoTransacao?: string;
  identificador?: string;
  estornado?: boolean;
  removido?: boolean;
  operadora?: string;
  quantidade?: number | string;
  observacao?: string;
  [key: string]: unknown;
}

interface PagamentoResumo {
  // Client fields
  total?: number | string;
  pix?: number | string;
  especie?: number | string;
  debito?: number | string;
  creditoRemoto?: number | string;
  dadosUnificados?: Transacao[];
  // Admin fields (different keys)
  cash?: number | string;
  creditosRemotos?: number | string;
  credito?: number | string;
  estornos?: number | string;
  pagamentos?: Transacao[];
  [key: string]: unknown;
}

interface PremiosResponse {
  premios?: Transacao[];
  totalEntregues?: number;
  estoqueAtual?: number;
  [key: string]: unknown;
}

export default function MaquinaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [maquina, setMaquina] = useState<MaquinaData | null>(null);
  const [resumo, setResumo] = useState<PagamentoResumo | null>(null);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [premios, setPremios] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [editing, setEditing] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [editLocal, setEditLocal] = useState("");
  const [saving, setSaving] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDynamic = useCallback(async () => {
    if (!id) return;
    try {
      // Fetch pagamentos (admin uses different endpoint + different field names)
      const pagPath = isAdmin() ? `/pagamentos-adm/${id}` : `/pagamentos/${id}`;
      const data = await apiFetch<PagamentoResumo>(pagPath);
      setResumo(data);

      // Extract transactions: admin returns `pagamentos`, client returns `dadosUnificados`
      const txList = (data.pagamentos ?? data.dadosUnificados ?? []) as Transacao[];
      setTransacoes(Array.isArray(txList) ? txList : []);

      // Fetch premios using correct /api prefix
      const prePath = isAdmin()
        ? `/api/premios-entregues-adm/${id}`
        : `/api/premios-entregues/${id}`;
      try {
        const preData = await apiFetch<PremiosResponse | Transacao[]>(prePath);
        let preList: Transacao[] = [];
        if (Array.isArray(preData)) {
          preList = preData;
        } else if (preData && typeof preData === "object" && Array.isArray((preData as PremiosResponse).premios)) {
          preList = (preData as PremiosResponse).premios!;
        }
        setPremios(preList);
      } catch (err) {
        console.warn("[MaquinaDetalhe] Erro ao carregar prêmios:", err);
      }

      setLastUpdate(new Date());
    } catch (err) {
      console.warn("[MaquinaDetalhe] pagamentos error:", err);
    }
  }, [id]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const path = isAdmin() ? `/maquina-adm/${id}` : `/maquina/${id}`;
        const data = await apiFetch<MaquinaData>(path);
        setMaquina(data);
        setEditNome(data.nome || "");
        setEditLocal(data.descricao || data.localizacao || "");
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
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchDynamic]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await apiFetch(`/maquina-adm/${id}`, {
        method: "PUT",
        body: JSON.stringify({ nome: editNome, local: editLocal }),
      });
      setMaquina((prev) => (prev ? { ...prev, nome: editNome, descricao: editLocal } : prev));
      setEditing(false);
    } catch (err) {
      console.error("[MaquinaDetalhe] save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Carregando máquina..." />;
  if (error)
    return (
      <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">
        {error}
      </div>
    );
  if (!maquina) return null;

  const isOnline = (() => {
    const last = maquina.ultimaRequisicao || maquina.ultimoPagamentoRecebido;
    if (!last) return false;
    return Date.now() - new Date(last).getTime() < 5 * 60 * 1000;
  })();

  const formatDateStr = (d?: string | null) =>
    d ? new Date(d).toLocaleString("pt-BR") : "—";

  const filteredTransacoes = transacoes.filter((t) => {
    const dateStr = t.data || t.dataHora;
    if (!dateStr) return true;
    const d = new Date(dateStr);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  });

  const chartData = transacoes.reduce<Record<string, number>>((acc, t) => {
    const dateStr = t.data || t.dataHora;
    if (!dateStr || t.estornado || t.removido) return acc;
    const day = new Date(dateStr).toLocaleDateString("pt-BR");
    acc[day] = (acc[day] || 0) + toNum(t.valor);
    return acc;
  }, {});
  const chartEntries = Object.entries(chartData)
    .map(([dia, valor]) => ({ dia, valor }))
    .sort((a, b) => {
      const [dA, mA, yA] = a.dia.split("/").map(Number);
      const [dB, mB, yB] = b.dia.split("/").map(Number);
      return new Date(yA, mA - 1, dA).getTime() - new Date(yB, mB - 1, dB).getTime();
    });

  // Normalize field names (admin uses cash/creditosRemotos, client uses especie/creditoRemoto)
  const normalizedResumo = {
    total: resumo?.total,
    pix: resumo?.pix,
    especie: resumo?.especie ?? resumo?.cash,
    debito: resumo?.debito,
    creditoRemoto: resumo?.creditoRemoto ?? resumo?.creditosRemotos,
  };

  const cards = [
    { label: "Total", value: normalizedResumo.total, icon: TrendingUp, color: "border-primary/30 bg-primary/10 text-primary" },
    { label: "PIX", value: normalizedResumo.pix, icon: Banknote, color: "border-blue-400/30 bg-blue-400/10 text-blue-400" },
    { label: "Espécie", value: normalizedResumo.especie, icon: Banknote, color: "border-green-400/30 bg-green-400/10 text-green-400" },
    { label: "Débito", value: normalizedResumo.debito, icon: CreditCard, color: "border-yellow-400/30 bg-yellow-400/10 text-yellow-400" },
    { label: "Crédito Remoto", value: normalizedResumo.creditoRemoto, icon: CreditCard, color: "border-purple-400/30 bg-purple-400/10 text-purple-400" },
  ];

  const getTypeIcon = (t: Transacao) => {
    if (t.estornado) return <Undo2 className="h-4 w-4 text-destructive" />;
    if (t.tipoTransacao === "credito_remoto") return <CreditCard className="h-4 w-4 text-info" />;
    if (t.tipo === "bank_transfer" || t.tipo === "11") return <Banknote className="h-4 w-4 text-accent" />;
    if (t.tipo === "CASH") return <Banknote className="h-4 w-4 text-success" />;
    return <DollarSign className="h-4 w-4 text-primary" />;
  };

  const getTypeLabel = (t: Transacao) => {
    if (t.tipoTransacao === "credito_remoto") return "Crédito Remoto";
    if (t.tipo === "bank_transfer" || t.tipo === "11") return "PIX";
    if (t.tipo === "CASH") return "Espécie";
    if (t.tipo === "debit_card") return "Débito";
    if (t.tipo === "credit_card") return "Crédito";
    return t.tipoPagamento || t.tipo || "—";
  };

  const clearFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="animate-fade-in space-y-4 pb-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex items-center gap-2">
          {isAdmin() && !editing && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-primary"
              onClick={() => setEditing(true)}
            >
              <Edit3 className="h-3 w-3" /> Editar
            </Button>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw
              className="h-3 w-3 animate-spin text-primary/60"
              style={{ animationDuration: "3s" }}
            />
            {lastUpdate.toLocaleTimeString("pt-BR")}
          </div>
        </div>
      </div>

      {/* Machine header */}
      <div className="rounded-2xl border border-primary/20 bg-card p-4 shadow-gold">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Nome
              </label>
              <Input
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                className="bg-secondary border-primary/20"
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1 block">
                Local
              </label>
              <Input
                value={editLocal}
                onChange={(e) => setEditLocal(e.target.value)}
                className="bg-secondary border-primary/20"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1 shadow-gold">
                <Save className="h-3 w-3" /> {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <span className="text-2xl">🧸</span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-base font-bold tracking-wide text-foreground truncate">
                {maquina.nome || "Máquina"}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {isOnline ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-success">
                    <Wifi className="h-3.5 w-3.5" /> Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-bold text-destructive">
                    <WifiOff className="h-3.5 w-3.5" /> Offline
                  </span>
                )}
                {(maquina.descricao || maquina.localizacao) && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 text-primary/60" />
                    {maquina.descricao || maquina.localizacao}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-xl border border-primary/10 bg-secondary h-10">
          <TabsTrigger
            value="resumo"
            className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Resumo
          </TabsTrigger>
          <TabsTrigger
            value="transacoes"
            className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Transações
          </TabsTrigger>
          <TabsTrigger
            value="premios"
            className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Prêmios
          </TabsTrigger>
          <TabsTrigger
            value="info"
            className="rounded-lg text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            Detalhes
          </TabsTrigger>
        </TabsList>

        {/* RESUMO */}
        <TabsContent value="resumo" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {cards.map((c) => (
              <div
                key={c.label}
                className={`rounded-2xl border bg-card p-3 shadow-card ${c.color.split(" ")[0]}`}
              >
                <div
                  className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${c.color}`}
                >
                  <c.icon className="h-4 w-4" />
                </div>
                <p className="text-lg font-bold text-foreground">{fmt(toNum(c.value))}</p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>

          {chartEntries.length > 0 && (
            <div className="rounded-2xl border border-primary/10 bg-card p-4 shadow-card">
              <h3 className="mb-3 text-sm font-bold text-primary font-display tracking-wide">
                Pagamentos por Dia
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartEntries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="dia"
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <YAxis
                    tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }}
                    stroke="hsl(var(--border))"
                  />
                  <Tooltip
                    formatter={(value: number) => [fmt(value), "Valor"]}
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                      color: "hsl(var(--foreground))",
                    }}
                  />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </TabsContent>

        {/* TRANSAÇÕES */}
        <TabsContent value="transacoes" className="mt-4 space-y-3">
          <div className="rounded-2xl border border-primary/10 bg-card p-3 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-4 w-4 text-primary/60" />
              <span className="text-xs font-medium text-foreground">Filtrar por data</span>
            </div>
            <div className="flex items-center gap-2">
              <DatePicker label="De" date={dateFrom} onSelect={setDateFrom} />
              <DatePicker label="Até" date={dateTo} onSelect={setDateTo} />
              {(dateFrom || dateTo) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs h-8 px-2 text-primary"
                >
                  Limpar
                </Button>
              )}
            </div>
            {(dateFrom || dateTo) && (
              <p className="mt-2 text-xs text-muted-foreground">
                {filteredTransacoes.length} de {transacoes.length} registros
              </p>
            )}
          </div>

          {filteredTransacoes.length > 0 ? (
            <div className="flex flex-col gap-2">
              {filteredTransacoes.map((p, i) => (
                <div
                  key={p.id || i}
                  className={cn(
                    "flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-card",
                    p.estornado && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg",
                        p.estornado ? "bg-destructive/10" : "bg-primary/10"
                      )}
                    >
                      {getTypeIcon(p)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {getTypeLabel(p)}
                        {p.estornado && (
                          <span className="ml-1.5 text-xs text-destructive">(estornado)</span>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateStr(p.data || p.dataHora)}
                      </p>
                    </div>
                  </div>
                  <p
                    className={cn(
                      "text-sm font-bold",
                      p.estornado ? "text-destructive" : "text-primary"
                    )}
                  >
                    {fmt(toNum(p.valor))}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Nenhuma transação encontrada" />
          )}
        </TabsContent>

        {/* PRÊMIOS */}
        <TabsContent value="premios" className="mt-4 space-y-3">
          {premios.length > 0 ? (
            <div className="flex flex-col gap-2">
              {premios.map((p, i) => (
                <div
                  key={p.id || i}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-card"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Gift className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {p.quantidade ? `${p.quantidade}x ` : ""}
                      Prêmio{p.quantidade && toNum(p.quantidade) > 1 ? "s" : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateStr(p.data || p.dataHora)}
                    </p>
                    {p.observacao && (
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {String(p.observacao)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="Nenhum prêmio encontrado" />
          )}
        </TabsContent>

        {/* DETALHES */}
        <TabsContent value="info" className="mt-4">
          <div className="rounded-2xl border border-primary/10 bg-card p-4 shadow-card space-y-2">
            {maquina.maquininha_serial && (
              <InfoRow icon={Cpu} label="Serial (MP)" value={maquina.maquininha_serial} />
            )}
            {maquina.store_id && (
              <InfoRow icon={Cpu} label="Store ID (PAG)" value={maquina.store_id} />
            )}
            <InfoRow
              icon={DollarSign}
              label="Último pagamento"
              value={formatDateStr(maquina.ultimoPagamentoRecebido)}
            />
            <InfoRow
              icon={Clock}
              label="Última requisição"
              value={formatDateStr(maquina.ultimaRequisicao)}
            />
            {maquina.dataInclusao && (
              <InfoRow
                icon={Clock}
                label="Data inclusão"
                value={formatDateStr(maquina.dataInclusao)}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
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
            "h-8 flex-1 justify-start text-left text-xs font-normal border-primary/20",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-1.5 h-3 w-3" />
          {date ? format(date, "dd/MM/yyyy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-primary/20" align="start">
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

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-secondary/50 px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary/60" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-card">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}