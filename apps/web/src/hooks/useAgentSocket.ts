/**
 * useAgentSocket — React hook for Agent Office connecting to Hono SSE /events.
 *
 * Receives real-time agent events, translates them for the Claude-Office engine,
 * and passes them into the onEvent handler.
 */

import { useEffect, useRef, useState } from 'react'
import type { OfficeEvent } from '../types'
import { useOfficeStore } from '../store/useOfficeStore'

export interface AgentSocketOptions {
  onEvent?: (event: OfficeEvent) => void
  url?: string
  disabled?: boolean
}

export interface AgentSocketResult {
  connected: boolean
  mcpServers: string[]
  events: OfficeEvent[]
  offline: boolean
}

function getRoleFromSender(sender: string): string {
  const s = sender.toLowerCase()
  if (s.includes('sarah') || s.includes('pm')) return 'pm'
  if (s.includes('budi') || s.includes('lead')) return 'it_lead'
  if (s.includes('fani') || s.includes('frontend')) return 'frontend'
  if (s.includes('bagas') || s.includes('backend')) return 'backend'
  if (s.includes('dimas') || s.includes('devops')) return 'devops'
  if (s.includes('qori') || s.includes('qa')) return 'qa'
  if (s.includes('claude') || s.includes('anto') || s.includes('assistant')) return 'assistant'
  if (s.includes('opay') || s.includes('boss')) return 'boss'
  return 'default'
}

export function useAgentSocket(options: AgentSocketOptions = {}): AgentSocketResult {
  const { onEvent, disabled = false } = options

  const [connected, setConnected] = useState(false)
  const [mcpServers] = useState<string[]>(['git', 'database', 'llm-tier1'])
  const [events, setEvents] = useState<OfficeEvent[]>([])
  const [offline, setOffline] = useState(false)

  const onEventRef = useRef(onEvent)
  useEffect(() => { onEventRef.current = onEvent }, [onEvent])

  useEffect(() => {
    if (disabled) return

    let es: EventSource | null = null
    let reconnectTimeout: any = null

    const connect = () => {
      try {
        es = new EventSource('/events')

        es.onopen = () => {
          setConnected(true)
          setOffline(false)
        }

        es.onmessage = (e) => {
          try {
            const raw = JSON.parse(e.data)
            
            // 1. Activity Log -> Slack Chat message
            if (raw.type === 'activity:log' && raw.data) {
              const role = getRoleFromSender(raw.data.sender || '')
              const officeEvt: OfficeEvent = {
                type: 'chat_message',
                sender: raw.data.sender || 'Agent',
                text: raw.data.message || '',
                status: raw.data.message || '',
              }
              ;(officeEvt as any).role = role
              ;(officeEvt as any).timestamp = Date.now()

              setEvents(prev => [...prev.slice(-49), officeEvt])
              onEventRef.current?.(officeEvt)
            }

            // 2. Typing indicator
            if (raw.type === 'chat_typing' && raw.data) {
              const typingEvt = {
                type: 'chat_typing',
                sender: raw.data.sender || 'Agent',
              }
              onEventRef.current?.(typingEvt as any)
            }

            // 3. Agent state change & speech bubble
            if (raw.type === 'agent:state' && raw.data) {
              if (raw.data.agentId) {
                if (raw.data.state === 'talking-to-manager') {
                  // Chat reply — speech bubble above the character, no Slack spam
                  const bubbleEvt: OfficeEvent = {
                    type: 'chat_bubble',
                    agentId: raw.data.agentId,
                    status: raw.data.bubble?.text || '...',
                  }
                  onEventRef.current?.(bubbleEvt)
                } else {
                  const statusEvt: OfficeEvent = {
                    type: 'agent_working',
                    agentId: raw.data.agentId,
                    status: raw.data.bubble?.text || (raw.data.state === 'working' ? 'coding...' : 'standby'),
                  }
                  onEventRef.current?.(statusEvt)
                }
              }
            }

            // 3. Task events (Kanban integration)
            if (raw.type === 'task:created' && raw.data) {
              useOfficeStore.setState((s) => {
                const exists = s.tasks.some(t => t.id === raw.data.id);
                return exists ? s : { tasks: [...s.tasks, raw.data] };
              });
            } else if (raw.type === 'task:update' && raw.data) {
              useOfficeStore.setState((s) => ({
                tasks: s.tasks.map(t => t.id === raw.data.id ? { ...t, ...raw.data } : t)
              }));
            } else if (raw.type === 'task:complete' && raw.data) {
              useOfficeStore.setState((s) => ({
                tasks: s.tasks.map(t => t.id === raw.data.id ? { ...t, status: 'done', ...raw.data } : t)
              }));
              const compEvt: OfficeEvent = {
                type: 'agent_completed',
                agentId: raw.data.assignedTo || 'agent_lead',
                result: 'Sprint task verified & completed! ✅',
              }
              onEventRef.current?.(compEvt)
            }
          } catch (err) {
            // ping or non-json
          }
        }

        es.onerror = () => {
          setConnected(false)
          setOffline(true)
          es?.close()
          reconnectTimeout = setTimeout(connect, 3000)
        }
      } catch (err) {
        setConnected(false)
        setOffline(true)
      }
    }

    connect()

    return () => {
      if (es) es.close()
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
    }
  }, [disabled])

  return { connected, mcpServers, events, offline }
}
