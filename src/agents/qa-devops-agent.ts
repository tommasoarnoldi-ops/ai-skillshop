// ============================================================
// QA & DevOps Agent — Quality assurance, CI/CD, infrastructure
// ============================================================

import { BaseAgent } from '../core/base-agent.js';
import type { AgentConfig, AgentMessage, Task } from '../types/index.js';
import type { MessageBus } from '../core/message-bus.js';
import type { TaskBoard } from '../core/task-board.js';

const QA_CONFIG: AgentConfig = {
  id: 'qa-devops',
  name: 'QA & DevOps Agent',
  role: 'QA Engineer & DevOps',
  expertise: [
    'Test strategy and test automation',
    'Jest and React Native Testing Library',
    'E2E testing (Detox / Maestro)',
    'CI/CD pipelines (EAS Build, GitHub Actions)',
    'Supabase infrastructure management',
    'Performance testing and optimization',
    'Security auditing',
    'Monitoring and alerting',
    'App Store deployment (iOS/Android)',
  ],
  responsibilities: [
    'Define test strategy and quality standards',
    'Write test plans and test cases',
    'Review code for quality, security, and performance',
    'Set up and maintain CI/CD pipelines',
    'Manage Supabase infrastructure and migrations',
    'Monitor app performance and error rates',
    'Manage EAS Build and app store submissions',
    'Define and enforce coding standards',
    'Security reviews and vulnerability scanning',
  ],
  canDelegateTo: [],
  reportsTo: 'cto',
  systemPrompt: `Sei il QA Engineer e DevOps di ForgeAI. Garantisci qualità e delivery.

STACK:
- Mobile: React Native + Expo (EAS Build per CI/CD)
- Backend: Supabase managed
- Testing: Jest + React Native Testing Library + Detox/Maestro (E2E)
- CI/CD: EAS Build + EAS Submit + GitHub Actions
- Monitoring: Sentry per crash reporting, custom analytics su Supabase

STANDARD DI QUALITÀ:
1. Code coverage minimo 70% per business logic
2. Ogni feature ha test unitari e di integrazione
3. Critical path ha test E2E
4. Zero vulnerabilità critiche in produzione
5. Performance budget: TTI < 2s, FPS ≥ 60
6. Crash-free rate ≥ 99.5%
7. Offline sync affidabile — zero data loss

AREE DI FOCUS:
- Test AI integration: mock Claude API, test prompts, verify response parsing
- Test offline: simulare perdita connessione, verify sync queue
- Test camera: mock camera input, verify UI states
- Performance: profiling React Native, ottimizzazione re-renders
- Security: API key management, RLS policies, input sanitization
- Accessibility: test con screen reader, contrasto, touch target

CI/CD PIPELINE:
1. PR → Lint + Type Check + Unit Tests
2. Merge main → Integration Tests + Build Preview
3. Release → E2E Tests + EAS Build + TestFlight/Internal Track
4. Production → EAS Submit + Monitoring

COME RISPONDI:
- Test cases specifici e azionabili
- Pipeline configs in YAML/JSON
- Security findings con severity e remediation
- Performance reports con metriche concrete
- Checklist di quality gate per ogni release`,
};

export class QADevOpsAgent extends BaseAgent {
  constructor(bus: MessageBus, board: TaskBoard, apiKey: string) {
    super(QA_CONFIG, bus, board, apiKey);
  }

  /** Create test plan for a feature */
  async createTestPlan(feature: string): Promise<string> {
    return this.think(`
Crea un test plan completo per la feature:

FEATURE: ${feature}

Struttura:
1. TEST STRATEGY: Approccio generale (unit, integration, E2E)
2. TEST CASES: Lista dettagliata con:
   - ID, titolo, tipo (unit/integration/E2E)
   - Precondizioni
   - Steps
   - Expected result
   - Priority (P0-P3)
3. EDGE CASES: Scenari limite (offline, errori AI, permessi camera)
4. PERFORMANCE TESTS: Cosa misurare e soglie
5. SECURITY TESTS: Verifica RLS, API keys, input validation
6. ACCESSIBILITY TESTS: Contrasto, touch target, screen reader
7. TEST DATA: Dati di test necessari
8. ENVIRONMENT: Setup necessario per eseguire i test
`);
  }

  /** Review code for quality */
  async reviewCode(code: string): Promise<string> {
    return this.think(`
Fai una code review di qualità per il seguente codice:

${code}

Valuta:
1. CORRETTEZZA: Bug potenziali, edge cases non gestiti
2. TYPE SAFETY: Uso corretto dei tipi TypeScript
3. PERFORMANCE: Re-renders inutili, memory leaks, operazioni costose
4. SICUREZZA: Vulnerabilità, input non sanitizzato, API key exposure
5. ACCESSIBILITÀ: Labels, contrasto, touch target
6. OFFLINE: Gestione assenza di rete
7. ERROR HANDLING: Try/catch, fallback UI, error boundaries
8. TESTING: Testabilità del codice, suggerimenti per test
9. BEST PRACTICES: Aderenza a React Native e ForgeAI conventions

Fornisci feedback specifico con suggerimenti di fix.
`);
  }

  /** Design CI/CD pipeline */
  async designPipeline(scope: string): Promise<string> {
    return this.think(`
Progetta la pipeline CI/CD per: ${scope}

Includi:
1. GitHub Actions workflow YAML
2. EAS Build configuration (eas.json)
3. Quality gates (cosa deve passare prima di procedere)
4. Environment management (dev, staging, production)
5. Secrets management
6. Rollback strategy
7. Monitoring post-deploy
`);
  }

  // ---- Task execution ----

  protected async executeTask(task: Task): Promise<string> {
    return this.think(`
Esegui questo task QA/DevOps:
Titolo: ${task.title}
Descrizione: ${task.description}
Deliverables: ${task.deliverables.join(', ')}
Criteri di accettazione: ${task.acceptanceCriteria.join(', ')}

Produci il deliverable di qualità/infra richiesto.
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
        assignedTo: 'qa-devops',
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

Rispondi con competenza QA/DevOps, fornendo soluzioni concrete.
`);
    this.sendMessage(message.from, 'answer', `Re: ${message.subject}`, answer, message.id);
  }

  protected async onDecisionRequested(message: AgentMessage): Promise<void> {
    // QA escalates most decisions to CTO
    this.sendMessage(
      'cto',
      'decision_request',
      `QA/DevOps: ${message.subject}`,
      `From ${message.from}: ${message.content}`,
      message.id,
    );
  }

  protected async onFeedbackReceived(message: AgentMessage): Promise<void> {
    this.addLearning(`QA feedback from ${message.from}: ${message.content.substring(0, 200)}`);
  }

  protected async onBroadcast(message: AgentMessage): Promise<void> {
    // QA monitors for quality-related broadcasts
    if (message.content.toLowerCase().includes('bug') ||
        message.content.toLowerCase().includes('error') ||
        message.content.toLowerCase().includes('crash') ||
        message.content.toLowerCase().includes('security')) {
      this.setContext(`quality_alert_${message.from}`, message.content.substring(0, 200));
    }
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'task_completed') {
      // Auto-trigger review for completed dev tasks
      if (message.from === 'developer') {
        const reviewTask = this.board.createTask({
          title: `Review: ${message.subject}`,
          description: `Review the completed work: ${message.content.substring(0, 500)}`,
          priority: 'high',
          assignedTo: 'qa-devops',
          createdBy: 'qa-devops',
        });
        this.queueTask(reviewTask);
      }
    }
  }
}
