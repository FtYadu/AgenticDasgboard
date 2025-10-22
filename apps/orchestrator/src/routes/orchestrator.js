import { Router } from 'express';
import { orchestratorService } from '../services/orchestrator.js';

const router = Router();

router.get('/snapshot', (_req, res) => {
  res.json(orchestratorService.getSnapshot());
});

router.post('/command', async (req, res) => {
  const { command, payload = {} } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  const task = await orchestratorService.dispatch(command, payload);
  res.status(202).json({ taskId: task.id });
});

export default router;
