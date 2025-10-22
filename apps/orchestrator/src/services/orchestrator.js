import EventEmitter from 'node:events';
import { nanoid } from 'nanoid';
import { logger } from '../utils/logger.js';
import { gptAgent } from '../agents/gptAgent.js';
import { visionAgent } from '../agents/visionAgent.js';
import { createRedisClient } from './redis.js';

const COMMAND_QUEUE_KEY = 'agentic:commands';

const agents = [
  { id: 'gpt', name: 'GPT Language Agent', handler: gptAgent },
  { id: 'vision', name: 'Vision Analysis Agent', handler: visionAgent },
];

export class OrchestratorService {
  constructor() {
    this.agentState = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      state: 'idle',
      lastTask: null,
      updatedAt: new Date().toISOString(),
    }));
    this.tasks = [];
    this.logs = [];
    this.events = new EventEmitter();
    this.log('info', 'Orchestrator booted', {
      agents: this.agentState.map((agent) => agent.id),
    });
  }

  getSnapshot() {
    return {
      agents: this.agentState,
      tasks: this.tasks.slice().reverse().slice(0, 10),
      logs: this.logs.slice().reverse().slice(0, 50),
    };
  }

  onLog(listener) {
    this.events.on('log', listener);
  }

  offLog(listener) {
    this.events.off('log', listener);
  }

  log(level, message, context = {}) {
    const entry = {
      id: nanoid(),
      level,
      message,
      context,
      timestamp: new Date().toISOString(),
    };
    this.logs.push(entry);
    logger[level](message, context);
    this.events.emit('log', entry);
    if (this.logs.length > 500) {
      this.logs.shift();
    }
  }

  updateAgent(agentId, data) {
    const target = this.agentState.find((agent) => agent.id === agentId);
    if (target) {
      Object.assign(target, data, { updatedAt: new Date().toISOString() });
    }
  }

  async enqueue(task) {
    const redis = createRedisClient();
    await redis.lpush(
      COMMAND_QUEUE_KEY,
      JSON.stringify({
        id: task.id,
        command: task.command,
        payload: task.payload,
        createdAt: task.createdAt,
        agentId: task.agentId,
      }),
    );
  }

  async dispatch(command, payload) {
    const agentId = payload.agentId && agents.some((agent) => agent.id === payload.agentId)
      ? payload.agentId
      : 'gpt';
    const task = {
      id: nanoid(),
      command,
      payload,
      status: 'pending',
      createdAt: new Date().toISOString(),
      output: '',
      agentId,
    };
    this.tasks.push(task);

    const agent = agents.find((candidate) => candidate.id === task.agentId) || agents[0];
    this.updateAgent(agent.id, { state: 'running', lastTask: command });
    this.log('info', `Dispatching ${command} to ${agent.name}`, { taskId: task.id });

    try {
      await this.enqueue(task);
    } catch (error) {
      this.log('error', 'Failed to enqueue command in Redis', { error: error.message, taskId: task.id });
    }

    try {
      const result = await agent.handler(command, payload);
      task.status = 'completed';
      task.output = result.output;
      this.log('info', `${agent.name} completed ${command}`, { taskId: task.id });
      this.updateAgent(agent.id, { state: 'idle' });
    } catch (error) {
      task.status = 'failed';
      task.output = error.message;
      this.log('error', `${agent.name} failed ${command}`, { taskId: task.id, error: error.message });
      this.updateAgent(agent.id, { state: 'error' });
    }

    return task;
  }
}

export const orchestratorService = new OrchestratorService();
