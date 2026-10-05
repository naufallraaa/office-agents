import React, { useState, useEffect } from 'react';
import { useOfficeStore } from '../store/useOfficeStore';
import type { Task, TaskStatus, AgentRole } from 'shared';

interface RetroKanbanProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLUMNS: { key: TaskStatus; label: string; color: string; badge: string }[] = [
  { key: 'pending', label: 'BACKLOG', color: '#94a3b8', badge: '⏳' },
  { key: 'in_progress', label: 'IN PROGRESS', color: '#38bdf8', badge: '💻' },
  { key: 'review', label: 'QA AUDIT', color: '#f59e0b', badge: '🔍' },
  { key: 'done', label: 'DONE', color: '#22c55e', badge: '✅' },
];

export const RetroKanban: React.FC<RetroKanbanProps> = ({ isOpen, onClose }) => {
  const { tasks } = useOfficeStore();
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (viewingTask) {
          setViewingTask(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, viewingTask]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleBadge = (role?: AgentRole) => {
    switch (role) {
      case 'pm': return { label: 'PM', color: '#ec4899', icon: '📊' };
      case 'it_lead': return { label: 'IT LEAD', color: '#3b82f6', icon: '👔' };
      case 'frontend': return { label: 'FRONTEND', color: '#10b981', icon: '🎨' };
      case 'backend': return { label: 'BACKEND', color: '#8b5cf6', icon: '⚙️' };
      case 'devops': return { label: 'DEVOPS', color: '#ef4444', icon: '🚀' };
      case 'qa': return { label: 'QA', color: '#f59e0b', icon: '🔍' };
      default: return { label: 'SQUAD', color: '#94a3b8', icon: '🤖' };
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerTitle}>
            <span>📋 SPRINT KANBAN BOARD</span>
            <span style={styles.taskCount}>[{tasks.length} SUBTASKS]</span>
          </div>
          <button style={styles.closeBtn} onClick={onClose} title="Tutup papan (ESC)">
            ✕ CLOSE
          </button>
        </div>

        {/* Columns Grid */}
        <div style={styles.columnsContainer}>
          {COLUMNS.map((col) => {
            const columnTasks = tasks.filter((t) => t.status === col.key);

            return (
              <div key={col.key} style={styles.column}>
                <div style={{ ...styles.columnHeader, borderColor: col.color }}>
                  <span>{col.badge} {col.label}</span>
                  <span style={{ ...styles.columnCount, backgroundColor: `${col.color}22`, color: col.color }}>
                    {columnTasks.length}
                  </span>
                </div>

                <div style={styles.taskList}>
                  {columnTasks.length === 0 ? (
                    <div style={styles.emptyColumn}>No tasks</div>
                  ) : (
                    columnTasks.map((task) => {
                      const badge = getRoleBadge(task.role);

                      return (
                        <div key={task.id} style={styles.card}>
                          <div style={styles.cardHeader}>
                            <span style={{ ...styles.roleTag, color: badge.color, borderColor: `${badge.color}66` }}>
                              {badge.icon} {badge.label}
                            </span>
                            <span style={styles.assignee}>
                              {task.assignedName}
                            </span>
                          </div>

                          <div style={styles.cardTitle}>{task.title}</div>
                          
                          {task.description && (
                            <div style={styles.cardDesc}>{task.description}</div>
                          )}

                          {task.result && (
                            <div style={styles.cardResult}>
                              <button 
                                style={styles.viewArtifactBtn}
                                onClick={() => setViewingTask(task)}
                              >
                                👁️ BUKA KODE & HASIL
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ==================== ARTIFACT / CODE INSPECTION MODAL ==================== */}
        {viewingTask && (
          <div style={styles.artifactOverlay} onClick={() => setViewingTask(null)}>
            <div style={styles.artifactModal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.artifactHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>📄</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                      {viewingTask.title}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>
                      Author: {viewingTask.assignedName} ({viewingTask.role?.toUpperCase()})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    style={styles.copyBtn}
                    onClick={() => handleCopy(viewingTask.result || '')}
                  >
                    {copied ? '✅ TERSALIN!' : '📋 COPY KODE'}
                  </button>
                  <button 
                    style={styles.closeBtn}
                    onClick={() => setViewingTask(null)}
                  >
                    ✕ TUTUP
                  </button>
                </div>
              </div>

              <div style={styles.artifactBody}>
                <pre style={styles.codeBlock}>
                  <code>{viewingTask.result}</code>
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    pointerEvents: 'auto',
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(5, 8, 16, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 24,
    boxSizing: 'border-box',
    fontFamily: '"JetBrains Mono", monospace',
  },
  modal: {
    width: '100%',
    maxWidth: 1100,
    height: '80vh',
    maxHeight: 700,
    backgroundColor: '#090d16fa',
    border: '1px solid #334155',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8)',
    overflow: 'hidden',
  },
  header: {
    padding: '12px 18px',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 12,
    color: '#38bdf8',
    letterSpacing: 0.5,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  taskCount: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: 600,
  },
  closeBtn: {
    fontFamily: '"JetBrains Mono", monospace',
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    borderRadius: 4,
    color: '#f8fafc',
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  columnsContainer: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    padding: 16,
    overflowY: 'auto',
    backgroundColor: '#070a12',
  },
  column: {
    backgroundColor: '#0b0f19',
    border: '1px solid #1e293b',
    borderRadius: 6,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  columnHeader: {
    padding: '10px 12px',
    backgroundColor: '#0f172a',
    borderBottom: '2px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.5,
    color: '#f8fafc',
  },
  columnCount: {
    fontSize: 11,
    fontWeight: 700,
    padding: '2px 6px',
    borderRadius: 10,
  },
  taskList: {
    flex: 1,
    padding: 10,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  emptyColumn: {
    textAlign: 'center',
    padding: '28px 0',
    color: '#475569',
    fontSize: 12,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: 6,
    padding: 10,
    boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roleTag: {
    fontSize: 10,
    fontWeight: 700,
    border: '1px solid',
    borderRadius: 3,
    padding: '1px 5px',
  },
  assignee: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: 600,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#f1f5f9',
    lineHeight: 1.3,
  },
  cardDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 1.3,
  },
  cardResult: {
    marginTop: 4,
    paddingTop: 6,
    borderTop: '1px dashed #1e293b',
  },
  viewArtifactBtn: {
    fontFamily: '"JetBrains Mono", monospace',
    width: '100%',
    padding: '6px',
    backgroundColor: '#1e293b',
    border: '1px solid #38bdf8',
    borderRadius: 4,
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.15s ease',
  },
  artifactOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(3, 7, 18, 0.85)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 120,
    padding: 20,
    boxSizing: 'border-box',
  },
  artifactModal: {
    width: '100%',
    maxWidth: 860,
    height: '85%',
    backgroundColor: '#090d16',
    border: '1px solid #38bdf8',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 0 32px rgba(56, 189, 248, 0.25)',
    overflow: 'hidden',
  },
  artifactHeader: {
    padding: '12px 16px',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyBtn: {
    fontFamily: '"JetBrains Mono", monospace',
    padding: '6px 12px',
    backgroundColor: '#0284c7',
    border: 'none',
    borderRadius: 4,
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 700,
    cursor: 'pointer',
  },
  artifactBody: {
    flex: 1,
    padding: 16,
    overflowY: 'auto',
    backgroundColor: '#050811',
  },
  codeBlock: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 12,
    lineHeight: 1.5,
    color: '#e2e8f0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
  },
};
