# CS2 Competitive Tracker - Setup Checklist

## Verificação de Projeto

- [x] Estrutura de pastas criada
- [x] Backend Express configurado
- [x] Frontend Vue com Vite
- [x] Componentes principais desenvolvidos
- [x] API client configurado
- [x] PandaScore integration
- [x] Documentação inicial

## Instalação e Execução

### Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edite .env com seu token PandaScore
npm run dev
```

Backend rodará em: http://localhost:5000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend rodará em: http://localhost:3000

## Variáveis de Ambiente Backend

Arquivo: `backend/.env`

```
PANDASCOPE_API_TOKEN=seu_token_aqui
PANDASCOPE_BASE_URL=https://api.pandascore.co
PORT=5000
NODE_ENV=development
```

## Endpoints Principais

- Dashboard: `http://localhost:3000/`
- API Matches: `http://localhost:5000/api/matches/`
- API Health: `http://localhost:5000/api/health`

## Próximos Passos

1. Configure seu token PandaScore no arquivo `.env` do backend
2. Instale dependências: `npm install` em ambos os diretórios
3. Inicie o backend: `npm run dev` (na pasta backend)
4. Inicie o frontend: `npm run dev` (na pasta frontend)
5. Acesse http://localhost:3000 no navegador

## Tecnologias

- Frontend: Vue 3 + Vite + Axios
- Backend: Node.js + Express + Axios
- API: PandaScore (CS2 dados)

## Support

Para dúvidas sobre a integração com PandaScore, consulte:
https://pandascore.co/developers
