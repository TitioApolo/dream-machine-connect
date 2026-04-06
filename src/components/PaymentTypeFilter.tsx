import { cn } from "@/lib/utils";
import { Filter } from "lucide-react";

export type PaymentType = "all" | "pix" | "especie" | "debito" | "credito" | "credito_remoto" | "estorno";

interface PaymentTypeFilterProps {
  selected: PaymentType;
  onChange: (type: PaymentType) => void;
  types?: PaymentType[];
}

const TYPE_LABELS: Record<PaymentType, string> = {
  all: "Todos",
  pix: "PIX",
  especie: "Espécie",
  debito: "Débito",
  credito: "Crédito",
  credito_remoto: "Cred. Remoto",
  estorno: "Estornos",
};

const TYPE_COLORS: Record<PaymentType, string> = {
  all: "border-primary/50 bg-primary/20 text-primary",
  pix: "border-blue-400/50 bg-blue-400/20 text-blue-400",
  especie: "border-green-400/50 bg-green-400/20 text-green-400",
  debito: "border-yellow-400/50 bg-yellow-400/20 text-yellow-400",
  credito: "border-purple-400/50 bg-purple-400/20 text-purple-400",
  credito_remoto: "border-cyan-400/50 bg-cyan-400/20 text-cyan-400",
  estorno: "border-destructive/50 bg-destructive/20 text-destructive",
};

const DEFAULT_TYPES: PaymentType[] = ["all", "pix", "especie", "debito", "credito", "credito_remoto", "estorno"];

export function PaymentTypeFilter({ selected, onChange, types = DEFAULT_TYPES }: PaymentTypeFilterProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
      <Filter className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      {types.map((type) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-all",
            selected === type
              ? TYPE_COLORS[type]
              : "border-border/40 bg-secondary/30 text-muted-foreground hover:text-foreground"
          )}
        >
          {TYPE_LABELS[type]}
        </button>
      ))}
    </div>
  );
}

// Helper to check if a transaction matches a payment type
export function matchesPaymentType(
  tipo?: string,
  tipoTransacao?: string,
  estornado?: boolean,
  filterType?: PaymentType
): boolean {
  if (!filterType || filterType === "all") return true;

  if (filterType === "estorno") return estornado === true;
  if (filterType === "credito_remoto") return tipoTransacao === "credito_remoto";
  if (filterType === "pix") return tipo === "bank_transfer" || tipo === "11" || tipo === "account_money";
  if (filterType === "especie") return tipo === "CASH";
  if (filterType === "debito") return tipo === "debit_card" || tipo === "8";
  if (filterType === "credito") return tipo === "credit_card" || tipo === "1";

  return false;
}
