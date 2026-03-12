// ============================================================
// Startup Workflow Presets — Common multi-agent tasks
// ============================================================

import type { Orchestrator } from '../core/orchestrator.js';
import type { AgentId } from '../types/index.js';

interface WorkflowPreset {
  name: string;
  description: string;
  steps: Array<{
    type: 'parallel' | 'pipeline' | 'debate' | 'workflow' | 'sprint';
    config: Record<string, unknown>;
  }>;
}

/**
 * Pre-built workflow presets for common startup operations.
 * Each preset orchestrates multiple agents on a specific task.
 */
export class StartupWorkflows {
  constructor(private orchestrator: Orchestrator) {}

  /** List all available presets */
  listPresets(): WorkflowPreset[] {
    return [
      {
        name: 'feature-spec',
        description: 'Full feature specification: PM writes PRD → CTO designs architecture → Dev estimates',
        steps: [],
      },
      {
        name: 'tech-review',
        description: 'Technical review: Dev implements → CTO reviews → QA creates tests',
        steps: [],
      },
      {
        name: 'pitch-prep',
        description: 'Investor pitch preparation: CEO strategy → Marketing pitch deck → PM demo script',
        steps: [],
      },
      {
        name: 'sprint-plan',
        description: 'Sprint planning: CEO defines goals → PM writes stories → CTO estimates → Dev breaks down',
        steps: [],
      },
      {
        name: 'incident-response',
        description: 'Incident response: QA diagnoses → Dev fixes → CTO reviews → CEO communicates',
        steps: [],
      },
      {
        name: 'market-analysis',
        description: 'Market analysis: Marketing researches → CEO evaluates → PM adjusts roadmap',
        steps: [],
      },
    ];
  }

  /**
   * Feature Specification — End-to-end feature design.
   * PM → CTO → Developer → QA
   */
  async featureSpec(featureName: string): Promise<string> {
    return this.orchestrator.runPipeline(
      `Feature Spec: ${featureName}`,
      `Feature da specificare per ForgeAI: ${featureName}. Contesto: app smartphone-first per operatori industriali PMI manifatturiere.`,
      [
        {
          agentId: 'product-manager',
          instruction: `Crea il PRD completo per "${featureName}". Includi: user stories con acceptance criteria, user flow dettagliato, wireframe ASCII, requisiti funzionali e non-funzionali, edge cases, success metrics, out of scope.`,
        },
        {
          agentId: 'cto',
          instruction: `Basandoti sul PRD ricevuto, progetta l'architettura tecnica per "${featureName}". Includi: componenti coinvolti, data model, API endpoints, AI integration, offline behavior, security considerations, implementation steps ordinati.`,
        },
        {
          agentId: 'developer',
          instruction: `Basandoti su PRD e architettura, genera il codice core per "${featureName}". Produci: componenti React Native, servizi, store Zustand, hooks. Codice TypeScript completo e funzionante.`,
        },
        {
          agentId: 'qa-devops',
          instruction: `Basandoti sull'implementazione, crea il test plan per "${featureName}". Includi: test cases (unit, integration, E2E), edge cases specifici, test offline, performance benchmarks, security checks.`,
        },
      ],
    );
  }

  /**
   * Technical Review — Code review workflow.
   * Developer → CTO review → QA review → Decision
   */
  async techReview(topic: string, codeOrDesign: string): Promise<string> {
    // CTO and QA review in parallel
    const reviews = await this.orchestrator.runParallel([
      {
        agentId: 'cto',
        instruction: `Review tecnica di "${topic}":\n\n${codeOrDesign.substring(0, 3000)}\n\nValuta: architettura, scalabilità, sicurezza, performance, aderenza allo stack ForgeAI. Fornisci feedback specifico con approve/reject.`,
        label: 'CTO Review',
      },
      {
        agentId: 'qa-devops',
        instruction: `Review qualità di "${topic}":\n\n${codeOrDesign.substring(0, 3000)}\n\nValuta: testabilità, error handling, edge cases, accessibility, offline behavior, coding standards. Fornisci feedback specifico.`,
        label: 'QA Review',
      },
    ]);

    let report = `\n═══ Technical Review: ${topic} ═══\n\n`;
    for (const [label, output] of reviews) {
      report += `── ${label} ──\n${output}\n\n`;
    }

    return report;
  }

  /**
   * Pitch Preparation — Build investor pitch materials.
   * CEO + Marketing + PM in parallel, then CEO synthesis.
   */
  async pitchPrep(context: string): Promise<string> {
    // Phase 1: Parallel preparation
    const materials = await this.orchestrator.runParallel([
      {
        agentId: 'ceo',
        instruction: `Prepara la narrativa strategica per il pitch ForgeAI agli investitori. ${context}\n\nIncludi: vision statement, moat competitivo, strategia di crescita 3 anni, unit economics target, team story, the ask (round size, uso fondi, milestones).`,
        label: 'CEO: Narrative',
      },
      {
        agentId: 'marketing',
        instruction: `Crea il pitch deck ForgeAI (10 slide) con contenuti completi. ${context}\n\nPer ogni slide: headline, bullet points, dati chiave, note presenter. Focus su: problema/soluzione, mercato, traction, differenziazione.`,
        label: 'Marketing: Pitch Deck',
      },
      {
        agentId: 'product-manager',
        instruction: `Prepara lo script della demo ForgeAI per investitori. ${context}\n\nScenario: operatore che deve eseguire setup macchinario CNC. Mostra: scanner → procedura → verifica AI → knowledge base. Script minuto per minuto con talking points.`,
        label: 'PM: Demo Script',
      },
    ]);

    // Phase 2: CEO synthesizes
    let allMaterials = '';
    for (const [label, output] of materials) {
      allMaterials += `\n--- ${label} ---\n${output.substring(0, 1500)}\n`;
    }

    const synthesis = await this.orchestrator.askAgent(
      'ceo',
      `Sintetizza questi materiali per il pitch ForgeAI in un brief esecutivo coerente:\n${allMaterials}\n\nProduci: 1) Elevator pitch (30 secondi), 2) Key talking points (5 punti), 3) Obiezioni anticipate e risposte, 4) Follow-up strategy post-pitch.`,
    );

    let report = `\n═══ Pitch Preparation ═══\n\n`;
    for (const [label, output] of materials) {
      report += `── ${label} ──\n${output}\n\n`;
      this.orchestrator.artifacts.add({
        type: 'marketing',
        filePath: `docs/pitch/${slugify(label)}.md`,
        content: output,
        description: label,
        createdBy: label.startsWith('CEO') ? 'ceo' : label.startsWith('Marketing') ? 'marketing' : 'product-manager',
      });
    }

    report += `── CEO: Executive Brief ──\n${synthesis}\n`;
    this.orchestrator.artifacts.add({
      type: 'marketing',
      filePath: 'docs/pitch/executive-brief.md',
      content: synthesis,
      description: 'CEO Executive Brief',
      createdBy: 'ceo',
    });

    this.orchestrator.artifacts.writeAllToDisk();
    return report;
  }

  /**
   * Sprint Planning — Full sprint planning cycle.
   * CEO → PM → CTO → CEO decision
   */
  async sprintPlan(sprintGoal: string): Promise<string> {
    return this.orchestrator.runPipeline(
      `Sprint Plan: ${sprintGoal}`,
      `Obiettivo dello sprint ForgeAI: ${sprintGoal}`,
      [
        {
          agentId: 'ceo',
          instruction: `Definisci gli obiettivi strategici per lo sprint "${sprintGoal}". Includi: obiettivi misurabili, priorità, risorse disponibili, vincoli.`,
        },
        {
          agentId: 'product-manager',
          instruction: `Basandoti sugli obiettivi CEO, scrivi le user stories per lo sprint. Per ogni story: titolo, descrizione, acceptance criteria, story points (1-13), priority (P0-P3). Ordina per priorità.`,
        },
        {
          agentId: 'cto',
          instruction: `Basandoti sulle user stories del PM, fai la stima tecnica e identifica: dipendenze tecniche, rischi tecnici, spike necessari, story da splittare. Proponi la composizione dello sprint (quali story ci stanno in 2 settimane).`,
        },
        {
          agentId: 'ceo',
          instruction: `Finalizza il piano sprint. Basandoti su stories del PM e stime del CTO: conferma le story selezionate, definisci gli sprint goals misurabili, assegna le responsabilità, identifica i check-point mid-sprint.`,
        },
      ],
    );
  }

  /**
   * Market Analysis — Deep dive su un aspetto del mercato.
   * Marketing → CEO → PM
   */
  async marketAnalysis(topic: string): Promise<string> {
    return this.orchestrator.runPipeline(
      `Market Analysis: ${topic}`,
      `Analisi di mercato per ForgeAI sul tema: ${topic}. Mercato target: PMI manifatturiere italiane 50-500 dipendenti, Connected Worker Market $8.6B.`,
      [
        {
          agentId: 'marketing',
          instruction: `Conduci un'analisi di mercato approfondita su "${topic}" per ForgeAI. Includi: dimensione mercato, trend, competitor analysis, customer insights, canali di acquisizione, pricing benchmark, barriere all'ingresso.`,
        },
        {
          agentId: 'ceo',
          instruction: `Valuta l'analisi di mercato e definisci le implicazioni strategiche per ForgeAI. Includi: opportunità da cogliere, rischi da mitigare, pivot necessari, investimenti da fare, timeline decisionale.`,
        },
        {
          agentId: 'product-manager',
          instruction: `Basandoti sull'analisi di mercato e la valutazione CEO, definisci le implicazioni per il prodotto. Includi: features da aggiungere/rimuovere, cambiamenti di priorità, nuovi user needs identificati, aggiustamenti al roadmap.`,
        },
      ],
    );
  }

  /**
   * Run a preset by name.
   */
  async runPreset(name: string, input: string): Promise<string> {
    switch (name) {
      case 'feature-spec':
        return this.featureSpec(input);
      case 'tech-review':
        return this.techReview(input, '');
      case 'pitch-prep':
        return this.pitchPrep(input);
      case 'sprint-plan':
        return this.sprintPlan(input);
      case 'market-analysis':
        return this.marketAnalysis(input);
      default:
        return `Unknown preset: ${name}. Available: ${this.listPresets().map(p => p.name).join(', ')}`;
    }
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);
}
