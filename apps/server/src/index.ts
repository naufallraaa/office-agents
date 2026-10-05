import './env'; // Load environment first - MUST be first import
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { llm, model, healthCheck } from './llm';
import { DEFAULT_AGENTS, type Agent, type ServerEvent } from 'shared';
import { SquadOrchestrator, SQUAD_PERSONAS } from 'agent-core';

const app = new Hono();

app.use('/*', cors());

// In-memory state
let currentAgents: Agent[] = JSON.parse(JSON.stringify(DEFAULT_AGENTS));

// SSE Subscriber pool
const sseClients = new Set<(event: ServerEvent) => void>();

function broadcast(event: ServerEvent) {
  // Update in-memory agent state if relevant
  if (event.type === 'agent:state' && event.data) {
    if (event.data.agents) {
      currentAgents = event.data.agents;
    } else if (event.data.agentId) {
      const idx = currentAgents.findIndex((a) => a.id === event.data.agentId);
      if (idx !== -1) {
        currentAgents[idx] = {
          ...currentAgents[idx],
          state: event.data.state || currentAgents[idx].state,
          floor: event.data.floor !== undefined ? event.data.floor : currentAgents[idx].floor,
          bubble: event.data.bubble !== undefined ? event.data.bubble : currentAgents[idx].bubble,
        };
      }
    }
  }

  // Catat tiap pesan chat (activity log) ke riwayat
  if (event.type === 'activity:log' && event.data?.message) {
    const senderName = event.data.sender || 'Agent';
    if (!senderName.startsWith('USER (')) {
      pushHistory({
        sender: senderName,
        color: event.data.color || '#95a5a6',
        text: event.data.message,
        mine: false,
      });
    }
  }

  // Push to all active SSE connections
  for (const client of sseClients) {
    try {
      client(event);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

const orchestrator = new SquadOrchestrator(llm, model);

// ===== Riwayat chat in-memory (konteks LLM + restore saat refresh) =====
interface ChatEntry {
  sender: string;
  color: string;
  text: string;
  ts: number;
  mine: boolean; // true = pesan dari Opay (user)
}
const chatHistory: ChatEntry[] = [];
const HISTORY_CAP = 200;

function pushHistory(entry: Omit<ChatEntry, 'ts'>) {
  chatHistory.push({ ...entry, ts: Date.now() });
  if (chatHistory.length > HISTORY_CAP) chatHistory.shift();
}

/** 8 pesan terakhir → format OpenAI messages buat konteks multi-turn */
function historyContext(): { role: 'user' | 'assistant'; content: string }[] {
  return chatHistory.slice(-8).map((h) => ({
    role: h.mine ? 'user' : 'assistant',
    content: `${h.sender}: ${h.text}`.slice(0, 300),
  }));
}

// ===== Tracker sprint buat perintah /status =====
interface SprintTask {
  id: string;
  title: string;
  role?: string;
  status: string;
}
interface SprintState {
  goal: string;
  startedAt: number;
  finishedAt: number | null;
  tasks: SprintTask[];
}
let sprintState: SprintState | null = null;

/** Broadcast yang nyegat event task buat ngisi tracker /status */
function trackedBroadcast(event: ServerEvent): void {
  if (sprintState && event.data) {
    if (event.type === 'task:created') {
      sprintState.tasks.push({
        id: event.data.id,
        title: event.data.title,
        role: event.data.role,
        status: event.data.status || 'pending',
      });
    } else if (event.type === 'task:update' || event.type === 'task:complete') {
      const t = sprintState.tasks.find((x) => x.id === event.data.id);
      if (t) {
        if (event.data.status) t.status = event.data.status;
        if (event.type === 'task:complete') t.status = 'done';
        if (event.data.title) t.title = event.data.title;
      }
    }
  }
  broadcast(event);
}

function formatSprintStatus(): string {
  if (!sprintState) {
    return 'Belum ada sprint yang jalan, Boss. Mau mulai? Ketik: /sprint <goal sprint>';
  }
  const s = sprintState;
  const total = s.tasks.length;
  const done = s.tasks.filter((t) => t.status === 'done').length;
  const review = s.tasks.filter((t) => t.status === 'review').length;
  const running = s.tasks.filter((t) => t.status === 'in_progress').length;
  const pending = total - done - review - running;
  const dur = Math.max(1, Math.round(((s.finishedAt ?? Date.now()) - s.startedAt) / 60000));
  const kondisi = s.finishedAt
    ? `SELESAI ✅ (durasi ~${dur} menit)`
    : 'MASIH JALAN 🔄';
  const detail = total === 0
    ? 'Task belum ada — lagi tahap briefing/breakdown.'
    : `Total task: ${total} | Selesai: ${done} | Review/QA: ${review} | Dikerjakan: ${running} | Antre: ${pending}`;
  return `Status sprint "${s.goal}" — ${kondisi}. ${detail}`;
}

function startSprint(goal: string, targetPath?: string) {
  sprintState = { goal, startedAt: Date.now(), finishedAt: null, tasks: [] };
  broadcast({
    type: 'chat_typing' as any,
    timestamp: Date.now(),
    data: { sender: 'Sarah (PM)' },
  });
  orchestrator
    .runSprint(goal, trackedBroadcast, targetPath)
    .then(() => {
      if (sprintState) sprintState.finishedAt = Date.now();
    })
    .catch((err: any) => {
      broadcast({
        type: 'activity:log',
        timestamp: Date.now(),
        data: { sender: 'SYSTEM', color: '#ef4444', message: `Sprint error: ${err.message}` },
      });
    });
}

app.get('/', (c) => c.text('kantor-ai server'));

app.get('/health', async (c) => {
  const llmOk = await healthCheck();
  return c.json({ ok: llmOk, timestamp: Date.now() });
});

app.get('/api/agents', (c) => {
  return c.json(currentAgents);
});

// Sprint execution endpoint
app.post('/api/sprint', async (c) => {
  try {
    const body = await c.req.json();
    const goal = body.goal || 'Fitur baru';
    const targetPath = body.targetPath;

    // Broadcast user intent immediately
    broadcast({
      type: 'activity:log',
      timestamp: Date.now(),
      data: {
        sender: 'USER (OPAY)',
        color: '#f43f5e',
        message: `📢 SPRINT GOAL MASUK: "${goal}"`,
      },
    });

    // Run squad orchestrator asynchronously so HTTP response is instant
    startSprint(goal, targetPath);

    return c.json({ ok: true, message: 'Sprint started' });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 400);
  }
});

// Riwayat chat buat restore setelah refresh
app.get('/api/chat/history', (c) => {
  return c.json(chatHistory.slice(-100));
});

// Slack Chat endpoint
app.post('/api/chat', async (c) => {
  try {
    const body = await c.req.json();
    const text = (body.text || '').trim();
    const sender = body.sender || 'Opay';
    const targetPath = body.targetPath;

    if (!text) return c.json({ ok: true });

    // ===== Perintah slash =====
    if (text === '/status') {
      const reply = formatSprintStatus();
      broadcast({
        type: 'activity:log',
        timestamp: Date.now(),
        data: { sender: 'Anto', color: '#cc785c', message: reply },
      });
      return c.json({ ok: true, reply });
    }

    if (text === '/help') {
      const lines = [
        'Perintah yang bisa dipake, Boss:',
        '• /sprint <goal> — jalanin sprint penuh (Sarah → Budi → tim → QA)',
        '• /status — progress sprint terakhir',
        '• /agents — daftar squad + state mereka',
        '• /help — tampilkan bantuan ini',
        '• /the-office — ganti tema kantor',
        'Ngobrol biasa juga bisa: sebut nama agen (mis. "Sarah, ...") biar dia yang jawab. Tanpa nama → gue (Anto) yang bales.',
      ];
      // Satu pesan per baris — Slack chat gak render newline
      for (const line of lines) {
        broadcast({
          type: 'activity:log',
          timestamp: Date.now(),
          data: { sender: 'Anto', color: '#cc785c', message: line },
        });
      }
      return c.json({ ok: true, reply: lines.join('\n') });
    }

    // Catat pesan Opay ke riwayat (buat konteks multi-turn)
    pushHistory({ sender, color: '#38bdf8', text, mine: true });

    // Check if message is a command or task
    const isSprintRequest = text.startsWith('/sprint') || text.startsWith('/task') ||
      /^(bikin|buat|tolong|tambah|update|refactor|create|build|implement)/i.test(text);

    if (isSprintRequest) {
      const goal = text.replace(/^\/(sprint|task)\s*/i, '').trim() || text;
      startSprint(goal, targetPath);
      return c.json({ ok: true });
    }

    // ===== Deteksi SEMUA nama/peran yang disebut (multi-mention, urut di teks) =====
    interface Target {
      display: string;
      color: string;
      id: string | null; // null = Anto (tanpa bubble kantor)
      prompt: string;
    }
    const ANTO_PROMPT =
      'Kamu adalah Anto, asisten AI analitis, cerdas, santai, dan taktis di KANTOR-AI. User adalah Opay (Boss). Jawab dengan santai, singkat, padat dalam 1-2 kalimat bahasa Indonesia.';
    const squadDefs: { words: string[]; target: Target }[] = [
      { words: ['sarah', 'pm'], target: { display: 'Sarah (PM)', color: '#ec4899', id: 'agent-pm', prompt: SQUAD_PERSONAS.pm.systemPrompt } },
      { words: ['budi', 'lead'], target: { display: 'Budi (Lead)', color: '#3b82f6', id: 'agent-lead', prompt: SQUAD_PERSONAS.it_lead.systemPrompt } },
      { words: ['fani', 'frontend'], target: { display: 'Fani (Frontend)', color: '#10b981', id: 'agent-frontend', prompt: SQUAD_PERSONAS.frontend.systemPrompt } },
      { words: ['bagas', 'backend'], target: { display: 'Bagas (Backend)', color: '#8b5cf6', id: 'agent-backend', prompt: SQUAD_PERSONAS.backend.systemPrompt } },
      { words: ['dimas', 'devops'], target: { display: 'Dimas (DevOps)', color: '#ef4444', id: 'agent-devops', prompt: SQUAD_PERSONAS.devops.systemPrompt } },
      { words: ['qori', 'qa'], target: { display: 'Qori (QA)', color: '#f59e0b', id: 'agent-qa', prompt: SQUAD_PERSONAS.qa.systemPrompt } },
    ];

    function indexOfMention(lower: string, word: string): number {
      let idx = lower.indexOf(word);
      while (idx !== -1) {
        const before = idx === 0 ? '' : lower[idx - 1];
        if (!/[a-z]/.test(before)) return idx;
        idx = lower.indexOf(word, idx + 1);
      }
      return -1;
    }

    const lower = text.toLowerCase();
    const found: { idx: number; target: Target }[] = [];
    for (const def of squadDefs) {
      let best = -1;
      for (const w of def.words) {
        const i = indexOfMention(lower, w);
        if (i !== -1 && (best === -1 || i < best)) best = i;
      }
      if (best !== -1) found.push({ idx: best, target: def.target });
    }
    found.sort((a, b) => a.idx - b.idx);

    // Balasan berurutan, maks 3 agen per pesan
    const targets = found.slice(0, 3).map((f) => f.target);
    if (targets.length === 0) {
      // Tanpa mention → Anto yang jawab (tanpa bubble kantor)
      targets.push({ display: 'Anto', color: '#cc785c', id: null, prompt: ANTO_PROMPT });
    }

    (async () => {
      for (const t of targets) {
        broadcast({
          type: 'chat_typing' as any,
          timestamp: Date.now(),
          data: { sender: t.display },
        });
        try {
          const res = await llm.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: t.prompt },
              ...historyContext(),
              {
                role: 'user',
                content: `Pesan/pertanyaan dari Opay (Boss): "${text}". Jawab dengan gayamu yang khas, santai, akrab dalam 1-2 kalimat bahasa Indonesia.`,
              },
            ],
            max_tokens: 150,
            temperature: 0.6,
          });
          const reply = res.choices[0]?.message?.content || 'Siap boss!';

          broadcast({
            type: 'activity:log',
            timestamp: Date.now(),
            data: { sender: t.display, color: t.color, message: reply },
          });

          // Speech bubble di atas kepala karakter (kalau yang jawab squad, bukan Anto)
          if (t.id) {
            broadcast({
              type: 'agent:state',
              timestamp: Date.now(),
              data: {
                agentId: t.id,
                state: 'talking-to-manager',
                bubble: {
                  text: reply.slice(0, 90),
                  type: 'speech',
                  expiresAt: Date.now() + 8000,
                },
              },
            });
          }
        } catch (e: any) {
          console.error('LLM chat error:', e);
        }
      }
    })();

    return c.json({ ok: true });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

// Agent direct chat endpoint
app.post('/api/agents/:id/chat', async (c) => {
  try {
    const agentId = c.req.param('id'); // id dari web, mis. "agent-pm"
    const body = await c.req.json();
    const userMessage = body.message || '';

    // Normalisasi id: web pakai "agent-pm", server pakai "agent_pm"
    const normId = agentId.replace(/-/g, '_');
    const agent = currentAgents.find((a) => a.id === agentId || a.id === normId);
    if (!agent) {
      return c.json({ ok: false, error: 'Agent not found' }, 404);
    }

    const persona = SQUAD_PERSONAS[agent.role];
    const display = `${agent.name} (${agent.roleTitle})`;

    // Broadcast user question (buat mode sim); client lokal menambahkan sendiri
    // dan memfilter sender "USER (OPAY)" biar gak dobel
    broadcast({
      type: 'activity:log',
      timestamp: Date.now(),
      data: {
        sender: 'USER (OPAY)',
        color: '#f43f5e',
        message: `@${agent.name}: "${userMessage}"`,
      },
    });
    // Catat ke riwayat sebagai pesan user
    pushHistory({ sender: 'Opay', color: '#38bdf8', text: `@${agent.name}: ${userMessage}`, mine: true });

    // Indikator mengetik + karakter mikir di kantor
    broadcast({
      type: 'chat_typing' as any,
      timestamp: Date.now(),
      data: { sender: display },
    });
    broadcast({
      type: 'agent:state',
      timestamp: Date.now(),
      data: {
        agentId, // pakai id web biar frontend cocok
        state: 'talking-to-manager',
        bubble: {
          text: 'Sedang berpikir...',
          type: 'speech',
          expiresAt: Date.now() + 6000,
        },
      },
    });

    const response = await llm.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: persona.systemPrompt },
        ...historyContext(),
        {
          role: 'user',
          content: `Pertanyaan dari user (Opay): "${userMessage}". Balas dengan gaya personamu yang khas, singkat, padat, dan ramah dalam 1-2 kalimat bahasa Indonesia.`,
        },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    const reply = response.choices[0]?.message?.content || 'Siap laksanakan!';

    // Karakter ngomong di kantor (bubble, bukan status kerja)
    broadcast({
      type: 'agent:state',
      timestamp: Date.now(),
      data: {
        agentId,
        state: 'talking-to-manager',
        bubble: {
          text: reply.slice(0, 90),
          type: 'speech',
          expiresAt: Date.now() + 10000,
        },
      },
    });

    broadcast({
      type: 'activity:log',
      timestamp: Date.now(),
      data: {
        sender: display,
        color: agent.color,
        message: reply,
      },
    });

    return c.json({ ok: true, reply });
  } catch (err: any) {
    return c.json({ ok: false, error: err.message }, 500);
  }
});

// SSE endpoint
app.get('/events', (c) => {
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (event: ServerEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      // Add to subscriber pool
      sseClients.add(send);

      // Welcome event with current agents state
      send({ 
        type: 'agent:state', 
        timestamp: Date.now(), 
        data: { agents: currentAgents } 
      });

      // Keepalive every 15s
      const interval = setInterval(() => {
        controller.enqueue(encoder.encode(`: ping\n\n`));
      }, 15000);

      // Cleanup on disconnect
      c.req.raw.signal.addEventListener('abort', () => {
        clearInterval(interval);
        sseClients.delete(send);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
});

const port = Number(process.env.PORT) || 3001;

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`🚀 Server running on http://localhost:${port}`);
