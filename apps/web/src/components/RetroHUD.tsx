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
  const [isSendingToAgent, setIsSendingToAgent] = useState(false);

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
      {/* ==================== TOP NAVIGATION SECTION ==================== */}
      <div style={styles.topSection}>
        {/* Main Floating Glass Navbar */}
        <div style={styles.topBar}>
          <div style={styles.branding}>
            <span style={styles.logoIcon}>🏢</span>
            <span style={styles.logoText}>KANTOR-AI</span>
            <span style={styles.subText}>AUTONOMOUS SQUAD</span>
          </div>

          <div style={styles.controlsGroup}>
            <button style={styles.navBtn} onClick={triggerWorkMode}>
              💻 WORK
            </button>
            <button style={styles.navBtn} onClick={triggerMeetingMode}>
              📋 SPRINT SYNC
            </button>
            <button style={styles.navBtn} onClick={triggerBreakMode}>
              ☕ PANTRY
            </button>

            {/* Kanban Board Toggle Button */}
            <button 
              style={{
                ...styles.navBtn,
                borderColor: isKanbanOpen ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)',
                color: isKanbanOpen ? '#38bdf8' : '#f8fafc',
                backgroundColor: isKanbanOpen ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.8)',
              }} 
              onClick={() => setIsKanbanOpen(!isKanbanOpen)}
            >
              📋 KANBAN {tasks.length > 0 ? `(${tasks.length})` : ''}
            </button>

            {/* Day / Night Ambient Toggle */}
            <button 
              style={{
                ...styles.navBtn,
                borderColor: isNightMode ? '#818cf8' : 'rgba(255, 255, 255, 0.15)',
                color: isNightMode ? '#c7d2fe' : '#f8fafc',
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
              {isFullscreen ? '🗗 EXIT' : '⛶ FULLSCREEN'}
            </button>

            {/* Online Indicator */}
            <div style={styles.statusIndicator}>
              <span style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isConnected ? '#22c55e' : '#ef4444',
                marginRight: 6,
                boxShadow: isConnected ? '0 0 10px #22c55e' : '0 0 10px #ef4444'
              }} />
              <span style={{ color: isConnected ? '#22c55e' : '#ef4444', fontSize: 16 }}>
                {isConnected ? 'LIVE' : 'CONNECTING...'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick-Jump Squad Navigation Ribbon */}
        <div style={styles.squadRibbon}>
          <span style={styles.ribbonTitle}>SQUAD FOCUS:</span>
          <div style={styles.pillsList}>
            {agents.map((agent) => {
              const isSelected = selectedAgent?.id === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => {
                    onFocusAgent(agent);
                    setSelectedAgent(agent);
                  }}
                  style={{
                    ...styles.agentPill,
                    borderColor: isSelected ? agent.color : 'rgba(255, 255, 255, 0.12)',
                    backgroundColor: isSelected ? `${agent.color}30` : 'rgba(15, 23, 42, 0.75)',
                    color: isSelected ? '#ffffff' : '#e2e8f0',
                    boxShadow: isSelected ? `0 0 14px ${agent.color}50` : 'none',
                  }}
                  title={`Fokus kamera ke meja ${agent.name}`}
                >
                  <span style={{ fontSize: 18 }}>{agent.emoji}</span>
                  <span style={{ fontWeight: 'bold' }}>{agent.name}</span>
                  <span style={{ color: agent.color, fontSize: 16 }}>[{agent.roleTitle}]</span>
                  <span style={{ opacity: 0.9 }}>
                    {agent.state === 'working' ? '💻' : agent.state === 'meeting' ? '📋' : agent.state === 'break' ? '☕' : '💤'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================== BOTTOM RIGHT: LIVE ACTIVITY STREAM ==================== */}
      <div style={{
        ...styles.logPanel,
        maxHeight: isLogMinimized ? 'auto' : 240,
        width: isLogMinimized ? 260 : 440,
      }}>
        <div 
          style={{
            ...styles.panelHeader,
            cursor: 'pointer',
            borderRadius: isLogMinimized ? 8 : '8px 8px 0 0',
          }}
          onClick={() => setIsLogMinimized(!isLogMinimized)}
          title="Klik untuk minimize/expand"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: '#38bdf8', fontSize: 18 }}>[LIVE_FEED]</span>
            <span style={{ fontSize: 15, color: '#94a3b8' }}>
              {isLogMinimized ? '(MINIMIZED)' : 'STREAM AKTIF'}
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

      {/* ==================== RIGHT SIDE: AGENT INSPECTOR DOSSIER ==================== */}
      {selectedAgent && (
        <div style={styles.agentDossier}>
          <div style={styles.panelHeader}>
            <span style={{ color: '#38bdf8', fontSize: 19 }}>DOSSIER: {selectedAgent.name.toUpperCase()}</span>
            <button 
              onClick={() => setSelectedAgent(null)}
              style={styles.closeBtn}
            >
              ✕
            </button>
          </div>

          <div style={styles.dossierContent}>
            <div style={styles.dossierHeader}>
              <span style={{ fontSize: 36 }}>{selectedAgent.emoji}</span>
              <div style={{ marginLeft: 12 }}>
                <div style={{ fontSize: 22, color: selectedAgent.color, fontWeight: 'bold' }}>
                  {selectedAgent.name}
                </div>
                <div style={{ fontSize: 16, color: '#94a3b8' }}>
                  {selectedAgent.roleTitle.toUpperCase()}
                </div>
              </div>
            </div>

            <div style={styles.dossierField}>
              <span style={styles.fieldLabel}>STATUS SAAT INI:</span>
              <span style={{ color: '#38bdf8', textTransform: 'uppercase', fontSize: 18, fontWeight: 'bold' }}>
                {selectedAgent.state}
              </span>
            </div>

            <div style={styles.dossierField}>
              <span style={styles.fieldLabel}>STYLE & PERSONALITY:</span>
              <div style={styles.personalityText}>
                {selectedAgent.personality}
              </div>
            </div>

            {selectedAgent.currentTask && (
              <div style={styles.dossierField}>
                <span style={styles.fieldLabel}>SUBTASK AKTIF:</span>
                <div style={{ color: '#facc15', fontSize: 16 }}>
                  {selectedAgent.currentTask}
                </div>
              </div>
            )}

            <button 
              style={styles.actionBtn}
              onClick={() => onFocusAgent(selectedAgent)}
            >
              🎯 FOKUS KE MEJA {selectedAgent.name.toUpperCase()}
            </button>

            {/* Direct message to agent */}
            <form onSubmit={handleSendToAgent} style={{ marginTop: 14 }}>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={`Tanya sesuatu ke ${selectedAgent.name}...`}
                style={styles.retroInput}
              />
              <button type="submit" style={styles.sendBtn} disabled={isSendingToAgent}>
                {isSendingToAgent ? 'MENUNGGU JAWABAN...' : 'KIRIM PESAN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== BOTTOM CENTER: SPOTLIGHT COMMAND INPUT ==================== */}
      <div style={styles.commandBar}>
        <form onSubmit={handleTaskSubmit} style={styles.commandForm}>
          <span style={styles.commandPrompt}>{'>'}</span>
          <input
            type="text"
            value={inputTask}
            onChange={(e) => setInputTask(e.target.value)}
            placeholder="Tulis sprint goal baru untuk tim (misal: 'Bikin auth JWT & dashboard kanban')..."
            style={styles.commandInput}
          />
          <button type="submit" style={styles.executeBtn}>
            EXECUTE SPRINT 🚀
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
    fontFamily: '"VT323", monospace',
  },
  topSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    width: '100%',
  },
  topBar: {
    pointerEvents: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: '8px 16px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
  },
  branding: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    fontSize: 24,
  },
  logoText: {
    fontSize: 22,
    color: '#38bdf8',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  subText: {
    fontSize: 16,
    color: '#64748b',
    marginLeft: 6,
  },
  controlsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  navBtn: {
    fontFamily: '"VT323", monospace',
    fontSize: 18,
    padding: '4px 12px',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 6,
    color: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  fullscreenBtn: {
    fontFamily: '"VT323", monospace',
    fontSize: 18,
    padding: '4px 12px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid #38bdf8',
    borderRadius: 6,
    color: '#38bdf8',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 6,
    padding: '4px 10px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
  },
  squadRibbon: {
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(9, 13, 22, 0.75)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 8,
    padding: '6px 14px',
    overflowX: 'auto',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
  },
  ribbonTitle: {
    fontSize: 16,
    color: '#94a3b8',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
    marginRight: 4,
  },
  pillsList: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    overflowX: 'auto',
  },
  agentPill: {
    fontFamily: '"VT323", monospace',
    fontSize: 17,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 12px',
    border: '1px solid',
    borderRadius: 20,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.15s ease',
  },
  logPanel: {
    pointerEvents: 'auto',
    position: 'absolute',
    bottom: 75,
    right: 16,
    width: 440,
    maxHeight: 240,
    backgroundColor: 'rgba(9, 13, 22, 0.92)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
    zIndex: 40,
  },
  panelHeader: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    padding: '6px 12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    letterSpacing: 0.5,
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  toggleBtn: {
    fontFamily: '"VT323", monospace',
    fontSize: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid #475569',
    borderRadius: 4,
    color: '#38bdf8',
    padding: '2px 8px',
    cursor: 'pointer',
  },
  logBody: {
    padding: 10,
    overflowY: 'auto',
    maxHeight: 190,
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: 6,
  },
  logItem: {
    fontSize: 17,
    lineHeight: 1.35,
  },
  logTime: {
    color: '#64748b',
    marginRight: 6,
    fontSize: 15,
  },
  logSender: {
    fontWeight: 'bold',
    marginRight: 6,
  },
  logMsg: {
    color: '#e2e8f0',
  },
  agentDossier: {
    pointerEvents: 'auto',
    position: 'absolute',
    top: 110,
    right: 16,
    width: 320,
    backgroundColor: 'rgba(9, 13, 22, 0.95)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8)',
    zIndex: 45,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 18,
    fontWeight: 'bold',
  },
  dossierContent: {
    padding: 14,
  },
  dossierHeader: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: 10,
    marginBottom: 10,
  },
  dossierField: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 15,
    color: '#94a3b8',
    display: 'block',
    marginBottom: 2,
  },
  personalityText: {
    fontSize: 17,
    color: '#cbd5e1',
    lineHeight: 1.3,
  },
  actionBtn: {
    fontFamily: '"VT323", monospace',
    width: '100%',
    padding: '6px',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid #38bdf8',
    borderRadius: 6,
    color: '#38bdf8',
    cursor: 'pointer',
    marginTop: 6,
    fontSize: 18,
  },
  retroInput: {
    fontFamily: '"VT323", monospace',
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    color: '#f8fafc',
    padding: '6px 10px',
    fontSize: 18,
    boxSizing: 'border-box',
    outline: 'none',
  },
  sendBtn: {
    fontFamily: '"VT323", monospace',
    width: '100%',
    marginTop: 6,
    padding: '6px',
    backgroundColor: '#0284c7',
    border: 'none',
    borderRadius: 6,
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 18,
    fontWeight: 'bold',
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
    backgroundColor: 'rgba(9, 13, 22, 0.9)',
    backdropFilter: 'blur(20px)',
    border: '1px solid #38bdf8',
    borderRadius: 8,
    padding: '6px 14px',
    boxShadow: '0 0 24px rgba(56, 189, 248, 0.25)',
  },
  commandPrompt: {
    fontFamily: '"VT323", monospace',
    color: '#38bdf8',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10,
  },
  commandInput: {
    fontFamily: '"VT323", monospace',
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#f8fafc',
    fontSize: 20,
  },
  executeBtn: {
    fontFamily: '"VT323", monospace',
    backgroundColor: '#38bdf8',
    color: '#090d16',
    border: 'none',
    borderRadius: 6,
    padding: '6px 14px',
    fontSize: 18,
    fontWeight: 'bold',
    cursor: 'pointer',
    marginLeft: 8,
  }
};
