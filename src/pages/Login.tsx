import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { LogoLeao } from "@/components/LogoLeao";

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
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      {/* Star field background */}
      <div className="star-field" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-32 w-32 items-center justify-center rounded-3xl border-2 border-primary/40 bg-card/80 shadow-gold-lg animate-glow backdrop-blur-sm">
            <LogoLeao size={100} />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-wider text-primary">
            PIX MACHINE
          </h1>
          <p className="text-sm text-muted-foreground">Faça login para continuar</p>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-primary/20 bg-card/90 p-6 shadow-gold backdrop-blur-sm">
          {/* Type toggle */}
          <div className="mb-5 flex rounded-xl border border-border bg-secondary p-1">
            {(["cliente", "pessoa"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  tipo === t
                    ? "bg-primary text-primary-foreground shadow-gold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "cliente" ? "Cliente" : "Admin"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl border-primary/30 bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Senha
              </label>
              <Input
                type="password"
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                className="h-12 rounded-xl border-primary/30 bg-secondary text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-primary text-primary-foreground font-bold text-base shadow-gold hover:shadow-gold-lg transition-shadow mt-1"
            >
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
    </div>
  );
}
