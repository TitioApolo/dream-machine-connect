import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Cpu } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState<"cliente" | "pessoa">("cliente");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, senha, tipo);
      navigate("/dashboard");
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : "Erro ao fazer login";
      const message =
        tipo === "pessoa" && rawMessage.toLowerCase().includes("invalid")
          ? "Credenciais de admin inválidas para /login-pessoa."
          : rawMessage;

      setError(message);
      console.error("[Login] Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6"
         style={{ background: "linear-gradient(160deg, hsl(220 25% 6%), hsl(220 25% 12%), hsl(210 40% 14%))" }}>
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-10 flex flex-col items-center gap-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/20 shadow-elevated ring-1 ring-primary/30">
            <Cpu className="h-10 w-10 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dreams Machine</h1>
          <p className="text-sm text-muted-foreground">Faça login para continuar</p>
        </div>

        <div className="mb-6 flex rounded-xl bg-secondary p-1 ring-1 ring-border">
          {(["cliente", "pessoa"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTipo(t)}
              className={`flex-1 rounded-lg py-3 text-sm font-medium transition-all ${
                tipo === t
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "cliente" ? "Cliente" : "Admin"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Email</label>
            <Input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12 rounded-xl bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">Senha</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="h-12 rounded-xl bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {error && <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">{error}</div>}

          <Button type="submit" disabled={loading} className="h-12 rounded-xl text-base font-semibold mt-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              `Entrar como ${tipo === "cliente" ? "Cliente" : "Admin"}`
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
