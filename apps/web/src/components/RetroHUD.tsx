import React, { useState, useEffect } from 'react';
import { useOfficeStore } from '../store/useOfficeStore';
import { RetroKanban } from './RetroKanban';
import type { Agent } from 'shared';

interface RetroHUDProps {
  onFocusAgent: (agent: Agent) => void;
  onToggleNightMode?: (isNight: boolean) => void;
}

export const RetroHUD: React.FC<RetroHUDProps> = ({ onFocusAgent, onToggleNightMode }) => {
  const {
    agents,
    selectedAgent,
    setSelectedAgent,
    logs,
    tasks,
    isConnected,
    triggerMeetingMode,
    triggerBreakMode,
    triggerWorkMode,
    addLog,
  } = useOfficeStore();

  const [inputTask, setInputTask] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLogMinimized, setIsLogMinimized] = useState(false);
  const [isKanbanOpen, setIsKanbanOpen] = useState(false);
  const [isNightMode, setIsNightMode] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch((err) => {
        console.error('Exit fullscreen failed:', err);
      });
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTask.trim()) return;

    const goal = inputTask.trim();
    setInputTask('');

    try {
      const res = await fetch('/api/sprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal }),
      });
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
    } catch (err: any) {
      addLog('SYSTEM', '#ef4444', `Gagal dispatch sprint: ${err.message}`);
    }
  };

  const [isSendingToAgent, setIsSendingToAgent] = useState(false);

  const handleSendToAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !selectedAgent || isSendingToAgent) return;

    const message = chatMessage.trim();
    setChatMessage('');
    setIsSendingToAgent(true);

    try {
      const res = await fetch(`/api/agents/${selectedAgent.id}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) {
        throw new Error(`Chat failed with status ${res.status}`);
      }
    } catch (err: any) {
      addLog('SYSTEM', '#ef4444', `Gagal kirim pesan ke ${selectedAgent.name}: ${err.message}`);
    } finally {
      setIsSendingToAgent(false);
    }
  };

  return (
    <div style={styles.hudContainer}>
      {/* ==================== TOP BAR ==================== */}
      <div style={styles.topBar}>
        <div style={styles.branding}>
          <span style={styles.logoIcon}>🏢</span>
          <span style={styles.logoText}>KANTOR-AI</span>
          <span style={styles.subText}>[16-BIT AUTONOMOUS SQUAD]</span>
        </div>

        <div style={styles.controlsGroup}>
          <button style={styles.retroBtn} onClick={triggerWorkMode}>
            💻 WORK
          </button>
          <button style={styles.retroBtn} onClick={triggerMeetingMode}>
            📋 SPRINT SYNC
          </button>
          <button style={styles.retroBtn} onClick={triggerBreakMode}>
            ☕ PANTRY
          </button>

          {/* Kanban Board Toggle Button */}
          <button 
            style={{
              ...styles.retroBtn,
              borderColor: isKanbanOpen ? '#38bdf8' : '#475569',
              color: isKanbanOpen ? '#38bdf8' : '#f8fafc',
            }} 
            onClick={() => setIsKanbanOpen(!isKanbanOpen)}
          >
            📋 KANBAN {tasks.length > 0 ? `(${tasks.length})` : ''}
          </button>

          {/* Day / Night Ambient Toggle */}
          <button 
            style={{
              ...styles.retroBtn,
              borderColor: isNightMode ? '#818cf8' : '#475569',
              color: isNightMode ? '#a5b4fc' : '#f8fafc',
            }} 
            onClick={() => {
              const next = !isNightMode;
              setIsNightMode(next);
              onToggleNightMode?.(next);
            }}
            title="Toggle Day / Night Lighting"
          >
            {isNightMode ? '🌙 NIGHT' : '☀️ DAY'}
          </button>

          {/* Fullscreen Button */}
          <button style={styles.fullscreenBtn} onClick={toggleFullscreen} title="Toggle Fullscreen">
            {isFullscreen ? '🗗 EXIT FULLSCREEN' : '⛶ FULLSCREEN'}
          </button>

          <div style={styles.statusIndicator}>
            <span style={{
              display: 'inline-block',
              width: 8,
              height: 8,
              borderRadius: '50%',
              backgroundColor: isConnected ? '#22c55e' : '#ef4444',
              marginRight: 6,
              boxShadow: isConnected ? '0 0 8px #22c55e' : '0 0 8px #ef4444'
            }} />
            <span style={{ color: isConnected ? '#22c55e' : '#ef4444', fontSize: 12, fontWeight: 600 }}>
              {isConnected ? 'ONLINE' : 'CONNECTING...'}
            </span>
          </div>
        </div>
      </div>

      {/* ==================== BOTTOM LEFT: ACTIVITY & CHAT LOG ==================== */}
      <div style={{
        ...styles.logPanel,
        maxHeight: isLogMinimized ? 'auto' : 230,
        width: isLogMinimized ? 260 : 440,
      }}>
        <div 
          style={{
            ...styles.panelHeader,
            cursor: 'pointer',
            borderRadius: isLogMinimized ? 6 : '6px 6px 0 0',
          }}
          onClick={() => setIsLogMinimized(!isLogMinimized)}
          title="Klik untuk minimize/expand"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>[SYS_COMM_LOG]</span>
            <span style={{ fontSize: 11, color: '#94a3b8', letterSpacing: 0.5 }}>
              {isLogMinimized ? '(MINIMIZED)' : 'LIVE STREAM'}
            </span>
          </div>
          <button 
            style={styles.toggleBtn}
            onClick={(e) => {
              e.stopPropagation();
              setIsLogMinimized(!isLogMinimized);
            }}
          >
            {isLogMinimized ? '▲ SHOW' : '▼ HIDE'}
          </button>
        </div>
        {!isLogMinimized && (
          <div style={styles.logBody}>
            {logs.map((log) => (
              <div key={log.id} style={styles.logItem}>
                <span style={styles.logTime}>[{log.timestamp}]</span>
                <span style={{ ...styles.logSender, color: log.color }}>{log.sender}:</span>
                <span style={styles.logMsg}>{log.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ==================== RIGHT SIDE: AGENT INSPECTOR ==================== */}
      {selectedAgent && (
        <div style={styles.agentDossier}>
          <div style={styles.panelHeader}>
            <span>[AGENT_DOSSIER]</span>
            <button 
              onClick={() => setSelectedAgent(null)}
              style={styles.closeBtn}
            >
              ✕
            </button>
          </div>

          <div style={styles.dossierContent}>
            <div style={styles.dossierHeader}>
              <span style={{ fontSize: 32 }}>{selectedAgent.emoji}</span>
              <div style={{ marginLeft: 12 }}>
                <div style={{ fontSize: 16, color: selectedAgent.color, fontWeight: 700 }}>
                  {selectedAgent.name}
                </div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>
                  ROLE: {selectedAgent.roleTitle.toUpperCase()}
                </div>
              </div>
            </div>

            <div style={styles.dossierField}>
              <span style={styles.fieldLabel}>STATUS:</span>
              <span style={{ color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase', fontSize: 13 }}>
                {selectedAgent.state}
              </span>
            </div>

            <div style={styles.dossierField}>
              <span style={styles.fieldLabel}>PERSONALITY:</span>
              <div style={styles.personalityText}>
                {selectedAgent.personality}
              </div>
            </div>

            {selectedAgent.currentTask && (
              <div style={styles.dossierField}>
                <span style={styles.fieldLabel}>ACTIVE TASK:</span>
                <div style={{ color: '#facc15', fontSize: 12, fontWeight: 500 }}>
                  {selectedAgent.currentTask}
                </div>
              </div>
            )}

            <button 
              style={styles.actionBtn}
              onClick={() => onFocusAgent(selectedAgent)}
            >
              🎯 FOCUS CAMERA
            </button>

            {/* Direct message to agent */}
            <form onSubmit={handleSendToAgent} style={{ marginTop: 12 }}>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={`Beri instruksi ke ${selectedAgent.name}...`}
                style={styles.retroInput}
              />
              <button type="submit" style={styles.sendBtn} disabled={isSendingToAgent}>
                {isSendingToAgent ? 'MENUNGGU BALASAN...' : 'KIRIM INSTRUKSI'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== BOTTOM CENTER: SPRINT COMMAND INPUT ==================== */}
      <div style={styles.commandBar}>
        <form onSubmit={handleTaskSubmit} style={styles.commandForm}>
          <span style={styles.commandPrompt}>{'>'}</span>
          <input
            type="text"
            value={inputTask}
            onChange={(e) => setInputTask(e.target.value)}
            placeholder="Ketik tugas sprint baru untuk IT Lead (misal: 'Bikin auth JWT & dashboard kanban')..."
            style={styles.commandInput}
          />
          <button type="submit" style={styles.executeBtn}>
            EXECUTE 🚀
          </button>
        </form>
      </div>

      {/* ==================== SPRINT KANBAN MODAL ==================== */}
      <RetroKanban isOpen={isKanbanOpen} onClose={() => setIsKanbanOpen(false)} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  hudContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 16,
    boxSizing: 'border-box',
    fontFamily: '"JetBrains Mono", "Fira Code", monospace',
  },
  topBar: {
    pointerEvents: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#090d16f2',
    border: '1px solid #334155',
    borderRadius: 6,
    padding: '8px 16px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
  },
  branding: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    fontSize: 22,
  },
  logoText: {
    fontFamily: '"Press Start 2P", monospace',
    fontSize: 13,
    color: '#38bdf8',
    letterSpacing: 1,
  },
  subText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: 500,
  },
  controlsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  retroBtn: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 12px',
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    borderRadius: 4,
    color: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  fullscreenBtn: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 12px',
    backgroundColor: '#0f172a',
    border: '1px solid #38bdf8',
    borderRadius: 4,
    color: '#38bdf8',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 6,
    padding: '4px 10px',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 4,
  },
  logPanel: {
    pointerEvents: 'auto',
    position: 'absolute',
    bottom: 75,
    right: 16,
    width: 440,
    maxHeight: 230,
    backgroundColor: '#090d16f5',
    border: '1px solid #334155',
    borderRadius: 6,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 24px rgba(0,0,0,0.7)',
    zIndex: 40,
  },
  panelHeader: {
    backgroundColor: '#1e293b',
    padding: '6px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.5,
    borderBottom: '1px solid #334155',
    borderRadius: '6px 6px 0 0',
  },
  toggleBtn: {
    fontFamily: '"JetBrains Mono", monospace',
    fontSize: 10,
    fontWeight: 700,
    backgroundColor: '#0f172a',
    border: '1px solid #475569',
    borderRadius: 3,
    color: '#38bdf8',
    padding: '2px 8px',
    cursor: 'pointer',
  },
  logBody: {
    padding: 10,
    overflowY: 'auto',
    maxHeight: 180,
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: 6,
  },
  logItem: {
    fontSize: 12,
    lineHeight: 1.4,
  },
  logTime: {
    color: '#64748b',
    marginRight: 6,
    fontSize: 11,
  },
  logSender: {
    fontWeight: 700,
    marginRight: 6,
  },
  logMsg: {
    color: '#e2e8f0',
  },
  agentDossier: {
    pointerEvents: 'auto',
    position: 'absolute',
    top: 75,
    right: 16,
    width: 300,
    backgroundColor: '#090d16fa',
    border: '1px solid #334155',
    borderRadius: 6,
    boxShadow: '0 8px 28px rgba(0,0,0,0.8)',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 700,
  },
  dossierContent: {
    padding: 14,
  },
  dossierHeader: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid #1e293b',
    paddingBottom: 10,
    marginBottom: 10,
  },
  dossierField: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 600,
    color: '#64748b',
    display: 'block',
    marginBottom: 2,
  },
  personalityText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 1.35,
  },
  actionBtn: {
    fontFamily: '"JetBrains Mono", monospace',
    width: '100%',
    padding: '8px',
    backgroundColor: '#1e293b',
    border: '1px solid #475569',
    borderRadius: 4,
    color: '#38bdf8',
    cursor: 'pointer',
    marginTop: 6,
    fontSize: 12,
    fontWeight: 600,
  },
  retroInput: {
    fontFamily: '"JetBrains Mono", monospace',
    width: '100%',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: 4,
    color: '#f8fafc',
    padding: '8px 10px',
    fontSize: 12,
    boxSizing: 'border-box',
    outline: 'none',
  },
  sendBtn: {
    fontFamily: '"JetBrains Mono", monospace',
    width: '100%',
    marginTop: 6,
    padding: '6px',
    backgroundColor: '#0284c7',
    border: 'none',
    borderRadius: 4,
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  },
  commandBar: {
    pointerEvents: 'auto',
    width: '100%',
    maxWidth: 780,
    margin: '0 auto',
  },
  commandForm: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#090d16fa',
    border: '1px solid #38bdf8',
    borderRadius: 6,
    padding: '6px 12px',
    boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)',
  },
  commandPrompt: {
    fontFamily: '"JetBrains Mono", monospace',
    color: '#38bdf8',
    fontSize: 16,
    fontWeight: 700,
    marginRight: 10,
  },
  commandInput: {
    fontFamily: '"JetBrains Mono", monospace',
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#f8fafc',
    fontSize: 14,
  },
  executeBtn: {
    fontFamily: '"Press Start 2P", monospace',
    backgroundColor: '#38bdf8',
    color: '#090d16',
    border: 'none',
    borderRadius: 4,
    padding: '8px 14px',
    fontSize: 9,
    fontWeight: 700,
    cursor: 'pointer',
    marginLeft: 8,
  }
};
