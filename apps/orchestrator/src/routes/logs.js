import { Router } from 'express';
import { orchestratorService } from '../services/orchestrator.js';

const router = Router();

router.get('/logs/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  const send = (entry) => {
    res.write(`data: ${JSON.stringify(entry)}\n\n`);
  };

  orchestratorService.getSnapshot().logs.slice().reverse().forEach(send);

  const listener = (entry) => send(entry);
  orchestratorService.onLog(listener);

  req.on('close', () => {
    orchestratorService.offLog(listener);
  });
});

export default router;
