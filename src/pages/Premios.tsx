import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Gift } from "lucide-react";

interface Premio {
  id?: number;
  _id?: string;
  nome?: string;
  descricao?: string;
  quantidade?: number;
  [key: string]: unknown;
}

export default function Premios() {
  const [premios, setPremios] = useState<Premio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Premio[] | { data: Premio[] }>("/premios")
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as { data: Premio[] }).data || [];
        setPremios(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Carregando prêmios..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;

  return (
    <div className="animate-fade-in">
      <h2 className="mb-4 font-display text-xl font-bold text-foreground">Prêmios</h2>
      {premios.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhum prêmio encontrado</p>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {premios.map((p, i) => (
            <div key={p.id || p._id || i} className="rounded-2xl bg-card p-4 shadow-card">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                <Gift className="h-5 w-5 text-warning" />
              </div>
              <h3 className="text-sm font-semibold text-foreground truncate">
                {p.nome || `Prêmio #${i + 1}`}
              </h3>
              {p.descricao && <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.descricao}</p>}
              {p.quantidade != null && (
                <p className="mt-2 text-xs font-medium text-muted-foreground">Qtd: {p.quantidade}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
