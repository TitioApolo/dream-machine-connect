import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Gift, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PremioItem {
  id?: string;
  data?: string;
  dataHora?: string;
  quantidade?: number;
  observacao?: string;
  tipo?: string;
  tipoTransacao?: string;
  maquinaNome?: string;
  [key: string]: unknown;
}

export default function Premios() {
  const [premios, setPremios] = useState<PremioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const data = await apiFetch<PremioItem[]>("/premios-entregues");
      console.log("[Premios] RESPONSE:", data);
      
      const all = Array.isArray(data) ? data : [];
      all.sort((a, b) => {
        const da = (a.data || a.dataHora) ? new Date(a.data || a.dataHora!).getTime() : 0;
        const db = (b.data || b.dataHora) ? new Date(b.data || b.dataHora!).getTime() : 0;
        return db - da;
      });

      setPremios(all);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar prêmios");
      console.error("[Premios] Error:", err);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    // Atualizar a cada 5 segundos
    intervalRef.current = setInterval(fetchData, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Carregando prêmios..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;

  const formatDate = (p: PremioItem) => {
    const d = p.data || p.dataHora;
    return d ? new Date(d).toLocaleString("pt-BR") : "—";
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">Prêmios Entregues</h1>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin text-primary/60" style={{ animationDuration: "3s" }} />
          {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {premios.length === 0 ? (
        <Card className="border-border bg-card/60 p-8 text-center">
          <p className="text-sm text-muted-foreground">Nenhum prêmio entregue encontrado</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {premios.map((p, i) => (
            <Card key={p.id || i} className="border-border/40 bg-card/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Gift className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {p.quantidade != null ? `${p.quantidade}x prêmio${p.quantidade > 1 ? "s" : ""}` : "Prêmio entregue"}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(p)}</p>
                  {p.observacao && (
                    <p className="text-xs text-muted-foreground/70 mt-1">{p.observacao}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
