'use client';

import { AgentStatus } from '../lib/api';

const statusColors: Record<AgentStatus['state'], string> = {
  idle: '#38bdf8',
  running: '#22c55e',
  error: '#f97316',
};

export function AgentCard({ agent }: { agent: AgentStatus }) {
  const label = agent.state.charAt(0).toUpperCase() + agent.state.slice(1);

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.8)',
        border: `1px solid ${statusColors[agent.state]}`,
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>{agent.name}</h3>
        <span
          style={{
            background: statusColors[agent.state],
            color: '#0f172a',
            padding: '0.25rem 0.75rem',
            borderRadius: '999px',
            fontSize: '0.8rem',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </span>
      </div>
      <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem' }}>
        Last task: {agent.lastTask || 'N/A'}
      </p>
      <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>
        Updated {new Date(agent.updatedAt).toLocaleTimeString()}
      </p>
    </div>
  );
}
