import express from 'express';
import dotenv from 'dotenv';
import { corsMiddleware, corsHeadersMiddleware, preflightMiddleware } from './src/middleware/cors.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import matchesRouter from './src/routes/matches.js';
import teamsRouter from './src/routes/teams.js';
import tournamentsRouter from './src/routes/tournaments.js';
import othersRouter from './src/routes/others.js';
import dashboardRouter from './src/routes/dashboard.js';
import healthRouter from './src/routes/health.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.options('*', preflightMiddleware);
app.use(corsMiddleware);
app.use(corsHeadersMiddleware);
app.use(express.json());

app.use('/api/matches', matchesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/health', healthRouter);
app.use('/api', othersRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📊 PandaScore API configured`);
});
