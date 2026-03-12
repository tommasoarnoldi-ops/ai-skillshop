// ============================================================
// Product Manager Agent — Product strategy, UX, and requirements
// ============================================================

import { BaseAgent } from '../core/base-agent.js';
import type { AgentConfig, AgentMessage, Task } from '../types/index.js';
import type { MessageBus } from '../core/message-bus.js';
import type { TaskBoard } from '../core/task-board.js';

const PM_CONFIG: AgentConfig = {
  id: 'product-manager',
  name: 'Product Manager Agent',
  role: 'Product Manager',
  expertise: [
    'Product strategy and roadmap',
    'User research and personas',
    'UX/UI design for industrial apps',
    'Requirements specification',
    'User story mapping',
    'Competitive analysis',
    'Metrics and KPIs',
    'Italian manufacturing SME workflows',
  ],
  responsibilities: [
    'Define product requirements and user stories',
    'Design user flows and wireframes',
    'Prioritize features based on user impact',
    'Write acceptance criteria for features',
    'Conduct competitive analysis',
    'Define success metrics per feature',
    'Translate business goals into product specs',
  ],
  canDelegateTo: ['developer'],
  reportsTo: 'ceo',
  systemPrompt: `Sei il Product Manager di ForgeAI. Definisci cosa costruire e perché.

PRODOTTO:
ForgeAI è un'app smartphone-first che guida operatori industriali nell'esecuzione di procedure complesse (setup macchinari CNC, manutenzione, QC) nelle PMI manifatturiere italiane.

UTENTI PRINCIPALI:
1. Operatore Junior (25-35 anni): nuovo assunto, deve imparare le procedure rapidamente
2. Operatore Senior (50-65 anni): conosce tutto, documenta il sapere prima della pensione
3. Manager di Stabilimento (40-55 anni): vuole visibilità su competenze team e compliance

FUNZIONALITÀ MVP:
1. Scanner macchinari (camera → AI vision → identificazione)
2. Guida step-by-step (procedure con verifica AI visiva)
3. Knowledge base chat (RAG su sapere aziendale)
4. Dashboard manager (analytics team e competenze)
5. Offline mode (cache + sync)

UX PRINCIPLES (CONTESTO FABBRICA):
- Tema scuro (riduce riflessi)
- Touch target ≥ 48px (guanti da lavoro)
- Font ≥ 15px (leggibilità a distanza)
- Contrasto alto (WCAG AA+)
- Uso con una mano
- Voice-first ready
- Feedback tattile (haptics)

NORTH STAR: procedure completate con successo / settimana

COME RISPONDI:
- User stories in formato "Come [persona], voglio [azione], in modo da [beneficio]"
- Wireframe ASCII quando utile
- Acceptance criteria specifici e testabili
- Sempre centrato sull'utente operatore in fabbrica
- Priorità chiare con reasoning (impatto utente vs effort)`,
};

export class ProductManagerAgent extends BaseAgent {
  constructor(bus: MessageBus, board: TaskBoard, apiKey: string) {
    super(PM_CONFIG, bus, board, apiKey);
  }

  /** Create detailed product requirements for a feature */
  async createPRD(featureName: string): Promise<string> {
    return this.think(`
Crea un PRD (Product Requirements Document) per la feature:

FEATURE: ${featureName}

Struttura del PRD:
1. OVERVIEW: Cosa e perché
2. USER PERSONAS: Chi la usa e in quale contesto
3. USER STORIES: Lista completa con acceptance criteria
4. USER FLOW: Flusso utente step-by-step (con wireframe ASCII se utile)
5. REQUISITI FUNZIONALI: Lista dettagliata
6. REQUISITI NON-FUNZIONALI: Performance, offline, accessibility
7. EDGE CASES: Scenari limite da gestire
8. SUCCESS METRICS: Come misuriamo il successo
9. OUT OF SCOPE: Cosa NON è incluso nell'MVP
10. DIPENDENZE: Cosa serve prima di iniziare
`);
  }

  /** Design user flow for a feature */
  async designUserFlow(scenario: string): Promise<string> {
    return this.think(`
Progetta il flusso utente per lo scenario:

SCENARIO: ${scenario}

Includi:
1. Punto di ingresso (come l'utente arriva qui)
2. Ogni step con: schermata, azioni possibili, feedback
3. Wireframe ASCII della schermata principale
4. Gestione errori e stati edge
5. Comportamento offline
6. Transizioni e animazioni suggerite
7. Accessibility considerations (guanti, rumore, illuminazione)
`);
  }

  /** Prioritize a backlog of features */
  async prioritizeBacklog(features: string[]): Promise<string> {
    return this.think(`
Prioritizza queste feature per ForgeAI MVP:

FEATURES:
${features.map((f, i) => `${i + 1}. ${f}`).join('\n')}

Usa il framework RICE (Reach, Impact, Confidence, Effort) adattato al contesto ForgeAI.
Per ogni feature fornisci:
- Score RICE
- Motivazione
- Dipendenze
- Raccomandazione (must-have / should-have / nice-to-have / out-of-scope)

Ordina per priorità finale.
`);
  }

  // ---- Task execution ----

  protected async executeTask(task: Task): Promise<string> {
    return this.think(`
Esegui questo task come Product Manager:
Titolo: ${task.title}
Descrizione: ${task.description}
Deliverables attesi: ${task.deliverables.join(', ')}
Criteri di accettazione: ${task.acceptanceCriteria.join(', ')}

Produci il deliverable di prodotto richiesto, con focus su utente e business value.
`);
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
      const task = this.board.createTask({
        title: message.subject,
        description: message.content,
        priority: 'high',
        assignedTo: 'product-manager',
        createdBy: message.from,
      });
      this.queueTask(task);
      await this.executeNextTask();
    }
  }

  protected async onQuestionReceived(message: AgentMessage): Promise<void> {
    const answer = await this.think(`
L'agente ${message.from} chiede:
"${message.content}"

Rispondi dal punto di vista del prodotto, sempre centrato sull'utente finale (operatore in fabbrica).
`);
    this.sendMessage(message.from, 'answer', `Re: ${message.subject}`, answer, message.id);
  }

  protected async onDecisionRequested(message: AgentMessage): Promise<void> {
    const decision = await this.think(`
Decisione di prodotto richiesta da ${message.from}:
"${message.subject}"
Dettagli: ${message.content}

Prendi una decisione basata su impatto utente e business value.
`);
    this.recordDecision(message.subject, decision, `PM decision for ${message.from}`);
    this.sendMessage(message.from, 'decision', `Product Decision: ${message.subject}`, decision, message.id);
  }

  protected async onFeedbackReceived(message: AgentMessage): Promise<void> {
    this.addLearning(`Product feedback from ${message.from}: ${message.content.substring(0, 200)}`);
  }

  protected async onBroadcast(message: AgentMessage): Promise<void> {
    this.setContext(`broadcast_${message.from}`, message.content.substring(0, 200));
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'task_completed') {
      this.setContext(`completed_by_${message.from}`, message.content.substring(0, 200));
    }
  }
}
