// ============================================================
// Bootstrap Workflow — Generate the full ForgeAI app from scratch
// ============================================================

import chalk from 'chalk';
import type { Orchestrator } from '../core/orchestrator.js';

/**
 * Pre-built workflow that uses all 6 agents to generate
 * the complete ForgeAI React Native app, documentation,
 * marketing materials, and infrastructure configs.
 */
export class BootstrapWorkflow {
  constructor(private orchestrator: Orchestrator) {}

  /**
   * Run the full bootstrap: generates all ForgeAI app artifacts.
   * Phases:
   *   1. Strategy & Planning (CEO + PM)
   *   2. Architecture & Design (CTO + PM)
   *   3. Implementation (Developer)
   *   4. Quality & Infra (QA/DevOps)
   *   5. Go-to-Market (Marketing)
   */
  async run(verbose: boolean = true): Promise<string> {
    const results: Record<string, string> = {};
    const startTime = Date.now();

    this.print(verbose, 'bootstrap', '🚀 Starting ForgeAI Full Bootstrap');
    this.print(verbose, 'bootstrap', 'Phase 1/5: Strategy & Planning');

    // ════════════════════════════════════════
    // PHASE 1: Strategy & Planning (parallel)
    // ════════════════════════════════════════
    const phase1 = await this.orchestrator.runParallel([
      {
        agentId: 'ceo',
        instruction: `Definisci la strategia di lancio ForgeAI per i primi 3 mesi.
Includi:
- Obiettivi misurabili (clienti pilot, revenue, pipeline)
- Milestone settimanali
- Risorse necessarie (team, budget, tool)
- Rischi top 3 e mitigazioni
- Criteri go/no-go per ogni fase`,
        label: 'CEO: Launch Strategy',
      },
      {
        agentId: 'product-manager',
        instruction: `Crea il PRD completo per l'MVP di ForgeAI.
Features MVP:
1. Scanner macchinari (camera → AI Vision → identificazione)
2. Guida step-by-step (procedure con verifica AI visiva)
3. Knowledge base chat (RAG su sapere aziendale)
4. Dashboard manager (analytics team)
5. Offline mode (cache + sync)

Per ogni feature: user stories, acceptance criteria, wireframe ASCII, edge cases.
Prioritizza con RICE framework.`,
        label: 'PM: MVP PRD',
      },
    ]);

    for (const [key, value] of phase1) {
      results[key] = value;
      this.orchestrator.artifacts.add({
        type: 'document',
        filePath: `docs/${slugify(key)}.md`,
        content: value,
        description: key,
        createdBy: key.startsWith('CEO') ? 'ceo' : 'product-manager',
      });
    }

    this.print(verbose, 'bootstrap', 'Phase 2/5: Architecture & Technical Design');

    // ════════════════════════════════════════
    // PHASE 2: Architecture & Design
    // ════════════════════════════════════════
    const prd = results['PM: MVP PRD'] ?? '';

    const phase2 = await this.orchestrator.runParallel([
      {
        agentId: 'cto',
        instruction: `Progetta l'architettura tecnica completa per ForgeAI MVP.

PRD di riferimento (sintesi):
${prd.substring(0, 2000)}

Produci:
1. ARCHITETTURA SISTEMA: Diagramma componenti (ASCII), flusso dati
2. DATABASE SCHEMA: SQL completo con tabelle, indici, RLS policies per Supabase
3. API CONTRACTS: Endpoint principali con request/response types
4. AI INTEGRATION: Prompts per Claude Vision (scanner + verifica), RAG pipeline
5. OFFLINE ARCHITECTURE: Strategia sync, conflict resolution, cache invalidation
6. COMPONENT TREE: Struttura componenti React Native
7. STATE MANAGEMENT: Zustand stores design
8. SECURITY: Auth flow, RLS, API key management`,
        label: 'CTO: Architecture',
      },
      {
        agentId: 'product-manager',
        instruction: `Progetta il Design System completo per ForgeAI.
Contesto: app usata in fabbrica, tema scuro, guanti, rumore, una mano.

Produci:
1. COLOR PALETTE: Colori primari, secondari, feedback, neutrali (con codici hex)
2. TYPOGRAPHY: Font sizes, weights, line heights per ogni contesto
3. SPACING: Sistema di spaziatura (4px grid)
4. COMPONENTS: Specifiche per ogni componente UI (Button, Card, Input, Modal, Badge, etc.)
   - Varianti, stati, dimensioni
   - Touch target minimo 48x48px
5. ICONS: Set di icone per contesto industriale
6. ANIMATIONS: Transizioni e feedback per ogni interazione
7. ACCESSIBILITY: Checklist WCAG AA per contesto fabbrica`,
        label: 'PM: Design System',
      },
    ]);

    for (const [key, value] of phase2) {
      results[key] = value;
      this.orchestrator.artifacts.add({
        type: 'document',
        filePath: `docs/${slugify(key)}.md`,
        content: value,
        description: key,
        createdBy: key.startsWith('CTO') ? 'cto' : 'product-manager',
      });
    }

    this.print(verbose, 'bootstrap', 'Phase 3/5: Implementation');

    // ════════════════════════════════════════
    // PHASE 3: Implementation (sequential pipeline)
    // ════════════════════════════════════════
    const architecture = results['CTO: Architecture'] ?? '';
    const designSystem = results['PM: Design System'] ?? '';

    // 3a: Generate core app files in parallel
    const phase3 = await this.orchestrator.runParallel([
      {
        agentId: 'developer',
        instruction: `Genera il file di configurazione theme.ts per ForgeAI React Native.

Design System:
${designSystem.substring(0, 2000)}

Produci il file COMPLETO src/config/theme.ts con:
- Colori (tema scuro, industriale)
- Typography (font sizes, weights)
- Spacing (4px grid)
- Border radius
- Shadows
- Component-specific tokens
- TypeScript types per tutto

Export come oggetto \`theme\` e tipo \`Theme\`.`,
        label: 'Dev: Theme Config',
      },
      {
        agentId: 'developer',
        instruction: `Genera il file TypeScript types per ForgeAI.

Architecture:
${architecture.substring(0, 2000)}

Produci il file COMPLETO src/types/index.ts con TUTTI i tipi:
- User, Company, Machine (con tutti i campi dal DB schema)
- Procedure, ProcedureStep, ProcedureExecution, StepExecution
- KnowledgeEntry
- OperatorSkill
- Enums: UserRole, ProcedureCategory, StepVerificationType, ExecutionStatus
- API request/response types
- Store state types
- Navigation types per Expo Router`,
        label: 'Dev: TypeScript Types',
      },
      {
        agentId: 'developer',
        instruction: `Genera il client Supabase per ForgeAI.

Produci il file COMPLETO src/services/supabase/client.ts con:
- Configurazione Supabase client con variabili ambiente Expo
- Type-safe client con Database types
- Helper per gestione sessione
- Configurazione per offline (persistenza locale)

E il file src/services/supabase/auth.ts con:
- signInWithEmail
- signUpWithEmail
- signInWithMagicLink
- signOut
- getCurrentUser
- onAuthStateChange
- Gestione errori e loading states`,
        label: 'Dev: Supabase Client',
      },
      {
        agentId: 'developer',
        instruction: `Genera i Zustand stores principali per ForgeAI.

Architecture:
${architecture.substring(0, 1500)}

Produci i file COMPLETI:

1. src/stores/authStore.ts — Stato auth (user, session, loading, error, actions)
2. src/stores/procedureStore.ts — Procedure, current execution, step navigation
3. src/stores/scanStore.ts — Scanner state, recognition result, machine matching
4. src/stores/offlineStore.ts — Sync queue, connection status, cached data

Ogni store deve:
- Usare Zustand con TypeScript strict
- Avere tipi espliciti per state e actions
- Gestire loading/error states
- Essere offline-friendly`,
        label: 'Dev: Zustand Stores',
      },
    ]);

    for (const [key, value] of phase3) {
      results[key] = value;
      this.orchestrator.artifacts.add({
        type: 'code',
        filePath: `forgeai-app/src/${slugify(key)}.ts`,
        content: value,
        description: key,
        createdBy: 'developer',
      });
    }

    // 3b: Generate AI services
    this.print(verbose, 'bootstrap', 'Phase 3b: AI Integration Services');

    const phase3b = await this.orchestrator.runParallel([
      {
        agentId: 'developer',
        instruction: `Genera il servizio AI Vision per ForgeAI.

Produci il file COMPLETO src/services/ai/vision.ts con:
- recognizeMachine(imageBase64): identifica macchinario da foto
- verifyStep(imageBase64, stepContext): verifica visiva completamento step
- System prompts ottimizzati per ogni caso d'uso
- Parsing JSON response con validazione
- Error handling e retry logic
- TypeScript types per input/output
- Usa Claude API (claude-sonnet-4-20250514) via fetch`,
        label: 'Dev: AI Vision Service',
      },
      {
        agentId: 'developer',
        instruction: `Genera il servizio AI Assistant per ForgeAI.

Produci il file COMPLETO src/services/ai/assistant.ts con:
- chatWithContext(message, context): chat contestuale con knowledge base
- generateStepInstruction(procedureContext): genera istruzioni per step
- translateProcedure(procedure, language): traduce procedura
- System prompt con contesto azienda/macchinario/procedura
- Gestione conversation history
- RAG integration placeholder
- Error handling e retry
- TypeScript types`,
        label: 'Dev: AI Assistant Service',
      },
      {
        agentId: 'developer',
        instruction: `Genera i componenti UI core per ForgeAI React Native.

Design System context: tema scuro, touch target 48px+, font 15px+.

Produci i file COMPLETI:
1. src/components/ui/Button.tsx — Varianti: primary, secondary, danger, ghost. Sizes: sm, md, lg. Loading state. Haptic feedback.
2. src/components/ui/Card.tsx — Varianti: default, elevated, outlined. Pressable option.
3. src/components/ui/Input.tsx — Text input con label, error, helper text. Varianti: default, search, password.
4. src/components/ui/Badge.tsx — Status badges: success, warning, danger, info, neutral.
5. src/components/ui/ProgressBar.tsx — Linear e circular progress. Animato.

Ogni componente:
- StyleSheet.create() per stili
- accessibilityLabel su ogni elemento
- TypeScript props interface
- Tema scuro usando i colori del design system`,
        label: 'Dev: UI Components',
      },
    ]);

    for (const [key, value] of phase3b) {
      results[key] = value;
      this.orchestrator.artifacts.add({
        type: 'code',
        filePath: `forgeai-app/src/${slugify(key)}.ts`,
        content: value,
        description: key,
        createdBy: 'developer',
      });
    }

    this.print(verbose, 'bootstrap', 'Phase 4/5: Quality & Infrastructure');

    // ════════════════════════════════════════
    // PHASE 4: Quality & Infrastructure
    // ════════════════════════════════════════
    const phase4 = await this.orchestrator.runParallel([
      {
        agentId: 'qa-devops',
        instruction: `Crea il test plan completo per ForgeAI MVP.

Features da testare:
1. Scanner macchinari (camera → AI → ID)
2. Guida step-by-step (navigazione, verifica, completamento)
3. Knowledge base chat
4. Dashboard manager
5. Offline mode (sync, queue, conflict)
6. Auth flow

Per ogni feature:
- Test cases con ID, tipo (unit/integration/E2E), priority (P0-P3)
- Edge cases specifici per contesto fabbrica
- Test offline scenarios
- Performance benchmarks (TTI, FPS, sync time)`,
        label: 'QA: Test Plan',
      },
      {
        agentId: 'qa-devops',
        instruction: `Progetta la pipeline CI/CD completa per ForgeAI.

Stack: React Native + Expo (EAS Build) + Supabase + GitHub Actions.

Produci:
1. GitHub Actions workflow YAML per:
   - PR: lint + typecheck + unit tests
   - Main: integration tests + EAS build preview
   - Release: E2E + EAS build production + TestFlight/Internal Track
2. eas.json con profili: development, preview, production
3. Quality gates e check pre-merge
4. Supabase migration strategy
5. Environment management (dev/staging/prod)
6. Monitoring e alerting post-deploy (Sentry config)
7. Rollback procedures`,
        label: 'QA: CI/CD Pipeline',
      },
      {
        agentId: 'cto',
        instruction: `Genera lo schema SQL completo per Supabase con tutte le tabelle ForgeAI.

Includi:
1. Tutte le CREATE TABLE (companies, users, machines, procedures, procedure_steps,
   procedure_executions, step_executions, knowledge_entries, operator_skills)
2. Tutti gli indici (incluso ivfflat per pgvector)
3. RLS policies per multi-tenant (company isolation)
4. Trigger per updated_at automatico
5. Seed data: 2 aziende demo, utenti, 3 macchinari CNC, 5 procedure con step
6. Commenti su ogni tabella/colonna

Il SQL deve essere eseguibile direttamente su Supabase.`,
        label: 'CTO: Database Schema SQL',
      },
    ]);

    for (const [key, value] of phase4) {
      results[key] = value;
      const isSQL = key.includes('SQL');
      this.orchestrator.artifacts.add({
        type: isSQL ? 'migration' : key.includes('CI/CD') ? 'pipeline' : 'test',
        filePath: isSQL ? 'forgeai-app/supabase/migrations/001_initial_schema.sql' :
                  key.includes('CI/CD') ? 'forgeai-app/.github/workflows/ci.yml' :
                  `docs/${slugify(key)}.md`,
        content: value,
        description: key,
        createdBy: key.startsWith('CTO') ? 'cto' : 'qa-devops',
      });
    }

    this.print(verbose, 'bootstrap', 'Phase 5/5: Go-to-Market');

    // ════════════════════════════════════════
    // PHASE 5: Go-to-Market
    // ════════════════════════════════════════
    const phase5 = await this.orchestrator.runParallel([
      {
        agentId: 'marketing',
        instruction: `Crea il piano Go-to-Market completo per ForgeAI, lancio Emilia-Romagna.

Includi:
1. POSITIONING: Value proposition, messaggio chiave, elevator pitch (30s e 2min)
2. CANALI DI ACQUISIZIONE: Top 5 canali con priorità, budget, timeline
3. CONTENUTI: Piano editoriale primo trimestre (blog, LinkedIn, whitepaper, video)
4. SALES ENABLEMENT: Script demo, obiezioni comuni e risposte, ROI calculator
5. EVENTI: Calendar trade show 2026 (MECSPE, SPS Italia, BI-MU)
6. PARTNERSHIP: Top 10 partner potenziali (system integrator, consulenti I4.0)
7. REFERRAL: Programma referral per direttori di stabilimento
8. METRICHE: KPI per ogni canale e target mensili
9. BUDGET: Allocazione budget marketing mensile`,
        label: 'Marketing: GTM Plan',
      },
      {
        agentId: 'marketing',
        instruction: `Crea il pitch deck di ForgeAI (contenuti testuali per ogni slide).

10 slide:
1. Cover — Hook e tagline
2. Problema — Il know-how industriale che muore (dati crisi demografica Italia)
3. Soluzione — ForgeAI in azione (screenshot flow)
4. Come funziona — 3 step (scansiona, segui, impara)
5. Mercato — TAM/SAM/SOM Connected Worker + PMI manifatturiere Italia
6. Business Model — Pricing, unit economics, LTV/CAC
7. Traction — Pilot results / LOI / pipeline
8. Competitor — Landscape map e differenziazione
9. Team — Founding team e advisory board
10. The Ask — Round, uso dei fondi, milestones

Per ogni slide: headline, 3-5 bullet, dati specifici, note per il presenter.`,
        label: 'Marketing: Pitch Deck',
      },
    ]);

    for (const [key, value] of phase5) {
      results[key] = value;
      this.orchestrator.artifacts.add({
        type: 'marketing',
        filePath: `docs/${slugify(key)}.md`,
        content: value,
        description: key,
        createdBy: 'marketing',
      });
    }

    // ════════════════════════════════════════
    // FINALIZE: Write all artifacts to disk
    // ════════════════════════════════════════
    this.print(verbose, 'bootstrap', 'Writing all artifacts to disk...');
    const writeResult = this.orchestrator.artifacts.writeAllToDisk();
    this.print(verbose, 'bootstrap', `Written ${writeResult.written} files, ${writeResult.errors.length} errors`);

    if (writeResult.errors.length > 0) {
      for (const err of writeResult.errors) {
        this.print(verbose, 'error', err);
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    // Build final report
    const report = [
      '',
      '═══════════════════════════════════════════════════════',
      '  FORGEAI BOOTSTRAP COMPLETE',
      '═══════════════════════════════════════════════════════',
      '',
      `  Duration: ${elapsed}s`,
      `  Artifacts generated: ${this.orchestrator.artifacts.size}`,
      `  Knowledge base entries: ${this.orchestrator.kb.size}`,
      `  Messages exchanged: ${this.orchestrator.getMessageLog().split('\n').length}`,
      '',
      '  Generated deliverables:',
      '',
      ...Object.keys(results).map(k => `    ✓ ${k}`),
      '',
      this.orchestrator.getArtifactsSummary(),
      '',
      '  All files written to: ./output/',
      '═══════════════════════════════════════════════════════',
    ].join('\n');

    return report;
  }

  /**
   * Run a single phase of the bootstrap.
   */
  async runPhase(phase: 1 | 2 | 3 | 4 | 5): Promise<string> {
    const phaseNames = {
      1: 'Strategy & Planning',
      2: 'Architecture & Design',
      3: 'Implementation',
      4: 'Quality & Infrastructure',
      5: 'Go-to-Market',
    };

    return this.orchestrator.runSprint(
      `ForgeAI Bootstrap — Phase ${phase}: ${phaseNames[phase]}`,
    );
  }

  private print(verbose: boolean, source: string, message: string): void {
    if (!verbose) return;
    const color = source === 'error' ? chalk.red : chalk.hex('#06B6D4');
    console.log(`${color(`[BOOTSTRAP]`)} ${message}`);
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}
