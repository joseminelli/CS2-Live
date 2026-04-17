import cors from 'cors';
import { corsOptions, ALLOWED_ORIGINS } from '../config/cors.js';

export const corsMiddleware = cors(corsOptions);

export const corsHeadersMiddleware = (req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Max-Age', '86400');
  }

  next();
};

export const preflightMiddleware = cors(corsOptions);
