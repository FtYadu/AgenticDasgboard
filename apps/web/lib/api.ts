export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000';
export const sseBaseUrl = process.env.NEXT_PUBLIC_WS_BASE || apiBaseUrl;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export interface AgentStatus {
  id: string;
  name: string;
  state: 'idle' | 'running' | 'error';
  lastTask?: string | null;
  updatedAt: string;
}

export interface TaskResult {
  id: string;
  command: string;
  agentId: string;
  status: 'pending' | 'completed' | 'failed';
  output: string;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

export interface DashboardSnapshot {
  agents: AgentStatus[];
  tasks: TaskResult[];
  logs: LogEntry[];
}

export function getSnapshot(): Promise<DashboardSnapshot> {
  return request<DashboardSnapshot>('/api/snapshot');
}

export function sendCommand(command: string, payload: Record<string, unknown>) {
  return request<{ taskId: string }>('/api/command', {
    method: 'POST',
    body: JSON.stringify({ command, payload }),
  });
}

export function sendMessage(author: string, content: string) {
  return request<{ messageId: string }>('/api/messages', {
    method: 'POST',
    body: JSON.stringify({ author, content }),
  });
}

export function createLogStream(): EventSource | null {
  if (typeof window === 'undefined') {
    return null;
  }

  return new EventSource(`${sseBaseUrl}/api/logs/stream`);
}
