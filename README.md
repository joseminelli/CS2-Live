# CS2 Competitive Tracker

Um site completo para acompanhamento em tempo real de jogos competitivos de CS2 (Counter-Strike 2) usando a API PandaScore.

## 🎮 Funcionalidades

- ✅ **Dashboard Principal** - Overview com estatísticas em tempo real
- ✅ **Jogos Ao Vivo** - Acompanhamento de partidas em progresso com atualização automática
- ✅ **Próximos Jogos** - Calendário com eventos agendados
- ✅ **Resultados Recentes** - Histórico de partidas finalizadas
- ✅ **Times** - Informações detalhadas de times competitivos
- ✅ **Placar Ao Vivo** - Atualização automática de scores

## 🛠️ Stack Tecnológico

### Frontend
- **Vue 3** - Framework reativo
- **Vite** - Build tool moderno
- **Axios** - Cliente HTTP

### Backend
- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **Axios** - Cliente HTTP para PandaScore API
- **CORS** - Suporte para requisições cross-origin

### API Externa
- **PandaScore** - Dados de jogos e times de CS2

## 📦 Instalação

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em `http://localhost:3000`

### Backend

```bash
cd backend
npm install
```

Configure o seu token de acesso da PandaScore:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione seu token:

```env
PANDASCOPE_API_TOKEN=seu_token_aqui
PANDASCOPE_BASE_URL=https://api.pandascore.co
PORT=5000
NODE_ENV=development
```

Inicie o servidor:

```bash
npm run dev
```

O backend estará disponível em `http://localhost:5000`

## 🌐 Endpoints da API Backend

### Matches
- `GET /api/matches/upcoming` - Próximos jogos
- `GET /api/matches/recent` - Jogos recentes
- `GET /api/matches/live` - Jogos ao vivo
- `GET /api/matches/:id` - Detalhes de um jogo

### Teams
- `GET /api/teams` - Lista de times
- `GET /api/teams/:id` - Detalhes de um time

### Players
- `GET /api/players/:id` - Informações do jogador

### Leagues & Series
- `GET /api/leagues` - Lista de ligas
- `GET /api/series` - Lista de séries

### Health
- `GET /api/health` - Status do servidor

## 📊 Estrutura de Pastas

```
CS Esports/
├── backend/
│   ├── server.js              # Servidor Express principal
│   ├── package.json
│   ├── .env.example          # Exemplo de configuração
│   └── node_modules/
│
├── frontend/
│   ├── src/
│   │   ├── main.js           # Entry point Vue
│   │   ├── App.vue           # Componente raiz
│   │   ├── api.js            # Cliente HTTP reutilizável
│   │   └── components/
│   │       ├── Header.vue    # Navegação
│   │       ├── Dashboard.vue # Dashboard principal
│   │       ├── UpcomingMatches.vue
│   │       ├── RecentMatches.vue
│   │       ├── LiveMatches.vue
│   │       └── Teams.vue
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── node_modules/
│
└── .github/
    └── copilot-instructions.md
```

## 🚀 Como Usar

1. **Instale as dependências** em ambos paste (frontend e backend)
2. **Configure seu token PandaScore** no arquivo `.env` do backend
3. **Inicie o backend**: `cd backend && npm run dev`
4. **Inicie o frontend**: `cd frontend && npm run dev`
5. **Acesse** `http://localhost:3000` no seu navegador

## 🎯 Funcionalidades Detalhadas

### Dashboard
- Mostra contagem de jogos ao vivo, próximos, finalizados e times registrados
- Displays de últimos 3 jogos ao vivo
- Preview dos próximos 5 jogos

### Jogos Ao Vivo
- Lista todos os matches em progresso
- Atualização automática a cada 10 segundos
- Exibição de scores em tempo real
- Informações dos times com logos

### Próximos Jogos
- Calendário com jogos agendados
- Filtro por time
- Ordenação por data ou nome do time
- Informações da liga/série

### Resultados Recentes
- Histórico de matches finalizados
- Scores finais
- League/série information

### Times
- Lista de times competitivos
- Pesquisa e filtros
- Estatísticas básicas
- Visualização de jogadores

## 🔄 Atualização Automática

- **Jogos Ao Vivo**: Atualiza a cada 10 segundos
- **Dashboard**: Carrega dados na inicialização
- Todos os endpoints do backend têm suporte para paginação

## 🎨 Design

- **Tema Dark Gaming** - Interface escura com acentos em verde neon (#00ff88)
- **Responsivo** - Funciona em desktop, tablet e mobile
- **Animações** - Efeitos visuais para elementos ao vivo
- **Paleta de Cores**: 
  - Primária: Verde (#00ff88)
  - Secundária: Ciano (#00ccff)
  - Destaque (Live): Vermelho (#ff0000)

## 📝 Requisitos

- Node.js 16+ ✅
- Token de acesso PandaScore ✅
- Conexão com internet ✅

## 🐛 Troubleshooting

### Erro de conexão com backend
- Verifique se o backend está rodando em `http://localhost:5000`
- Confirme que o CORS está habilitado

### Token da API inválido
- Verifique se copiou corretamente o token no arquivo `.env`
- Teste o token usando `curl` ou Postman

### Dados não aparecem
- Verifique se a API da PandaScore está online
- Confirme que sua conexão de internet está ativa

## 📚 Documentação Adicional

- [Documentação Vue 3](https://vuejs.org/)
- [Documentação Vite](https://vitejs.dev/)
- [Documentação Express](https://expressjs.com/)
- [PandaScore API Docs](https://pandascore.co/developers)

## 💡 Possíveis Melhorias Futuras

- [ ] Autenticação de usuários
- [ ] Favoritar times/jogadores
- [ ] Comparação de estatísticas
- [ ] Previsões de matches
- [ ] Sistema de notificações
- [ ] Integração com WebSocket para atualizações em tempo real
- [ ] Gráficos e análises avançadas
- [ ] Dark/Light mode toggle

## 📄 Licença

Este projeto é de código aberto e disponível para uso pessoal e educacional.

---

**Desenvolvido com ❤️ para fãs de CS2 Competitivo**
