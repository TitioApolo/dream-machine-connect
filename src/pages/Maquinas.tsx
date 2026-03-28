import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Cpu, MapPin, CheckCircle2, XCircle, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose
} from "@/components/ui/dialog";

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
  const [showAdd, setShowAdd] = useState(false);
  const [newNome, setNewNome] = useState("");
  const [newLocal, setNewLocal] = useState("");
  const [adding, setAdding] = useState(false);
  const navigate = useNavigate();

  const loadMaquinas = async () => {
    try {
      if (isAdmin()) {
        const clientes = await apiFetch<ClienteResponse[]>("/clientes");
        setMaquinas(clientes.flatMap((c) => c.Maquina || []));
      } else {
        const list = await apiFetch<Maquina[]>("/maquinas");
        setMaquinas(Array.isArray(list) ? list : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar máquinas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadMaquinas(); }, []);

  const handleAdd = async () => {
    if (!newNome.trim()) return;
    setAdding(true);
    try {
      await apiFetch("/maquina-adm", {
        method: "POST",
        body: JSON.stringify({ nome: newNome, local: newLocal, status: "ativo" }),
      });
      setShowAdd(false);
      setNewNome("");
      setNewLocal("");
      await loadMaquinas();
    } catch (err) {
      console.error("[Maquinas] Erro ao adicionar:", err);
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <LoadingSpinner text="Carregando máquinas..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-foreground">Máquinas</h2>
        {isAdmin() && (
          <Dialog open={showAdd} onOpenChange={setShowAdd}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1 text-xs">
                <Plus className="h-3.5 w-3.5" /> Nova
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Nova Máquina</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Nome</label>
                  <Input value={newNome} onChange={(e) => setNewNome(e.target.value)} placeholder="Ex: Dreams 11" className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Local</label>
                  <Input value={newLocal} onChange={(e) => setNewLocal(e.target.value)} placeholder="Ex: Bar do João" className="bg-secondary border-border" />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost" size="sm">Cancelar</Button>
                </DialogClose>
                <Button size="sm" onClick={handleAdd} disabled={adding || !newNome.trim()}>
                  {adding ? "Salvando..." : "Criar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

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
                className="w-full rounded-2xl bg-card p-4 shadow-card border border-border text-left transition-colors active:bg-secondary/50"
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
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
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
