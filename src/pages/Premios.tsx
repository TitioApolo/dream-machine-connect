import { useEffect, useState } from "react";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Gift, Users } from "lucide-react";

interface ClienteResponse {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  dataVencimento?: string;
  Maquina: Array<{ id: string; nome: string }>;
}

export default function Premios() {
  const [clientes, setClientes] = useState<ClienteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        if (isAdmin()) {
          console.log("[Premios] Admin: fetching /clientes");
          const data = await apiFetch<ClienteResponse[]>("/clientes");
          setClientes(data);
        } else {
          setClientes([]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar dados");
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, []);

  if (loading) return <LoadingSpinner text="Carregando..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;

  if (!isAdmin()) {
    return (
      <div className="animate-fade-in">
        <h2 className="mb-4 font-display text-xl font-bold text-foreground">Prêmios</h2>
        <p className="py-8 text-center text-sm text-muted-foreground">Disponível apenas para administradores</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="mb-4 font-display text-xl font-bold text-foreground">Clientes</h2>
      {clientes.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Nenhum cliente encontrado</p>
      ) : (
        <div className="flex flex-col gap-3">
          {clientes.map((c) => (
            <div key={c.id} className="rounded-2xl bg-card p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                  <Users className="h-5 w-5 text-warning" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">{c.nome}</h3>
                  <p className="text-xs text-muted-foreground">{c.email}</p>
                  <p className="text-xs text-muted-foreground">{c.Maquina?.length || 0} máquinas</p>
                </div>
                <div>
                  <span className={`text-xs font-medium ${c.ativo ? "text-success" : "text-destructive"}`}>
                    {c.ativo ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
