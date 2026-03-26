import { useEffect, useState } from "react";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DollarSign, Clock } from "lucide-react";

interface Pagamento {
  id?: string;
  valorDoPix?: number;
  valor?: number;
  dataPagamento?: string;
  dataInclusao?: string;
  ultimoPagamentoRecebido?: string | null;
  nome?: string;
  descricao?: string;
  [key: string]: unknown;
}

interface Maquina {
  id: string;
  nome?: string;
  descricao?: string;
  ultimoPagamentoRecebido?: string | null;
}

interface ClienteResponse {
  id: string;
  nome: string;
  Maquina: Maquina[];
}

export default function Pagamentos() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // Try fetching from /pagamentos first
        console.log("[Pagamentos] Fetching /pagamentos");
        const data = await apiFetch<Pagamento[]>("/pagamentos");
        console.log("[Pagamentos] RESPONSE:", data);
        if (Array.isArray(data) && data.length > 0) {
          setPagamentos(data);
          return;
        }
      } catch (err) {
        console.warn("[Pagamentos] /pagamentos failed, using fallback:", err);
      }

      // Fallback: use machine data
      try {
        setUseFallback(true);
        if (isAdmin()) {
          const clientes = await apiFetch<ClienteResponse[]>("/clientes");
          setMaquinas(clientes.flatMap((c) => c.Maquina || []));
        } else {
          const list = await apiFetch<Maquina[]>("/maquinas");
          setMaquinas(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar pagamentos");
      } finally {
        setLoading(false);
      }
    }

    load().finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Carregando pagamentos..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleString("pt-BR") : "—";

  const formatCurrency = (v?: number | null) =>
    v != null ? v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "—";

  // If we got real pagamentos data
  if (!useFallback && pagamentos.length > 0) {
    return (
      <div className="animate-fade-in">
        <h2 className="mb-4 font-display text-xl font-bold text-foreground">Pagamentos</h2>
        <div className="flex flex-col gap-3">
          {pagamentos.map((p, i) => (
            <div key={p.id || i} className="rounded-2xl bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {formatCurrency(p.valorDoPix ?? p.valor)}
                  </h3>
                  <p className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDate(p.dataPagamento ?? p.dataInclusao)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback: show machines with last payment info
  return (
    <div className="animate-fade-in">
      <h2 className="mb-4 font-display text-xl font-bold text-foreground">Pagamentos</h2>
      {maquinas.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum pagamento encontrado</p>
      ) : (
        <div className="flex flex-col gap-3">
          {maquinas.map((m, i) => (
            <div key={m.id || i} className="rounded-2xl bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-success/10">
                  <DollarSign className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{m.nome || `Máquina ${i + 1}`}</h3>
                  {m.descricao && <p className="text-xs text-muted-foreground">{m.descricao}</p>}
                </div>
                <div className="text-right">
                  {m.ultimoPagamentoRecebido ? (
                    <p className="text-xs text-muted-foreground">
                      {formatDate(m.ultimoPagamentoRecebido)}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Sem pagamentos</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
