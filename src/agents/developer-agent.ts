// ============================================================
// Developer Agent — Full-stack implementation
// ============================================================

import { BaseAgent } from '../core/base-agent.js';
import type { AgentConfig, AgentMessage, Task } from '../types/index.js';
import type { MessageBus } from '../core/message-bus.js';
import type { TaskBoard } from '../core/task-board.js';

const DEV_CONFIG: AgentConfig = {
  id: 'developer',
  name: 'Full-Stack Developer Agent',
  role: 'Senior Full-Stack Developer',
  expertise: [
    'React Native / Expo Router',
    'TypeScript (strict mode)',
    'Zustand state management',
    'Supabase (PostgreSQL, Auth, Storage, Edge Functions)',
    'Claude API integration (text + vision)',
    'SQLite / offline-first patterns',
    'expo-camera, expo-speech, expo-haptics',
    'Mobile UI/UX implementation',
    'REST API design',
    'Testing (Jest, React Native Testing Library)',
  ],
  responsibilities: [
    'Implement features based on specs from PM and CTO',
    'Write clean, type-safe TypeScript code',
    'Build React Native components following the design system',
    'Integrate Claude API for vision and language features',
    'Implement offline-first data layer with sync',
    'Write Supabase Edge Functions for backend logic',
    'Create database migrations and seed data',
    'Write unit and integration tests',
  ],
  canDelegateTo: [],
  reportsTo: 'cto',
  systemPrompt: `Sei il Senior Full-Stack Developer di ForgeAI. Scrivi codice production-ready.

STACK:
- React Native + Expo Router (SDK 52+, file-based routing)
- TypeScript strict mode
- Zustand per state management
- Supabase (PostgreSQL + Auth + Storage + Edge Functions + pgvector)
- Claude API (claude-sonnet-4-20250514) per vision + language
- SQLite (expo-sqlite) per offline storage
- expo-camera, expo-speech, expo-haptics

STRUTTURA PROGETTO:
app/ → Expo Router pages (auth, tabs, procedure, scan, admin)
src/components/ → UI components (ui/, camera/, procedure/, knowledge/, dashboard/)
src/services/ → Business logic (ai/, supabase/, offline/, speech/)
src/stores/ → Zustand stores
src/hooks/ → Custom hooks
src/types/ → TypeScript types
src/config/ → Theme, API config

REGOLE DI CODICE:
1. TypeScript strict — no any, no ts-ignore
2. Componenti funzionali con hooks
3. Styling con StyleSheet.create() — no inline styles
4. Nomi chiari e descrittivi — il codice si auto-documenta
5. Error handling robusto — try/catch con fallback UX
6. Offline-first — ogni feature deve funzionare senza rete
7. Accessibilità — accessibilityLabel su ogni elemento interattivo
8. Performance — useMemo, useCallback dove serve, FlatList per liste
9. Tema scuro di default — usa i colori dal design system
10. Touch target minimo 48x48px

QUANDO SCRIVI CODICE:
- Produci file completi e funzionanti, non snippet parziali
- Includi tutti gli import necessari
- Includi i tipi TypeScript
- Segui le convenzioni del progetto
- Gestisci loading, error, empty states
- Considera il contesto fabbrica (guanti, rumore, una mano)`,
};

export class DeveloperAgent extends BaseAgent {
  constructor(bus: MessageBus, board: TaskBoard, apiKey: string) {
    super(DEV_CONFIG, bus, board, apiKey);
  }

  /** Generate code for a component or service */
  async generateCode(spec: string): Promise<string> {
    return this.think(`
Genera il codice per la seguente specifica:

${spec}

REQUISITI:
- Codice TypeScript completo e funzionante
- Tutti gli import necessari
- Tipi TypeScript espliciti
- Error handling
- Commenti solo dove il codice non è auto-esplicativo
- Segui il design system ForgeAI (tema scuro, touch target grandi)

Produci il codice con il path del file dove salvarlo.
`);
  }

  /** Implement a database migration */
  async generateMigration(schema: string): Promise<string> {
    return this.think(`
Genera la migrazione SQL per Supabase basata su:

${schema}

Includi:
1. CREATE TABLE statements
2. Indici necessari
3. RLS policies per multi-tenant
4. Commenti sulle scelte
5. Seed data di esempio se appropriato

Il SQL deve essere idempotente (usa IF NOT EXISTS dove appropriato).
`);
  }

  /** Implement a Supabase Edge Function */
  async generateEdgeFunction(spec: string): Promise<string> {
    return this.think(`
Genera una Supabase Edge Function (Deno/TypeScript) per:

${spec}

Includi:
1. Import Supabase client
2. Request validation
3. Auth check
4. Business logic
5. Error handling con response codes appropriati
6. TypeScript types
`);
  }

  // ---- Task execution ----

  protected async executeTask(task: Task): Promise<string> {
    return this.think(`
Implementa questo task come Senior Developer:
Titolo: ${task.title}
Descrizione: ${task.description}
Deliverables: ${task.deliverables.join(', ')}
Criteri di accettazione: ${task.acceptanceCriteria.join(', ')}

Produci codice completo, funzionante e production-ready.
Se il task richiede più file, producili tutti con i path corretti.
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
      // Direct implementation request (not from task board)
      const task = this.board.createTask({
        title: message.subject,
        description: message.content,
        priority: 'high',
        assignedTo: 'developer',
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

Rispondi con competenza tecnica e code snippets concreti.
`);
    this.sendMessage(message.from, 'answer', `Re: ${message.subject}`, answer, message.id);
  }

  protected async onDecisionRequested(message: AgentMessage): Promise<void> {
    // Developer escalates decisions to CTO
    this.sendMessage(
      'cto',
      'decision_request',
      message.subject,
      `Escalated from ${message.from}: ${message.content}`,
      message.id,
    );
  }

  protected async onFeedbackReceived(message: AgentMessage): Promise<void> {
    this.addLearning(`Dev feedback from ${message.from}: ${message.content.substring(0, 200)}`);

    // If feedback requires code changes, create a fix task
    if (message.content.toLowerCase().includes('fix') || message.content.toLowerCase().includes('bug')) {
      const task = this.board.createTask({
        title: `Fix: ${message.subject}`,
        description: message.content,
        priority: 'high',
        assignedTo: 'developer',
        createdBy: message.from,
      });
      this.queueTask(task);
    }
  }

  protected async onBroadcast(message: AgentMessage): Promise<void> {
    this.setContext(`broadcast_${message.from}`, message.content.substring(0, 200));
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'report') {
      this.setContext(`report_${message.from}`, message.content.substring(0, 200));
    }
  }
}
