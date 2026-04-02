import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Cpu, Receipt, Wallet, Gift, CreditCard, RotateCcw, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";
import { LogoLeao } from "@/components/LogoLeao";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", label: "Início", icon: LayoutDashboard },
  { path: "/maquinas", label: "Máquinas", icon: Cpu },
  { path: "/pagamentos", label: "Pagamentos", icon: Wallet },
  { path: "/transacoes", label: "Transações", icon: Receipt },
  { path: "/cartao-credito", label: "Cartão", icon: CreditCard },
  { path: "/reembolso", label: "Reembolso", icon: RotateCcw },
  { path: "/premios", label: "Prêmios", icon: Gift },
];

export function MobileLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-primary/20 bg-card/95 px-4 py-3 shadow-gold backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 p-1">
            <LogoLeao size={32} />
          </div>
          <div>
            <h1 className="font-display text-base font-bold tracking-wider text-primary leading-none">PIX MACHINE</h1>
            {user && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {user.name || user.email} · {user.tipo === "pessoa" ? "Admin" : "Cliente"}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors active:bg-muted hover:border-destructive/40 hover:text-destructive"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-primary/20 bg-card/95 shadow-gold backdrop-blur-sm">
        <div className="flex items-center overflow-x-auto scrollbar-hide py-2 px-1 gap-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                  isActive
                    ? "font-bold text-primary"
                    : "text-muted-foreground active:text-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5",
                    isActive && "text-primary drop-shadow-[0_0_6px_hsl(45,100%,50%,0.5)]"
                  )}
                />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}