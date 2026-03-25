import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface Maquina {
  id: string;
  nome?: string;
}

interface PagamentoResumo {
  total?: number;
  estornos?: number;
  cash?: number;
  pix?: number | string;
  debito?: number | string;
  credito?: number | string;
  creditosRemotos?: number | string;
  [key: string]: unknown;
}

export default function Pagamentos() {
  const [maquina, setMaquina] = useState<Maquina | null>(null);
  const [resumo, setResumo] = useState<PagamentoResumo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const maquinas = await apiFetch<Maquina[]>("/maquinas");
        if (!maquinas[0]?.id) {
          throw new Error("Nenhuma máquina encontrada para carregar pagamentos.");
        }

        setMaquina(maquinas[0]);
        const data = await apiFetch<PagamentoResumo>(`/pagamentos/${maquinas[0].id}`);
        setResumo(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar pagamentos");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) return <LoadingSpinner text="Carregando pagamentos..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;

  return (
    <div className="animate-fade-in">
      <h2 className="mb-2 font-display text-xl font-bold text-foreground">Pagamentos</h2>
      {maquina && <p className="mb-4 text-xs text-muted-foreground">Máquina: {maquina.nome || maquina.id}</p>}

      {resumo ? (
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(resumo).map(([chave, valor]) => (
            <div key={chave} className="rounded-2xl bg-card p-4 shadow-card">
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">{chave}</p>
              <p className="text-lg font-bold text-foreground">
                {typeof valor === "number" || (typeof valor === "string" && !Number.isNaN(Number(valor)))
                  ? `R$ ${Number(valor).toFixed(2)}`
                  : String(valor)}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">Sem dados de pagamentos</p>
      )}
    </div>
  );
}
