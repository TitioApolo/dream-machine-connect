import { Bell, X, Trash2, Wifi, WifiOff, DollarSign, AlertTriangle, Info } from "lucide-react";
import { useNotifications, type AppNotification, type NotifType } from "@/contexts/NotificationContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const typeConfig: Record<NotifType, { icon: React.ElementType; color: string; bg: string }> = {
  machine_offline: { icon: WifiOff, color: "text-destructive", bg: "bg-destructive/10" },
  machine_online: { icon: Wifi, color: "text-success", bg: "bg-success/10" },
  new_payment: { icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  info: { icon: Info, color: "text-info", bg: "bg-info/10" },
};

function NotifIcon({ type }: { type: NotifType }) {
  const cfg = typeConfig[type] ?? typeConfig.info;
  const Icon = cfg.icon;
  return (
    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cfg.bg)}>
      <Icon className={cn("h-4 w-4", cfg.color)} />
    </div>
  );
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function NotificationBell() {
  const { notifications, unreadCount, markAllRead, dismissNotification, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleOpen = (v: boolean) => {
    setOpen(v);
    if (v && unreadCount > 0) markAllRead();
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary transition-colors hover:border-primary/40 active:bg-muted"
          aria-label="Notificações"
        >
          <Bell className={cn("h-4 w-4", unreadCount > 0 ? "text-primary" : "text-muted-foreground")} />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white leading-none">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-80 border-primary/20 bg-card p-0 shadow-gold"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="font-display text-sm font-bold tracking-wider text-primary">Notificações</h3>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
              onClick={clearAll}
            >
              <Trash2 className="h-3 w-3" /> Limpar
            </Button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-8 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Sem notificações</p>
              <p className="text-xs text-muted-foreground/60">Você será avisado quando algo mudar</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <NotifIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground">{n.title}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground/60">{formatTime(n.timestamp)}</p>
                  </div>
                  <button
                    onClick={() => dismissNotification(n.id)}
                    className="mt-0.5 shrink-0 rounded p-0.5 text-muted-foreground/60 hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}