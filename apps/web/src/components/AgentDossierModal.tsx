import React, { useEffect, useState } from 'react';
import type { Agent } from '../types';

interface AgentDossierModalProps {
  agent: Agent | null;
  onClose: () => void;
  onMention: (agentName: string) => void;
  onSendToBreak?: (agentId: string) => void;
  onSendToWork?: (agentId: string) => void;
  /** Dipanggil kalau Boss ngirim chat langsung dari dossier (biar muncul juga di Slack) */
  onChatMessage?: (text: string) => void;
}

export const AgentDossierModal: React.FC<AgentDossierModalProps> = ({
  agent,
  onClose,
  onMention,
  onSendToBreak,
  onSendToWork,
  onChatMessage,
}) => {
  const [chatInput, setChatInput] = useState('');
  const [pending, setPending] = useState(false);
  const [reply, setReply] = useState<string | null>(null);

  // Reset tiap ganti agen / buka modal
  useEffect(() => {
    setChatInput('');
    setReply(null);
    setPending(false);
  }, [agent?.id]);

  if (!agent) return null;

  const isBoss = agent.id.includes('boss');

  const sendChat = async () => {
    const msg = chatInput.trim();
    if (!msg || pending) return;
    setChatInput('');
    setPending(true);
    setReply(null);
    onChatMessage?.(msg);
    try {
      const res = await fetch(`/api/agents/${agent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setReply(data.ok ? data.reply : `Gagal: ${data.error || 'server error'}`);
    } catch {
      setReply('Server lagi nggak nyambung, Boss.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>{agent.emoji}</span>
            <span style={{ color: agent.color, fontWeight: 'bold', fontSize: 14 }}>
              {agent.name.toUpperCase()}
            </span>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>({agent.role})</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          <div style={styles.row}>
            <span style={styles.label}>STATUS:</span>
            <span style={{ color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase' }}>
              {agent.state} ({agent.statusText || 'standby'})
            </span>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>SPOT:</span>
            <span style={{ color: '#cbd5e1' }}>{agent.assignedSpotId || 'Meja'} ({agent.room})</span>
          </div>

          <div style={styles.row}>
            <span style={styles.label}>TUGAS:</span>
            <span style={{ color: '#facc15' }}>{agent.task || 'Standby nunggu sprint backlog'}</span>
          </div>

          {!isBoss && (
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={styles.label}>CHAT LANGSUNG:</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  style={styles.chatInput}
                  value={chatInput}
                  placeholder={`Tanya ${agent.name} langsung...`}
                  disabled={pending}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); void sendChat(); }
                    if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
                  }}
                />
                <button
                  style={{ ...styles.mentionBtn, opacity: pending ? 0.6 : 1, minWidth: 70 }}
                  onClick={() => void sendChat()}
                  disabled={pending}
                >
                  {pending ? '...' : 'Kirim'}
                </button>
              </div>
              {reply && (
                <div style={{ fontSize: 11, color: '#e2e8f0', background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '8px 10px', whiteSpace: 'pre-wrap' }}>
                  <span style={{ color: agent.color, fontWeight: 'bold' }}>{agent.name}: </span>
                  {reply}
                </div>
              )}
            </div>
          )}

          <div style={styles.actions}>
            <button
              style={styles.mentionBtn}
              onClick={() => {
                onMention(agent.name);
                onClose();
              }}
            >
              💬 Sebut di #office-general
            </button>

            {onSendToBreak && (
              <button
                style={styles.actionBtn}
                onClick={() => {
                  onSendToBreak(agent.id);
                  onClose();
                }}
              >
                ☕ Suruh Rehat / Ngopi
              </button>
            )}

            {onSendToWork && (
              <button
                style={styles.actionBtn}
                onClick={() => {
                  onSendToWork(agent.id);
                  onClose();
                }}
              >
                💻 Suruh Balik Kerja
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(5, 8, 16, 0.7)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 16,
    boxSizing: 'border-box',
    fontFamily: '"JetBrains Mono", monospace',
  },
  modal: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 8,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
    overflow: 'hidden',
  },
  header: {
    padding: '10px 14px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: 14,
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  body: {
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  row: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    fontSize: 12,
  },
  label: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTop: '1px solid #1e293b',
  },
  mentionBtn: {
    padding: '8px 12px',
    backgroundColor: '#0284c7',
    border: 'none',
    borderRadius: 6,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: '"JetBrains Mono", monospace',
  },
  actionBtn: {
    padding: '6px 12px',
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    borderRadius: 6,
    color: '#e2e8f0',
    fontSize: 12,
    cursor: 'pointer',
    fontFamily: '"JetBrains Mono", monospace',
  },
  chatInput: {
    flex: 1,
    padding: '8px 10px',
    backgroundColor: '#0b1220',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#e2e8f0',
    fontSize: 12,
    fontFamily: '"JetBrains Mono", monospace',
    outline: 'none',
  },
};
