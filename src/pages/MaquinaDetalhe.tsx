import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  ArrowLeft, Cpu, MapPin, CheckCircle2, XCircle, Clock, DollarSign,
  CreditCard, Banknote, Gift, TrendingUp, Smartphone, CalendarIcon, RefreshCw,
  Undo2, Package, Edit3, Save
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface PagamentoItem {
  id?: string;
  data?: string;
  valor?: string | number;
  tipo?: string;
  tipoTransacao?: string;
  identificador?: string;
  estornado?: boolean;
  removido?: boolean;
  operadora?: string;
  [key: string]: unknown;
}

interface PagamentoResumo {
  total?: number;
  pix?: string | number;
  cash?: number;
  especie?: number;
  debito?: string | number;
  credito?: string | number;
  creditosRemotos?: string | number;
  creditoRemoto?: string | number;
  estornos?: number;
  estoque?: number;
  premios?: number;
  pagamentos?: PagamentoItem[];
  [key: string]: unknown;
}

export default function MaquinaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [maquina, setMaquina] = useState<MaquinaData | null>(null);
  const [resumo, setResumo] = useState<PagamentoResumo | null>(null);
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
      const path = isAdmin() ? `/pagamentos-adm/${id}` : `/pagamentos/${id}`;
      const data = await apiFetch<PagamentoResumo>(path);
      console.log("[MaquinaDetalhe] PAGAMENTOS RESPONSE:", data);
      setResumo(data);
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
        console.log("[MaquinaDetalhe] MAQUINA RESPONSE:", data);
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
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchDynamic]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await apiFetch(`/maquina-adm/${id}`, {
        method: "PUT",
        body: JSON.stringify({ nome: editNome, local: editLocal }),
      });
      setMaquina((prev) => prev ? { ...prev, nome: editNome, descricao: editLocal } : prev);
      setEditing(false);
    } catch (err) {
      console.error("[MaquinaDetalhe] save error:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Carregando máquina..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;
  if (!maquina) return null;

  const isActive = !!maquina.ultimoPagamentoRecebido;
  const formatDateStr = (d?: string | null) => d ? new Date(d).toLocaleString("pt-BR") : "—";
  const toNum = (v?: string | number | null): number => {
    if (v == null) return 0;
    return typeof v === "string" ? parseFloat(v) || 0 : v;
  };
  const formatCurrency = (v?: string | number | null) => {
    const n = toNum(v);
    return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const allPagamentos = resumo?.pagamentos || [];

  const filteredPagamentos = allPagamentos.filter((p) => {
    if (!p.data) return true;
    const d = new Date(p.data);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    return true;
  });

  const transacoes = filteredPagamentos.filter((p) => p.tipoTransacao === "pagamento" || p.tipoTransacao === "credito_remoto" || p.tipo === "bank_transfer");
  const premiosEntregues = filteredPagamentos.filter((p) => p.tipoTransacao === "premio" || (p.tipo || "").toLowerCase().includes("prêmio") || (p.tipo || "").toLowerCase().includes("premio"));

  const chartData = filteredPagamentos.reduce<Record<string, number>>((acc, p) => {
    if (!p.data || p.estornado || p.removido) return acc;
    const day = new Date(p.data).toLocaleDateString("pt-BR");
    acc[day] = (acc[day] || 0) + toNum(p.valor);
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
    { label: "Total", value: resumo?.total, icon: TrendingUp, color: "bg-primary/10 text-primary" },
    { label: "PIX", value: resumo?.pix, icon: Smartphone, color: "bg-accent/10 text-accent" },
    { label: "Espécie", value: resumo?.cash ?? resumo?.especie, icon: Banknote, color: "bg-success/10 text-success" },
    { label: "Débito", value: resumo?.debito, icon: CreditCard, color: "bg-warning/10 text-warning" },
    { label: "Crédito Remoto", value: resumo?.creditosRemotos ?? resumo?.creditoRemoto, icon: CreditCard, color: "bg-secondary text-secondary-foreground" },
    { label: "Estornos", value: resumo?.estornos, icon: Undo2, color: "bg-destructive/10 text-destructive" },
    { label: "Estoque", value: resumo?.estoque, icon: Package, color: "bg-primary/10 text-primary" },
  ];

  const getTypeIcon = (tipo?: string) => {
    const t = (tipo || "").toLowerCase();
    if (t.includes("pix") || t.includes("bank_transfer")) return <Smartphone className="h-4 w-4 text-accent" />;
    if (t.includes("remoto") || t.includes("credito_remoto")) return <CreditCard className="h-4 w-4 text-primary" />;
    if (t.includes("espécie") || t.includes("cash")) return <Banknote className="h-4 w-4 text-success" />;
    return <DollarSign className="h-4 w-4 text-primary" />;
  };

  const getTypeLabel = (p: PagamentoItem) => {
    if (p.tipoTransacao === "credito_remoto") return "Crédito Remoto";
    if (p.tipo === "bank_transfer") return "PIX";
    return p.tipo || p.tipoTransacao || "—";
  };

  const clearFilters = () => { setDateFrom(undefined); setDateTo(undefined); };

  return (
    <div className="animate-fade-in space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm font-medium text-primary">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
        <div className="flex items-center gap-2">
          {isAdmin() && !editing && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setEditing(true)}>
              <Edit3 className="h-3 w-3" /> Editar
            </Button>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} />
            {lastUpdate.toLocaleTimeString("pt-BR")}
          </div>
        </div>
      </div>

      {/* Machine header */}
      <div className="rounded-2xl bg-card p-4 shadow-card border border-border">
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Nome</label>
              <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Local</label>
              <Input value={editLocal} onChange={(e) => setEditLocal(e.target.value)} className="bg-secondary border-border" />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
                <Save className="h-3 w-3" /> {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Cpu className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-lg font-bold text-foreground truncate">{maquina.nome || "Máquina"}</h2>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {isActive ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Ativa</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-destructive"><XCircle className="h-3.5 w-3.5" /> Inativa</span>
                )}
                {(maquina.descricao || maquina.localizacao) && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{maquina.descricao || maquina.localizacao}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="resumo" className="w-full">
        <TabsList className="grid w-full grid-cols-4 rounded-xl bg-secondary h-10">
          <TabsTrigger value="resumo" className="rounded-lg text-xs">Resumo</TabsTrigger>
          <TabsTrigger value="transacoes" className="rounded-lg text-xs">Transações</TabsTrigger>
          <TabsTrigger value="premios" className="rounded-lg text-xs">Prêmios</TabsTrigger>
          <TabsTrigger value="info" className="rounded-lg text-xs">Detalhes</TabsTrigger>
        </TabsList>

        {/* RESUMO */}
        <TabsContent value="resumo" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {cards.map((c) => (
              <div key={c.label} className="rounded-2xl bg-card p-3 shadow-card border border-border">
                <div className={`mb-2 flex h-8 w-8 items-center justify-center rounded-lg ${c.color}`}>
                  <c.icon className="h-4 w-4" />
                </div>
                <p className="text-lg font-bold text-foreground">
                  {c.label === "Estoque" ? (toNum(c.value)) : formatCurrency(c.value)}
                </p>
                <p className="text-xs text-muted-foreground">{c.label}</p>
              </div>
            ))}
          </div>

          {chartEntries.length > 0 && (
            <div className="rounded-2xl bg-card p-4 shadow-card border border-border">
              <h3 className="mb-3 text-sm font-bold text-foreground">Pagamentos por Dia</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartEntries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="dia" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                  <YAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} stroke="hsl(var(--border))" />
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), "Valor"]}
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </TabsContent>

        {/* TRANSAÇÕES */}
        <TabsContent value="transacoes" className="mt-4 space-y-3">
          <div className="rounded-2xl bg-card p-3 shadow-card border border-border">
            <div className="flex items-center gap-2 mb-2">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-foreground">Filtrar por data</span>
            </div>
            <div className="flex items-center gap-2">
              <DatePicker label="De" date={dateFrom} onSelect={setDateFrom} />
              <DatePicker label="Até" date={dateTo} onSelect={setDateTo} />
              {(dateFrom || dateTo) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-8 px-2">Limpar</Button>
              )}
            </div>
            {(dateFrom || dateTo) && (
              <p className="mt-2 text-xs text-muted-foreground">{filteredPagamentos.length} de {allPagamentos.length} registros</p>
            )}
          </div>

          {transacoes.length > 0 ? (
            <div className="flex flex-col gap-2">
              {transacoes.map((p, i) => (
                <div key={p.id || i} className={cn(
                  "flex items-center justify-between rounded-xl bg-card px-4 py-3 shadow-card border border-border",
                  p.estornado && "opacity-50"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg",
                      p.estornado ? "bg-destructive/10" : "bg-primary/10"
                    )}>
                      {p.estornado ? <Undo2 className="h-4 w-4 text-destructive" /> : getTypeIcon(p.tipoTransacao || p.tipo)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {getTypeLabel(p)}
                        {p.estornado && <span className="ml-1.5 text-xs text-destructive">(estornado)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateStr(p.data)}</p>
                    </div>
                  </div>
                  <p className={cn("text-sm font-bold", p.estornado ? "text-destructive" : "text-foreground")}>
                    {formatCurrency(p.valor)}
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
          {premiosEntregues.length > 0 ? (
            <div className="flex flex-col gap-2">
              {premiosEntregues.map((p, i) => (
                <div key={p.id || i} className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 shadow-card border border-border">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
                    <Gift className="h-4 w-4 text-warning" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Prêmio entregue</p>
                    <p className="text-xs text-muted-foreground">{formatDateStr(p.data)}</p>
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
          <div className="rounded-2xl bg-card p-4 shadow-card border border-border space-y-2">
            {maquina.maquininha_serial && <InfoRow icon={Cpu} label="Serial" value={maquina.maquininha_serial} />}
            {maquina.store_id && <InfoRow icon={Cpu} label="Store ID" value={maquina.store_id} />}
            <InfoRow icon={DollarSign} label="Último pagamento" value={formatDateStr(maquina.ultimoPagamentoRecebido)} />
            <InfoRow icon={Clock} label="Última requisição" value={formatDateStr(maquina.ultimaRequisicao)} />
            {maquina.dataInclusao && <InfoRow icon={Clock} label="Data inclusão" value={formatDateStr(maquina.dataInclusao)} />}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DatePicker({ label, date, onSelect }: { label: string; date?: Date; onSelect: (d: Date | undefined) => void }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("h-8 flex-1 justify-start text-left text-xs font-normal", !date && "text-muted-foreground")}>
          <CalendarIcon className="mr-1.5 h-3 w-3" />
          {date ? format(date, "dd/MM/yyyy") : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={onSelect} initialFocus className={cn("p-3 pointer-events-auto")} />
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
    <div className="rounded-2xl bg-card p-8 text-center shadow-card border border-border">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
