import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import orchestratorRouter from './routes/orchestrator.js';
import messageRouter from './routes/messages.js';
import logsRouter from './routes/logs.js';
import { orchestratorService } from './services/orchestrator.js';
import { createRedisClient } from './services/redis.js';

const app = express();

const allowedOrigins = process.env.CORS_ORIGINS?.split(',').map((origin) => origin.trim()).filter(Boolean) ?? [];

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : undefined,
    credentials: true,
  }),
);
app.use(express.json());

app.get('/healthz', async (_req, res) => {
  const status = {
    ok: true,
    redis: false,
    strapi: false,
  };

  try {
    const redis = createRedisClient();
    await redis.ping();
    status.redis = true;
  } catch (error) {
    status.ok = false;
    status.redis = false;
    status.redisError = error.message;
  }

  if (process.env.CMS_URL) {
    try {
      const response = await fetch(`${process.env.CMS_URL}/admin`, { method: 'HEAD' });
      status.strapi = response.ok || response.status === 302;
      if (!status.strapi) {
        status.ok = false;
      }
    } catch (error) {
      status.ok = false;
      status.strapi = false;
      status.strapiError = error.message;
    }
  }

  res.status(status.ok ? 200 : 503).json(status);
});

app.use('/api', orchestratorRouter);
app.use('/api', messageRouter);
app.use('/api', logsRouter);

const port = process.env.PORT || 4000;

app.listen(port, () => {
  orchestratorService.log('info', `Agentic orchestrator listening on port ${port}`);
});
