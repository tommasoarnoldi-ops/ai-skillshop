// ============================================================
// Orchestrator — Coordinates all agents and manages workflows
// ============================================================

import chalk from 'chalk';
import type { AgentId, Task } from '../types/index.js';
import { MessageBus } from './message-bus.js';
import { TaskBoard } from './task-board.js';
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

    this.log('system', 'Orchestrator initialized with 6 agents');
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
      }
    }

    // Phase 3: CEO evaluates progress
    this.log('ceo', 'Evaluating progress...');
    const evaluation = await this.ceo.evaluateProgress();

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
      '--- Message Bus ---',
      `Total messages exchanged: ${this.bus.totalMessages}`,
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
    const outputs: Record<string, string> = {};

    // Step 1: CEO sets strategic direction
    this.log('ceo', 'Setting strategic direction...');
    const strategy = await this.ceo.createStrategicPlan(topic);
    outputs['CEO Strategy'] = strategy;

    // Step 2: PM creates product requirements
    this.log('product-manager', 'Creating product requirements...');
    const prd = await this.pm.createPRD(topic);
    outputs['Product Requirements'] = prd;

    // Step 3: CTO designs architecture
    this.log('cto', 'Designing technical architecture...');
    const architecture = await this.cto.designArchitecture(
      `${topic}\n\nProduct Requirements:\n${prd.substring(0, 1000)}`,
    );
    outputs['Technical Architecture'] = architecture;

    // Step 4: Developer generates implementation
    this.log('developer', 'Generating implementation...');
    const code = await this.developer.generateCode(
      `Feature: ${topic}\n\nArchitecture:\n${architecture.substring(0, 1000)}\n\nRequirements:\n${prd.substring(0, 500)}`,
    );
    outputs['Implementation'] = code;

    // Step 5: QA creates test plan
    this.log('qa-devops', 'Creating test plan...');
    const testPlan = await this.qa.createTestPlan(topic);
    outputs['Test Plan'] = testPlan;

    // Step 6: Marketing creates go-to-market angle
    this.log('marketing', 'Creating GTM angle...');
    const gtm = await this.marketing.generateContent(
      'feature brief',
      `Nuova feature ForgeAI: ${topic}`,
    );
    outputs['Marketing Brief'] = gtm;

    // Compile report
    const report = [
      '═══════════════════════════════════════════════',
      `COLLABORATIVE WORKFLOW: ${topic}`,
      '═══════════════════════════════════════════════',
      '',
      ...Object.entries(outputs).flatMap(([title, content]) => [
        `── ${title} ${'─'.repeat(Math.max(0, 40 - title.length))}`,
        content.substring(0, 2000),
        '',
      ]),
      `Messages exchanged: ${this.bus.totalMessages}`,
    ].join('\n');

    this.log('workflow', 'Collaborative workflow completed');
    return report;
  }

  /**
   * Ask a specific agent a question and get a response.
   */
  async askAgent(agentId: AgentId, question: string): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent) return `Agent ${agentId} not found.`;

    this.log(agentId, `Processing question...`);
    // Access the protected think method via a task
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

  // ---- Logging ----

  private log(source: string, message: string): void {
    if (!this.verbose) return;

    const colors: Record<string, (s: string) => string> = {
      system: chalk.gray,
      sprint: chalk.cyan,
      workflow: chalk.magenta,
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
