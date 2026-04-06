import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Lock, Eye, EyeOff, User, ShieldCheck } from "lucide-react";
import logoShield from "@/assets/logo-leao-shield.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipo, setTipo] = useState<"cliente" | "pessoa">("cliente");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
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

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    // For now just show confirmation since backend doesn't have reset endpoint
    setForgotSent(true);
  };

  const whatsappLink = "https://wa.me/5562992388625";
  const instagramLink = "https://www.instagram.com/pix.machine?igsh=MXVzcmQ4a3Fkczc2Nw==";

  if (showForgot) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
        <div className="star-field" />
        <div className="relative z-10 w-full max-w-sm animate-fade-in">
          <div className="mb-8 flex flex-col items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-[hsl(43,96%,56%)] opacity-20 blur-3xl" />
              <img src={logoShield} alt="Pix Machine" width={140} height={140} className="relative z-10 drop-shadow-[0_0_30px_rgba(255,195,0,0.4)]" />
            </div>
            <h1 className="font-display text-3xl font-bold tracking-[0.3em] text-primary">
              PIX MACHINE
            </h1>
          </div>

          <div className="rounded-2xl border border-primary/30 bg-card/90 p-6 backdrop-blur-sm">
            <h2 className="mb-4 text-center text-lg font-semibold text-foreground">Recuperar Senha</h2>
            {forgotSent ? (
              <div className="flex flex-col items-center gap-4">
                <p className="text-center text-sm text-muted-foreground">
                  Se o e-mail estiver cadastrado, você receberá as instruções para redefinir sua senha.
                </p>
                <Button
                  onClick={() => { setShowForgot(false); setForgotSent(false); }}
                  className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground"
                >
                  Voltar ao Login
                </Button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    E-mail
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
                    <input
                      type="email"
                      placeholder="seu@email.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                      className="h-12 w-full rounded-xl border border-primary/30 bg-secondary pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-primary font-bold uppercase tracking-wider text-primary-foreground"
                >
                  Enviar
                </Button>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="text-sm text-primary hover:underline"
                >
                  Voltar ao login
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6">
      {/* Star field background */}
      <div className="star-field" />

      <div className="relative z-10 w-full max-w-sm animate-fade-in">
        {/* Logo with glow */}
        <div className="mb-6 flex flex-col items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-[hsl(43,96%,56%)] opacity-20 blur-3xl" />
            <img
              src={logoShield}
              alt="Pix Machine"
              width={160}
              height={160}
              className="relative z-10 drop-shadow-[0_0_40px_rgba(255,195,0,0.4)]"
            />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-[0.3em] text-primary drop-shadow-[0_0_20px_rgba(255,195,0,0.3)]">
            PIX MACHINE
          </h1>
        </div>

        {/* Login card */}
        <div className="rounded-2xl border border-primary/30 bg-card/90 p-6 backdrop-blur-sm">
          {/* Type toggle */}
          <div className="mb-5 flex rounded-xl border border-primary/30 bg-secondary p-1">
            {(["cliente", "pessoa"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                  tipo === t
                    ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(255,195,0,0.3)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "cliente" ? <User className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                {t === "cliente" ? "Cliente" : "Admin"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                E-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-primary/30 bg-secondary pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-primary/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-primary/30 bg-secondary pl-11 pr-12 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Esqueci senha */}
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="self-end text-xs text-primary/70 hover:text-primary hover:underline"
            >
              Esqueci minha senha
            </button>

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl bg-primary text-primary-foreground font-bold text-base uppercase tracking-wider shadow-[0_0_20px_rgba(255,195,0,0.3)] hover:shadow-[0_0_30px_rgba(255,195,0,0.5)] transition-shadow"
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

        {/* Support links */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Contate o suporte:
          </p>
          <div className="flex items-center gap-4">
            <a
              href={instagramLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-pink-500/40 bg-pink-500/10 text-pink-500 transition-colors hover:bg-pink-500/20"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500/40 bg-green-500/10 text-green-500 transition-colors hover:bg-green-500/20"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
