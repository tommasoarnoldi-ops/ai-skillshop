import { describe, it, expect } from 'vitest';
import { HealthMonitor } from '../src/core/health-monitor.js';
import type { BaseAgent } from '../src/core/base-agent.js';
import type { AgentId, AgentState } from '../src/types/index.js';

// Minimal mock agent for testing
function createMockAgent(id: AgentId): BaseAgent {
  return {
    id,
    status: 'idle',
    config: { id, name: id, role: 'test', systemPrompt: '', expertise: [], responsibilities: [], canDelegateTo: [], reportsTo: null },
    getState: () => ({
      id,
      status: 'idle' as const,
      currentTask: null,
      taskQueue: [],
      messageInbox: [],
      completedTasks: [],
      memory: { decisions: [], context: {}, learnings: [] },
    }),
  } as unknown as BaseAgent;
}

function createAgentMap(): Map<AgentId, BaseAgent> {
  const agents = new Map<AgentId, BaseAgent>();
  agents.set('ceo', createMockAgent('ceo'));
  agents.set('cto', createMockAgent('cto'));
  agents.set('developer', createMockAgent('developer'));
  return agents;
}

describe('HealthMonitor', () => {
  it('initializes with all agents healthy', () => {
    const monitor = new HealthMonitor(createAgentMap());
    const health = monitor.getAllHealth();

    expect(health).toHaveLength(3);
    expect(health.every(h => h.status === 'healthy')).toBe(true);
    expect(monitor.isSystemHealthy()).toBe(true);
  });

  it('tracks heartbeats', () => {
    const monitor = new HealthMonitor(createAgentMap());
    monitor.heartbeat('ceo');

    const health = monitor.getHealth('ceo');
    expect(health).not.toBeNull();
    expect(health!.status).toBe('healthy');
  });

  it('records successes and failures', () => {
    const monitor = new HealthMonitor(createAgentMap());
    monitor.recordSuccess('developer', 500);
    monitor.recordSuccess('developer', 600);
    monitor.recordFailure('developer');

    const health = monitor.getHealth('developer');
    expect(health!.tasksCompleted).toBe(2);
    expect(health!.tasksFailed).toBe(1);
    expect(health!.errorRate).toBeCloseTo(1 / 3);
    expect(health!.avgResponseTime).toBe(550);
  });

  it('enforces rate limits', () => {
    const monitor = new HealthMonitor(createAgentMap(), { burstLimit: 3 });

    monitor.recordApiCall('cto', 100);
    monitor.recordApiCall('cto', 100);
    expect(monitor.canMakeApiCall('cto').allowed).toBe(true);

    monitor.recordApiCall('cto', 100);
    const check = monitor.canMakeApiCall('cto');
    expect(check.allowed).toBe(false);
    expect(check.retryAfterMs).toBeGreaterThan(0);
  });

  it('allows calls for different agents independently', () => {
    const monitor = new HealthMonitor(createAgentMap(), { burstLimit: 2 });

    monitor.recordApiCall('ceo', 100);
    monitor.recordApiCall('ceo', 100);

    expect(monitor.canMakeApiCall('ceo').allowed).toBe(false);
    expect(monitor.canMakeApiCall('cto').allowed).toBe(true);
  });

  it('returns null for unknown agents', () => {
    const monitor = new HealthMonitor(createAgentMap());
    expect(monitor.getHealth('marketing' as AgentId)).toBeNull();
  });

  it('generates summary', () => {
    const monitor = new HealthMonitor(createAgentMap());
    monitor.recordSuccess('ceo', 200);
    monitor.recordFailure('cto');

    const summary = monitor.getSummary();
    expect(summary).toContain('System uptime');
    expect(summary).toContain('Agent Health');
    expect(summary).toContain('ceo');
    expect(summary).toContain('cto');
  });
});
