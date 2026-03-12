// ============================================================
// CEO Agent — Strategic leadership and coordination
// ============================================================

import { BaseAgent } from '../core/base-agent.js';
import type { AgentConfig, AgentMessage, Task } from '../types/index.js';
import type { MessageBus } from '../core/message-bus.js';
import type { TaskBoard } from '../core/task-board.js';

const CEO_CONFIG: AgentConfig = {
  id: 'ceo',
  name: 'CEO Agent',
  role: 'Chief Executive Officer',
  expertise: [
    'Strategic planning',
    'Business model design',
    'Fundraising strategy',
    'Market positioning',
    'Team coordination',
    'Decision making under uncertainty',
    'Italian manufacturing SME market',
  ],
  responsibilities: [
    'Define company vision and strategic direction',
    'Coordinate all agents and resolve conflicts',
    'Make high-level decisions on priorities',
    'Define sprints and milestones',
    'Evaluate progress against business goals',
    'Manage resource allocation between agents',
  ],
  canDelegateTo: ['cto', 'product-manager', 'marketing', 'qa-devops', 'developer'],
  reportsTo: null,
  systemPrompt: `Sei il CEO di ForgeAI, una startup AI che sviluppa una piattaforma smartphone-first per guidare i lavoratori industriali nelle PMI manifatturiere italiane.

IL TUO RUOLO:
- Definisci la strategia aziendale e le priorità
- Coordini tutti i team (CTO, Product, Dev, Marketing, QA)
- Prendi decisioni strategiche su prodotto, mercato, risorse
- Pianifichi sprint e milestone
- Risolvi conflitti tra team e riallinei le priorità

CONTESTO FORGEAI:
- Problema: operatori senior vanno in pensione → know-how critico va perso
- Soluzione: app AI che guida operatori con vision + voce + knowledge base
- Target: PMI manifatturiere italiane, 50-500 dipendenti, partendo dall'Emilia-Romagna
- Modello: SaaS B2B (Starter €499/mese, Pro €1.499/mese, setup fee €5-15K)
- Mercato: Connected Worker Market — $8.6B, CAGR 18.5%
- North Star Metric: procedure completate con successo / settimana
- Stack: React Native + Expo, Supabase, Claude API

COME RISPONDI:
- Sii strategico e orientato all'azione
- Ogni decisione deve essere motivata con impatto su business/utente
- Quando deleghi, sii specifico su obiettivi e criteri di accettazione
- Pensa sempre a: "questo ci avvicina al product-market fit?"
- Rispondi in italiano quando il contesto è italiano, in inglese per aspetti tecnici
- Formatta le risposte in modo strutturato con sezioni chiare`,
};

export class CEOAgent extends BaseAgent {
  constructor(bus: MessageBus, board: TaskBoard, apiKey: string) {
    super(CEO_CONFIG, bus, board, apiKey);
  }

  /** The CEO creates a strategic plan, breaking it into tasks for other agents */
  async createStrategicPlan(objective: string): Promise<string> {
    const boardSummary = this.board.getSummary();

    const plan = await this.think(`
Come CEO di ForgeAI, crea un piano strategico per il seguente obiettivo:

OBIETTIVO: ${objective}

STATO ATTUALE DEL TASK BOARD:
${boardSummary}

Produci un piano con:
1. ANALISI: Valutazione dell'obiettivo nel contesto ForgeAI
2. PRIORITÀ: Cosa fare prima, dopo, e perché
3. TASK: Lista di task concreti da assegnare ai vari agenti (CTO, Product Manager, Developer, Marketing, QA/DevOps)
4. DIPENDENZE: Quali task dipendono da altri
5. MILESTONE: Criteri di successo misurabili
6. RISCHI: Potenziali problemi e mitigazioni

Per ogni task specifica:
- Titolo chiaro
- Agente assegnatario (cto | product-manager | developer | marketing | qa-devops)
- Priorità (critical | high | medium | low)
- Deliverable atteso
- Criteri di accettazione

Formatta come JSON array alla fine:
[{"title": "...", "assignTo": "...", "priority": "...", "description": "...", "deliverables": ["..."], "acceptanceCriteria": ["..."]}]
`);

    this.recordDecision(
      'Strategic Plan',
      `Created plan for: ${objective}`,
      plan.substring(0, 200),
    );

    return plan;
  }

  /** CEO runs a sprint planning session */
  async planSprint(sprintGoal: string): Promise<Task[]> {
    const plan = await this.createStrategicPlan(sprintGoal);

    // Extract JSON task array from the response
    const jsonMatch = plan.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    try {
      const taskDefs = JSON.parse(jsonMatch[0]) as Array<{
        title: string;
        assignTo: string;
        priority: string;
        description: string;
        deliverables?: string[];
        acceptanceCriteria?: string[];
      }>;

      const tasks: Task[] = [];
      for (const def of taskDefs) {
        const task = this.board.createTask({
          title: def.title,
          description: def.description,
          priority: def.priority as Task['priority'],
          assignedTo: def.assignTo as Task['assignedTo'],
          createdBy: 'ceo',
          deliverables: def.deliverables,
          acceptanceCriteria: def.acceptanceCriteria,
        });
        tasks.push(task);

        // Notify the assigned agent
        this.sendMessage(
          task.assignedTo,
          'task_assignment',
          `New task: ${task.title}`,
          JSON.stringify({
            taskId: task.id,
            title: task.title,
            description: task.description,
            deliverables: task.deliverables,
            acceptanceCriteria: task.acceptanceCriteria,
          }),
        );
      }

      // Broadcast sprint plan
      this.sendMessage(
        'all',
        'broadcast',
        `Sprint Plan: ${sprintGoal}`,
        `Ho pianificato lo sprint con ${tasks.length} task. Controllate la task board per i vostri assignment.`,
      );

      return tasks;
    } catch {
      return [];
    }
  }

  /** CEO evaluates overall progress */
  async evaluateProgress(): Promise<string> {
    const summary = this.board.getSummary();
    const allTasks = this.board.getAllTasks();
    const completedTasks = allTasks.filter(t => t.status === 'done');
    const blockedTasks = allTasks.filter(t => t.status === 'blocked');

    return this.think(`
Valuta il progresso del progetto ForgeAI:

TASK BOARD:
${summary}

TASK COMPLETATI (${completedTasks.length}):
${completedTasks.map(t => `- ${t.title}: ${t.output?.substring(0, 100) ?? 'no output'}`).join('\n')}

TASK BLOCCATI (${blockedTasks.length}):
${blockedTasks.map(t => `- ${t.title} (assigned: ${t.assignedTo})`).join('\n')}

Fornisci:
1. PROGRESSO: Percentuale stimata verso l'obiettivo
2. SUCCESSI: Cosa sta funzionando bene
3. PROBLEMI: Cosa è bloccato e perché
4. AZIONI: Decisioni da prendere immediatamente
5. PROSSIMI PASSI: Priorità per il prossimo ciclo
`);
  }

  // ---- Message handlers ----

  protected async executeTask(task: Task): Promise<string> {
    return this.think(`
Esegui questo task CEO:
Titolo: ${task.title}
Descrizione: ${task.description}
Deliverables: ${task.deliverables.join(', ')}

Produci il deliverable richiesto.
`);
  }

  protected async onTaskAssigned(message: AgentMessage): Promise<void> {
    // CEO rarely receives tasks, but handle gracefully
    const task = JSON.parse(message.content);
    const boardTask = this.board.getTask(task.taskId);
    if (boardTask) this.queueTask(boardTask);
  }

  protected async onQuestionReceived(message: AgentMessage): Promise<void> {
    const answer = await this.think(`
L'agente ${message.from} mi ha posto questa domanda:
"${message.content}"

Rispondi come CEO con una decisione chiara e motivata.
`);

    this.sendMessage(message.from, 'answer', `Re: ${message.subject}`, answer, message.id);
  }

  protected async onDecisionRequested(message: AgentMessage): Promise<void> {
    const decision = await this.think(`
L'agente ${message.from} richiede una decisione su:
"${message.subject}"

Dettagli: ${message.content}

Prendi una decisione strategica motivata. Considera impatto su business, utente e timeline.
`);

    this.recordDecision(message.subject, decision, `Requested by ${message.from}`);
    this.sendMessage(message.from, 'decision', `Decision: ${message.subject}`, decision, message.id);
  }

  protected async onFeedbackReceived(message: AgentMessage): Promise<void> {
    this.addLearning(`Feedback from ${message.from}: ${message.content.substring(0, 200)}`);
  }

  protected async onBroadcast(message: AgentMessage): Promise<void> {
    // CEO listens to broadcasts and intervenes if needed
    this.setContext(`last_broadcast_from_${message.from}`, message.content.substring(0, 200));
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    // Handle task_completed, reports, etc.
    if (message.type === 'task_completed') {
      this.setContext(`completed_${message.from}`, message.content.substring(0, 200));
    }
  }
}
