import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Crown, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404: rota não encontrada:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="text-center animate-fade-in">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border-2 border-primary/30 bg-card shadow-gold">
            <Crown className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h1 className="font-display text-6xl font-bold text-primary mb-2">404</h1>
        <p className="text-lg text-muted-foreground mb-1">Página não encontrada</p>
        <p className="text-sm text-muted-foreground/60 mb-8">
          A rota <code className="text-primary/80">{location.pathname}</code> não existe
        </p>
        <Button
          onClick={() => navigate("/dashboard")}
          className="gap-2 shadow-gold"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </div>
    </div>
  );
};

export default NotFound;