import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Cpu, Receipt, Wallet, Gift, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";
import logoShield from "@/assets/logo-leao-shield.png";

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
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-primary/20 bg-card/95 px-4 py-3 shadow-gold backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 p-0.5">
            <img src={logoShield} alt="Pix Machine" className="h-9 w-9 object-contain" />
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

      {/* Bottom Nav - Floating pill style */}
      <nav className="fixed bottom-4 left-4 right-4 z-50">
        <div className="mx-auto max-w-md rounded-2xl border border-primary/20 bg-card/95 shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,215,0,0.1)] backdrop-blur-xl">
          <div className="flex items-center justify-around py-2 px-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    "relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-2 text-[10px] font-medium transition-all duration-200",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground active:scale-95 hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <span className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20" />
                  )}
                  <item.icon
                    className={cn(
                      "relative z-10 h-5 w-5 transition-all",
                      isActive && "text-primary drop-shadow-[0_0_8px_hsl(45,100%,50%,0.6)]"
                    )}
                  />
                  <span className="relative z-10">{item.label}</span>
                  {isActive && (
                    <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary shadow-[0_0_6px_hsl(45,100%,50%,0.5)]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
