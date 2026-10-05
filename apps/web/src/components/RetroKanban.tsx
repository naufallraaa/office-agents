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
            ✕ TUTUP
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
                    <div style={styles.emptyColumn}>Tidak ada task</div>
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
                      Penulis: {viewingTask.assignedName} ({viewingTask.role?.toUpperCase()})
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    style={styles.copyBtn}
                    onClick={() => handleCopy(viewingTask.result || '')}
                  >
                    {copied ? '✅ TERSALIN!' : '📋 SALIN KODE'}
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
    backgroundColor: 'rgba(5, 8, 16, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    padding: 24,
    boxSizing: 'border-box',
    fontFamily: '"VT323", monospace',
  },
  modal: {
    width: '100%',
    maxWidth: 1100,
    height: '80vh',
    maxHeight: 720,
    backgroundColor: 'rgba(9, 13, 22, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.85)',
    overflow: 'hidden',
  },
  header: {
    padding: '12px 20px',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    color: '#38bdf8',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  taskCount: {
    fontSize: 18,
    color: '#94a3b8',
  },
  closeBtn: {
    fontFamily: '"VT323", monospace',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    color: '#f8fafc',
    padding: '4px 12px',
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  columnsContainer: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
    padding: 16,
    overflowY: 'auto',
    backgroundColor: '#070a12',
  },
  column: {
    backgroundColor: 'rgba(11, 15, 25, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  columnHeader: {
    padding: '10px 14px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderBottom: '2px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f8fafc',
  },
  columnCount: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: '2px 8px',
    borderRadius: 12,
  },
  taskList: {
    flex: 1,
    padding: 12,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  emptyColumn: {
    textAlign: 'center',
    padding: '28px 0',
    color: '#64748b',
    fontSize: 17,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
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
    fontSize: 15,
    fontWeight: 'bold',
    border: '1px solid',
    borderRadius: 4,
    padding: '1px 6px',
  },
  assignee: {
    fontSize: 16,
    color: '#94a3b8',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f1f5f9',
    lineHeight: 1.3,
  },
  cardDesc: {
    fontSize: 16,
    color: '#94a3b8',
    lineHeight: 1.3,
  },
  cardResult: {
    marginTop: 6,
    paddingTop: 8,
    borderTop: '1px dashed rgba(255, 255, 255, 0.1)',
  },
  viewArtifactBtn: {
    fontFamily: '"VT323", monospace',
    width: '100%',
    padding: '6px',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid #38bdf8',
    borderRadius: 6,
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: 'bold',
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
    backdropFilter: 'blur(8px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 120,
    padding: 20,
    boxSizing: 'border-box',
  },
  artifactModal: {
    width: '100%',
    maxWidth: 880,
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
    padding: '12px 18px',
    backgroundColor: '#0f172a',
    borderBottom: '1px solid #334155',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  copyBtn: {
    fontFamily: '"VT323", monospace',
    padding: '6px 14px',
    backgroundColor: '#0284c7',
    border: 'none',
    borderRadius: 6,
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  artifactBody: {
    flex: 1,
    padding: 16,
    overflowY: 'auto',
    backgroundColor: '#050811',
  },
  codeBlock: {
    fontFamily: '"VT323", monospace',
    fontSize: 17,
    lineHeight: 1.45,
    color: '#e2e8f0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    margin: 0,
  },
};
