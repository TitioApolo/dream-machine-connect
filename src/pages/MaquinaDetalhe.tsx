import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  ArrowLeft, Cpu, MapPin, CheckCircle2, XCircle, Clock, DollarSign,
  CreditCard, Banknote, Gift, TrendingUp, Smartphone
} from "lucide-react";
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

  // Real-time polling every 5s
  useEffect(() => {
    intervalRef.current = setInterval(fetchDynamic, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchDynamic]);

  if (loading) return <LoadingSpinner text="Carregando máquina..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;
  if (!maquina) return null;

  const isActive = !!maquina.ultimoPagamentoRecebido;
  const formatDate = (d?: string | null) => d ? new Date(d).toLocaleString("pt-BR") : "—";
  const formatCurrency = (v?: number) => v != null ? `R$ ${v.toFixed(2)}` : "R$ 0,00";

  // Chart data: group transacoes by date
  const chartData = transacoes.reduce<Record<string, number>>((acc, t) => {
    const dateStr = t.data || t.dataHora;
    if (!dateStr) return acc;
    const day = new Date(dateStr).toLocaleDateString("pt-BR");
    acc[day] = (acc[day] || 0) + (t.valor || 0);
    return acc;
  }, {});
  const chartEntries = Object.entries(chartData).map(([dia, valor]) => ({ dia, valor }));

  const cards = [
    { label: "Total", value: pagamentos?.total, icon: TrendingUp, color: "bg-primary/10 text-primary" },
    { label: "PIX", value: pagamentos?.pix, icon: Smartphone, color: "bg-accent/10 text-accent" },
    { label: "Espécie", value: pagamentos?.especie, icon: Banknote, color: "bg-success/10 text-success" },
    { label: "Débito", value: pagamentos?.debito, icon: CreditCard, color: "bg-warning/10 text-warning" },
    { label: "Crédito Remoto", value: pagamentos?.creditoRemoto, icon: CreditCard, color: "bg-secondary text-secondary-foreground" },
    { label: "Prêmios", value: pagamentos?.premios, icon: Gift, color: "bg-destructive/10 text-destructive" },
  ];

  return (
    <div className="animate-fade-in space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm font-medium text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      {/* Machine header */}
      <div className="rounded-2xl bg-card p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Cpu className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg font-bold text-foreground truncate">
              {maquina.nome || "Máquina"}
            </h2>
            <div className="flex items-center gap-1 mt-0.5">
              {isActive ? (
                <span className="flex items-center gap-1 text-xs font-medium text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Ativa
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <XCircle className="h-3.5 w-3.5" /> Inativa
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {(maquina.descricao || maquina.localizacao) && (
            <InfoRow icon={MapPin} label="Localização" value={maquina.descricao || maquina.localizacao || ""} />
          )}
          {maquina.maquininha_serial && (
            <InfoRow icon={Cpu} label="Serial" value={maquina.maquininha_serial} />
          )}
          <InfoRow icon={DollarSign} label="Último pagamento" value={formatDate(maquina.ultimoPagamentoRecebido)} />
          <InfoRow icon={Clock} label="Última requisição" value={formatDate(maquina.ultimaRequisicao)} />
        </div>
      </div>

      {/* Payment summary cards */}
      {pagamentos && (
        <div>
          <h3 className="mb-3 font-display text-base font-bold text-foreground">Resumo de Pagamentos</h3>
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
        </div>
      )}

      {/* Chart */}
      {chartEntries.length > 0 && (
        <div className="rounded-2xl bg-card p-4 shadow-card">
          <h3 className="mb-3 font-display text-base font-bold text-foreground">Transações por Dia</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartEntries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="dia" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Valor"]}
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
              />
              <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Transaction history */}
      {transacoes.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-base font-bold text-foreground">Histórico de Transações</h3>
          <div className="flex flex-col gap-2">
            {transacoes.slice(0, 50).map((t, i) => (
              <div key={t.id || i} className="flex items-center justify-between rounded-xl bg-card px-4 py-3 shadow-card">
                <div>
                  <p className="text-sm font-medium text-foreground">{t.tipoPagamento || "—"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(t.data || t.dataHora)}</p>
                </div>
                <p className="text-sm font-bold text-foreground">{formatCurrency(t.valor)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prize history */}
      {premios.length > 0 && (
        <div>
          <h3 className="mb-3 font-display text-base font-bold text-foreground">Histórico de Prêmios</h3>
          <div className="flex flex-col gap-2">
            {premios.slice(0, 50).map((p, i) => (
              <div key={p.id || i} className="flex items-center justify-between rounded-xl bg-card px-4 py-3 shadow-card">
                <div>
                  <p className="text-sm font-medium text-foreground">Qtd: {p.quantidade ?? "—"}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(p.dataHora)}</p>
                </div>
                {p.observacao && <p className="text-xs text-muted-foreground max-w-[50%] truncate">{p.observacao}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-secondary/50 px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
