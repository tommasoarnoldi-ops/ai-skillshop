// ============================================================
// Dashboard — Consolidated project health view
// ============================================================

import chalk from 'chalk';
import type { AgentId } from '../types/index.js';
import type { TaskBoard } from './task-board.js';
import type { KnowledgeBase } from './knowledge-base.js';
import type { ArtifactStore } from './artifact-store.js';
import type { MetricsTracker } from './metrics.js';
import type { MessageBus } from './message-bus.js';
import type { Scheduler } from './scheduler.js';
import type { EventReactionEngine } from './event-reactions.js';
import type { BaseAgent } from './base-agent.js';

interface AgentRegistry {
  get(id: AgentId): BaseAgent | undefined;
  entries(): IterableIterator<[AgentId, BaseAgent]>;
}

/**
 * Consolidated dashboard showing entire system health at a glance.
 */
export class Dashboard {
  constructor(
    private agentMap: AgentRegistry,
    private board: TaskBoard,
    private kb: KnowledgeBase,
    private artifacts: ArtifactStore,
    private metrics: MetricsTracker,
    private bus: MessageBus,
    private scheduler: Scheduler,
    private reactions: EventReactionEngine,
  ) {}

  /** Generate a full dashboard view */
  render(): string {
    const sys = this.metrics.getSystemMetrics();
    const uptimeMin = Math.round(sys.uptime / 60000);
    const allTasks = this.board.getAllTasks();
    const messages = this.bus.getLog();

    const sections: string[] = [];

    // ── Header ──
    sections.push([
      '',
      chalk.bold.cyan('╔═══════════════════════════════════════════════════════════════╗'),
      chalk.bold.cyan('║') + chalk.bold.white('              FORGEAI PROJECT DASHBOARD                     ') + chalk.bold.cyan('║'),
      chalk.bold.cyan('╚═══════════════════════════════════════════════════════════════╝'),
      '',
    ].join('\n'));

    // ── System Overview ──
    sections.push(this.renderSection('SYSTEM OVERVIEW', [
      `Uptime: ${uptimeMin}m`,
      `Autonomy Cycles: ${sys.totalCycles}`,
      `Total Tasks: ${sys.totalTasks} (${sys.completedTasks} done, ${sys.failedTasks} failed)`,
      `Completion Rate: ${(sys.completionRate * 100).toFixed(1)}%`,
      `Messages: ${sys.totalMessages}`,
      `Knowledge Base: ${this.kb.size} entries`,
      `Artifacts: ${this.artifacts.size} files`,
    ]));

    // ── Agent Status ──
    const agentLines: string[] = [];
    const agents: AgentId[] = ['ceo', 'cto', 'product-manager', 'developer', 'marketing', 'qa-devops'];
    for (const id of agents) {
      const agent = this.agentMap.get(id);
      if (!agent) continue;
      const state = agent.getState();
      const m = sys.agentMetrics.find(x => x.agentId === id);
      const statusIcon = { idle: '🟢', thinking: '🟡', executing: '🔵', waiting: '⏳', error: '🔴' }[state.status];
      agentLines.push(
        `${statusIcon} ${id.padEnd(17)} ${String(m?.tasksCompleted ?? 0).padStart(3)} done  ${String(state.taskQueue.length).padStart(2)} queued  ${String(state.memory.decisions.length).padStart(2)} decisions`,
      );
    }
    sections.push(this.renderSection('AGENT STATUS', agentLines));

    // ── Task Board ──
    const tasksByStatus = {
      backlog: allTasks.filter(t => t.status === 'backlog').length,
      ready: allTasks.filter(t => t.status === 'ready').length,
      in_progress: allTasks.filter(t => t.status === 'in_progress').length,
      review: allTasks.filter(t => t.status === 'review').length,
      done: allTasks.filter(t => t.status === 'done').length,
      blocked: allTasks.filter(t => t.status === 'blocked').length,
    };
    const bar = (count: number, max: number, char: string) => {
      const len = max > 0 ? Math.round((count / max) * 20) : 0;
      return char.repeat(len);
    };
    const maxTasks = Math.max(1, ...Object.values(tasksByStatus));

    sections.push(this.renderSection('TASK BOARD', [
      `Backlog:     ${String(tasksByStatus.backlog).padStart(3)} ${chalk.gray(bar(tasksByStatus.backlog, maxTasks, '░'))}`,
      `Ready:       ${String(tasksByStatus.ready).padStart(3)} ${chalk.blue(bar(tasksByStatus.ready, maxTasks, '▒'))}`,
      `In Progress: ${String(tasksByStatus.in_progress).padStart(3)} ${chalk.yellow(bar(tasksByStatus.in_progress, maxTasks, '▓'))}`,
      `Review:      ${String(tasksByStatus.review).padStart(3)} ${chalk.cyan(bar(tasksByStatus.review, maxTasks, '▓'))}`,
      `Done:        ${String(tasksByStatus.done).padStart(3)} ${chalk.green(bar(tasksByStatus.done, maxTasks, '█'))}`,
      `Blocked:     ${String(tasksByStatus.blocked).padStart(3)} ${chalk.red(bar(tasksByStatus.blocked, maxTasks, '█'))}`,
    ]));

    // ── Knowledge Base ──
    const kbCategories = ['architecture', 'requirements', 'decision', 'market_intel', 'brand', 'user_research', 'testing', 'infrastructure', 'learning'] as const;
    const kbLines: string[] = [];
    for (const cat of kbCategories) {
      const entries = this.kb.getByCategory(cat);
      if (entries.length > 0) {
        kbLines.push(`${cat.padEnd(16)} ${String(entries.length).padStart(3)} entries`);
      }
    }
    if (kbLines.length > 0) {
      sections.push(this.renderSection('KNOWLEDGE BASE', kbLines));
    }

    // ── Recent Activity ──
    const recentMessages = messages.slice(-8);
    if (recentMessages.length > 0) {
      const activityLines = recentMessages.map(m => {
        const time = m.timestamp.toISOString().substring(11, 19);
        const arrow = m.to === 'all' ? '→ ALL' : `→ ${m.to}`;
        return `${time}  ${m.from.padEnd(16)} ${arrow.padEnd(22)} ${m.type}`;
      });
      sections.push(this.renderSection('RECENT ACTIVITY', activityLines));
    }

    // ── Reactions ──
    const reactionsSummary = this.reactions.getSummary();
    if (reactionsSummary !== 'No reactions configured.') {
      sections.push(this.renderSection('EVENT REACTIONS', reactionsSummary.split('\n')));
    }

    // ── Scheduler ──
    const jobs = this.scheduler.getJobs();
    if (jobs.length > 0) {
      const jobLines = jobs.map(j => {
        const status = j.enabled ? '✓' : '✗';
        const runs = j.maxRuns ? `${j.runCount}/${j.maxRuns}` : String(j.runCount);
        return `${status} ${j.name.padEnd(25)} [${j.frequency.padEnd(7)}] runs: ${runs}`;
      });
      sections.push(this.renderSection('SCHEDULER', jobLines));
    }

    return sections.join('\n');
  }

  /** Render a compact version for REPL */
  renderCompact(): string {
    const sys = this.metrics.getSystemMetrics();
    const allTasks = this.board.getAllTasks();
    const done = allTasks.filter(t => t.status === 'done').length;
    const blocked = allTasks.filter(t => t.status === 'blocked').length;
    const inProgress = allTasks.filter(t => t.status === 'in_progress').length;

    return [
      chalk.cyan(`Tasks: ${done} done, ${inProgress} active, ${blocked} blocked`),
      chalk.cyan(`KB: ${this.kb.size} | Artifacts: ${this.artifacts.size} | Messages: ${sys.totalMessages}`),
      chalk.cyan(`Completion: ${(sys.completionRate * 100).toFixed(0)}%`),
    ].join(' | ');
  }

  // ── Helpers ──

  private renderSection(title: string, lines: string[]): string {
    const header = chalk.bold(`  ── ${title} ${'─'.repeat(Math.max(0, 50 - title.length))}`);
    const body = lines.map(l => `  ${l}`).join('\n');
    return `${header}\n${body}\n`;
  }
}
