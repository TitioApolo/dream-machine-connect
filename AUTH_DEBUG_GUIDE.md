# 🔐 Authentication Testing & Debug Guide

## Status Atual

✅ **Melhorias Implementadas:**
- Nova logo do leão integrada no login
- Enhanced logging para debug de autenticação
- Melhor handling de userType/userId
- Improved session restoration

## 🧪 Como Testar a Autenticação

### 1. No Navegador (Recomendado)

1. **Abrir Developer Tools**
   - Pressione `F12` no navegador
   - Vá para aba "Console"

2. **Fazer Login**
   - Insira email e senha (credenciais válidas do backend)
   - Clique "Entrar"

3. **Verificar Logs**
   Procure pelos logs `[AUTH]` no console:
   ```
   [AUTH] POST https://dreams-machine-7e6a3c0a6e6e.herokuapp.com/login-cliente
   [AUTH] Response status: 200
   [AUTH] Login data extracted: {
     token: "eyJ...",
     id: "user-id-123",
     key: "CLIENT",
     loginType: "CLIENT",
     allKeys: [...]
   }
   [Auth] Armazenado - userType: CLIENT userId: user-id-123
   ```

4. **Verificar LocalStorage**
   - Abra aba "Application" → "Storage" → "Local Storage"
   - Procure por:
     - `token` ✅ DEVE ter valor
     - `userType` ✅ DEVE ser "CLIENT" ou "ADMIN"
     - `userId` ✅ DEVE ter valor
     - `user` ✅ JSON com email/name/tipo
     - `auth_tipo` ✅ DEVE ser "cliente" ou "pessoa"

5. **Verificar Dashboard Load**
   - Se dashboard carregar sem erro 401, ✅ **Sucesso!**
   - Se erro 401 aparecer, verifique logs para culpado

### 2. Via Script Node.js

```bash
# Editar test-auth-flow.js com credenciais válidas
# Atualizar TEST_CREDENCIAIS
node test-auth-flow.js
```

## 🐛 Troubleshooting - 401 Unauthorized

### Cenário 1: Token não está sendo salvo
**Sintomas:**
- localStorage vazio após login
- Console mostra: "Token não encontrado"

**Solução:**
- Verificar se response do login contém `token`
- Verificar se não há erro ao fazer parse de JSON
- Testar em navegador sem extensions (modo incógnito)

### Cenário 2: userType/userId não salvos
**Sintomas:**
- localStorage tem token mas não tem userType/userId
- Dashboard usa rota errada (/maquinas vs /maquinas-adm)

**Solução:**
- Verificar response do login contém `id` e `key`
- Se não tiver, backend pode estar retornando formato diferente
- Adicionar logs em AuthContext para rastrear valores

### Cenário 3: 401 em primeira chamada de API
**Sintomas:**
- Login sucede, mas Dashboard retorna 401
- Token válido mas header não foi enviado

**Solução:**
- Verificar se `x-access-token` está no header (não `Authorization`)
- Verificar se token não está vazio/undefined
- Testar endpoint manualmente com postman

## 📊 Debug Checklist

- [ ] Console mostra logs [AUTH] completos
- [ ] localStorage tem: token, userType, userId
- [ ] userType é exatamente "CLIENT" ou "ADMIN"
- [ ] userId não está vazio
- [ ] Logo 🦁 aparece na página de login
- [ ] Ao fazer refresh, dashboard não retorna 401
- [ ] Logout limpa localStorage completamente
- [ ] Dois logins diferentes (cliente/admin) funcionam

## 🔍 Endpoints para Teste Manual (Postman/cURL)

### Login Cliente
```bash
POST https://dreams-machine-7e6a3c0a6e6e.herokuapp.com/login-cliente
Content-Type: application/json

{
  "email": "seu@email.com",
  "senha": "sua_senha"
}
```

**Resposta esperada:**
```json
{
  "token": "eyJhbGc...",
  "id": "user-123",
  "key": "CLIENT",
  "email": "seu@email.com",
  "name": "Nome do Usuario"
}
```

### Login Admin
```bash
POST https://dreams-machine-7e6a3c0a6e6e.herokuapp.com/login-pessoa
Content-Type: application/json

{
  "email": "admin@email.com",
  "senha": "admin_senha"
}
```

### Chamar API com Token
```bash
GET https://dreams-machine-7e6a3c0a6e6e.herokuapp.com/estatisticas-gerais/user-123
x-access-token: eyJhbGc...
```

**⚠️ IMPORTANTE:** Header é `x-access-token`, NÃO `Authorization: Bearer`

## 📝 Logs Esperados por Página

### Login.tsx
```
[AUTH] POST /login-cliente
[AUTH] Response status: 200
[AUTH] Login data extracted: {...}
[Auth] Armazenado - userType: CLIENT userId: user-123
```

### Dashboard.tsx
```
[API] URL: /estatisticas-gerais/user-123
[API] Token: eyJ...
[API] User Type: CLIENT
[API] User ID: user-123
[API] Status: 200
```

### MaquinaDetalhe.tsx
```
[API] URL: /maquinas (ou /maquinas-adm para ADMIN)
[API] Status: 200
Polling iniciado: fetchDynamic every 5000ms
```

## ✨ Próximas Melhorias

- [ ] Adicionar refresh automático de token antes de expirar
- [ ] Implementar retry logic com backoff exponencial
- [ ] Adicionar toast de erro visível para usuário
- [ ] Criar componente de erro 401 customizado
- [ ] Adicionar indicador visual de sincronização com servidor

## 📞 Suporte

Se o problema persistir:
1. Ativar DevTools Console
2. Reproduzir erro
3. Compartilhar logs completos (começam com [AUTH] ou [API])
4. Verificar credenciais são válidas no backend
5. Confirmar URL base é `https://dreams-machine-7e6a3c0a6e6e.herokuapp.com`
