'use client';

import { LogEntry } from '../lib/api';

const levelColor: Record<LogEntry['level'], string> = {
  info: '#38bdf8',
  warn: '#facc15',
  error: '#f97316',
};

export function LogList({ logs }: { logs: LogEntry[] }) {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.9)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.5)',
        maxHeight: '360px',
        overflowY: 'auto',
        border: '1px solid rgba(148, 163, 184, 0.1)',
      }}
    >
      <h3 style={{ marginTop: 0, fontSize: '1.25rem' }}>Activity log</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {logs.map((log) => (
          <li
            key={log.id}
            style={{
              display: 'grid',
              gridTemplateColumns: 'auto 1fr',
              gap: '0.75rem',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                color: levelColor[log.level],
                fontWeight: 600,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
              }}
            >
              {log.level}
            </span>
            <div>
              <p style={{ margin: 0, fontSize: '0.95rem' }}>{log.message}</p>
              {log.context && (
                <pre
                  style={{
                    margin: '0.25rem 0 0',
                    fontSize: '0.7rem',
                    background: 'rgba(30, 41, 59, 0.8)',
                    padding: '0.5rem',
                    borderRadius: '8px',
                    color: '#cbd5f5',
                    overflowX: 'auto',
                  }}
                >
                  {JSON.stringify(log.context, null, 2)}
                </pre>
              )}
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.75rem' }}>
                {new Date(log.timestamp).toLocaleString()}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
