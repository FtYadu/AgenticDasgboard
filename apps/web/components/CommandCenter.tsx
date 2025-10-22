'use client';

import { FormEvent, useState } from 'react';
import { sendCommand, sendMessage } from '../lib/api';

export function CommandCenter({ onSuccess }: { onSuccess?: () => void }) {
  const [command, setCommand] = useState('summarize');
  const [payload, setPayload] = useState('{}');
  const [author, setAuthor] = useState('Operator');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleCommandSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsSubmitting(true);
      setStatus(null);
      const parsedPayload = payload.trim() ? JSON.parse(payload) : {};
      const { taskId } = await sendCommand(command, parsedPayload);
      setStatus(`Command queued as task ${taskId}`);
      setPayload('{}');
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      setStatus('Failed to send command. Check payload JSON.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessageSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!message.trim()) return;

    try {
      setIsSubmitting(true);
      setStatus(null);
      const { messageId } = await sendMessage(author, message);
      setStatus(`Message stored with id ${messageId}`);
      setMessage('');
    } catch (error) {
      console.error(error);
      setStatus('Failed to store message.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.95)',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.5)',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        display: 'grid',
        gap: '1.5rem',
      }}
    >
      <div>
        <h3 style={{ marginTop: 0 }}>Dispatch command</h3>
        <form onSubmit={handleCommandSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Command</span>
            <input
              value={command}
              onChange={(event) => setCommand(event.target.value)}
              style={{
                padding: '0.75rem',
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#e2e8f0',
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Payload JSON</span>
            <textarea
              value={payload}
              onChange={(event) => setPayload(event.target.value)}
              rows={4}
              style={{
                padding: '0.75rem',
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#e2e8f0',
                fontFamily: 'monospace',
              }}
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
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
            {isSubmitting ? 'Sending…' : 'Send command'}
          </button>
        </form>
      </div>

      <div>
        <h3>Store operator note</h3>
        <form onSubmit={handleMessageSubmit} style={{ display: 'grid', gap: '0.75rem' }}>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Author</span>
            <input
              value={author}
              onChange={(event) => setAuthor(event.target.value)}
              style={{
                padding: '0.75rem',
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#e2e8f0',
              }}
            />
          </label>
          <label style={{ display: 'grid', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Message</span>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              style={{
                padding: '0.75rem',
                borderRadius: '12px',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                background: 'rgba(15, 23, 42, 0.8)',
                color: '#e2e8f0',
              }}
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: '#22c55e',
              color: '#0f172a',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {isSubmitting ? 'Saving…' : 'Save to CMS'}
          </button>
        </form>
      </div>

      {status && (
        <p style={{ margin: 0, color: '#f8fafc', fontSize: '0.85rem' }}>{status}</p>
      )}
    </div>
  );
}
