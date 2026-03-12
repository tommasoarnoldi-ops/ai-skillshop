// ============================================================
// Marketing & Growth Agent — Go-to-market, content, sales
// ============================================================

import { BaseAgent } from '../core/base-agent.js';
import type { AgentConfig, AgentMessage, Task } from '../types/index.js';
import type { MessageBus } from '../core/message-bus.js';
import type { TaskBoard } from '../core/task-board.js';

const MARKETING_CONFIG: AgentConfig = {
  id: 'marketing',
  name: 'Marketing & Growth Agent',
  role: 'Head of Marketing & Growth',
  expertise: [
    'B2B SaaS go-to-market strategy',
    'Italian manufacturing market',
    'Content marketing for industrial sector',
    'Sales enablement and pitch decks',
    'SEO and digital marketing',
    'Customer acquisition strategy',
    'Pricing strategy',
    'Partnership development',
    'Trade shows and industry events (SPS Italia, MECSPE, BI-MU)',
  ],
  responsibilities: [
    'Define go-to-market strategy for Emilia-Romagna launch',
    'Create marketing content (website, case studies, whitepapers)',
    'Develop sales materials (pitch deck, one-pager, demo scripts)',
    'Plan customer acquisition funnel',
    'Define pricing and packaging strategy',
    'Identify and plan industry events and partnerships',
    'Create brand identity and messaging',
    'Plan referral and word-of-mouth programs',
  ],
  canDelegateTo: [],
  reportsTo: 'ceo',
  systemPrompt: `Sei il Head of Marketing & Growth di ForgeAI. Guidi la strategia go-to-market.

PRODOTTO:
ForgeAI — piattaforma AI smartphone-first per guidare operatori industriali nelle PMI manifatturiere.

MERCATO TARGET:
- PMI manifatturiere italiane, 50-500 dipendenti
- Settori: meccanica di precisione, automotive, food & beverage, packaging
- Geografia: lancio Emilia-Romagna, poi Veneto e Lombardia
- Buyer persona: Direttore di Stabilimento / Responsabile Produzione
- User persona: Operatore macchina CNC / Manutentore

MODELLO BUSINESS:
- SaaS B2B con setup fee
- Starter: €499/mese (1 reparto, 10 operatori, 50 procedure)
- Pro: €1.499/mese (illimitato)
- Setup fee: €5-15K (onboarding, digitalizzazione procedure iniziali)

COMPETITOR:
- Augmentir ($44M, enterprise, USA)
- Tulip ($340M, no-code, enterprise)
- Poka, Dozuki — tutti enterprise, nessuno smartphone-first per PMI

DIFFERENZIATORI:
1. Smartphone-first (no hardware costoso, no smart glasses)
2. AI Vision per riconoscimento e verifica automatica
3. Knowledge capture — cattura il sapere dei senior prima che vadano in pensione
4. Prezzo PMI-friendly (vs enterprise pricing dei competitor)
5. Offline-first (funziona in fabbrica senza WiFi)

CANALI:
- Direct sales (distretti industriali)
- Confindustria e associazioni di categoria
- Trade shows (MECSPE, SPS Italia, BI-MU)
- Consulenti Industria 4.0 / system integrators
- Content marketing tecnico
- Referral program tra direttori di stabilimento

COME RISPONDI:
- Focus su azione e risultati misurabili
- Contenuti in italiano per il mercato target
- Usa dati e benchmark del settore manifatturiero italiano
- Proponi sempre metriche di successo per ogni iniziativa
- Considera il ciclo di vendita B2B lungo (3-6 mesi per PMI manifatturiere)`,
};

export class MarketingAgent extends BaseAgent {
  constructor(bus: MessageBus, board: TaskBoard, apiKey: string) {
    super(MARKETING_CONFIG, bus, board, apiKey);
  }

  /** Create go-to-market plan */
  async createGTMPlan(phase: string): Promise<string> {
    return this.think(`
Crea un piano go-to-market per ForgeAI, fase: ${phase}

Includi:
1. OBIETTIVI: Target metrici per questa fase (clienti, revenue, pipeline)
2. POSITIONING: Messaggio chiave e value proposition
3. CANALI: Canali di acquisizione prioritari con budget stimato
4. CONTENUTI: Piano contenuti (articoli, case study, video, whitepaper)
5. SALES ENABLEMENT: Materiali necessari per il team commerciale
6. EVENTI: Trade show e eventi di settore da presidiare
7. PARTNERSHIP: Partner strategici da attivare
8. TIMELINE: Cronoprogramma attività
9. METRICHE: KPI di successo per ogni canale
10. BUDGET: Stima budget marketing mensile
`);
  }

  /** Create pitch deck outline */
  async createPitchDeck(): Promise<string> {
    return this.think(`
Crea la struttura e i contenuti per il pitch deck di ForgeAI.

Slide per slide:
1. Cover — Hook e tagline
2. Problema — Il know-how industriale che muore
3. Soluzione — ForgeAI in 30 secondi
4. Demo / Product — Screenshots e flusso chiave
5. Mercato — TAM/SAM/SOM con dati Connected Worker Market
6. Business Model — Pricing e unit economics
7. Traction — Metriche attuali o pilot results
8. Competitor — Landscape e differenziazione
9. Team — Founding team e advisory
10. Ask — Cosa cerchiamo (funding, partnership, clienti pilot)

Per ogni slide: headline, bullet points, dati chiave, note per il presenter.
`);
  }

  /** Generate content piece */
  async generateContent(type: string, topic: string): Promise<string> {
    return this.think(`
Genera un contenuto marketing per ForgeAI:

TIPO: ${type} (articolo blog / case study / whitepaper / post LinkedIn / email)
TOPIC: ${topic}
TARGET: Direttori di stabilimento PMI manifatturiere italiane

Il contenuto deve:
- Parlare la lingua del manufacturing italiano
- Usare dati e scenari concreti del settore
- Posizionare ForgeAI come soluzione al problema specifico
- Includere una CTA chiara
- Essere scritto in italiano professionale ma non corporate-speak
`);
  }

  // ---- Task execution ----

  protected async executeTask(task: Task): Promise<string> {
    return this.think(`
Esegui questo task di marketing:
Titolo: ${task.title}
Descrizione: ${task.description}
Deliverables: ${task.deliverables.join(', ')}
Criteri di accettazione: ${task.acceptanceCriteria.join(', ')}

Produci il deliverable marketing/growth richiesto.
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
        assignedTo: 'marketing',
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

Rispondi con competenza marketing/growth, focalizzandoti sul mercato manifatturiero italiano.
`);
    this.sendMessage(message.from, 'answer', `Re: ${message.subject}`, answer, message.id);
  }

  protected async onDecisionRequested(message: AgentMessage): Promise<void> {
    const decision = await this.think(`
Decisione marketing richiesta da ${message.from}:
"${message.subject}"
Dettagli: ${message.content}

Prendi una decisione basata su impatto go-to-market e ROI.
`);
    this.recordDecision(message.subject, decision, `Marketing decision for ${message.from}`);
    this.sendMessage(message.from, 'decision', `Marketing Decision: ${message.subject}`, decision, message.id);
  }

  protected async onFeedbackReceived(message: AgentMessage): Promise<void> {
    this.addLearning(`Marketing feedback from ${message.from}: ${message.content.substring(0, 200)}`);
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
