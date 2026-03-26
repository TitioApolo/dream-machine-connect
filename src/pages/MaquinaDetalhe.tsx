import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { ArrowLeft, Cpu, MapPin, CheckCircle2, XCircle, Clock, DollarSign } from "lucide-react";

interface MaquinaDetalhe {
  id: string;
  nome?: string;
  descricao?: string;
  localizacao?: string;
  store_id?: string;
  maquininha_serial?: string;
  ultimoPagamentoRecebido?: string | null;
  ultimaRequisicao?: string | null;
  dataInclusao?: string;
  [key: string]: unknown;
}

export default function MaquinaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [maquina, setMaquina] = useState<MaquinaDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const path = isAdmin() ? `/maquina-adm/${id}` : `/maquina/${id}`;
        console.log("[MaquinaDetalhe] Fetching:", path);
        const data = await apiFetch<MaquinaDetalhe>(path);
        console.log("[MaquinaDetalhe] RESPONSE:", data);
        setMaquina(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar máquina");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [id]);

  if (loading) return <LoadingSpinner text="Carregando máquina..." />;
  if (error) return <div className="rounded-2xl bg-destructive/10 p-6 text-center text-sm text-destructive">{error}</div>;
  if (!maquina) return null;

  const isActive = !!maquina.ultimoPagamentoRecebido;

  const formatDate = (d?: string | null) =>
    d ? new Date(d).toLocaleString("pt-BR") : "—";

  return (
    <div className="animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </button>

      <div className="rounded-2xl bg-card p-5 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Cpu className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-lg font-bold text-foreground truncate">
              {maquina.nome || "Máquina"}
            </h2>
            <div className="flex items-center gap-1 mt-0.5">
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

        <div className="space-y-3">
          {(maquina.descricao || maquina.localizacao) && (
            <InfoRow icon={MapPin} label="Localização" value={maquina.descricao || maquina.localizacao || ""} />
          )}
          {maquina.maquininha_serial && (
            <InfoRow icon={Cpu} label="Serial" value={maquina.maquininha_serial} />
          )}
          {maquina.store_id && (
            <InfoRow icon={Cpu} label="Store ID" value={maquina.store_id} />
          )}
          <InfoRow
            icon={DollarSign}
            label="Último pagamento"
            value={formatDate(maquina.ultimoPagamentoRecebido)}
          />
          <InfoRow
            icon={Clock}
            label="Última requisição"
            value={formatDate(maquina.ultimaRequisicao)}
          />
          {maquina.dataInclusao && (
            <InfoRow icon={Clock} label="Data inclusão" value={formatDate(maquina.dataInclusao)} />
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-secondary/50 px-3 py-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
