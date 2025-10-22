import { Router } from 'express';
import axios from 'axios';
import { orchestratorService } from '../services/orchestrator.js';

const router = Router();

router.post('/messages', async (req, res) => {
  const { author, content } = req.body;
  if (!author || !content) {
    return res.status(400).json({ error: 'Author and content are required' });
  }

  if (!process.env.CMS_URL || !process.env.CMS_TOKEN) {
    orchestratorService.log('warn', 'CMS env vars missing. Skipping storage.', { author });
    return res
      .status(202)
      .json({ messageId: 'simulated', warning: 'CMS persistence disabled in this environment.' });
  }

  try {
    const response = await axios.post(
      `${process.env.CMS_URL}/api/messages`,
      {
        data: {
          author,
          content,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CMS_TOKEN}`,
        },
      },
    );

    const messageId = response.data?.data?.id || 'unknown';
    orchestratorService.log('info', 'Stored message in CMS', { messageId });
    res.status(201).json({ messageId });
  } catch (error) {
    orchestratorService.log('error', 'Failed to store message in CMS', {
      error: error.message,
    });
    res.status(502).json({ error: 'Failed to store message in CMS' });
  }
});

export default router;
