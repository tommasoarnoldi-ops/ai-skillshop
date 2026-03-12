// ============================================================
// Orchestrator — Coordinates all agents and manages workflows
// ============================================================

import chalk from 'chalk';
import type { AgentId, Task } from '../types/index.js';
import { MessageBus } from './message-bus.js';
import { TaskBoard } from './task-board.js';
import { KnowledgeBase } from './knowledge-base.js';
import { ArtifactStore } from './artifact-store.js';
import { CollaborationEngine } from './collaboration.js';
import { StatePersistence } from './state-persistence.js';
import { AutonomyLoop, type AutonomyConfig, type CycleReport } from './autonomy-loop.js';
import { MetricsTracker } from './metrics.js';
import { EventReactionEngine, createDefaultReactions } from './event-reactions.js';
import { CEOAgent } from '../agents/ceo-agent.js';
import { CTOAgent } from '../agents/cto-agent.js';
import { ProductManagerAgent } from '../agents/product-manager-agent.js';
import { DeveloperAgent } from '../agents/developer-agent.js';
import { MarketingAgent } from '../agents/marketing-agent.js';
import { QADevOpsAgent } from '../agents/qa-devops-agent.js';
import type { BaseAgent } from './base-agent.js';

export interface OrchestratorConfig {
  apiKey: string;
  verbose?: boolean;
  outputDir?: string;
  stateDir?: string;
}

/**
 * The Orchestrator initializes all agents, manages the message bus,
 * and coordinates multi-agent workflows for building ForgeAI.
 */
export class Orchestrator {
  private bus: MessageBus;
  private board: TaskBoard;
  private agents: Map<AgentId, BaseAgent>;
  private verbose: boolean;

  // Shared systems
  readonly kb: KnowledgeBase;
  readonly artifacts: ArtifactStore;
  readonly collaboration: CollaborationEngine;
  readonly persistence: StatePersistence;
  readonly autonomy: AutonomyLoop;
  readonly metrics: MetricsTracker;
  readonly reactions: EventReactionEngine;

  // Individual agent references for direct access
  readonly ceo: CEOAgent;
  readonly cto: CTOAgent;
  readonly pm: ProductManagerAgent;
  readonly developer: DeveloperAgent;
  readonly marketing: MarketingAgent;
  readonly qa: QADevOpsAgent;

  constructor(config: OrchestratorConfig) {
    this.bus = new MessageBus();
    this.board = new TaskBoard();
    this.kb = new KnowledgeBase();
    this.artifacts = new ArtifactStore(config.outputDir ?? './output');
    this.persistence = new StatePersistence(config.stateDir ?? './.forgeai-state');
    this.verbose = config.verbose ?? false;
    this.agents = new Map();

    // Initialize all agents
    this.ceo = new CEOAgent(this.bus, this.board, config.apiKey);
    this.cto = new CTOAgent(this.bus, this.board, config.apiKey);
    this.pm = new ProductManagerAgent(this.bus, this.board, config.apiKey);
    this.developer = new DeveloperAgent(this.bus, this.board, config.apiKey);
    this.marketing = new MarketingAgent(this.bus, this.board, config.apiKey);
    this.qa = new QADevOpsAgent(this.bus, this.board, config.apiKey);

    this.agents.set('ceo', this.ceo);
    this.agents.set('cto', this.cto);
    this.agents.set('product-manager', this.pm);
    this.agents.set('developer', this.developer);
    this.agents.set('marketing', this.marketing);
    this.agents.set('qa-devops', this.qa);

    // Initialize collaboration engine
    this.collaboration = new CollaborationEngine(
      this.agents,
      this.bus,
      this.board,
      this.kb,
      this.artifacts,
    );

    // Initialize autonomy loop
    this.autonomy = new AutonomyLoop(
      this.agents,
      this.bus,
      this.board,
      this.kb,
      this.artifacts,
    );

    // Initialize metrics tracker
    this.metrics = new MetricsTracker();

    // Initialize event reactions
    this.reactions = new EventReactionEngine(this.agents, this.bus, this.board);
    createDefaultReactions(this.reactions);

    // Seed knowledge base with ForgeAI project context
    this.seedKnowledgeBase();

    this.log('system', 'Orchestrator initialized: 6 agents + KB + Artifacts + Collaboration + Autonomy + Metrics + Reactions');
  }

  // ---- Knowledge Base Seeding ----

  private seedKnowledgeBase(): void {
    this.kb.put({
      category: 'architecture',
      key: 'tech-stack',
      content: 'React Native + Expo Router (SDK 52+), Zustand, SQLite (offline), Supabase (PostgreSQL + Auth + Storage + Edge Functions + pgvector), Claude API (claude-sonnet-4-20250514)',
      contributedBy: 'cto',
      tags: ['stack', 'foundation'],
    });

    this.kb.put({
      category: 'market_intel',
      key: 'target-market',
      content: 'PMI manifatturiere italiane, 50-500 dipendenti. Lancio Emilia-Romagna (distretto meccanica). Connected Worker Market: $8.6B (2025), CAGR 18.5%. Competitor: Augmentir, Tulip, Poka — tutti enterprise, nessuno smartphone-first per PMI.',
      contributedBy: 'marketing',
      tags: ['market', 'competitor', 'target'],
    });

    this.kb.put({
      category: 'requirements',
      key: 'mvp-features',
      content: '1. Scanner macchinari (camera → AI vision → ID)\n2. Guida step-by-step (procedure + verifica AI visiva)\n3. Knowledge base chat (RAG)\n4. Dashboard manager (analytics)\n5. Offline mode (cache + sync)',
      contributedBy: 'product-manager',
      tags: ['mvp', 'features', 'priority'],
    });

    this.kb.put({
      category: 'brand',
      key: 'pricing',
      content: 'SaaS B2B. Starter: €499/mese (1 reparto, 10 operatori, 50 procedure). Pro: €1.499/mese (illimitato). Setup fee: €5-15K.',
      contributedBy: 'marketing',
      tags: ['pricing', 'business-model'],
    });

    this.kb.put({
      category: 'user_research',
      key: 'personas',
      content: '1. Operatore Junior (25-35): nuovo assunto, deve imparare rapidamente\n2. Operatore Senior (50-65): conosce tutto, documenta prima della pensione\n3. Manager Stabilimento (40-55): visibilità competenze team e compliance',
      contributedBy: 'product-manager',
      tags: ['personas', 'users'],
    });

    this.kb.put({
      category: 'architecture',
      key: 'ux-principles',
      content: 'Tema scuro (riduce riflessi), touch target ≥ 48px (guanti), font ≥ 15px, contrasto WCAG AA+, uso con una mano, voice-first ready, feedback haptics.',
      contributedBy: 'product-manager',
      tags: ['ux', 'design', 'accessibility'],
    });
  }

  // ---- High-level workflows ----

  /**
   * Run a full sprint: CEO plans → agents execute → CEO evaluates.
   */
  async runSprint(goal: string): Promise<string> {
    this.log('sprint', `Starting sprint: "${goal}"`);

    // Phase 1: CEO creates strategic plan and assigns tasks
    this.log('ceo', 'Creating strategic plan...');
    const tasks = await this.ceo.planSprint(goal);
    this.log('ceo', `Created ${tasks.length} tasks`);

    if (tasks.length === 0) {
      return 'No tasks were created. The CEO could not parse the plan.';
    }

    // Phase 2: Execute tasks in dependency order
    this.log('sprint', 'Executing tasks...');
    const results: string[] = [];

    for (const task of tasks) {
      const agent = this.agents.get(task.assignedTo);
      if (!agent) {
        this.log('error', `No agent found for ${task.assignedTo}`);
        continue;
      }

      this.log(task.assignedTo, `Executing: ${task.title}`);
      agent.queueTask(task);
      const completed = await agent.executeNextTask();

      if (completed) {
        const status = completed.status === 'done' ? chalk.green('DONE') : chalk.red('BLOCKED');
        this.log(task.assignedTo, `${status} — ${task.title}`);
        results.push(`[${task.assignedTo}] ${task.title}: ${completed.output?.substring(0, 200) ?? 'no output'}`);

        // Store output in knowledge base
        if (completed.output) {
          this.kb.put({
            category: 'decision',
            key: `sprint-task-${task.title}`,
            content: completed.output.substring(0, 2000),
            contributedBy: task.assignedTo,
            tags: ['sprint', goal],
          });
        }
      }
    }

    // Phase 3: CEO evaluates progress
    this.log('ceo', 'Evaluating progress...');
    const evaluation = await this.ceo.evaluateProgress();

    // Save state
    this.saveState();

    const report = [
      '═══════════════════════════════════════',
      `SPRINT REPORT: ${goal}`,
      '═══════════════════════════════════════',
      '',
      `Tasks completed: ${results.length}/${tasks.length}`,
      '',
      '--- Task Results ---',
      ...results,
      '',
      '--- CEO Evaluation ---',
      evaluation,
      '',
      '--- System Stats ---',
      `Messages exchanged: ${this.bus.totalMessages}`,
      `Knowledge base entries: ${this.kb.size}`,
      `Artifacts generated: ${this.artifacts.size}`,
      '',
      this.board.getSummary(),
    ].join('\n');

    this.log('sprint', 'Sprint completed');
    return report;
  }

  /**
   * Run a collaborative workflow where agents work together on a topic.
   * Flow: CEO → PM (requirements) → CTO (architecture) → Dev (implementation) → QA (review)
   */
  async runCollaborativeWorkflow(topic: string): Promise<string> {
    this.log('workflow', `Starting collaborative workflow: "${topic}"`);

    // Get existing knowledge context
    const kbContext = this.kb.getContextFor(topic);
    this.log('workflow', `Knowledge base context: ${kbContext.length > 50 ? 'found' : 'minimal'}`);

    const outputs: Record<string, string> = {};

    // Step 1: CEO sets strategic direction
    this.log('ceo', 'Setting strategic direction...');
    const strategy = await this.ceo.createStrategicPlan(topic);
    outputs['CEO Strategy'] = strategy;

    // Step 2: PM creates product requirements
    this.log('product-manager', 'Creating product requirements...');
    const prd = await this.pm.createPRD(topic);
    outputs['Product Requirements'] = prd;
    this.artifacts.add({
      type: 'document',
      filePath: `docs/prd-${slugify(topic)}.md`,
      content: prd,
      description: `PRD for ${topic}`,
      createdBy: 'product-manager',
    });

    // Step 3: CTO designs architecture
    this.log('cto', 'Designing technical architecture...');
    const architecture = await this.cto.designArchitecture(
      `${topic}\n\nProduct Requirements:\n${prd.substring(0, 1000)}`,
    );
    outputs['Technical Architecture'] = architecture;
    this.artifacts.add({
      type: 'document',
      filePath: `docs/architecture-${slugify(topic)}.md`,
      content: architecture,
      description: `Architecture design for ${topic}`,
      createdBy: 'cto',
    });

    // Step 4: Developer generates implementation
    this.log('developer', 'Generating implementation...');
    const code = await this.developer.generateCode(
      `Feature: ${topic}\n\nArchitecture:\n${architecture.substring(0, 1000)}\n\nRequirements:\n${prd.substring(0, 500)}`,
    );
    outputs['Implementation'] = code;
    this.artifacts.add({
      type: 'code',
      filePath: `src/features/${slugify(topic)}.ts`,
      content: code,
      description: `Implementation of ${topic}`,
      createdBy: 'developer',
    });

    // Step 5: QA reviews implementation
    this.log('qa-devops', 'Reviewing implementation...');
    const review = await this.collaboration.review({
      authorId: 'developer',
      reviewerId: 'qa-devops',
      subject: topic,
      content: code,
    });
    outputs['QA Review'] = review.feedback;

    // Step 6: QA creates test plan
    this.log('qa-devops', 'Creating test plan...');
    const testPlan = await this.qa.createTestPlan(topic);
    outputs['Test Plan'] = testPlan;
    this.artifacts.add({
      type: 'test',
      filePath: `tests/${slugify(topic)}.test.md`,
      content: testPlan,
      description: `Test plan for ${topic}`,
      createdBy: 'qa-devops',
    });

    // Step 7: Marketing creates go-to-market angle
    this.log('marketing', 'Creating GTM angle...');
    const gtm = await this.marketing.generateContent(
      'feature brief',
      `Nuova feature ForgeAI: ${topic}`,
    );
    outputs['Marketing Brief'] = gtm;

    // Store all in knowledge base
    for (const [key, value] of Object.entries(outputs)) {
      this.kb.put({
        category: key.includes('Architecture') ? 'architecture' :
                  key.includes('Requirements') ? 'requirements' :
                  key.includes('Marketing') ? 'brand' : 'decision',
        key: `${slugify(topic)}-${slugify(key)}`,
        content: value.substring(0, 3000),
        contributedBy: key.includes('CEO') ? 'ceo' :
                       key.includes('CTO') || key.includes('Architecture') ? 'cto' :
                       key.includes('Product') ? 'product-manager' :
                       key.includes('Developer') || key.includes('Implementation') ? 'developer' :
                       key.includes('Marketing') ? 'marketing' : 'qa-devops',
        tags: [topic, key],
      });
    }

    // Write artifacts to disk
    const writeResult = this.artifacts.writeAllToDisk();
    this.log('workflow', `Artifacts written: ${writeResult.written}, errors: ${writeResult.errors.length}`);

    // Save state
    this.saveState();

    // Compile report
    const report = [
      '═══════════════════════════════════════════════',
      `COLLABORATIVE WORKFLOW: ${topic}`,
      '═══════════════════════════════════════════════',
      '',
      `QA Review: ${review.approved ? '✅ APPROVED' : '❌ CHANGES REQUESTED'}`,
      '',
      ...Object.entries(outputs).flatMap(([title, content]) => [
        `── ${title} ${'─'.repeat(Math.max(0, 40 - title.length))}`,
        content.substring(0, 2000),
        '',
      ]),
      '--- System Stats ---',
      `Messages exchanged: ${this.bus.totalMessages}`,
      `Knowledge base entries: ${this.kb.size}`,
      `Artifacts generated: ${this.artifacts.size}`,
      '',
      this.artifacts.getSummary(),
    ].join('\n');

    this.log('workflow', 'Collaborative workflow completed');
    return report;
  }

  /**
   * Run a debate between two agents, with a third deciding.
   */
  async runDebate(
    topic: string,
    agent1: AgentId,
    agent2: AgentId,
    decider: AgentId = 'ceo',
    rounds: number = 2,
  ): Promise<string> {
    this.log('debate', `Starting debate: "${topic}" (${agent1} vs ${agent2}, decided by ${decider})`);

    const result = await this.collaboration.debate({
      topic,
      participant1: agent1,
      participant2: agent2,
      deciderId: decider,
      rounds,
    });

    const report = [
      '═══════════════════════════════════════════════',
      `DEBATE: ${topic}`,
      '═══════════════════════════════════════════════',
      '',
      ...result.rounds.map(r =>
        `── Round ${r.round} — ${r.speaker} ${'─'.repeat(20)}\n${r.argument.substring(0, 1500)}\n`,
      ),
      `── DECISION (${result.decidedBy}) ${'─'.repeat(20)}`,
      result.conclusion,
    ].join('\n');

    return report;
  }

  /**
   * Run a production pipeline (e.g., requirements → architecture → code → tests).
   */
  async runPipeline(
    name: string,
    initialInput: string,
    stages: Array<{ agentId: AgentId; instruction: string }>,
  ): Promise<string> {
    this.log('pipeline', `Starting pipeline: "${name}" with ${stages.length} stages`);

    const result = await this.collaboration.pipeline({
      name,
      initialInput,
      stages: stages.map((s, i) => ({
        ...s,
        outputPath: `pipeline/${slugify(name)}/stage-${i + 1}-${s.agentId}.md`,
        outputType: 'document' as const,
      })),
    });

    // Write artifacts
    this.artifacts.writeAllToDisk();
    this.saveState();

    const report = [
      '═══════════════════════════════════════════════',
      `PIPELINE: ${name}`,
      '═══════════════════════════════════════════════',
      '',
      ...result.stages.map((s, i) => [
        `── Stage ${i + 1}: ${s.agentId} (${s.duration}ms) ──`,
        s.output.substring(0, 1500),
        '',
      ].join('\n')),
      '── FINAL OUTPUT ──',
      result.finalOutput.substring(0, 3000),
    ].join('\n');

    return report;
  }

  /**
   * Run parallel tasks across agents.
   */
  async runParallel(
    tasks: Array<{ agentId: AgentId; instruction: string; label?: string }>,
  ): Promise<string> {
    this.log('parallel', `Running ${tasks.length} tasks in parallel`);

    const results = await this.collaboration.parallel(
      tasks.map(t => ({
        agentId: t.agentId,
        instruction: t.instruction,
        outputKey: t.label ?? t.agentId,
      })),
    );

    const report = [
      '═══════════════════════════════════════════════',
      `PARALLEL EXECUTION (${tasks.length} tasks)`,
      '═══════════════════════════════════════════════',
      '',
      ...Array.from(results.entries()).map(([key, output]) =>
        `── ${key} ${'─'.repeat(Math.max(0, 40 - key.length))}\n${output.substring(0, 2000)}\n`,
      ),
    ].join('\n');

    return report;
  }

  /**
   * Run the system autonomously — CEO plans, agents execute, iterate.
   */
  async runAutonomous(
    objective: string,
    config?: Partial<AutonomyConfig>,
  ): Promise<string> {
    const fullConfig: AutonomyConfig = {
      maxCycles: config?.maxCycles ?? 5,
      maxTasksPerCycle: config?.maxTasksPerCycle ?? 4,
      verbose: config?.verbose ?? this.verbose,
      onCycleComplete: (report) => {
        this.metrics.recordCycle(report);
        this.log('autonomy', `Cycle ${report.cycle}: ${report.tasksCompleted}/${report.tasksCreated} tasks — ${report.summary.substring(0, 80)}`);
      },
    };

    this.log('autonomy', `Starting autonomous execution: "${objective}"`);
    this.log('autonomy', `Max ${fullConfig.maxCycles} cycles, ${fullConfig.maxTasksPerCycle} tasks/cycle`);

    const reports = await this.autonomy.run(objective, fullConfig);
    this.saveState();

    const totalCompleted = reports.reduce((s, r) => s + r.tasksCompleted, 0);
    const totalCreated = reports.reduce((s, r) => s + r.tasksCreated, 0);
    const totalDuration = reports.reduce((s, r) => s + r.duration, 0);

    const result = [
      '═══════════════════════════════════════════════════════',
      `  AUTONOMOUS EXECUTION REPORT`,
      '═══════════════════════════════════════════════════════',
      '',
      `  Objective: ${objective}`,
      `  Cycles completed: ${reports.length}`,
      `  Total tasks: ${totalCompleted}/${totalCreated} completed`,
      `  Total duration: ${(totalDuration / 1000).toFixed(1)}s`,
      '',
      '  ── Cycle Details ──',
      '',
      ...reports.map(r => [
        `  Cycle ${r.cycle}: ${r.tasksCompleted}/${r.tasksCreated} tasks (${(r.duration / 1000).toFixed(1)}s)`,
        `    ${r.summary.substring(0, 150)}`,
      ].join('\n')),
      '',
      '  ── System State ──',
      '',
      `  Knowledge base: ${this.kb.size} entries`,
      `  Artifacts: ${this.artifacts.size} files`,
      `  Messages: ${this.bus.totalMessages}`,
      '',
      this.board.getSummary(),
      '',
      this.metrics.generateReport(),
    ].join('\n');

    return result;
  }

  /**
   * Ask a specific agent a question and get a response.
   */
  async askAgent(agentId: AgentId, question: string): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent) return `Agent ${agentId} not found.`;

    this.log(agentId, 'Processing question...');
    const task = this.board.createTask({
      title: `Answer: ${question.substring(0, 50)}`,
      description: question,
      priority: 'medium',
      assignedTo: agentId,
      createdBy: 'ceo',
      deliverables: ['Detailed answer'],
    });

    agent.queueTask(task);
    const completed = await agent.executeNextTask();
    return completed?.output ?? 'No response generated.';
  }

  /**
   * Get the current status of all agents.
   */
  getStatus(): string {
    const lines = [
      '═══════════════════════════════════════',
      'FORGEAI AGENT SYSTEM STATUS',
      '═══════════════════════════════════════',
      '',
    ];

    for (const [id, agent] of this.agents) {
      const state = agent.getState();
      const statusIcon = {
        idle: '🟢',
        thinking: '🟡',
        executing: '🔵',
        waiting: '⏳',
        error: '🔴',
      }[state.status];

      lines.push(
        `${statusIcon} ${agent.config.name} (${id})`,
        `   Role: ${agent.config.role}`,
        `   Status: ${state.status}`,
        `   Tasks in queue: ${state.taskQueue.length}`,
        `   Completed tasks: ${state.completedTasks.length}`,
        `   Decisions made: ${state.memory.decisions.length}`,
        `   Learnings: ${state.memory.learnings.length}`,
        '',
      );
    }

    lines.push(this.board.getSummary());
    lines.push(`\nTotal messages: ${this.bus.totalMessages}`);
    lines.push(`Knowledge base: ${this.kb.size} entries`);
    lines.push(`Artifacts: ${this.artifacts.size} files`);

    return lines.join('\n');
  }

  /**
   * Get the message log.
   */
  getMessageLog(): string {
    const messages = this.bus.getLog();
    if (messages.length === 0) return 'No messages yet.';

    return messages
      .map((m) => {
        const time = m.timestamp.toISOString().substring(11, 19);
        return `[${time}] ${m.from} → ${m.to} (${m.type}): ${m.subject}`;
      })
      .join('\n');
  }

  /**
   * Get knowledge base summary.
   */
  getKnowledgeSummary(): string {
    return this.kb.exportSummary();
  }

  /**
   * Get artifacts summary.
   */
  getArtifactsSummary(): string {
    return this.artifacts.getSummary();
  }

  /**
   * Get metrics report.
   */
  getMetricsReport(): string {
    return this.metrics.generateReport();
  }

  /**
   * Get event reactions summary.
   */
  getReactionsSummary(): string {
    return this.reactions.getSummary();
  }

  // ---- State persistence ----

  private saveState(): void {
    try {
      const snapshot = {
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        agents: Array.from(this.agents.entries()).map(([_id, agent]) => {
          const state = agent.getState();
          return {
            id: state.id,
            completedTaskCount: state.completedTasks.length,
            queuedTaskCount: state.taskQueue.length,
            decisions: state.memory.decisions,
            context: state.memory.context,
            learnings: state.memory.learnings,
          };
        }),
        tasks: this.board.getAllTasks(),
        messages: this.bus.getLog(),
        knowledge: [],
        artifacts: [],
        metadata: {
          totalMessages: this.bus.totalMessages,
          knowledgeEntries: this.kb.size,
          artifactCount: this.artifacts.size,
        },
      };

      this.persistence.save(snapshot);
      this.log('system', 'State saved');
    } catch (error) {
      this.log('error', `Failed to save state: ${error}`);
    }
  }

  // ---- Logging ----

  private log(source: string, message: string): void {
    if (!this.verbose) return;

    const colors: Record<string, (s: string) => string> = {
      system: chalk.gray,
      sprint: chalk.cyan,
      workflow: chalk.magenta,
      debate: chalk.hex('#8B5CF6'),
      pipeline: chalk.hex('#06B6D4'),
      parallel: chalk.hex('#14B8A6'),
      ceo: chalk.yellow,
      cto: chalk.blue,
      'product-manager': chalk.green,
      developer: chalk.white,
      marketing: chalk.hex('#F59E0B'),
      'qa-devops': chalk.red,
      error: chalk.bgRed.white,
    };

    const colorFn = colors[source] ?? chalk.white;
    const prefix = colorFn(`[${source.toUpperCase()}]`);
    console.log(`${prefix} ${message}`);
  }
}

// ---- Helpers ----

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}
