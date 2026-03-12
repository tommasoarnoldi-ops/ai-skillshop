// ============================================================
// Metrics Tracker — Monitor agent performance and system health
// ============================================================

import type { AgentId, AgentMessage, Task } from '../types/index.js';
import type { CycleReport } from './autonomy-loop.js';

export interface AgentMetrics {
  agentId: AgentId;
  tasksCompleted: number;
  tasksFailed: number;
  totalTaskTime: number;   // milliseconds
  avgTaskTime: number;
  messagessSent: number;
  messagesReceived: number;
  decisionssMade: number;
  knowledgeContributed: number;
  artifactsProduced: number;
}

export interface SystemMetrics {
  uptime: number;              // milliseconds since start
  totalCycles: number;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  completionRate: number;      // 0-1
  totalMessages: number;
  knowledgeEntries: number;
  artifacts: number;
  agentMetrics: AgentMetrics[];
  cycleHistory: CycleReport[];
}

/**
 * Tracks performance metrics across the entire agent system.
 * Provides analytics and reporting for system health monitoring.
 */
export class MetricsTracker {
  private startTime = Date.now();
  private taskTimings = new Map<string, { start: number; end?: number; agent: AgentId }>();
  private agentStats = new Map<AgentId, {
    tasksCompleted: number;
    tasksFailed: number;
    totalTime: number;
    messagesSent: number;
    messagesReceived: number;
    decisions: number;
    knowledge: number;
    artifacts: number;
  }>();
  private cycleHistory: CycleReport[] = [];

  private allAgents: AgentId[] = ['ceo', 'cto', 'product-manager', 'developer', 'marketing', 'qa-devops'];

  constructor() {
    // Initialize stats for all agents
    for (const id of this.allAgents) {
      this.agentStats.set(id, {
        tasksCompleted: 0,
        tasksFailed: 0,
        totalTime: 0,
        messagesSent: 0,
        messagesReceived: 0,
        decisions: 0,
        knowledge: 0,
        artifacts: 0,
      });
    }
  }

  // ── Recording events ──

  recordTaskStart(taskId: string, agentId: AgentId): void {
    this.taskTimings.set(taskId, { start: Date.now(), agent: agentId });
  }

  recordTaskComplete(taskId: string, success: boolean): void {
    const timing = this.taskTimings.get(taskId);
    if (!timing) return;
    timing.end = Date.now();

    const duration = timing.end - timing.start;
    const stats = this.agentStats.get(timing.agent);
    if (!stats) return;

    if (success) {
      stats.tasksCompleted++;
    } else {
      stats.tasksFailed++;
    }
    stats.totalTime += duration;
  }

  recordMessage(message: AgentMessage): void {
    const senderStats = this.agentStats.get(message.from);
    if (senderStats) senderStats.messagesSent++;

    if (message.to !== 'all') {
      const receiverStats = this.agentStats.get(message.to);
      if (receiverStats) receiverStats.messagesReceived++;
    } else {
      // Broadcast — count for all except sender
      for (const [id, stats] of this.agentStats) {
        if (id !== message.from) stats.messagesReceived++;
      }
    }

    if (message.type === 'decision') {
      if (senderStats) senderStats.decisions++;
    }
  }

  recordKnowledgeEntry(agentId: AgentId): void {
    const stats = this.agentStats.get(agentId);
    if (stats) stats.knowledge++;
  }

  recordArtifact(agentId: AgentId): void {
    const stats = this.agentStats.get(agentId);
    if (stats) stats.artifacts++;
  }

  recordCycle(report: CycleReport): void {
    this.cycleHistory.push(report);
  }

  // ── Queries ──

  getAgentMetrics(agentId: AgentId): AgentMetrics {
    const stats = this.agentStats.get(agentId)!;
    const totalTasks = stats.tasksCompleted + stats.tasksFailed;
    return {
      agentId,
      tasksCompleted: stats.tasksCompleted,
      tasksFailed: stats.tasksFailed,
      totalTaskTime: stats.totalTime,
      avgTaskTime: totalTasks > 0 ? Math.round(stats.totalTime / totalTasks) : 0,
      messagessSent: stats.messagesSent,
      messagesReceived: stats.messagesReceived,
      decisionssMade: stats.decisions,
      knowledgeContributed: stats.knowledge,
      artifactsProduced: stats.artifacts,
    };
  }

  getSystemMetrics(): SystemMetrics {
    const agentMetrics = this.allAgents.map(id => this.getAgentMetrics(id));
    const totalCompleted = agentMetrics.reduce((s, m) => s + m.tasksCompleted, 0);
    const totalFailed = agentMetrics.reduce((s, m) => s + m.tasksFailed, 0);
    const total = totalCompleted + totalFailed;

    return {
      uptime: Date.now() - this.startTime,
      totalCycles: this.cycleHistory.length,
      totalTasks: total,
      completedTasks: totalCompleted,
      failedTasks: totalFailed,
      completionRate: total > 0 ? totalCompleted / total : 0,
      totalMessages: agentMetrics.reduce((s, m) => s + m.messagessSent, 0),
      knowledgeEntries: agentMetrics.reduce((s, m) => s + m.knowledgeContributed, 0),
      artifacts: agentMetrics.reduce((s, m) => s + m.artifactsProduced, 0),
      agentMetrics,
      cycleHistory: this.cycleHistory,
    };
  }

  // ── Formatted reports ──

  generateReport(): string {
    const sys = this.getSystemMetrics();
    const uptimeMin = Math.round(sys.uptime / 60000);

    const lines: string[] = [
      '═══════════════════════════════════════════════',
      '  FORGEAI SYSTEM METRICS',
      '═══════════════════════════════════════════════',
      '',
      `  Uptime: ${uptimeMin}m`,
      `  Cycles completed: ${sys.totalCycles}`,
      `  Tasks: ${sys.completedTasks} completed / ${sys.failedTasks} failed / ${sys.totalTasks} total`,
      `  Completion rate: ${(sys.completionRate * 100).toFixed(1)}%`,
      `  Messages exchanged: ${sys.totalMessages}`,
      `  Knowledge entries: ${sys.knowledgeEntries}`,
      `  Artifacts: ${sys.artifacts}`,
      '',
      '  ── Agent Performance ──',
      '',
      formatTable(
        ['Agent', 'Done', 'Failed', 'Avg Time', 'Msgs Sent', 'Decisions', 'KB', 'Artifacts'],
        sys.agentMetrics.map(m => [
          m.agentId,
          String(m.tasksCompleted),
          String(m.tasksFailed),
          m.avgTaskTime > 0 ? `${(m.avgTaskTime / 1000).toFixed(1)}s` : '-',
          String(m.messagessSent),
          String(m.decisionssMade),
          String(m.knowledgeContributed),
          String(m.artifactsProduced),
        ]),
      ),
    ];

    if (this.cycleHistory.length > 0) {
      lines.push(
        '',
        '  ── Cycle History ──',
        '',
      );
      for (const c of this.cycleHistory) {
        lines.push(
          `  Cycle ${c.cycle}: ${c.tasksCompleted}/${c.tasksCreated} tasks (${(c.duration / 1000).toFixed(1)}s)`,
          `    ${c.summary.substring(0, 100)}`,
        );
      }
    }

    lines.push('');
    return lines.join('\n');
  }
}

// ── Table formatter ──

function formatTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) =>
    Math.max(h.length, ...rows.map(r => (r[i] ?? '').length)),
  );

  const headerLine = '  ' + headers.map((h, i) => h.padEnd(colWidths[i])).join('  ');
  const separator = '  ' + colWidths.map(w => '─'.repeat(w)).join('──');

  const dataLines = rows.map(
    row => '  ' + row.map((cell, i) => (cell ?? '').padEnd(colWidths[i])).join('  '),
  );

  return [headerLine, separator, ...dataLines].join('\n');
}
