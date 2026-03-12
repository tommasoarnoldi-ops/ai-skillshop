// ============================================================
// Autonomy Loop — Agents self-direct, plan, execute, iterate
// ============================================================

import chalk from 'chalk';
import type { AgentId, Task } from '../types/index.js';
import type { BaseAgent } from './base-agent.js';
import type { MessageBus } from './message-bus.js';
import type { TaskBoard } from './task-board.js';
import type { KnowledgeBase } from './knowledge-base.js';
import type { ArtifactStore } from './artifact-store.js';

interface AgentRegistry {
  get(id: AgentId): BaseAgent | undefined;
}

export interface AutonomyConfig {
  maxCycles: number;        // Maximum number of plan-execute-evaluate cycles
  maxTasksPerCycle: number; // Max tasks an agent can create per cycle
  verbose: boolean;
  onCycleComplete?: (cycle: CycleReport) => void;
}

export interface CycleReport {
  cycle: number;
  planner: AgentId;
  tasksCreated: number;
  tasksCompleted: number;
  tasksFailed: number;
  artifacts: number;
  knowledgeAdded: number;
  duration: number;
  summary: string;
  shouldContinue: boolean;
}

/**
 * Autonomy Loop: the system self-directs through plan → execute → evaluate cycles.
 *
 * Each cycle:
 * 1. CEO evaluates current state and decides what to do next
 * 2. CEO creates tasks and assigns to agents
 * 3. Agents execute tasks (potentially creating sub-tasks)
 * 4. CEO evaluates results and decides: continue or stop
 *
 * This enables the system to run autonomously for extended periods,
 * building the ForgeAI startup incrementally.
 */
export class AutonomyLoop {
  private running = false;
  private cycleCount = 0;
  private cycleReports: CycleReport[] = [];

  constructor(
    private agents: AgentRegistry,
    private bus: MessageBus,
    private board: TaskBoard,
    private kb: KnowledgeBase,
    private artifacts: ArtifactStore,
  ) {}

  /**
   * Run the autonomy loop for a given objective.
   * The CEO plans, delegates, and evaluates until the objective is met
   * or maxCycles is reached.
   */
  async run(objective: string, config: AutonomyConfig): Promise<CycleReport[]> {
    this.running = true;
    this.cycleCount = 0;
    this.cycleReports = [];

    this.log(config.verbose, `Starting autonomy loop: "${objective}"`);
    this.log(config.verbose, `Max cycles: ${config.maxCycles}`);

    while (this.running && this.cycleCount < config.maxCycles) {
      this.cycleCount++;
      this.log(config.verbose, `\n═══ CYCLE ${this.cycleCount}/${config.maxCycles} ═══`);

      const cycleStart = Date.now();

      // ── PHASE 1: Plan ──
      this.log(config.verbose, 'Phase 1: CEO planning...');
      const plan = await this.planCycle(objective, config);

      // ── PHASE 2: Execute ──
      this.log(config.verbose, `Phase 2: Executing ${plan.length} tasks...`);
      const results = await this.executeCycle(plan, config);

      // ── PHASE 3: Evaluate ──
      this.log(config.verbose, 'Phase 3: CEO evaluating...');
      const evaluation = await this.evaluateCycle(objective, results, config);

      const report: CycleReport = {
        cycle: this.cycleCount,
        planner: 'ceo',
        tasksCreated: plan.length,
        tasksCompleted: results.filter(r => r.status === 'done').length,
        tasksFailed: results.filter(r => r.status === 'blocked').length,
        artifacts: this.artifacts.size,
        knowledgeAdded: this.kb.size,
        duration: Date.now() - cycleStart,
        summary: evaluation.summary,
        shouldContinue: evaluation.shouldContinue,
      };

      this.cycleReports.push(report);
      config.onCycleComplete?.(report);

      this.log(config.verbose, `Cycle ${this.cycleCount} complete: ${report.tasksCompleted}/${report.tasksCreated} tasks done`);
      this.log(config.verbose, `Continue: ${evaluation.shouldContinue ? 'YES' : 'NO — objective met or max cycles'}`);

      if (!evaluation.shouldContinue) {
        this.log(config.verbose, 'CEO decided to stop. Objective met or no more productive work.');
        break;
      }
    }

    this.running = false;
    this.log(config.verbose, `\nAutonomy loop completed after ${this.cycleCount} cycles`);
    return this.cycleReports;
  }

  /** Stop the loop early */
  stop(): void {
    this.running = false;
  }

  /** Whether the loop is currently running */
  get isRunning(): boolean {
    return this.running;
  }

  /** Get all cycle reports */
  getReports(): CycleReport[] {
    return [...this.cycleReports];
  }

  // ── Internal cycle phases ──

  private async planCycle(
    objective: string,
    config: AutonomyConfig,
  ): Promise<Task[]> {
    const ceo = this.agents.get('ceo');
    if (!ceo) throw new Error('CEO agent not found');

    // Build context for CEO
    const boardSummary = this.board.getSummary();
    const completedTasks = this.board.getTasksByStatus('done');
    const blockedTasks = this.board.getTasksByStatus('blocked');
    const kbSummary = this.kb.exportSummary();
    const previousCycles = this.cycleReports.slice(-3);

    const planTask = this.board.createTask({
      title: `Cycle ${this.cycleCount} Planning`,
      description: `Obiettivo: ${objective}

Stato attuale:
${boardSummary}

Task completati finora: ${completedTasks.length}
Task bloccati: ${blockedTasks.length}
Knowledge base entries: ${this.kb.size}
Artifacts generati: ${this.artifacts.size}

${previousCycles.length > 0 ? `Cicli precedenti:\n${previousCycles.map(c => `  Ciclo ${c.cycle}: ${c.tasksCompleted}/${c.tasksCreated} completati — ${c.summary.substring(0, 100)}`).join('\n')}` : 'Primo ciclo.'}

Pianifica i prossimi ${config.maxTasksPerCycle} task per avanzare verso l'obiettivo.
Per ogni task specifica titolo, agente, priorità, descrizione, deliverables.

IMPORTANTE: Non ripetere task già completati. Focalizzati su cosa manca.

Rispondi con un JSON array:
[{"title":"...","assignTo":"ceo|cto|product-manager|developer|marketing|qa-devops","priority":"critical|high|medium|low","description":"...","deliverables":["..."]}]`,
      priority: 'critical',
      assignedTo: 'ceo',
      createdBy: 'ceo',
    });

    ceo.queueTask(planTask);
    const result = await ceo.executeNextTask();
    const output = result?.output ?? '';

    // Parse tasks from CEO output
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    try {
      const taskDefs = JSON.parse(jsonMatch[0]) as Array<{
        title: string;
        assignTo: string;
        priority: string;
        description: string;
        deliverables?: string[];
      }>;

      const tasks: Task[] = [];
      for (const def of taskDefs.slice(0, config.maxTasksPerCycle)) {
        const task = this.board.createTask({
          title: def.title,
          description: def.description,
          priority: def.priority as Task['priority'],
          assignedTo: def.assignTo as AgentId,
          createdBy: 'ceo',
          deliverables: def.deliverables,
        });
        tasks.push(task);
      }

      return tasks;
    } catch {
      return [];
    }
  }

  private async executeCycle(
    tasks: Task[],
    config: AutonomyConfig,
  ): Promise<Task[]> {
    const results: Task[] = [];

    for (const task of tasks) {
      const agent = this.agents.get(task.assignedTo);
      if (!agent) continue;

      this.log(config.verbose, `  [${task.assignedTo}] ${task.title}`);

      agent.queueTask(task);
      const completed = await agent.executeNextTask();

      if (completed) {
        results.push(completed);

        // Save output to knowledge base
        if (completed.output && completed.status === 'done') {
          this.kb.put({
            category: 'decision',
            key: `cycle-${this.cycleCount}-${task.title}`.substring(0, 80),
            content: completed.output.substring(0, 3000),
            contributedBy: task.assignedTo,
            tags: [`cycle-${this.cycleCount}`, task.assignedTo],
          });
        }

        const icon = completed.status === 'done' ? '✓' : '✗';
        this.log(config.verbose, `  ${icon} ${task.title}`);
      }
    }

    return results;
  }

  private async evaluateCycle(
    objective: string,
    results: Task[],
    config: AutonomyConfig,
  ): Promise<{ summary: string; shouldContinue: boolean }> {
    const ceo = this.agents.get('ceo');
    if (!ceo) return { summary: 'No CEO agent', shouldContinue: false };

    const evalTask = this.board.createTask({
      title: `Evaluate Cycle ${this.cycleCount}`,
      description: `Obiettivo generale: ${objective}

Risultati ciclo ${this.cycleCount}:
${results.map(r => `- [${r.status}] ${r.title} (${r.assignedTo}): ${r.output?.substring(0, 150) ?? 'no output'}`).join('\n')}

Task completati: ${results.filter(r => r.status === 'done').length}/${results.length}
Cicli rimanenti: ${config.maxCycles - this.cycleCount}

Valuta:
1. Quanto siamo vicini all'obiettivo? (% stimata)
2. Cosa è stato fatto bene
3. Cosa è bloccato o ha bisogno di correzione
4. Dobbiamo continuare? (sì se c'è ancora lavoro produttivo, no se l'obiettivo è raggiunto o non ci sono più azioni utili)

Rispondi con JSON:
{"progress_percent": 0-100, "summary": "...", "should_continue": true/false, "next_focus": "..."}`,
      priority: 'critical',
      assignedTo: 'ceo',
      createdBy: 'ceo',
    });

    ceo.queueTask(evalTask);
    const evalResult = await ceo.executeNextTask();
    const output = evalResult?.output ?? '';

    // Parse evaluation
    const jsonMatch = output.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const eval_ = JSON.parse(jsonMatch[0]) as {
          progress_percent?: number;
          summary?: string;
          should_continue?: boolean;
        };
        return {
          summary: eval_.summary ?? output.substring(0, 500),
          shouldContinue: eval_.should_continue ?? false,
        };
      } catch {
        // fallthrough
      }
    }

    // Default: continue if we have cycles left
    return {
      summary: output.substring(0, 500),
      shouldContinue: this.cycleCount < config.maxCycles,
    };
  }

  private log(verbose: boolean, message: string): void {
    if (!verbose) return;
    console.log(chalk.hex('#A78BFA')(`[AUTONOMY] ${message}`));
  }
}
