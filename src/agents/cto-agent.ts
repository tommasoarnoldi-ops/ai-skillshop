// ============================================================
// CTO Agent — Technical architecture and engineering leadership
// ============================================================

import { BaseAgent } from '../core/base-agent.js';
import type { AgentConfig, AgentMessage, Task } from '../types/index.js';
import type { MessageBus } from '../core/message-bus.js';
import type { TaskBoard } from '../core/task-board.js';

const CTO_CONFIG: AgentConfig = {
  id: 'cto',
  name: 'CTO Agent',
  role: 'Chief Technology Officer',
  expertise: [
    'System architecture',
    'React Native / Expo',
    'Supabase / PostgreSQL',
    'AI/ML integration (Claude API, Vision, RAG)',
    'Offline-first mobile architecture',
    'Performance optimization',
    'Security and data privacy',
    'Technical debt management',
  ],
  responsibilities: [
    'Define technical architecture and standards',
    'Make technology stack decisions',
    'Review technical designs and code architecture',
    'Ensure scalability, security, and performance',
    'Guide Developer agent on implementation',
    'Define API contracts and data models',
    'Evaluate build-vs-buy decisions',
  ],
  canDelegateTo: ['developer', 'qa-devops'],
  reportsTo: 'ceo',
  systemPrompt: `Sei il CTO di ForgeAI. Guidi tutte le decisioni tecniche per la piattaforma.

STACK TECNOLOGICO:
- Mobile: React Native + Expo Router (SDK 52+), Zustand, SQLite (offline)
- Backend: Supabase (PostgreSQL + Auth + Storage + Edge Functions + pgvector)
- AI: Anthropic Claude API (claude-sonnet-4-20250514) per vision + language
- Speech: expo-speech (TTS) + Whisper API (STT)

ARCHITETTURA:
- Mobile-first, smartphone-only per operatori
- Offline-first: le procedure devono funzionare senza internet
- Multi-tenant: isolamento dati per azienda via RLS
- AI Vision: riconoscimento macchinari + verifica step via Claude Vision
- RAG: knowledge base aziendale con pgvector per risposte contestuali

PRINCIPI TECNICI:
1. Keep it simple — MVP first, no over-engineering
2. Offline-first non è opzionale — in fabbrica non c'è WiFi
3. Security by default — RLS, API key management, data isolation
4. Performance — l'app deve essere reattiva, l'operatore è in piedi
5. Type safety — TypeScript strict mode ovunque

COME RISPONDI:
- Decisioni tecniche chiare con trade-off espliciti
- Quando proponi architettura, includi diagrammi ASCII o strutture chiare
- Code snippets concreti quando appropriato
- Considera sempre: scalabilità, sicurezza, developer experience, costo
- Segnala tech debt e proponi plan di gestione`,
};

export class CTOAgent extends BaseAgent {
  constructor(bus: MessageBus, board: TaskBoard, apiKey: string) {
    super(CTO_CONFIG, bus, board, apiKey);
  }

  /** Design technical architecture for a feature */
  async designArchitecture(feature: string): Promise<string> {
    return this.think(`
Progetta l'architettura tecnica per la seguente feature di ForgeAI:

FEATURE: ${feature}

Produci:
1. OVERVIEW: Descrizione ad alto livello dell'architettura
2. COMPONENTI: Componenti coinvolti (frontend, backend, AI, storage)
3. DATA MODEL: Schema dati necessario (tabelle, relazioni, indici)
4. API: Endpoint o Edge Functions necessarie
5. AI INTEGRATION: Come si integra con Claude API (prompts, flusso)
6. OFFLINE: Come funziona offline (cache, sync, conflict resolution)
7. SICUREZZA: Considerazioni di sicurezza e privacy
8. IMPLEMENTAZIONE: Steps di implementazione ordinati per il Developer Agent
`);
  }

  /** Review a technical design or implementation */
  async reviewTechnical(description: string): Promise<string> {
    return this.think(`
Fai una review tecnica di:

${description}

Valuta:
1. Correttezza architetturale
2. Scalabilità
3. Sicurezza
4. Performance
5. Manutenibilità
6. Aderenza allo stack ForgeAI
7. Gestione offline
8. Potenziali problemi

Fornisci feedback specifico con suggerimenti di miglioramento.
`);
  }

  /** Define API contract */
  async defineAPIContract(endpoint: string): Promise<string> {
    return this.think(`
Definisci il contratto API per:

ENDPOINT: ${endpoint}

Includi:
1. HTTP method e path
2. Request body (TypeScript interface)
3. Response body (TypeScript interface)
4. Error responses
5. Autenticazione richiesta
6. Rate limiting
7. Esempio di chiamata
8. Edge Function implementation skeleton (Supabase/Deno)
`);
  }

  // ---- Task execution ----

  protected async executeTask(task: Task): Promise<string> {
    const prompt = `
Esegui questo task tecnico come CTO:
Titolo: ${task.title}
Descrizione: ${task.description}
Deliverables attesi: ${task.deliverables.join(', ')}
Criteri di accettazione: ${task.acceptanceCriteria.join(', ')}

Produci il deliverable tecnico richiesto con il livello di dettaglio necessario per il Developer Agent.
`;

    const result = await this.think(prompt);

    // If this generates sub-tasks for Developer, create them
    if (task.deliverables.some(d => d.includes('implementation'))) {
      this.sendMessage(
        'developer',
        'task_assignment',
        `Implementation needed: ${task.title}`,
        result,
      );
    }

    return result;
  }

  protected async onTaskAssigned(message: AgentMessage): Promise<void> {
    try {
      const taskData = JSON.parse(message.content);
      const task = this.board.getTask(taskData.taskId);
      if (task) {
        this.queueTask(task);
        await this.executeNextTask();
      }
    } catch {
      // Handle non-JSON task assignments
      const task = this.board.createTask({
        title: message.subject,
        description: message.content,
        priority: 'high',
        assignedTo: 'cto',
        createdBy: message.from,
      });
      this.queueTask(task);
      await this.executeNextTask();
    }
  }

  protected async onQuestionReceived(message: AgentMessage): Promise<void> {
    const answer = await this.think(`
L'agente ${message.from} ha una domanda tecnica:
"${message.content}"

Rispondi con competenza tecnica, fornendo soluzioni concrete e code snippets quando utile.
`);
    this.sendMessage(message.from, 'answer', `Re: ${message.subject}`, answer, message.id);
  }

  protected async onDecisionRequested(message: AgentMessage): Promise<void> {
    const decision = await this.think(`
Decisione tecnica richiesta da ${message.from}:
"${message.subject}"
Dettagli: ${message.content}

Analizza trade-off e prendi una decisione tecnica motivata.
`);
    this.recordDecision(message.subject, decision, `Requested by ${message.from}`);
    this.sendMessage(message.from, 'decision', `Tech Decision: ${message.subject}`, decision, message.id);
  }

  protected async onFeedbackReceived(message: AgentMessage): Promise<void> {
    this.addLearning(`Tech feedback from ${message.from}: ${message.content.substring(0, 200)}`);
  }

  protected async onBroadcast(message: AgentMessage): Promise<void> {
    // CTO monitors broadcasts for technical implications
    if (message.content.toLowerCase().includes('architecture') ||
        message.content.toLowerCase().includes('technical') ||
        message.content.toLowerCase().includes('bug') ||
        message.content.toLowerCase().includes('performance')) {
      this.setContext(`tech_alert_${message.from}`, message.content.substring(0, 200));
    }
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'report') {
      this.setContext(`report_${message.from}`, message.content.substring(0, 200));
    }
  }
}
