import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

interface Transacao {
  id?: number;
  _id?: string;
  tipo?: string;
  valor?: number;
  data?: string;
  descricao?: string;
  maquina?: string;
  [key: string]: unknown;
}

export default function Transacoes() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Transacao[] | { data: Transacao[] }>("/transacoes")
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as { data: Transacao[] }).data || [];
        setTransacoes(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Carregando transações..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;

  return (
    <div className="animate-fade-in">
      <h2 className="mb-4 font-display text-xl font-bold text-foreground">Transações</h2>
      {transacoes.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhuma transação encontrada</p>
      ) : (
        <div className="flex flex-col gap-2">
          {transacoes.map((t, i) => {
            const isPositive = t.tipo === "entrada" || (t.valor != null && t.valor > 0);
            return (
              <div key={t.id || t._id || i} className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isPositive ? "bg-success/10" : "bg-destructive/10"}`}>
                  {isPositive ? (
                    <ArrowDownLeft className="h-4 w-4 text-success" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {t.descricao || t.maquina || `Transação #${t.id || i + 1}`}
                  </p>
                  {t.data && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(t.data).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
                {t.valor != null && (
                  <span className={`text-sm font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
                    {isPositive ? "+" : "-"} R$ {Math.abs(t.valor).toFixed(2)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
