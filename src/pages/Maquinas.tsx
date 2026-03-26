import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Cpu, MapPin, CheckCircle2, XCircle, ChevronRight } from "lucide-react";

interface Maquina {
  id: string;
  nome?: string;
  descricao?: string;
  localizacao?: string;
  ultimoPagamentoRecebido?: string | null;
  ultimaRequisicao?: string | null;
  maquininha_serial?: string;
}

interface ClienteResponse {
  id: string;
  nome: string;
  Maquina: Maquina[];
}

export default function Maquinas() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      try {
        if (isAdmin()) {
          console.log("[Maquinas] Admin: fetching /clientes");
          const clientes = await apiFetch<ClienteResponse[]>("/clientes");
          const allMaquinas = clientes.flatMap((c) => c.Maquina || []);
          setMaquinas(allMaquinas);
        } else {
          console.log("[Maquinas] Cliente: fetching /maquinas");
          const list = await apiFetch<Maquina[]>("/maquinas");
          setMaquinas(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar máquinas");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  if (loading) return <LoadingSpinner text="Carregando máquinas..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;

  return (
    <div className="animate-fade-in">
      <h2 className="mb-4 font-display text-xl font-bold text-foreground">Máquinas</h2>
      {maquinas.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">Nenhuma máquina encontrada</p>
      ) : (
        <div className="flex flex-col gap-3">
          {maquinas.map((m, i) => {
            const isActive = !!m.ultimoPagamentoRecebido;
            return (
              <button
                key={m.id || i}
                onClick={() => navigate(`/maquina/${m.id}`)}
                className="w-full rounded-2xl bg-card p-4 shadow-card text-left transition-colors active:bg-secondary/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Cpu className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm font-semibold text-foreground truncate">
                      {m.nome || `Máquina ${i + 1}`}
                    </h3>
                    {(m.descricao || m.localizacao) && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {m.descricao || m.localizacao}
                      </p>
                    )}
                    {m.ultimoPagamentoRecebido && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Último pag: {new Date(m.ultimoPagamentoRecebido).toLocaleString("pt-BR")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <span className="flex items-center gap-1 text-xs font-medium text-success">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                        <XCircle className="h-3.5 w-3.5" />
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
