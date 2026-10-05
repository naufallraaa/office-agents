import React, { useState, useEffect, useRef } from 'react';
import { useOfficeStore } from '../store/useOfficeStore';
import { RetroKanban } from './RetroKanban';
import type { Agent } from 'shared';

interface SimsHUDProps {
  onFocusAgent: (agent: Agent) => void;
  onSwitchFloor: (floor: 1 | 2 | 3) => void;
}

export const SimsHUD: React.FC<SimsHUDProps> = ({ onFocusAgent, onSwitchFloor }) => {
  const {
    agents,
    selectedAgent,
    setSelectedAgent,
    logs,
    tasks,
    isConnected,
    activeFloor,
    setActiveFloor,
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
  const [isSendingToAgent, setIsSendingToAgent] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Camera auto-follows activeFloor (meeting/break/work triggers change it
  // in the store; the camera glides immediately while agents walk the stairs).
  const lastCamFloor = useRef<1 | 2 | 3>(activeFloor);
  const switchFloorRef = useRef(onSwitchFloor);
  switchFloorRef.current = onSwitchFloor;
  useEffect(() => {
    const unsub = useOfficeStore.subscribe((s) => {
      if (s.activeFloor !== lastCamFloor.current) {
        lastCamFloor.current = s.activeFloor;
        switchFloorRef.current(s.activeFloor);
      }
    });
    return unsub;
  }, []);

  const handleFloorChange = (floor: 1 | 2 | 3) => {
    setActiveFloor(floor); // camera glides via the subscription above
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputTask.trim()) return;

    const goal = inputTask.trim();
    setInputTask('');

    // Switch to Workspace floor on sprint start
    handleFloorChange(2);

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

  const getPlumbobEmoji = (state: string) => {
    switch (state) {
      case 'working': return '💚';
      case 'thinking': return '💙';
      case 'break': return '💛';
      default: return '💚';
    }
  };

  return (
    <div style={styles.hudContainer}>
      {/* ==================== TOP BAR ==================== */}
      <div style={styles.topBar}>
        <div style={styles.branding}>
          <span style={styles.logoIcon}>🏢</span>
          <div>
            <div style={styles.logoText}>KANTOR-AI</div>
            <div style={styles.subText}>THE SIMS ISOMETRIC SQUAD</div>
          </div>
        </div>

        <div style={styles.controlsGroup}>
          <button style={styles.glassBtn} onClick={triggerWorkMode}>
            💻 WORK (2F)
          </button>
          <button style={styles.glassBtn} onClick={triggerMeetingMode}>
            📋 SYNC (3F)
          </button>
          <button style={styles.glassBtn} onClick={triggerBreakMode}>
            ☕ CAFE (1F)
          </button>

          {/* Kanban Board Button */}
          <button 
            style={{
              ...styles.glassBtn,
              borderColor: isKanbanOpen ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)',
              color: isKanbanOpen ? '#38bdf8' : '#f8fafc',
              backgroundColor: isKanbanOpen ? 'rgba(56, 189, 248, 0.15)' : 'rgba(15, 23, 42, 0.75)',
            }} 
            onClick={() => setIsKanbanOpen(!isKanbanOpen)}
          >
            📋 KANBAN {tasks.length > 0 ? `(${tasks.length})` : ''}
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
            <span style={{ color: isConnected ? '#22c55e' : '#ef4444', fontSize: 13, fontWeight: 700 }}>
              {isConnected ? 'ONLINE' : 'CONNECTING...'}
            </span>
          </div>
        </div>
      </div>

      {/* ==================== LEFT SIDE: THE SIMS FLOOR SELECTOR ==================== */}
      <div style={styles.floorWidget}>
        <div style={styles.floorWidgetTitle}>BUILDING FLOORS</div>
        
        <button 
          style={{
            ...styles.floorBtn,
            backgroundColor: activeFloor === 3 ? 'rgba(168, 85, 247, 0.25)' : 'rgba(15, 23, 42, 0.75)',
            borderColor: activeFloor === 3 ? '#a855f7' : 'rgba(255, 255, 255, 0.12)',
            color: activeFloor === 3 ? '#c084fc' : '#cbd5e1',
          }}
          onClick={() => handleFloorChange(3)}
        >
          <span style={{ fontSize: 16 }}>🏢</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>3F ROOFTOP</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Boardroom & Sync</div>
          </div>
        </button>

        <button 
          style={{
            ...styles.floorBtn,
            backgroundColor: activeFloor === 2 ? 'rgba(56, 189, 248, 0.25)' : 'rgba(15, 23, 42, 0.75)',
            borderColor: activeFloor === 2 ? '#38bdf8' : 'rgba(255, 255, 255, 0.12)',
            color: activeFloor === 2 ? '#38bdf8' : '#cbd5e1',
          }}
          onClick={() => handleFloorChange(2)}
        >
          <span style={{ fontSize: 16 }}>💻</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>2F WORKSPACE</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>6 Tech Desks</div>
          </div>
        </button>

        <button 
          style={{
            ...styles.floorBtn,
            backgroundColor: activeFloor === 1 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(15, 23, 42, 0.75)',
            borderColor: activeFloor === 1 ? '#f59e0b' : 'rgba(255, 255, 255, 0.12)',
            color: activeFloor === 1 ? '#fbbf24' : '#cbd5e1',
          }}
          onClick={() => handleFloorChange(1)}
        >
          <span style={{ fontSize: 16 }}>☕</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>1F CAFE & LOUNGE</div>
            <div style={{ fontSize: 10, opacity: 0.8 }}>Espresso & Dining</div>
          </div>
        </button>
      </div>

      {/* ==================== BOTTOM RIGHT: LIVE ACTIVITY STREAM ==================== */}
      <div style={{
        ...styles.logPanel,
        maxHeight: isLogMinimized ? 'auto' : 240,
        width: isLogMinimized ? 220 : 420,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#38bdf8', fontSize: 13, fontWeight: 700 }}>LIVE ACTIVITY STREAM</span>
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
            <span style={{ color: '#38bdf8', fontSize: 14, fontWeight: 700 }}>
              SIM DOSSIER: {selectedAgent.name.toUpperCase()}
            </span>
            <button 
              onClick={() => setSelectedAgent(null)}
              style={styles.closeBtn}
            >
              ✕
            </button>
          </div>

          <div style={styles.dossierContent}>
            <div style={styles.dossierHeader}>
              <div style={{ position: 'relative' }}>
                <span style={{ fontSize: 38 }}>{selectedAgent.emoji}</span>
                <span style={{ position: 'absolute', top: -8, right: -6, fontSize: 14 }}>
                  {getPlumbobEmoji(selectedAgent.state)}
                </span>
              </div>
              <div style={{ marginLeft: 14 }}>
                <div style={{ fontSize: 18, color: selectedAgent.color, fontWeight: 800 }}>
                  {selectedAgent.name}
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                  {selectedAgent.roleTitle.toUpperCase()} • LANTAI {selectedAgent.floor || 2}F
                </div>
              </div>
            </div>

            <div style={styles.dossierField}>
              <span style={styles.fieldLabel}>STATUS:</span>
              <span style={{ color: '#38bdf8', textTransform: 'uppercase', fontSize: 13, fontWeight: 700 }}>
                {selectedAgent.state}
              </span>
            </div>

            <div style={styles.dossierField}>
              <span style={styles.fieldLabel}>PERSONALITY & ROLE:</span>
              <div style={styles.personalityText}>
                {selectedAgent.personality}
              </div>
            </div>

            {selectedAgent.currentTask && (
              <div style={styles.dossierField}>
                <span style={styles.fieldLabel}>SUBTASK AKTIF:</span>
                <div style={{ color: '#facc15', fontSize: 12, fontWeight: 600 }}>
                  {selectedAgent.currentTask}
                </div>
              </div>
            )}

            <button 
              style={styles.actionBtn}
              onClick={() => onFocusAgent(selectedAgent)}
            >
              🎯 FOKUS KE SIM {selectedAgent.name.toUpperCase()}
            </button>

            {/* Direct message to agent */}
            <form onSubmit={handleSendToAgent} style={{ marginTop: 12 }}>
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder={`Bicara langsung dengan ${selectedAgent.name}...`}
                style={styles.modernInput}
              />
              <button type="submit" style={styles.sendBtn} disabled={isSendingToAgent}>
                {isSendingToAgent ? 'MENUNGGU RESPONS...' : 'KIRIM PESAN'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================== BOTTOM SECTION: SPOTLIGHT INPUT & THE SIMS PORTRAIT BAR ==================== */}
      <div style={styles.bottomSection}>
        {/* Spotlight Command Bar */}
        <div style={styles.commandBar}>
          <form onSubmit={handleTaskSubmit} style={styles.commandForm}>
            <span style={styles.commandIcon}>⚡</span>
            <input
              type="text"
              value={inputTask}
              onChange={(e) => setInputTask(e.target.value)}
              placeholder="Berikan sprint goal baru ke squad (misal: 'Bikin payment gateway Midtrans & webhook')..."
              style={styles.commandInput}
            />
            <button type="submit" style={styles.executeBtn}>
              EXECUTE SPRINT 🚀
            </button>
          </form>
        </div>

        {/* The Sims 4 Household Portrait Bar */}
        <div style={styles.simsPortraitBar}>
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
                  ...styles.portraitCard,
                  borderColor: isSelected ? agent.color : 'rgba(255, 255, 255, 0.12)',
                  backgroundColor: isSelected ? `${agent.color}25` : 'rgba(15, 23, 42, 0.8)',
                  boxShadow: isSelected ? `0 0 16px ${agent.color}50` : 'none',
                }}
                title={`Pilih ${agent.name} (${agent.roleTitle})`}
              >
                {/* Rotating Plumbob Indicator */}
                <div style={styles.plumbobBadge}>
                  {getPlumbobEmoji(agent.state)}
                </div>

                <div style={styles.portraitAvatar}>
                  <span style={{ fontSize: 24 }}>{agent.emoji}</span>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#f8fafc' }}>
                    {agent.name}
                  </div>
                  <div style={{ fontSize: 10, color: agent.color, fontWeight: 600 }}>
                    {agent.roleTitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
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
    fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
  },
  topBar: {
    pointerEvents: 'auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: '10px 18px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
  },
  branding: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logoIcon: {
    fontSize: 26,
  },
  logoText: {
    fontSize: 16,
    color: '#38bdf8',
    letterSpacing: 0.5,
    fontWeight: 800,
  },
  subText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  controlsGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  glassBtn: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontSize: 12,
    fontWeight: 700,
    padding: '7px 14px',
    backgroundColor: 'rgba(30, 41, 59, 0.75)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 8,
    color: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  fullscreenBtn: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontSize: 12,
    fontWeight: 700,
    padding: '7px 14px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid #38bdf8',
    borderRadius: 8,
    color: '#38bdf8',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    marginLeft: 6,
    padding: '6px 12px',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  floorWidget: {
    pointerEvents: 'auto',
    position: 'absolute',
    top: 90,
    left: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6)',
    zIndex: 30,
  },
  floorWidgetTitle: {
    fontSize: 10,
    fontWeight: 800,
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 4,
  },
  floorBtn: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '8px 12px',
    border: '1px solid',
    borderRadius: 8,
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  bottomSection: {
    pointerEvents: 'auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 880,
    margin: '0 auto',
    zIndex: 40,
  },
  commandBar: {
    width: '100%',
  },
  commandForm: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'rgba(9, 13, 22, 0.92)',
    backdropFilter: 'blur(24px)',
    border: '1px solid #38bdf8',
    borderRadius: 12,
    padding: '8px 16px',
    boxShadow: '0 8px 32px rgba(56, 189, 248, 0.25)',
  },
  commandIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  commandInput: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    flex: 1,
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: 500,
  },
  executeBtn: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    backgroundColor: '#38bdf8',
    color: '#090d16',
    border: 'none',
    borderRadius: 8,
    padding: '8px 16px',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    marginLeft: 10,
  },
  simsPortraitBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(9, 13, 22, 0.85)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 16,
    padding: '10px 14px',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.7)',
  },
  portraitCard: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    padding: '8px 14px',
    border: '1px solid',
    borderRadius: 12,
    cursor: 'pointer',
    minWidth: 90,
    transition: 'all 0.15s ease',
  },
  plumbobBadge: {
    position: 'absolute',
    top: -10,
    fontSize: 14,
  },
  portraitAvatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  logPanel: {
    pointerEvents: 'auto',
    position: 'absolute',
    bottom: 120,
    right: 16,
    width: 420,
    maxHeight: 240,
    backgroundColor: 'rgba(9, 13, 22, 0.92)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.7)',
    zIndex: 40,
  },
  panelHeader: {
    backgroundColor: 'rgba(30, 41, 59, 0.85)',
    padding: '8px 14px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  },
  toggleBtn: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    fontSize: 11,
    fontWeight: 700,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    border: '1px solid #475569',
    borderRadius: 4,
    color: '#38bdf8',
    padding: '3px 8px',
    cursor: 'pointer',
  },
  logBody: {
    padding: 12,
    overflowY: 'auto',
    maxHeight: 180,
    display: 'flex',
    flexDirection: 'column-reverse',
    gap: 8,
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
    top: 90,
    right: 16,
    width: 320,
    backgroundColor: 'rgba(9, 13, 22, 0.95)',
    backdropFilter: 'blur(24px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8)',
    zIndex: 45,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 700,
  },
  dossierContent: {
    padding: 16,
  },
  dossierHeader: {
    display: 'flex',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  dossierField: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: '#64748b',
    display: 'block',
    marginBottom: 2,
  },
  personalityText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 1.4,
  },
  actionBtn: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    width: '100%',
    padding: '8px',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    border: '1px solid #38bdf8',
    borderRadius: 8,
    color: '#38bdf8',
    cursor: 'pointer',
    marginTop: 8,
    fontSize: 12,
    fontWeight: 700,
  },
  modernInput: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    width: '100%',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    color: '#f8fafc',
    padding: '8px 12px',
    fontSize: 12,
    boxSizing: 'border-box',
    outline: 'none',
  },
  sendBtn: {
    fontFamily: '"Plus Jakarta Sans", sans-serif',
    width: '100%',
    marginTop: 6,
    padding: '7px',
    backgroundColor: '#0284c7',
    border: 'none',
    borderRadius: 8,
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 700,
  }
};
