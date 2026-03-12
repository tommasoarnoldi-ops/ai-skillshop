// ============================================================
// Health Monitor — Agent health tracking and rate limiting
// ============================================================

import type { AgentId } from '../types/index.js';
import type { BaseAgent } from './base-agent.js';

export interface HealthStatus {
  agentId: AgentId;
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastHeartbeat: Date;
  uptime: number; // ms since creation
  tasksCompleted: number;
  tasksFailed: number;
  errorRate: number;
  avgResponseTime: number;
  apiCallsRemaining: number;
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
}

interface ApiCallRecord {
  timestamp: number;
  agentId: AgentId;
  duration: number;
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  requestsPerMinute: 50,
  requestsPerHour: 1000,
  burstLimit: 10,
};

/**
 * Monitors agent health and enforces API rate limits.
 */
export class HealthMonitor {
  private agents: Map<AgentId, BaseAgent>;
  private heartbeats = new Map<AgentId, Date>();
  private apiCalls: ApiCallRecord[] = [];
  private taskFailures = new Map<AgentId, number>();
  private taskSuccesses = new Map<AgentId, number>();
  private responseTimes = new Map<AgentId, number[]>();
  private startTime = Date.now();
  private rateLimitConfig: RateLimitConfig;

  constructor(agents: Map<AgentId, BaseAgent>, rateLimit?: Partial<RateLimitConfig>) {
    this.agents = agents;
    this.rateLimitConfig = { ...DEFAULT_RATE_LIMIT, ...rateLimit };

    // Initialize tracking for all agents
    for (const id of agents.keys()) {
      this.heartbeats.set(id, new Date());
      this.taskFailures.set(id, 0);
      this.taskSuccesses.set(id, 0);
      this.responseTimes.set(id, []);
    }
  }

  /** Record a heartbeat for an agent */
  heartbeat(agentId: AgentId): void {
    this.heartbeats.set(agentId, new Date());
  }

  /** Record a successful task completion */
  recordSuccess(agentId: AgentId, durationMs: number): void {
    this.taskSuccesses.set(agentId, (this.taskSuccesses.get(agentId) ?? 0) + 1);
    const times = this.responseTimes.get(agentId) ?? [];
    times.push(durationMs);
    if (times.length > 100) times.shift();
    this.responseTimes.set(agentId, times);
    this.heartbeat(agentId);
  }

  /** Record a task failure */
  recordFailure(agentId: AgentId): void {
    this.taskFailures.set(agentId, (this.taskFailures.get(agentId) ?? 0) + 1);
    this.heartbeat(agentId);
  }

  /** Record an API call for rate limiting */
  recordApiCall(agentId: AgentId, durationMs: number): void {
    this.apiCalls.push({ timestamp: Date.now(), agentId, duration: durationMs });
    // Keep only last hour
    const oneHourAgo = Date.now() - 3600000;
    this.apiCalls = this.apiCalls.filter(c => c.timestamp > oneHourAgo);
  }

  /** Check if an API call is allowed under rate limits */
  canMakeApiCall(agentId: AgentId): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentCalls = this.apiCalls.filter(c => c.timestamp > oneMinuteAgo);
    const agentCalls = recentCalls.filter(c => c.agentId === agentId);

    // Per-agent burst limit
    if (agentCalls.length >= this.rateLimitConfig.burstLimit) {
      const oldestCall = agentCalls[0];
      return { allowed: false, retryAfterMs: 60000 - (now - oldestCall.timestamp) };
    }

    // Global per-minute limit
    if (recentCalls.length >= this.rateLimitConfig.requestsPerMinute) {
      const oldestCall = recentCalls[0];
      return { allowed: false, retryAfterMs: 60000 - (now - oldestCall.timestamp) };
    }

    // Hourly limit
    if (this.apiCalls.length >= this.rateLimitConfig.requestsPerHour) {
      return { allowed: false, retryAfterMs: 60000 };
    }

    return { allowed: true };
  }

  /** Get health status for a specific agent */
  getHealth(agentId: AgentId): HealthStatus | null {
    const agent = this.agents.get(agentId);
    if (!agent) return null;

    const successes = this.taskSuccesses.get(agentId) ?? 0;
    const failures = this.taskFailures.get(agentId) ?? 0;
    const total = successes + failures;
    const errorRate = total > 0 ? failures / total : 0;
    const times = this.responseTimes.get(agentId) ?? [];
    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const lastHB = this.heartbeats.get(agentId) ?? new Date();
    const sinceHeartbeat = Date.now() - lastHB.getTime();

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (agent.status === 'error' || errorRate > 0.5 || sinceHeartbeat > 300000) {
      status = 'unhealthy';
    } else if (errorRate > 0.2 || sinceHeartbeat > 120000) {
      status = 'degraded';
    } else {
      status = 'healthy';
    }

    // Count remaining API calls for this agent
    const recentAgentCalls = this.apiCalls.filter(
      c => c.agentId === agentId && c.timestamp > Date.now() - 60000,
    );

    return {
      agentId,
      status,
      lastHeartbeat: lastHB,
      uptime: Date.now() - this.startTime,
      tasksCompleted: successes,
      tasksFailed: failures,
      errorRate,
      avgResponseTime: Math.round(avgTime),
      apiCallsRemaining: this.rateLimitConfig.burstLimit - recentAgentCalls.length,
    };
  }

  /** Get health status for all agents */
  getAllHealth(): HealthStatus[] {
    return Array.from(this.agents.keys())
      .map(id => this.getHealth(id))
      .filter((h): h is HealthStatus => h !== null);
  }

  /** Check if the overall system is healthy */
  isSystemHealthy(): boolean {
    const health = this.getAllHealth();
    const unhealthy = health.filter(h => h.status === 'unhealthy');
    return unhealthy.length === 0;
  }

  /** Get formatted health report */
  getSummary(): string {
    const health = this.getAllHealth();
    const uptime = Date.now() - this.startTime;
    const uptimeStr = formatDuration(uptime);

    const statusIcon = { healthy: '●', degraded: '◐', unhealthy: '○' };
    const lines = [
      `System uptime: ${uptimeStr}`,
      `API calls (last hour): ${this.apiCalls.length}/${this.rateLimitConfig.requestsPerHour}`,
      '',
      'Agent Health:',
      ...health.map(h => {
        const icon = statusIcon[h.status];
        const errPct = (h.errorRate * 100).toFixed(0);
        return `  ${icon} ${h.agentId}: ${h.status} | ${h.tasksCompleted} done, ${h.tasksFailed} failed (${errPct}% err) | avg ${h.avgResponseTime}ms | ${h.apiCallsRemaining} calls left`;
      }),
    ];

    return lines.join('\n');
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
