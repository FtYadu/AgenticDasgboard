'use client';

import { useMemo } from 'react';
import { CommandCenter } from '../components/CommandCenter';
import { AgentCard } from '../components/AgentCard';
import { LogList } from '../components/LogList';
import { TaskTable } from '../components/TaskTable';
import { useDashboardSnapshot } from '../lib/hooks';

export default function DashboardPage() {
  const { snapshot, error, isLoading, refresh } = useDashboardSnapshot();

  const content = useMemo(() => {
    if (isLoading) {
      return <p style={{ color: '#cbd5f5' }}>Loading orchestrator data…</p>;
    }

    if (error) {
      return (
        <p style={{ color: '#f97316' }}>
          Failed to load data from orchestrator. Check that the backend is running.
        </p>
      );
    }

    if (!snapshot) {
      return null;
    }

    return (
      <div
        style={{
          display: 'grid',
          gap: '1.5rem',
        }}
      >
        <section>
          <h2 style={{ margin: '0 0 1rem', fontSize: '2rem' }}>Agent status</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1rem',
            }}
          >
            {snapshot.agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <TaskTable tasks={snapshot.tasks} />
          <LogList logs={snapshot.logs} />
        </section>
      </div>
    );
  }, [error, isLoading, snapshot]);

  return (
    <main>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '2.5rem' }}>Agentic operations center</h1>
          <p style={{ margin: 0, color: '#94a3b8' }}>
            Monitor delegated AI workloads and orchestrate new tasks in one place.
          </p>
        </div>
        <button
          onClick={() => refresh()}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '12px',
            border: 'none',
            background: '#38bdf8',
            color: '#0f172a',
            fontWeight: 700,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          Refresh
        </button>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem',
        }}
      >
        <div>{content}</div>
        <CommandCenter onSuccess={() => refresh()} />
      </div>
    </main>
  );
}
