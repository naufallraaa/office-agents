// Agent states
export type AgentState = 'idle' | 'walking' | 'working' | 'thinking' | 'break' | 'meeting';

// Agent roles (6 squad roles)
export type AgentRole = 'pm' | 'it_lead' | 'frontend' | 'backend' | 'devops' | 'qa';

export interface AgentBubble {
  text: string;
  type: 'speech' | 'emote';
  expiresAt: number;
}

// Agent persona & position
export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  roleTitle: string;
  state: AgentState;
  floor: 1 | 2 | 3; // 1: Cafe/Lounge, 2: Workspace, 3: Rooftop Boardroom
  position: { x: number; y: number };
  workstation: { x: number; y: number };
  emoji: string;
  color: string;
  personality: string;
  currentTask?: string;
  bubble?: AgentBubble;
}

// Task status
export type TaskStatus = 'pending' | 'in_progress' | 'review' | 'done';

// Task
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  role?: AgentRole;
  assignedTo?: string; // agent id
  assignedName?: string;
  subtasks?: Task[];
  result?: string;
  createdAt: number;
  updatedAt: number;
}

// Events (SSE)
export type EventType = 
  | 'agent:state'
  | 'agent:move'
  | 'agent:thought'
  | 'agent:dialog'
  | 'task:created'
  | 'task:update'
  | 'task:complete'
  | 'activity:log';

export interface ServerEvent {
  type: EventType;
  timestamp: number;
  data: any;
}

export const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'agent_pm',
    name: 'Sarah',
    role: 'pm',
    roleTitle: 'Project Manager',
    state: 'idle',
    floor: 2,
    position: { x: 2, y: 3 },
    workstation: { x: 2, y: 3 },
    emoji: '📊',
    color: '#ec4899', // pink rose / magenta
    personality: 'Komunikatif, terstruktur, fokus pada user value, timeline, user story, dan acceptance criteria.',
  },
  {
    id: 'agent_lead',
    name: 'Budi',
    role: 'it_lead',
    roleTitle: 'IT Lead',
    state: 'idle',
    floor: 2,
    position: { x: 3, y: 3 },
    workstation: { x: 3, y: 3 },
    emoji: '👔',
    color: '#3b82f6', // blue
    personality: 'Analitis, teliti dalam code review, penjaga backlog dan acceptance criteria.',
  },
  {
    id: 'agent_frontend',
    name: 'Fani',
    role: 'frontend',
    roleTitle: 'Frontend Eng',
    state: 'idle',
    floor: 2,
    position: { x: 3, y: 7 },
    workstation: { x: 3, y: 7 },
    emoji: '🎨',
    color: '#10b981', // emerald green
    personality: 'Kreatif, perfeksionis soal UI/UX, styling responsive, dan micro-interaction.',
  },
  {
    id: 'agent_backend',
    name: 'Bagas',
    role: 'backend',
    roleTitle: 'Backend Eng',
    state: 'idle',
    floor: 2,
    position: { x: 7, y: 3 },
    workstation: { x: 7, y: 3 },
    emoji: '⚙️',
    color: '#8b5cf6', // purple
    personality: 'Pragmatis, fokus ke arsitektur data, endpoint Hono/API, dan query database.',
  },
  {
    id: 'agent_devops',
    name: 'Dimas',
    role: 'devops',
    roleTitle: 'DevOps Eng',
    state: 'idle',
    floor: 2,
    position: { x: 7, y: 7 },
    workstation: { x: 7, y: 7 },
    emoji: '🚀',
    color: '#ef4444', // red
    personality: 'Siaga, menjaga kestabilan infra, container Docker, automasi build & logging.',
  },
  {
    id: 'agent_qa',
    name: 'Qori',
    role: 'qa',
    roleTitle: 'QA Engineer',
    state: 'idle',
    floor: 2,
    position: { x: 5, y: 5 },
    workstation: { x: 5, y: 5 },
    emoji: '🔍',
    color: '#f59e0b', // amber yellow
    personality: 'Kritis, pemburu edge-case, ahli uji negatif, konkurensi, dan aksesibilitas.',
  },
];
