import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { RotateCcw, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ReembolsoItem {
  id?: string;
  data?: string;
  dataHora?: string;
  valor?: number | string;
  motivo?: string;
  status?: string;
  maquinaNome?: string;
  estabelecimentoNome?: string;
  [key: string]: unknown;
}

interface MaquinaItem {
  id: string;
  nome?: string;
  estabelecimentoNome?: string;
}

interface ClienteItem {
  id: string;
  nome: string;
  Maquina: MaquinaItem[];
}

const fmt = (v: number) =>
  `R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

const toNum = (v?: unknown): number => {
  if (v == null) return 0;
  const n = Number(v);
  return isNaN(n) ? 0 : n;
};

export default function Reembolso() {
  const [items, setItems] = useState<ReembolsoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      let machines: MaquinaItem[] = [];
      if (isAdmin()) {
        const clientes = await apiFetch<ClienteItem[]>("/clientes");
        machines = Array.isArray(clientes)
          ? clientes.flatMap((c) =>
              (c.Maquina || []).map((m) => ({ ...m, estabelecimentoNome: c.nome }))
            )
          : [];
      } else {
        const list = await apiFetch<MaquinaItem[]>("/maquinas");
        machines = Array.isArray(list) ? list : [];
      }

      const all: ReembolsoItem[] = [];
      await Promise.allSettled(
        machines.map(async (m) => {
          try {
            const path = isAdmin()
              ? `/api/reembolsos-adm/${m.id}`
              : `/api/reembolsos/${m.id}`;
            const data = await apiFetch<ReembolsoItem[]>(path);
            const list = Array.isArray(data) ? data : [];
            list.forEach((item) => {
              all.push({ ...item, maquinaNome: m.nome || m.id, estabelecimentoNome: m.estabelecimentoNome });
            });
          } catch (err) {
            console.warn(`[Reembolso] Erro máquina ${m.id}:`, err);
          }
        })
      );

      all.sort((a, b) => {
        const da = a.data || a.dataHora;
        const db = b.data || b.dataHora;
        return (db ? new Date(db).getTime() : 0) - (da ? new Date(da).getTime() : 0);
      });

      setItems(all);
      setLastUpdate(new Date());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar reembolsos");
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Carregando reembolsos..." />;

  const formatDate = (item: ReembolsoItem) => {
    const d = item.data || item.dataHora;
    return d ? new Date(d).toLocaleString("pt-BR") : "—";
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">Reembolsos</h1>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin text-primary/60" style={{ animationDuration: "3s" }} />
          {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <Card className="border-border bg-card/60 p-8 text-center">
          <RotateCcw className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum reembolso encontrado</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <Card key={item.id || i} className="border-border/40 bg-card/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 border border-destructive/20">
                  <RotateCcw className="h-4 w-4 text-destructive" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Reembolso</p>
                    <p className="text-sm font-bold text-destructive">{fmt(toNum(item.valor))}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(item)}</p>
                  {(item.maquinaNome || item.estabelecimentoNome) && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {item.estabelecimentoNome && `${item.estabelecimentoNome} - `}{item.maquinaNome}
                    </p>
                  )}
                  {item.motivo && (
                    <p className="text-xs text-muted-foreground/70 mt-1">{String(item.motivo)}</p>
                  )}
                  {item.status && (
                    <span className="inline-block mt-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground">
                      {String(item.status)}
                    </span>
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
