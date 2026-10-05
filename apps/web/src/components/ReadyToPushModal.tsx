import React, { useState } from 'react';
import { useOfficeStore } from '../store/useOfficeStore';

interface ReadyToPushModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetPath?: string;
}

export const ReadyToPushModal: React.FC<ReadyToPushModalProps> = ({ isOpen, onClose, targetPath = '.' }) => {
  const { tasks } = useOfficeStore();
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const branchName = `feature/sprint-${Date.now().toString().slice(-4)}`;
  const gitCommands = [
    `git checkout -b ${branchName}`,
    `git add .`,
    `git commit -m "feat(squad): implementasi hasil sprint kantor-ai"`,
    `git push origin ${branchName}`,
  ].join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const doneTasks = tasks.filter(t => t.status === 'done');

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <span>🚀 SPRINT COMPLETED — READY TO PUSH</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div style={styles.body}>
          <div style={styles.section}>
            <div style={styles.label}>TARGET PROJECT DIRECTORY:</div>
            <div style={styles.pathBadge}>{targetPath}</div>
          </div>

          <div style={styles.section}>
            <div style={styles.label}>COMPLETED SUBTASKS ({doneTasks.length}):</div>
            <div style={styles.taskList}>
              {doneTasks.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: 13, fontStyle: 'italic' }}>
                  Belum ada task yang diselesaikan.
                </div>
              ) : (
                doneTasks.map((t) => (
                  <div key={t.id} style={styles.taskItem}>
                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>✓</span>
                    <span style={{ color: '#f8fafc', fontWeight: 600 }}>{t.title}</span>
                    <span style={{ color: '#94a3b8', fontSize: 11 }}>({t.assignedName})</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={styles.section}>
            <div style={styles.label}>EKSEKUSI GIT MANUAL (DI TERMINAL ANDA):</div>
            <div style={styles.codeWrap}>
              <pre style={styles.codeBlock}>{gitCommands}</pre>
              <button style={styles.copyBtn} onClick={handleCopy}>
                {copied ? '✅ COPIED TO CLIPBOARD!' : '📋 COPY GIT COMMAND'}
              </button>
            </div>
            <div style={styles.hint}>
              * Sesuai aturan keamanan: Opay mengeksekusi git secara manual di terminal project.
            </div>
          </div>
        </div>

        <div style={styles.footer}>
          <button style={styles.doneBtn} onClick={onClose}>
            SELESAI & TUTUP
          </button>
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
    backgroundColor: 'rgba(5, 8, 16, 0.85)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 20,
    boxSizing: 'border-box',
    fontFamily: '"JetBrains Mono", monospace',
  },
  modal: {
    width: '100%',
    maxWidth: 640,
    backgroundColor: '#0f172a',
    border: '1px solid #38bdf8',
    borderRadius: 10,
    boxShadow: '0 0 40px rgba(56, 189, 248, 0.3)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '14px 18px',
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 14,
    color: '#38bdf8',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    fontSize: 16,
    cursor: 'pointer',
    fontWeight: 'bold',
  },
  body: {
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    maxHeight: '65vh',
    overflowY: 'auto',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  pathBadge: {
    padding: '8px 12px',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 6,
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: 600,
  },
  taskList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '10px 12px',
    backgroundColor: '#090d16',
    border: '1px solid #1e293b',
    borderRadius: 6,
    maxHeight: 140,
    overflowY: 'auto',
  },
  taskItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
  },
  codeWrap: {
    position: 'relative',
    backgroundColor: '#090d16',
    border: '1px solid #334155',
    borderRadius: 6,
    padding: 14,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  codeBlock: {
    margin: 0,
    color: '#7dd3fc',
    fontSize: 13,
    lineHeight: 1.5,
    fontFamily: '"JetBrains Mono", monospace',
  },
  copyBtn: {
    padding: '8px 14px',
    backgroundColor: '#0284c7',
    border: 'none',
    borderRadius: 6,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: '"JetBrains Mono", monospace',
    transition: 'background 0.15s',
  },
  hint: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    marginTop: 4,
  },
  footer: {
    padding: '12px 18px',
    backgroundColor: '#1e293b',
    borderTop: '1px solid #334155',
    display: 'flex',
    justifyContent: 'flex-end',
  },
  doneBtn: {
    padding: '8px 16px',
    backgroundColor: '#10b981',
    border: 'none',
    borderRadius: 6,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: '"JetBrains Mono", monospace',
  },
};
