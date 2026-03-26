import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Cpu, Receipt, Wallet, Gift, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/dashboard", label: "Início", icon: LayoutDashboard },
  { path: "/maquinas", label: "Máquinas", icon: Cpu },
  { path: "/pagamentos", label: "Pagamentos", icon: Wallet },
  { path: "/transacoes", label: "Transações", icon: Receipt },
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
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card px-4 py-3 shadow-card">
        <div>
          <h1 className="font-display text-lg font-bold text-foreground">Dreams Machine</h1>
          {user && (
            <p className="text-xs text-muted-foreground">
              {user.name || user.email} • {user.tipo === "pessoa" ? "Admin" : "Cliente"}
            </p>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-secondary-foreground transition-colors active:bg-secondary/80"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sair
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card shadow-elevated">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-xs transition-colors",
                  isActive ? "font-semibold text-primary" : "text-muted-foreground active:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
