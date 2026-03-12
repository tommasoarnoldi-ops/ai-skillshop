// ============================================================
// Event Reactions — Auto-trigger agent actions on conditions
// ============================================================

import type { AgentId, AgentMessage, Task } from '../types/index.js';
import type { MessageBus } from './message-bus.js';
import type { TaskBoard } from './task-board.js';
import type { BaseAgent } from './base-agent.js';

interface AgentRegistry {
  get(id: AgentId): BaseAgent | undefined;
}

export type EventCondition =
  | { type: 'message_contains'; keywords: string[] }
  | { type: 'task_completed'; agentId?: AgentId }
  | { type: 'task_failed'; agentId?: AgentId }
  | { type: 'task_count'; status: Task['status']; threshold: number; comparison: 'gt' | 'lt' | 'eq' }
  | { type: 'message_type'; messageType: AgentMessage['type'] }
  | { type: 'custom'; check: () => boolean };

export interface Reaction {
  id: string;
  name: string;
  condition: EventCondition;
  action: ReactionAction;
  enabled: boolean;
  triggerCount: number;
  maxTriggers?: number; // Limit how many times it can fire
}

export type ReactionAction =
  | { type: 'assign_task'; agentId: AgentId; taskTitle: string; taskDescription: string }
  | { type: 'send_message'; from: AgentId; to: AgentId | 'all'; subject: string; content: string }
  | { type: 'escalate'; to: AgentId; subject: string }
  | { type: 'custom'; execute: () => Promise<void> };

/**
 * Event-driven reaction system. Watches messages and task board state,
 * auto-triggers agent actions when conditions are met.
 *
 * Examples:
 * - When a dev task is completed → QA auto-creates a review task
 * - When a task fails → CEO gets an escalation
 * - When "security" is mentioned → CTO auto-reviews
 */
export class EventReactionEngine {
  private reactions: Reaction[] = [];

  constructor(
    private agents: AgentRegistry,
    private bus: MessageBus,
    private board: TaskBoard,
  ) {}

  /** Register a reaction */
  addReaction(reaction: Omit<Reaction, 'triggerCount'>): void {
    this.reactions.push({ ...reaction, triggerCount: 0 });
  }

  /** Remove a reaction by ID */
  removeReaction(id: string): void {
    this.reactions = this.reactions.filter(r => r.id !== id);
  }

  /** Enable/disable a reaction */
  setEnabled(id: string, enabled: boolean): void {
    const reaction = this.reactions.find(r => r.id === id);
    if (reaction) reaction.enabled = enabled;
  }

  /**
   * Check a message against all reactions and fire matching ones.
   * Called by the orchestrator whenever a message is sent.
   */
  async checkMessage(message: AgentMessage): Promise<void> {
    for (const reaction of this.reactions) {
      if (!reaction.enabled) continue;
      if (reaction.maxTriggers && reaction.triggerCount >= reaction.maxTriggers) continue;

      if (this.matchesCondition(reaction.condition, message)) {
        await this.executeAction(reaction);
        reaction.triggerCount++;
      }
    }
  }

  /**
   * Check task board state against all reactions.
   * Called periodically or after task state changes.
   */
  async checkTaskBoard(): Promise<void> {
    for (const reaction of this.reactions) {
      if (!reaction.enabled) continue;
      if (reaction.maxTriggers && reaction.triggerCount >= reaction.maxTriggers) continue;

      if (reaction.condition.type === 'task_count') {
        const tasks = this.board.getTasksByStatus(reaction.condition.status);
        const count = tasks.length;
        const { threshold, comparison } = reaction.condition;
        const matches = comparison === 'gt' ? count > threshold
          : comparison === 'lt' ? count < threshold
          : count === threshold;

        if (matches) {
          await this.executeAction(reaction);
          reaction.triggerCount++;
        }
      }

      if (reaction.condition.type === 'custom' && reaction.condition.check()) {
        await this.executeAction(reaction);
        reaction.triggerCount++;
      }
    }
  }

  /** Get all registered reactions */
  getReactions(): Reaction[] {
    return [...this.reactions];
  }

  /** Summary for display */
  getSummary(): string {
    if (this.reactions.length === 0) return 'No reactions configured.';

    return this.reactions
      .map(r => {
        const status = r.enabled ? '✓' : '✗';
        const fires = r.maxTriggers ? `${r.triggerCount}/${r.maxTriggers}` : String(r.triggerCount);
        return `  ${status} ${r.name} (fired: ${fires})`;
      })
      .join('\n');
  }

  // ── Internal ──

  private matchesCondition(condition: EventCondition, message: AgentMessage): boolean {
    switch (condition.type) {
      case 'message_contains':
        return condition.keywords.some(kw =>
          message.content.toLowerCase().includes(kw.toLowerCase()) ||
          message.subject.toLowerCase().includes(kw.toLowerCase()),
        );

      case 'task_completed':
        return message.type === 'task_completed' &&
          (!condition.agentId || message.from === condition.agentId);

      case 'task_failed':
        return message.type === 'escalation' &&
          (!condition.agentId || message.from === condition.agentId);

      case 'message_type':
        return message.type === condition.messageType;

      default:
        return false;
    }
  }

  private async executeAction(reaction: Reaction): Promise<void> {
    const { action } = reaction;

    switch (action.type) {
      case 'assign_task': {
        const agent = this.agents.get(action.agentId);
        if (!agent) break;
        const task = this.board.createTask({
          title: action.taskTitle,
          description: action.taskDescription,
          priority: 'high',
          assignedTo: action.agentId,
          createdBy: 'ceo', // System-triggered
        });
        agent.queueTask(task);
        break;
      }

      case 'send_message':
        this.bus.send({
          type: 'broadcast',
          from: action.from,
          to: action.to,
          subject: action.subject,
          content: action.content,
        });
        break;

      case 'escalate':
        this.bus.send({
          type: 'escalation',
          from: 'ceo',
          to: action.to,
          subject: action.subject,
          content: `Auto-escalation triggered by reaction: ${reaction.name}`,
          priority: 'high',
        });
        break;

      case 'custom':
        await action.execute();
        break;
    }
  }
}

/**
 * Create default reactions for ForgeAI system.
 */
export function createDefaultReactions(engine: EventReactionEngine): void {
  // Auto-review when developer completes a task
  engine.addReaction({
    id: 'auto-qa-review',
    name: 'Auto QA Review on Dev Task Complete',
    enabled: true,
    condition: { type: 'task_completed', agentId: 'developer' },
    action: {
      type: 'assign_task',
      agentId: 'qa-devops',
      taskTitle: 'Auto-Review: Developer task completed',
      taskDescription: 'A developer task was completed. Review the output for quality, security, and test coverage.',
    },
  });

  // Escalate to CEO on failure
  engine.addReaction({
    id: 'escalate-failures',
    name: 'Escalate Failures to CEO',
    enabled: true,
    condition: { type: 'task_failed' },
    action: {
      type: 'escalate',
      to: 'ceo',
      subject: 'Task failure detected',
    },
  });

  // CTO auto-alert on security mentions
  engine.addReaction({
    id: 'security-alert',
    name: 'CTO Security Alert',
    enabled: true,
    condition: {
      type: 'message_contains',
      keywords: ['security', 'vulnerability', 'sicurezza', 'vulnerabilit'],
    },
    action: {
      type: 'send_message',
      from: 'cto',
      to: 'ceo',
      subject: 'Security mention detected',
      content: 'A security-related topic was mentioned. CTO should review.',
    },
  });

  // Alert when too many tasks are blocked
  engine.addReaction({
    id: 'blocked-alert',
    name: 'Blocked Tasks Alert',
    enabled: true,
    maxTriggers: 3,
    condition: { type: 'task_count', status: 'blocked', threshold: 3, comparison: 'gt' },
    action: {
      type: 'escalate',
      to: 'ceo',
      subject: 'Multiple tasks blocked — intervention needed',
    },
  });
}
