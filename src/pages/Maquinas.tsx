import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Cpu, MapPin, CheckCircle2, XCircle } from "lucide-react";

interface Maquina {
  id?: number;
  _id?: string;
  nome?: string;
  localizacao?: string;
  status?: string;
  ativa?: boolean;
  [key: string]: unknown;
}

export default function Maquinas() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Maquina[] | { data: Maquina[] }>("/maquinas")
      .then((res) => {
        const list = Array.isArray(res) ? res : (res as { data: Maquina[] }).data || [];
        setMaquinas(list);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
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
            const isActive = m.ativa !== false && m.status !== "inativa";
            return (
              <div key={m.id || m._id || i} className="rounded-2xl bg-card p-4 shadow-card">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Cpu className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-sm font-semibold text-foreground truncate">
                      {m.nome || `Máquina ${m.id || m._id || i + 1}`}
                    </h3>
                    {m.localizacao && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {m.localizacao}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
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
            );
          })}
        </div>
      )}
    </div>
  );
}
