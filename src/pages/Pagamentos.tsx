import { useEffect, useState } from "react";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { DollarSign } from "lucide-react";

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
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        if (isAdmin()) {
          console.log("[Pagamentos] Admin: fetching /clientes");
          const clientes = await apiFetch<ClienteResponse[]>("/clientes");
          const allMaquinas = clientes.flatMap((c) => c.Maquina || []);
          setMaquinas(allMaquinas);
        } else {
          console.log("[Pagamentos] Cliente: fetching /maquinas");
          const list = await apiFetch<Maquina[]>("/maquinas");
          setMaquinas(Array.isArray(list) ? list : []);
        }
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
      <h2 className="mb-4 font-display text-xl font-bold text-foreground">Pagamentos</h2>
      {maquinas.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhuma máquina encontrada</p>
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
                      Último: {new Date(m.ultimoPagamentoRecebido).toLocaleDateString("pt-BR")}
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
