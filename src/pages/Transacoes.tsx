import { useEffect, useState } from "react";
import { apiFetch, apiFetchFirst } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface Maquina {
  id: string;
}

interface Transacao {
  id: string;
  descricao: string;
  valor: number;
}

export default function Transacoes() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [origem, setOrigem] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const result = await apiFetchFirst<unknown>(["/transacoes"]);

        if (Array.isArray(result)) {
          const list = (result as Array<Record<string, unknown>>).map((item, index) => ({
            id: String(item.id ?? item._id ?? index),
            descricao: String(item.descricao ?? item.maquina ?? `Transação #${index + 1}`),
            valor: Number(item.valor ?? 0),
          }));
          setOrigem("/transacoes");
          setTransacoes(list);
          return;
        }

        throw new Error("Formato inesperado em /transacoes");
      } catch {
        const maquinas = await apiFetch<Maquina[]>("/maquinas");
        if (!maquinas[0]?.id) {
          throw new Error("Nenhuma máquina encontrada para buscar transações.");
        }

        const pagamentos = await apiFetch<Record<string, unknown>>(`/pagamentos/${maquinas[0].id}`);
        const list = Object.entries(pagamentos)
          .filter(([, value]) => typeof value === "number" || (typeof value === "string" && !Number.isNaN(Number(value))))
          .map(([chave, valor], index) => ({
            id: `${chave}-${index}`,
            descricao: chave,
            valor: Number(valor),
          }));

        setOrigem(`/pagamentos/${maquinas[0].id}`);
        setTransacoes(list);
      } finally {
        setLoading(false);
      }
    }

    load().catch((err) => {
      const message = err instanceof Error ? err.message : "Erro ao carregar transações";
      setError(message);
      setLoading(false);
    });
  }, []);

  if (loading) return <LoadingSpinner text="Carregando transações..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;

  return (
    <div className="animate-fade-in">
      <h2 className="mb-2 font-display text-xl font-bold text-foreground">Transações</h2>
      {origem && <p className="mb-4 text-xs text-muted-foreground">Origem: {origem}</p>}

      {transacoes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma transação encontrada</p>
      ) : (
        <div className="flex flex-col gap-2">
          {transacoes.map((t) => {
            const isPositive = t.valor >= 0;
            return (
              <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isPositive ? "bg-success/10" : "bg-destructive/10"}`}>
                  {isPositive ? (
                    <ArrowDownLeft className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{t.descricao}</p>
                </div>
                <span className={`text-sm font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
                  {isPositive ? "+" : "-"} R$ {Math.abs(t.valor).toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
