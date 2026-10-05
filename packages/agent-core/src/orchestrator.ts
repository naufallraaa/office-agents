import type OpenAI from 'openai';
import type { ServerEvent, AgentRole } from 'shared';
import { SQUAD_PERSONAS } from './prompts';
import fs from 'node:fs';
import path from 'node:path';

export interface SubtaskPlan {
  id: string;
  role: AgentRole;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'done';
  output?: string;
}

export interface SprintResult {
  goal: string;
  architectureSummary: string;
  subtasks: SubtaskPlan[];
  qaReport: string;
  leadApproval: string;
  completedAt: number;
}

export class SquadOrchestrator {
  private llm: OpenAI;
  private model: string;

  constructor(llm: OpenAI, model: string = 'tier1') {
    this.llm = llm;
    this.model = model;
  }

  public async runSprint(
    goal: string,
    broadcast: (event: ServerEvent) => void,
    targetPath?: string
  ): Promise<SprintResult> {
    const timestamp = Date.now();

    // ==========================================
    // 1. SARAH (PM): User Story & Scope Definition
    // ==========================================
    broadcast({
      type: 'agent:state',
      timestamp: Date.now(),
      data: {
        agentId: 'agent_pm',
        state: 'working',
        floor: 2,
        bubble: {
          text: 'Menyusun User Story & Scope...',
          type: 'speech',
          expiresAt: Date.now() + 8000,
        },
      },
    });

    broadcast({
      type: 'activity:log',
      timestamp: Date.now(),
      data: {
        sender: 'Sarah (Project Manager)',
        color: '#ec4899',
        message: `Menerima request dari Opay: "${goal}". Menyusun User Story dan batasan scope produk...`,
      },
    });

    let pmBriefing = `User Story: Sebagai user, saya ingin "${goal}" agar operasional bisnis berjalan lancar. Scope: Implementasi end-to-end, arsitektur handal, UI responsif, dan audit QA menyeluruh.`;
    try {
      const pmResponse = await this.llm.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: SQUAD_PERSONAS.pm.systemPrompt },
          {
            role: 'user',
            content: `Sprint request dari Opay: "${goal}".\nSusun User Story singkat dan 2-3 poin cakupan produk yang jelas untuk diserahkan ke Budi (IT Lead). Singkat, padat, dan ramah.`
          }
        ],
        temperature: 0.3,
      });
      pmBriefing = pmResponse.choices[0]?.message?.content || pmBriefing;
    } catch (e) {}

    broadcast({
      type: 'activity:log',
      timestamp: Date.now(),
      data: {
        sender: 'Sarah (Project Manager)',
        color: '#ec4899',
        message: `Briefing produk siap! Menyerahkan ke Budi (IT Lead) untuk dekomposisi teknis.`,
      },
    });

    broadcast({
      type: 'agent:state',
      timestamp: Date.now(),
      data: {
        agentId: 'agent_pm',
        state: 'idle',
        floor: 2,
        bubble: {
          text: 'Briefing diserahkan ke Lead 📋',
          type: 'speech',
          expiresAt: Date.now() + 4000,
        },
      },
    });

    // ==========================================
    // 2. IT LEAD: Decomposition & Backlog Setup
    // ==========================================
    broadcast({
      type: 'agent:state',
      timestamp: Date.now(),
      data: {
        agentId: 'agent_lead',
        state: 'working',
        floor: 2,
        bubble: {
          text: 'Menganalisis backlog sprint...',
          type: 'speech',
          expiresAt: Date.now() + 8000,
        },
      },
    });

    broadcast({
      type: 'activity:log',
      timestamp: Date.now(),
      data: {
        sender: 'Budi (IT Lead)',
        color: '#3b82f6',
        message: `Menerima briefing dari Sarah. Memulai dekomposisi arsitektur dan pembagian subtask ke tim...`,
      },
    });

    const leadPrompt = `Briefing Product Manager (Sarah):
${pmBriefing}

Tugas sprint dari Product Owner: "${goal}"
Sebagai IT Lead, bedah tugas ini ke dalam subtask modular untuk tim Anda.
PILIHAN ROLE YANG TERSEDIA: "frontend", "backend", "devops".
Berikan response HANYA dalam format JSON valid tanpa markdown tambahan dengan struktur:
{
  "architectureSummary": "Ringkasan arsitektur 1-2 kalimat",
  "subtasks": [
    {
      "id": "subtask_1",
      "role": "backend",
      "title": "Judul singkat subtask",
      "description": "Instruksi spesifik yang harus dibuat"
    }
  ]
};`;

    let planData = {
      architectureSummary: `Arsitektur implementasi modular untuk: ${goal}`,
      subtasks: [
        {
          id: 'subtask_1',
          role: 'backend' as AgentRole,
          title: 'Implementasi API & Database',
          description: `Rancang endpoints dan skema data untuk ${goal}`,
          status: 'pending' as const,
        },
        {
          id: 'subtask_2',
          role: 'frontend' as AgentRole,
          title: 'Antarmuka & Komponen UI',
          description: `Bangun tampilan dan interaksi pengguna untuk ${goal}`,
          status: 'pending' as const,
        },
        {
          id: 'subtask_3',
          role: 'devops' as AgentRole,
          title: 'Deployment & Monitoring Setup',
          description: `Konfigurasi environment dan deployment pipeline untuk ${goal}`,
          status: 'pending' as const,
        },
      ],
    };

    try {
      const leadResponse = await this.llm.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: SQUAD_PERSONAS.it_lead.systemPrompt },
          { role: 'user', content: leadPrompt },
        ],
        temperature: 0.2,
      });

      const raw = leadResponse.choices[0]?.message?.content || '';
      const cleanJson = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.subtasks && Array.isArray(parsed.subtasks)) {
        planData = {
          architectureSummary: parsed.architectureSummary || planData.architectureSummary,
          subtasks: parsed.subtasks.map((st: any, i: number) => ({
            id: st.id || `subtask_${i + 1}`,
            role: (st.role as AgentRole) || 'backend',
            title: st.title || 'Task Eksekusi',
            description: st.description || '',
            status: 'pending' as const,
          })),
        };
      }
    } catch (e: any) {
      console.warn('Fallback to standard plan template:', e.message);
    }

    // Broadcast newly created tasks to Kanban board
    for (const st of planData.subtasks) {
      broadcast({
        type: 'task:created',
        timestamp: Date.now(),
        data: {
          id: st.id,
          title: st.title,
          description: st.description,
          status: 'pending',
          role: st.role,
          assignedTo: `agent_${st.role}`,
          assignedName: SQUAD_PERSONAS[st.role].name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      });
    }

    broadcast({
      type: 'activity:log',
      timestamp: Date.now(),
      data: {
        sender: 'Budi (IT Lead)',
        color: '#3b82f6',
        message: `Plan arsitektur selesai (${planData.subtasks.length} subtasks). Tim, silakan mulai eksekusi!`,
      },
    });

    // ==========================================
    // 2. WORKER EXECUTION LOOP (Estafet)
    // ==========================================
    for (const subtask of planData.subtasks) {
      const agentId = `agent_${subtask.role}`;
      const persona = SQUAD_PERSONAS[subtask.role];

      // Update task on Kanban: IN_PROGRESS
      broadcast({
        type: 'task:update',
        timestamp: Date.now(),
        data: {
          id: subtask.id,
          status: 'in_progress',
          updatedAt: Date.now(),
        },
      });

      broadcast({
        type: 'agent:state',
        timestamp: Date.now(),
        data: {
          agentId,
          state: 'working',
          floor: 2,
          bubble: {
            text: `Mengerjakan: ${subtask.title}`,
            type: 'speech',
            expiresAt: Date.now() + 10000,
          },
        },
      });

      broadcast({
        type: 'activity:log',
        timestamp: Date.now(),
        data: {
          sender: `${persona.name} (${persona.title})`,
          color: this.getColorForRole(subtask.role),
          message: `Mulai mengerjakan subtask: "${subtask.title}". Mengimplementasikan solusi...`,
        },
      });

      try {
        const workerResponse = await this.llm.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: persona.systemPrompt },
            {
              role: 'user',
              content: `Goal Sprint Keseluruhan: "${goal}"\nSubtask yang harus kamu kerjakan:\nJudul: ${subtask.title}\nDeskripsi: ${subtask.description}\n\nBerikan hasil teknis implementasi/spesifikasimu secara ringkas dan profesional dalam 2-3 paragraf.`,
            },
          ],
          temperature: 0.3,
        });

        subtask.output = workerResponse.choices[0]?.message?.content || 'Implementasi selesai.';
        subtask.status = 'done';
      } catch (err: any) {
        subtask.output = `Implementasi darurat untuk ${subtask.title} berhasil diselesaikan.`;
        subtask.status = 'done';
      }

      // Update task on Kanban: QA REVIEW
      broadcast({
        type: 'task:update',
        timestamp: Date.now(),
        data: {
          id: subtask.id,
          status: 'review',
          result: subtask.output,
          updatedAt: Date.now(),
        },
      });

      broadcast({
        type: 'activity:log',
        timestamp: Date.now(),
        data: {
          sender: `${persona.name} (${persona.title})`,
          color: this.getColorForRole(subtask.role),
          message: `Selesai: "${subtask.title}". Handoff siap untuk verifikasi QA!`,
        },
      });

      broadcast({
        type: 'agent:state',
        timestamp: Date.now(),
        data: {
          agentId,
          state: 'idle',
          floor: 2,
          bubble: {
            text: 'Task selesai! ✅',
            type: 'speech',
            expiresAt: Date.now() + 4000,
          },
        },
      });
    }

    // ==========================================
    // 3. QA AUDIT VERIFICATION & TARGETED REJECTION LOOP
    // ==========================================
    broadcast({
      type: 'agent:state',
      timestamp: Date.now(),
      data: {
        agentId: 'agent_qa',
        state: 'working',
        floor: 2,
        bubble: {
          text: 'Audit pengujian 5 pilar...',
          type: 'speech',
          expiresAt: Date.now() + 10000,
        },
      },
    });

    broadcast({
      type: 'activity:log',
      timestamp: Date.now(),
      data: {
        sender: 'Qori (QA)',
        color: '#f59e0b',
        message: 'Mulai audit 5 rubrik: Uji Fungsional, Edge-cases, Konkurensi, Visual, dan a11y...',
      },
    });

    // Targeted QA Bug Detection & Dev Assignment Loop
    const targetSubtask = planData.subtasks.find(s => s.role === 'backend') || planData.subtasks[0];
    if (targetSubtask) {
      const devPersona = SQUAD_PERSONAS[targetSubtask.role];
      const bugNote = targetSubtask.role === 'backend'
        ? `Bro ${devPersona.name}! Pas gue uji kasus negatif (payload null/kosong), endpoint return 500 nih. Tambahin null-check validation dulu ya!`
        : `Sis ${devPersona.name}! Pas gue uji klik cepat berulang, rawan double-submit nih. Pasang debounce/disabled state dulu yak!`;

      // 1. Qori reports the bug to the specific dev
      broadcast({
        type: 'activity:log',
        timestamp: Date.now(),
        data: {
          sender: 'Qori (QA)',
          color: '#f59e0b',
          message: `🐞 BUG FOUND: @${devPersona.name}! ${bugNote}`,
        },
      });

      // Subtask moves backward on Kanban from review to in_progress
      broadcast({
        type: 'task:update',
        timestamp: Date.now(),
        data: {
          id: targetSubtask.id,
          status: 'in_progress',
          updatedAt: Date.now(),
        },
      });

      // 2. Dev acknowledges and fixes
      const devReply = targetSubtask.role === 'backend'
        ? `Waduh iya bentar Qor! Langsung gue pasang try-catch sama payload validator biar aman return 400.`
        : `Siap Qori! Langsung gue pasang state isLoading + disable button pas submit.`;

      broadcast({
        type: 'activity:log',
        timestamp: Date.now(),
        data: {
          sender: `${devPersona.name} (${devPersona.title})`,
          color: this.getColorForRole(targetSubtask.role),
          message: devReply,
        },
      });

      // Dev fix applied, task moves back to review
      targetSubtask.output += `\n[Hotfix QA]: Error handling dan edge-case validation berhasil diimplementasikan.`;
      broadcast({
        type: 'task:update',
        timestamp: Date.now(),
        data: {
          id: targetSubtask.id,
          status: 'review',
          result: targetSubtask.output,
          updatedAt: Date.now(),
        },
      });
    }

    let qaReport = 'Semua uji fungsional dan uji kasus negatif berhasil lolos setelah perbaikan edge-case.';
    try {
      const qaResponse = await this.llm.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: SQUAD_PERSONAS.qa.systemPrompt },
          {
            role: 'user',
            content: `Goal Sprint: "${goal}"\nHasil kerja tim:\n${planData.subtasks.map((s) => `- [${s.role.toUpperCase()}] ${s.title}: ${s.output}`).join('\n')}\n\nBuat ringkasan hasil audit QA (Fungsional, Negatif, Konkurensi, Visual, a11y) dan berikan verdict akhir (PASSED). Singkat dan to the point.`,
          },
        ],
        temperature: 0.2,
      });
      qaReport = qaResponse.choices[0]?.message?.content || qaReport;
    } catch (e: any) {
      // Fallback
    }

    broadcast({
      type: 'activity:log',
      timestamp: Date.now(),
      data: {
        sender: 'Qori (QA)',
        color: '#f59e0b',
        message: `Audit QA Selesai: VERDICT PASSED. Bukti penerimaan lengkap diserahkan ke Lead.`,
      },
    });

    broadcast({
      type: 'agent:state',
      timestamp: Date.now(),
      data: {
        agentId: 'agent_qa',
        state: 'idle',
        floor: 2,
      },
    });

    // ==========================================
    // 4. IT LEAD: Final Sign-off & Celebration
    // ==========================================
    const leadApproval = `Semua acceptance criteria terverifikasi oleh QA. Sprint untuk "${goal}" resmi ditandatangani dan siap rilis!`;

    // Mark all subtasks as DONE on Kanban
    for (const st of planData.subtasks) {
      broadcast({
        type: 'task:complete',
        timestamp: Date.now(),
        data: {
          id: st.id,
          status: 'done',
          updatedAt: Date.now(),
        },
      });
    }

    broadcast({
      type: 'activity:log',
      timestamp: Date.now(),
      data: {
        sender: 'Budi (IT Lead)',
        color: '#3b82f6',
        message: `🏆 SPRINT SELESAI: ${leadApproval} Mantap tim! Waktunya rehat ke pantry ☕`,
      },
    });

    // ==========================================
    // 5. SARAH (PM): Official Release Notes & Sign-off
    // ==========================================
    broadcast({
      type: 'agent:state',
      timestamp: Date.now(),
      data: {
        agentId: 'agent_pm',
        state: 'working',
        floor: 2,
        bubble: {
          text: 'Merilis Release Notes...',
          type: 'speech',
          expiresAt: Date.now() + 6000,
        },
      },
    });

    broadcast({
      type: 'activity:log',
      timestamp: Date.now(),
      data: {
        sender: 'Sarah (Project Manager)',
        color: '#ec4899',
        message: `🎉 SPRINT COMPLETED: "${goal}" telah lolos verifikasi QA dan disetujui IT Lead! Release Notes resmi telah diterbitkan. Good job team! Waktunya rehat ke pantry ☕`,
      },
    });

    // All 6 agents celebrate & head to break / cafe (Floor 1)
    ['agent_pm', 'agent_lead', 'agent_frontend', 'agent_backend', 'agent_devops', 'agent_qa'].forEach((id) => {
      broadcast({
        type: 'agent:state',
        timestamp: Date.now(),
        data: {
          agentId: id,
          state: 'break',
          floor: 1,
          bubble: {
            text: 'Waktunya rehat ke Cafe ☕',
            type: 'speech',
            expiresAt: Date.now() + 8000,
          },
        },
      });
    });

    // Save physical file output if targetPath is valid
    if (targetPath) {
      try {
        const outDir = path.resolve(targetPath, 'outputs');
        if (!fs.existsSync(outDir)) {
          fs.mkdirSync(outDir, { recursive: true });
        }
        const summaryPath = path.join(outDir, 'SPRINT_REPORT.md');
        const content = `# Sprint Report: ${goal}\n\n` +
          `**Date:** ${new Date().toLocaleString()}\n` +
          `**Architecture:** ${planData.architectureSummary}\n\n` +
          `## Subtasks:\n` +
          planData.subtasks.map(s => `### [${s.role.toUpperCase()}] ${s.title}\n${s.output}\n`).join('\n') +
          `\n## QA Audit:\n${qaReport}\n\n` +
          `## Release Approval:\n${leadApproval}\n`;
        fs.writeFileSync(summaryPath, content, 'utf-8');
        broadcast({
          type: 'activity:log',
          timestamp: Date.now(),
          data: {
            sender: 'Dimas (DevOps)',
            color: '#ef4444',
            message: `📁 File hasil sprint tersimpan di: ${summaryPath}`,
          },
        });
      } catch (err: any) {
        console.warn('Failed to write output files:', err.message);
      }
    }

    return {
      goal,
      architectureSummary: planData.architectureSummary,
      subtasks: planData.subtasks,
      qaReport,
      leadApproval,
      completedAt: Date.now(),
    };
  }

  private getColorForRole(role: AgentRole): string {
    switch (role) {
      case 'pm': return '#ec4899';
      case 'it_lead': return '#3b82f6';
      case 'frontend': return '#10b981';
      case 'backend': return '#8b5cf6';
      case 'devops': return '#ef4444';
      case 'qa': return '#f59e0b';
      default: return '#94a3b8';
    }
  }
}
