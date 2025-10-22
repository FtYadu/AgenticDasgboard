'use client';

import { TaskResult } from '../lib/api';

const statusColor: Record<TaskResult['status'], string> = {
  pending: '#facc15',
  completed: '#22c55e',
  failed: '#f97316',
};

export function TaskTable({ tasks }: { tasks: TaskResult[] }) {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.9)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        overflowX: 'auto',
      }}
    >
      <h3 style={{ marginTop: 0, fontSize: '1.25rem' }}>Task results</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <th style={{ textAlign: 'left', paddingBottom: '0.75rem' }}>Command</th>
            <th style={{ textAlign: 'left', paddingBottom: '0.75rem' }}>Agent</th>
            <th style={{ textAlign: 'left', paddingBottom: '0.75rem' }}>Status</th>
            <th style={{ textAlign: 'left', paddingBottom: '0.75rem' }}>Output</th>
            <th style={{ textAlign: 'left', paddingBottom: '0.75rem' }}>Created</th>
          </tr>
        </thead>
        <tbody style={{ color: '#e2e8f0' }}>
          {tasks.map((task) => (
            <tr key={task.id} style={{ borderTop: '1px solid rgba(148, 163, 184, 0.1)' }}>
              <td style={{ padding: '0.75rem 0' }}>{task.command}</td>
              <td style={{ padding: '0.75rem 0' }}>{task.agentId}</td>
              <td style={{ padding: '0.75rem 0' }}>
                <span
                  style={{
                    background: statusColor[task.status],
                    color: '#0f172a',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '999px',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                  }}
                >
                  {task.status}
                </span>
              </td>
              <td style={{ padding: '0.75rem 0', maxWidth: '320px' }}>{task.output}</td>
              <td style={{ padding: '0.75rem 0' }}>{new Date(task.createdAt).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
