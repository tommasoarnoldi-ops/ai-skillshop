// ============================================================
// Scheduler — Recurring and scheduled workflow execution
// ============================================================

import chalk from 'chalk';
import type { AgentId } from '../types/index.js';

export type ScheduleFrequency = 'once' | 'hourly' | 'daily' | 'weekly' | 'custom';

export interface ScheduledJob {
  id: string;
  name: string;
  description: string;
  frequency: ScheduleFrequency;
  intervalMs?: number;          // For 'custom' frequency
  action: () => Promise<string>;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  runCount: number;
  maxRuns?: number;             // Stop after N runs
  lastResult?: string;
  lastError?: string;
}

export interface JobResult {
  jobId: string;
  jobName: string;
  success: boolean;
  output: string;
  duration: number;
  timestamp: Date;
}

/**
 * Scheduler for recurring multi-agent workflows.
 *
 * Use cases:
 * - Daily standup: CEO evaluates progress every morning
 * - Weekly sprint review: all agents report
 * - Periodic market scan: Marketing checks competitors
 * - Hourly health check: QA monitors system metrics
 */
export class Scheduler {
  private jobs = new Map<string, ScheduledJob>();
  private timers = new Map<string, NodeJS.Timeout>();
  private running = false;
  private jobHistory: JobResult[] = [];

  /** Register a new scheduled job */
  addJob(job: Omit<ScheduledJob, 'runCount' | 'lastRun' | 'nextRun'>): void {
    const scheduledJob: ScheduledJob = {
      ...job,
      runCount: 0,
    };
    this.jobs.set(job.id, scheduledJob);
  }

  /** Remove a job */
  removeJob(id: string): void {
    this.stopJob(id);
    this.jobs.delete(id);
  }

  /** Start all enabled jobs */
  startAll(): void {
    this.running = true;
    for (const job of this.jobs.values()) {
      if (job.enabled) this.startJob(job.id);
    }
    console.log(chalk.hex('#06B6D4')(`[SCHEDULER] Started ${this.jobs.size} jobs`));
  }

  /** Stop all jobs */
  stopAll(): void {
    this.running = false;
    for (const id of this.timers.keys()) {
      this.stopJob(id);
    }
    console.log(chalk.hex('#06B6D4')('[SCHEDULER] All jobs stopped'));
  }

  /** Start a specific job */
  startJob(id: string): void {
    const job = this.jobs.get(id);
    if (!job) return;

    this.stopJob(id); // Clear existing timer

    const intervalMs = this.getIntervalMs(job);
    if (intervalMs <= 0) {
      // Run once immediately
      this.executeJob(job);
      return;
    }

    job.nextRun = new Date(Date.now() + intervalMs);

    const timer = setInterval(async () => {
      if (!job.enabled) return;
      if (job.maxRuns && job.runCount >= job.maxRuns) {
        this.stopJob(id);
        return;
      }
      await this.executeJob(job);
      job.nextRun = new Date(Date.now() + intervalMs);
    }, intervalMs);

    this.timers.set(id, timer);
  }

  /** Stop a specific job */
  stopJob(id: string): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearInterval(timer);
      this.timers.delete(id);
    }
  }

  /** Run a job immediately (regardless of schedule) */
  async runNow(id: string): Promise<JobResult | null> {
    const job = this.jobs.get(id);
    if (!job) return null;
    return this.executeJob(job);
  }

  /** Get all jobs */
  getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  /** Get job execution history */
  getHistory(): JobResult[] {
    return [...this.jobHistory];
  }

  /** Summary for display */
  getSummary(): string {
    const jobs = this.getJobs();
    if (jobs.length === 0) return 'No scheduled jobs.';

    const lines = [
      '═══════════════════════════════════════',
      'SCHEDULER',
      '═══════════════════════════════════════',
      `Status: ${this.running ? 'RUNNING' : 'STOPPED'}`,
      `Jobs: ${jobs.length}`,
      '',
    ];

    for (const job of jobs) {
      const status = job.enabled ? '✓' : '✗';
      const runs = job.maxRuns ? `${job.runCount}/${job.maxRuns}` : String(job.runCount);
      const next = job.nextRun ? job.nextRun.toISOString().substring(11, 19) : '-';
      lines.push(`  ${status} ${job.name} [${job.frequency}] runs: ${runs} next: ${next}`);
      if (job.lastResult) {
        lines.push(`    Last: ${job.lastResult.substring(0, 80)}`);
      }
    }

    return lines.join('\n');
  }

  // ── Internal ──

  private async executeJob(job: ScheduledJob): Promise<JobResult> {
    const startTime = Date.now();
    let output = '';
    let success = true;

    try {
      output = await job.action();
      job.lastResult = output.substring(0, 500);
      job.lastError = undefined;
    } catch (error) {
      success = false;
      const errMsg = error instanceof Error ? error.message : String(error);
      job.lastError = errMsg;
      output = `Error: ${errMsg}`;
    }

    job.lastRun = new Date();
    job.runCount++;

    const result: JobResult = {
      jobId: job.id,
      jobName: job.name,
      success,
      output,
      duration: Date.now() - startTime,
      timestamp: new Date(),
    };

    this.jobHistory.push(result);

    // Keep history manageable
    if (this.jobHistory.length > 100) {
      this.jobHistory = this.jobHistory.slice(-50);
    }

    return result;
  }

  private getIntervalMs(job: ScheduledJob): number {
    switch (job.frequency) {
      case 'once': return 0;
      case 'hourly': return 60 * 60 * 1000;
      case 'daily': return 24 * 60 * 60 * 1000;
      case 'weekly': return 7 * 24 * 60 * 60 * 1000;
      case 'custom': return job.intervalMs ?? 60 * 60 * 1000;
    }
  }
}

/**
 * Create default scheduled jobs for ForgeAI development.
 */
export function createDefaultJobs(
  scheduler: Scheduler,
  actions: {
    dailyStandup: () => Promise<string>;
    progressCheck: () => Promise<string>;
    sprintReview: () => Promise<string>;
  },
): void {
  scheduler.addJob({
    id: 'daily-standup',
    name: 'Daily Standup',
    description: 'CEO evaluates progress and identifies blockers',
    frequency: 'daily',
    action: actions.dailyStandup,
    enabled: false, // Disabled by default — enable when needed
  });

  scheduler.addJob({
    id: 'progress-check',
    name: 'Progress Check',
    description: 'CEO checks task board and knowledge base growth',
    frequency: 'custom',
    intervalMs: 4 * 60 * 60 * 1000, // Every 4 hours
    action: actions.progressCheck,
    enabled: false,
  });

  scheduler.addJob({
    id: 'sprint-review',
    name: 'Weekly Sprint Review',
    description: 'All agents report on sprint progress',
    frequency: 'weekly',
    action: actions.sprintReview,
    enabled: false,
  });
}
