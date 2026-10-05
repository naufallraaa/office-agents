import { create } from 'zustand';
import { DEFAULT_AGENTS, type Agent, type Task, type ServerEvent } from 'shared';

export interface OfficeLog {
  id: string;
  timestamp: string;
  sender: string;
  color: string;
  message: string;
}

interface OfficeState {
  agents: Agent[];
  selectedAgent: Agent | null;
  tasks: Task[];
  logs: OfficeLog[];
  isConnected: boolean;
  
  // Actions
  setSelectedAgent: (agent: Agent | null) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  setAgents: (agents: Agent[]) => void;
  addLog: (sender: string, color: string, message: string) => void;
  setConnected: (connected: boolean) => void;
  triggerMeetingMode: () => void;
  triggerBreakMode: () => void;
  triggerWorkMode: () => void;
  connectSSE: () => () => void;
}

export const useOfficeStore = create<OfficeState>((set, get) => ({
  agents: DEFAULT_AGENTS,
  selectedAgent: null,
  tasks: [],
  logs: [
    {
      id: 'init_1',
      timestamp: new Date().toLocaleTimeString(),
      sender: 'SYSTEM',
      color: '#38bdf8',
      message: 'KANTOR-AI virtual office initialized. 5 agents on standby.',
    },
    {
      id: 'init_2',
      timestamp: new Date().toLocaleTimeString(),
      sender: 'Budi (IT Lead)',
      color: '#3b82f6',
      message: 'Semua role ready. Menunggu sprint backlog berikutnya...',
    }
  ],
  isConnected: false,

  setSelectedAgent: (agent) => set({ selectedAgent: agent }),

  setAgents: (agents) => set({ agents }),

  updateAgent: (id, updates) => set((state) => ({
    agents: state.agents.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    selectedAgent: state.selectedAgent?.id === id ? { ...state.selectedAgent, ...updates } : state.selectedAgent,
  })),

  addLog: (sender, color, message) => set((state) => ({
    logs: [
      {
        id: `log_${Date.now()}_${Math.random()}`,
        timestamp: new Date().toLocaleTimeString(),
        sender,
        color,
        message,
      },
      ...state.logs.slice(0, 49), // Keep latest 50 logs
    ],
  })),

  setConnected: (isConnected) => set({ isConnected }),

  triggerMeetingMode: () => {
    const { agents, addLog } = get();
    const updated = agents.map((a) => ({
      ...a,
      state: 'meeting' as const,
      bubble: {
        text: 'Menuju ruang rapat 📋',
        type: 'speech' as const,
        expiresAt: Date.now() + 6000,
      }
    }));
    set({ agents: updated });
    addLog('SYSTEM', '#eab308', '🔔 SPRINT SYNC: Semua agen berkumpul di ruang rapat.');
  },

  triggerBreakMode: () => {
    const { agents, addLog } = get();
    const updated = agents.map((a) => ({
      ...a,
      state: 'break' as const,
      bubble: {
        text: 'Waktunya kopi ☕',
        type: 'speech' as const,
        expiresAt: Date.now() + 6000,
      }
    }));
    set({ agents: updated });
    addLog('SYSTEM', '#10b981', '☕ BREAK TIME: Tim menuju pantry & coffee bar.');
  },

  triggerWorkMode: () => {
    const { agents, addLog } = get();
    const updated = agents.map((a) => ({
      ...a,
      state: 'working' as const,
      bubble: {
        text: 'Kembali ke cubicle 💻',
        type: 'speech' as const,
        expiresAt: Date.now() + 5000,
      }
    }));
    set({ agents: updated });
    addLog('SYSTEM', '#3b82f6', '💻 WORK MODE: Agen kembali ke cubicle masing-masing.');
  },

  connectSSE: () => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const setupStream = () => {
      try {
        eventSource = new EventSource('/events');

        eventSource.onopen = () => {
          set({ isConnected: true });
        };

        eventSource.onmessage = (event) => {
          try {
            const parsed: ServerEvent = JSON.parse(event.data);
            
            if (parsed.type === 'agent:state' && parsed.data) {
              if (parsed.data.agents) {
                set({ agents: parsed.data.agents });
              } else if (parsed.data.agentId) {
                get().updateAgent(parsed.data.agentId, {
                  state: parsed.data.state,
                  bubble: parsed.data.bubble,
                });
              }
            } else if (parsed.type === 'task:created' && parsed.data) {
              set((state) => {
                const exists = state.tasks.some((t) => t.id === parsed.data.id);
                if (!exists) {
                  return { tasks: [...state.tasks, parsed.data] };
                }
                return state;
              });
            } else if (parsed.type === 'task:update' && parsed.data) {
              set((state) => ({
                tasks: state.tasks.map((t) => (t.id === parsed.data.id ? { ...t, ...parsed.data } : t)),
              }));
            } else if (parsed.type === 'task:complete' && parsed.data) {
              set((state) => ({
                tasks: state.tasks.map((t) => (t.id === parsed.data.id ? { ...t, status: 'done', ...parsed.data } : t)),
              }));
            } else if (parsed.type === 'activity:log' && parsed.data) {
              get().addLog(parsed.data.sender || 'AGENT', parsed.data.color || '#94a3b8', parsed.data.message);
            }
          } catch (e) {
            // Ping or non-json message
          }
        };

        eventSource.onerror = () => {
          set({ isConnected: false });
          eventSource?.close();
          // Auto reconnect after 3 seconds
          reconnectTimeout = setTimeout(setupStream, 3000);
        };
      } catch (err) {
        set({ isConnected: false });
      }
    };

    setupStream();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  },
}));
