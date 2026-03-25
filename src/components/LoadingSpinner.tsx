import { Loader2 } from "lucide-react";

export function LoadingSpinner({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 className="h-8 w-8 animate-spin-slow text-primary" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
