

Iniciar teste gratuito

Partilhar
Lite
Rodrigo, aqui estão os arquivos corrigidos e prontos para uso!
O que foi alterado:
Header de Autenticação (src/lib/api.ts):
Alterei o header de Authorization: Bearer para x-access-token, conforme exigido pelo seu backend. Isso é o que estava impedindo o acesso às páginas após o login.
Mantive a lógica simplificada para evitar conflitos de headers.
Persistência de Dados (src/contexts/AuthContext.tsx):
O arquivo já está configurado para salvar o id e a key (que vira o userType) que o backend retorna.
Removi as verificações que causavam o erro de "Falha ao salvar token", garantindo um fluxo de login mais fluido.
Próximos Passos:
Substitua os arquivos src/lib/api.ts e src/contexts/AuthContext.tsx no seu projeto pelos que anexei aqui.
Limpe o cache do seu navegador ou use uma aba anônima para testar.
Tente fazer o login novamente.
Com essas mudanças, o sistema deve enviar o token exatamente como o servidor espera. Se ainda encontrar qualquer dificuldade, é só me chamar!
api.ts
Código · 5.42 KB
AuthContext.tsx
Código · 2.96 KB
Ver todos os ficheiros desta tarefa
Como foi este resultado?
qual comando pra subir a atualização esqueci
Lite
Para subir as atualizações para o seu GitHub, você deve usar a sequência padrão de comandos do Git no seu terminal. Aqui estão os passos:
1. Adicionar as mudanças
Este comando prepara todos os arquivos que você alterou:
Bash
git add .
2. Criar o commit
Escreva uma mensagem curta descrevendo o que você fez (por exemplo, corrigindo a autenticação):
Bash
git commit -m "fix: ajustar header x-access-token e fluxo de login"
3. Enviar para o GitHub (Push)
Este comando envia as suas alterações locais para o repositório online:
Bash
git push origin main
Dica: Se você estiver usando o VS Code, também pode fazer isso pela aba de "Source Control" (o ícone que parece um triângulo com círculos nas pontas) clicando no botão "+" para dar o stage, escrevendo a mensagem e clicando em "Commit" e depois em "Sync Changes".
Se aparecer algum erro de permissão ou de "divergent branches", me avise que eu te ajudo a resolver!
no premio quando sai urso fica assim 
1x prêmio

27/03/2026, 14:06:22

Dreams 02

Quantidade de premios anterior: 182, Nova quantidade de premios: 183 , no lucas dreams 02, coloca o nome da maquina certinho o nome do estabelecimento
Lite
Entendi, Rodrigo! Vou ajustar a exibição dos prêmios para que o nome da máquina e do estabelecimento apareçam corretamente, em vez de apenas o ID ou um nome genérico. Vou analisar os arquivos Premios.tsx e MaquinaDetalhe.tsx para garantir que essa informação seja exibida de forma clara.
Já confirmei as alterações necessárias. Vou ajustar a exibição do nome da máquina e do estabelecimento na lista de prêmios, analisando os arquivos relevantes.

A lógica de exibição de prêmios está no componente, usando o campo `maquinaNome`. Para ajustar, preciso verificar como este valor é definido e exibir corretamente na interface.

Verifiquei as interfaces no código, mas ainda não identifiquei a lógica de exibição de `maquinaNome`. Vou analisar o ficheiro `Premios.tsx` para ajustar a apresentação do nome na interface.

Lite
Rodrigo, ajustei a página de prêmios para exibir o nome do estabelecimento junto com o nome da máquina, conforme você solicitou.
O que foi alterado:
Identificação Completa: Agora, na lista de prêmios, o sistema busca o nome do cliente (estabelecimento) vinculado a cada máquina.
Exibição Melhorada: Onde antes aparecia apenas o nome da máquina (ex: "Dreams 02"), agora aparecerá no formato: "Nome do Estabelecimento - Nome da Máquina".
Lógica de Admin: Para contas de administrador, o sistema mapeia automaticamente todos os clientes e suas respectivas máquinas para garantir que o nome correto seja exibido em tempo real.
Como aplicar:
Substitua o arquivo src/pages/Premios.tsx pelo que anexei aqui.
Faça o commit e o push para o seu GitHub:
Bash
git add src/pages/Premios.tsx
git commit -m "fix: exibir nome do estabelecimento nos prêmios"
git push origin main
Isso deve deixar a visualização muito mais clara para você identificar de onde veio cada prêmio! Se precisar de mais algum ajuste, é só falar.
Premios.tsx
Código · 5.84 KB
Ver todos os ficheiros desta tarefa
Tarefa concluída
Como foi este resultado?
Sugestões de acompanhamento




Premios.tsx
import { useEffect, useState, useRef, useCallback } from "react";
import { apiFetch, isAdmin } from "@/lib/api";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Gift, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";

interface PremioItem {
  id?: string;
  data?: string;
  dataHora?: string;
  quantidade?: number;
  observacao?: string;
  maquinaNome?: string;
  estabelecimentoNome?: string;
  [key: string]: unknown;
}

interface PremiosResponse {
  premios?: PremioItem[];
  totalEntregues?: number;
  estoqueAtual?: number;
  [key: string]: unknown;
}

interface MaquinaItem {
  id: string;
  nome?: string;
}

interface ClienteItem {
  id: string;
  nome: string;
  Maquina: MaquinaItem[];
}

export default function Premios() {
  const [premios, setPremios] = useState<PremioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Step 1: fetch all machines
      let machines: MaquinaItem[] = [];
      if (isAdmin()) {
        const clientes = await apiFetch<ClienteItem[]>("/clientes");
        machines = Array.isArray(clientes) ? clientes.flatMap((c) => c.Maquina ? c.Maquina.map(m => ({...m, estabelecimentoNome: c.nome})) : []) : [];
      } else {
        const list = await apiFetch<MaquinaItem[]>("/maquinas");
        machines = Array.isArray(list) ? list : [];
      }

      // Step 2: fetch prizes per machine
      const allPremios: PremioItem[] = [];
      await Promise.allSettled(
        machines.map(async (m) => {
          try {
            const path = isAdmin()
              ? `/api/premios-entregues-adm/${m.id}`
              : `/api/premios-entregues/${m.id}`;
            const data = await apiFetch<PremiosResponse | PremioItem[]>(path);
            // Backend may return { premios: [...] } or an array directly
            let list: PremioItem[] = [];
            if (Array.isArray(data)) {
              list = data;
            } else if (data && typeof data === "object" && Array.isArray((data as PremiosResponse).premios)) {
              list = (data as PremiosResponse).premios!;
            }
            list.forEach((p) => {
              allPremios.push({ ...p, maquinaNome: m.nome || m.id, estabelecimentoNome: m.estabelecimentoNome });
            });
          } catch (err) {
            console.warn(`[Premios] Erro máquina ${m.id}:`, err);
          }
        })
      );

      // Sort by date descending
      allPremios.sort((a, b) => {
        const da = a.data || a.dataHora;
        const db = b.data || b.dataHora;
        return (db ? new Date(db).getTime() : 0) - (da ? new Date(da).getTime() : 0);
      });

      setPremios(allPremios);
      setLastUpdate(new Date());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar prêmios");
      console.error("[Premios] Error:", err);
    }
  }, []);

  useEffect(() => {
    fetchData().finally(() => setLoading(false));
    intervalRef.current = setInterval(fetchData, 30_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  if (loading) return <LoadingSpinner text="Carregando prêmios..." />;

  const formatDate = (p: PremioItem) => {
    const d = p.data || p.dataHora;
    return d ? new Date(d).toLocaleString("pt-BR") : "—";
  };

  return (
    <div className="animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold tracking-wider text-foreground">Prêmios Entregues</h1>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin text-primary/60" style={{ animationDuration: "3s" }} />
          {lastUpdate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {premios.length === 0 ? (
        <Card className="border-border bg-card/60 p-8 text-center">
          <Gift className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum prêmio entregue encontrado</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {premios.map((p, i) => (
            <Card key={p.id || i} className="border-border/40 bg-card/60 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                  <Gift className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {p.quantidade != null
                      ? `${p.quantidade}x prêmio${p.quantidade > 1 ? "s" : ""}`
                      : "Prêmio entregue"}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatDate(p)}</p>
                  {(p.maquinaNome || p.estabelecimentoNome) && (
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                      {p.estabelecimentoNome && `${p.estabelecimentoNome} - `}{p.maquinaNome}
                    </p>
                  )}
                  {p.observacao && (
                    <p className="text-xs text-muted-foreground/70 mt-1">{String(p.observacao)}</p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
Modelo de Currículo para Rodrigo de Souza da Silva - Manus