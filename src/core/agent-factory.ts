// ============================================================
// Agent Factory — Create custom agents with minimal config
// ============================================================

import type { AgentConfig, AgentId, AgentMessage, Task } from '../types/index.js';
import type { MessageBus } from './message-bus.js';
import type { TaskBoard } from './task-board.js';
import { BaseAgent } from './base-agent.js';

export interface CustomAgentBehavior {
  /** How to execute tasks — receives the task, returns output string */
  executeTask?: (agent: CustomAgent, task: Task) => Promise<string>;
  /** Custom handler for questions */
  onQuestion?: (agent: CustomAgent, message: AgentMessage) => Promise<void>;
  /** Custom handler for task assignments */
  onTaskAssigned?: (agent: CustomAgent, message: AgentMessage) => Promise<void>;
  /** Custom handler for broadcasts */
  onBroadcast?: (agent: CustomAgent, message: AgentMessage) => Promise<void>;
}

export interface AgentFactoryParams {
  id: AgentId;
  name: string;
  role: string;
  systemPrompt: string;
  expertise?: string[];
  responsibilities?: string[];
  canDelegateTo?: AgentId[];
  reportsTo?: AgentId | null;
  behavior?: CustomAgentBehavior;
}

/**
 * A dynamically created agent that uses provided behavior callbacks.
 */
export class CustomAgent extends BaseAgent {
  private behavior: CustomAgentBehavior;

  constructor(
    config: AgentConfig,
    bus: MessageBus,
    board: TaskBoard,
    apiKey: string,
    behavior: CustomAgentBehavior = {},
  ) {
    super(config, bus, board, apiKey);
    this.behavior = behavior;
  }

  /** Expose think() for custom behavior callbacks */
  async reason(prompt: string): Promise<string> {
    return this.think(prompt);
  }

  /** Expose sendMessage for custom behavior callbacks */
  send(to: AgentId | 'all', type: AgentMessage['type'], subject: string, content: string): AgentMessage {
    return this.sendMessage(to, type, subject, content);
  }

  protected async executeTask(task: Task): Promise<string> {
    if (this.behavior.executeTask) {
      return this.behavior.executeTask(this, task);
    }
    return this.think(
      `Execute this task:\nTitle: ${task.title}\nDescription: ${task.description}\n\nProvide a complete deliverable.`,
    );
  }

  protected async onTaskAssigned(message: AgentMessage): Promise<void> {
    if (this.behavior.onTaskAssigned) {
      return this.behavior.onTaskAssigned(this, message);
    }
    const task = this.board.getTask(message.content);
    if (task) this.queueTask(task);
  }

  protected async onQuestionReceived(message: AgentMessage): Promise<void> {
    if (this.behavior.onQuestion) {
      return this.behavior.onQuestion(this, message);
    }
    const answer = await this.think(`Answer this question from ${message.from}: ${message.content}`);
    this.sendMessage(message.from, 'answer', `Re: ${message.subject}`, answer, message.id);
  }

  protected async onDecisionRequested(message: AgentMessage): Promise<void> {
    const decision = await this.think(`Make a decision on: ${message.content}`);
    this.sendMessage(message.from, 'answer', `Decision: ${message.subject}`, decision, message.id);
  }

  protected async onFeedbackReceived(message: AgentMessage): Promise<void> {
    this.addLearning(`Feedback from ${message.from}: ${message.content.substring(0, 200)}`);
  }

  protected async onBroadcast(message: AgentMessage): Promise<void> {
    if (this.behavior.onBroadcast) {
      return this.behavior.onBroadcast(this, message);
    }
  }

  protected async onMessage(_message: AgentMessage): Promise<void> {
    // Default: no-op for unhandled message types
  }
}

/**
 * Factory for creating custom agents with minimal configuration.
 *
 * Usage:
 * ```ts
 * const factory = new AgentFactory(bus, board, apiKey);
 * const researcher = factory.create({
 *   id: 'researcher' as AgentId,
 *   name: 'Research Agent',
 *   role: 'Deep research and analysis',
 *   systemPrompt: 'You are a research specialist...',
 *   behavior: {
 *     executeTask: async (agent, task) => {
 *       return agent.reason(`Research: ${task.description}`);
 *     },
 *   },
 * });
 * ```
 */
export class AgentFactory {
  constructor(
    private bus: MessageBus,
    private board: TaskBoard,
    private apiKey: string,
  ) {}

  /** Create a custom agent */
  create(params: AgentFactoryParams): CustomAgent {
    const config: AgentConfig = {
      id: params.id,
      name: params.name,
      role: params.role,
      systemPrompt: params.systemPrompt,
      expertise: params.expertise ?? [],
      responsibilities: params.responsibilities ?? [],
      canDelegateTo: params.canDelegateTo ?? [],
      reportsTo: params.reportsTo ?? null,
    };

    return new CustomAgent(config, this.bus, this.board, this.apiKey, params.behavior);
  }

  /** Create multiple agents at once */
  createMany(paramsList: AgentFactoryParams[]): Map<AgentId, CustomAgent> {
    const agents = new Map<AgentId, CustomAgent>();
    for (const params of paramsList) {
      agents.set(params.id, this.create(params));
    }
    return agents;
  }
}
