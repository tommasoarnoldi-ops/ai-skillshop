// ============================================================
// Base Agent — Abstract class for all ForgeAI agents
// ============================================================

import Anthropic from '@anthropic-ai/sdk';
import { v4 as uuid } from 'uuid';
import type {
  AgentConfig,
  AgentId,
  AgentMemory,
  AgentMessage,
  AgentState,
  AgentStatus,
  DecisionRecord,
  Task,
} from '../types/index.js';
import type { MessageBus } from './message-bus.js';
import type { TaskBoard } from './task-board.js';
import { ErrorRecovery } from './error-recovery.js';

/**
 * Abstract base class for all agents in the ForgeAI system.
 * Provides: AI reasoning via Claude, message handling, task execution, memory.
 */
export abstract class BaseAgent {
  readonly config: AgentConfig;
  protected state: AgentState;
  protected bus: MessageBus;
  protected board: TaskBoard;
  protected client: Anthropic;
  protected conversationHistory: Anthropic.MessageParam[] = [];
  protected errorRecovery: ErrorRecovery;

  constructor(
    config: AgentConfig,
    bus: MessageBus,
    board: TaskBoard,
    apiKey: string,
  ) {
    this.config = config;
    this.bus = bus;
    this.board = board;
    this.client = new Anthropic({ apiKey });
    this.errorRecovery = new ErrorRecovery({ maxRetries: 3, baseDelayMs: 1000 });

    this.state = {
      id: config.id,
      status: 'idle',
      currentTask: null,
      taskQueue: [],
      messageInbox: [],
      completedTasks: [],
      memory: { decisions: [], context: {}, learnings: [] },
    };

    // Register on the message bus
    this.bus.register(config.id, (msg) => this.handleIncomingMessage(msg));
  }

  // ---- Public API ----

  get id(): AgentId {
    return this.config.id;
  }

  get status(): AgentStatus {
    return this.state.status;
  }

  get memory(): AgentMemory {
    return this.state.memory;
  }

  getState(): AgentState {
    return { ...this.state };
  }

  // ---- Message Handling ----

  private async handleIncomingMessage(message: AgentMessage): Promise<void> {
    this.state.messageInbox.push(message);

    // Route based on message type
    switch (message.type) {
      case 'task_assignment':
        await this.onTaskAssigned(message);
        break;
      case 'question':
        await this.onQuestionReceived(message);
        break;
      case 'decision_request':
        await this.onDecisionRequested(message);
        break;
      case 'feedback':
        await this.onFeedbackReceived(message);
        break;
      case 'broadcast':
        await this.onBroadcast(message);
        break;
      default:
        await this.onMessage(message);
    }
  }

  /** Send a message to another agent */
  protected sendMessage(
    to: AgentId | 'all',
    type: AgentMessage['type'],
    subject: string,
    content: string,
    replyTo?: string,
  ): AgentMessage {
    return this.bus.send({
      type,
      from: this.config.id,
      to,
      subject,
      content,
      replyTo,
    });
  }

  // ---- AI Reasoning ----

  /** Ask Claude to reason about something within this agent's role */
  protected async think(prompt: string): Promise<string> {
    this.state.status = 'thinking';

    const contextBlock = this.buildContextBlock();

    this.conversationHistory.push({
      role: 'user',
      content: `${contextBlock}\n\n${prompt}`,
    });

    // Keep conversation manageable
    if (this.conversationHistory.length > 20) {
      this.conversationHistory = this.conversationHistory.slice(-16);
    }

    try {
      const text = await this.errorRecovery.withRetry(
        this.config.id,
        'think',
        async () => {
          const response = await this.client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 4096,
            system: this.config.systemPrompt,
            messages: this.conversationHistory,
          });

          return response.content
            .filter((b): b is Anthropic.TextBlock => b.type === 'text')
            .map((b) => b.text)
            .join('\n');
        },
      );

      this.conversationHistory.push({ role: 'assistant', content: text });
      this.state.status = 'idle';
      return text;
    } catch (error) {
      this.state.status = 'error';
      const errMsg = error instanceof Error ? error.message : String(error);
      return `[AI Error] ${errMsg}`;
    }
  }

  /** Build context block from memory and current state */
  private buildContextBlock(): string {
    const parts: string[] = ['[CONTEXT]'];

    if (this.state.currentTask) {
      parts.push(`Current Task: ${this.state.currentTask.title}`);
      parts.push(`Task Description: ${this.state.currentTask.description}`);
    }

    parts.push(`Pending tasks in queue: ${this.state.taskQueue.length}`);
    parts.push(`Completed tasks: ${this.state.completedTasks.length}`);

    const recentDecisions = this.state.memory.decisions.slice(-5);
    if (recentDecisions.length > 0) {
      parts.push('\nRecent decisions:');
      for (const d of recentDecisions) {
        parts.push(`- ${d.topic}: ${d.decision}`);
      }
    }

    for (const [key, value] of Object.entries(this.state.memory.context)) {
      parts.push(`${key}: ${value}`);
    }

    return parts.join('\n');
  }

  // ---- Task Execution ----

  /** Execute the next task in queue */
  async executeNextTask(): Promise<Task | null> {
    if (this.state.currentTask) return this.state.currentTask;

    const next = this.state.taskQueue.shift();
    if (!next) return null;

    this.state.currentTask = next;
    this.state.status = 'executing';
    this.board.updateStatus(next.id, 'in_progress');

    try {
      const output = await this.executeTask(next);
      next.output = output;
      next.status = 'done';
      next.completedAt = new Date();
      this.board.updateStatus(next.id, 'done');
      this.board.setOutput(next.id, output);
      this.state.completedTasks.push(next);

      // Notify creator
      this.sendMessage(
        next.createdBy,
        'task_completed',
        `Task completed: ${next.title}`,
        output,
      );
    } catch (error) {
      next.status = 'blocked';
      this.board.updateStatus(next.id, 'blocked');
      this.state.status = 'error';

      this.sendMessage(
        next.createdBy,
        'escalation',
        `Task blocked: ${next.title}`,
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      this.state.currentTask = null;
      this.state.status = 'idle';
    }

    return next;
  }

  /** Queue a task for execution */
  queueTask(task: Task): void {
    this.state.taskQueue.push(task);
  }

  // ---- Memory ----

  /** Record a decision */
  protected recordDecision(topic: string, decision: string, reasoning: string): void {
    const record: DecisionRecord = {
      id: uuid(),
      topic,
      decision,
      reasoning,
      madeBy: this.config.id,
      timestamp: new Date(),
    };
    this.state.memory.decisions.push(record);
  }

  /** Store something in context memory */
  protected setContext(key: string, value: string): void {
    this.state.memory.context[key] = value;
  }

  /** Add a learning */
  protected addLearning(learning: string): void {
    this.state.memory.learnings.push(learning);
  }

  // ---- Abstract methods — each agent implements these ----

  /** Execute a task (core agent logic) */
  protected abstract executeTask(task: Task): Promise<string>;

  /** Handle a task assignment message */
  protected abstract onTaskAssigned(message: AgentMessage): Promise<void>;

  /** Handle a question from another agent */
  protected abstract onQuestionReceived(message: AgentMessage): Promise<void>;

  /** Handle a decision request */
  protected abstract onDecisionRequested(message: AgentMessage): Promise<void>;

  /** Handle feedback */
  protected abstract onFeedbackReceived(message: AgentMessage): Promise<void>;

  /** Handle a broadcast message */
  protected abstract onBroadcast(message: AgentMessage): Promise<void>;

  /** Handle any other message type */
  protected abstract onMessage(message: AgentMessage): Promise<void>;
}
