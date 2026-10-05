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
          bubble: event.data.bubble !== undefined ? event.data.bubble : currentAgents[idx].bubble,
        };
      }
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
    orchestrator.runSprint(goal, broadcast).catch((err: any) => {
      console.error('Squad sprint execution failed:', err);
      broadcast({
        type: 'activity:log',
        timestamp: Date.now(),
        data: {
          sender: 'SYSTEM',
          color: '#ef4444',
          message: `Sprint execution failed: ${err.message}`,
        },
      });
    });

    return c.json({ ok: true, message: 'Sprint started' });
  } catch (error: any) {
    return c.json({ ok: false, error: error.message }, 400);
  }
});

// Agent direct chat endpoint
app.post('/api/agents/:id/chat', async (c) => {
  try {
    const agentId = c.req.param('id');
    const body = await c.req.json();
    const userMessage = body.message || '';

    const agent = currentAgents.find((a) => a.id === agentId);
    if (!agent) {
      return c.json({ ok: false, error: 'Agent not found' }, 404);
    }

    const persona = SQUAD_PERSONAS[agent.role];

    // Broadcast user question immediately
    broadcast({
      type: 'activity:log',
      timestamp: Date.now(),
      data: {
        sender: 'USER (OPAY)',
        color: '#f43f5e',
        message: `@${agent.name}: "${userMessage}"`,
      },
    });

    // Make agent think in office
    broadcast({
      type: 'agent:state',
      timestamp: Date.now(),
      data: {
        agentId: agent.id,
        state: 'thinking',
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
        {
          role: 'user',
          content: `Pertanyaan dari user (Opay): "${userMessage}". Balas dengan gaya personamu yang khas, singkat, padat, dan ramah dalam 1-2 kalimat bahasa Indonesia.`,
        },
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    const reply = response.choices[0]?.message?.content || 'Siap laksanakan!';

    // Agent speaks in office
    broadcast({
      type: 'agent:state',
      timestamp: Date.now(),
      data: {
        agentId: agent.id,
        state: 'working',
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
        sender: `${agent.name} (${agent.roleTitle})`,
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
