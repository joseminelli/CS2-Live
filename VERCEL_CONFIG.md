# 🚀 Configuração para Vercel - CS2 Live

## Backend Configuration

### 1. Variáveis de Ambiente Vercel (Backend)

Acesse: **Vercel Dashboard > Settings > Environment Variables**

Adicione as seguintes variáveis:

```
PANDASCOPE_API_TOKEN=IyzsJGUPhAKQLINXdBYA6p4iYtqbdTjKH-8LxGC8OwknAJWZWF0
PANDASCOPE_BASE_URL=https://api.pandascore.co
PORT=3000
NODE_ENV=production
```

### 2. Verificar Configurações

- ✅ Root Directory: `./` (raiz do repositório)
- ✅ Build Command: `npm run build` 
- ✅ Start Command: `npm start` ou `node server.js`
- ✅ Framework: `Other` ou deixar em branco para Node.js

## Frontend Configuration

### 1. Variáveis de Ambiente Vercel (Frontend)

Acesse: **Vercel Dashboard > Settings > Environment Variables**

Adicione as seguintes variáveis:

```
VITE_API_BASE_URL_DEV=http://localhost:5000/api
VITE_API_BASE_URL_PROD=https://cs-2-live.vercel.app/api
```

### 2. Verificar Configurações

- ✅ Root Directory: `./frontend` (pasta do frontend)
- ✅ Build Command: `npm run build`
- ✅ Start Command: deixar vazio (Vercel gerencia isso)
- ✅ Framework: `Vite`

## 🔧 Troubleshooting

### CORS Error na Produção?

**Problema:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Solução:**

1. **Backend tem headers CORS corretos:**
   ```javascript
   Access-Control-Allow-Origin: https://seu-frontend.vercel.app
   Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization
   ```

2. **Verifique console do navegador (DevTools > Network):**
   - Veja se o error ocorre no preflight (OPTIONS request)
   - Veja a resposta do servidor

3. **Backend enviando 500?**
   - Verifique se `PANDASCOPE_API_TOKEN` está correto
   - Teste: `curl https://cs-2-live.vercel.app/api/health`

### URL API incorreta?

Verificar no frontend DevTools > Console se vê:
```
🚀 Usando API Base URL: https://cs-2-live.vercel.app/api
```

Se aparecer `http://localhost:5000/api` em produção, significa que o build não configurou `VITE_API_BASE_URL_PROD`.

## 📋 Checklist antes de fazer Deploy

- [ ] Backend com PANDASCOPE_API_TOKEN configurado na Vercel
- [ ] Frontend com VITE_API_BASE_URL_PROD apontando para backend
- [ ] CORS configurado no backend para aceitar origin do frontend
- [ ] Testar em localhost primeiro: `npm run dev` (frontend + backend)
- [ ] Build localmente: `npm run build` e verificar erros
- [ ] Push para repo GitHub
- [ ] Vercel faz deploy automático
- [ ] Testar site em produção

## 🛠️ Comandos Úteis

```bash
# Build frontend
cd frontend && npm run build

# Testar build localmente
npm run preview

# Backend em produção (requer Node.js)
cd backend && npm start
```
