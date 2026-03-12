// ============================================================
// Message Bus — Inter-agent communication system
// ============================================================

import EventEmitter from 'eventemitter3';
import { v4 as uuid } from 'uuid';
import type { AgentId, AgentMessage, MessageType, Priority } from '../types/index.js';

type MessageHandler = (message: AgentMessage) => void | Promise<void>;

/**
 * Central message bus that routes messages between agents.
 * Supports direct messaging, broadcasts, and topic subscriptions.
 */
export class MessageBus {
  private emitter = new EventEmitter();
  private messageLog: AgentMessage[] = [];
  private subscriptions = new Map<AgentId, MessageHandler>();

  /** Register an agent to receive messages */
  register(agentId: AgentId, handler: MessageHandler): void {
    this.subscriptions.set(agentId, handler);
    this.emitter.on(agentId, handler);
    this.emitter.on('broadcast', handler);
  }

  /** Unregister an agent */
  unregister(agentId: AgentId): void {
    const handler = this.subscriptions.get(agentId);
    if (handler) {
      this.emitter.off(agentId, handler);
      this.emitter.off('broadcast', handler);
      this.subscriptions.delete(agentId);
    }
  }

  /** Send a message from one agent to another (or broadcast) */
  send(params: {
    type: MessageType;
    from: AgentId;
    to: AgentId | 'all';
    subject: string;
    content: string;
    priority?: Priority;
    replyTo?: string;
    metadata?: Record<string, unknown>;
  }): AgentMessage {
    const message: AgentMessage = {
      id: uuid(),
      type: params.type,
      from: params.from,
      to: params.to,
      subject: params.subject,
      content: params.content,
      priority: params.priority ?? 'medium',
      replyTo: params.replyTo,
      metadata: params.metadata,
      timestamp: new Date(),
    };

    this.messageLog.push(message);

    if (params.to === 'all') {
      // Broadcast to all except sender
      for (const [agentId, handler] of this.subscriptions) {
        if (agentId !== params.from) {
          handler(message);
        }
      }
    } else {
      this.emitter.emit(params.to, message);
    }

    return message;
  }

  /** Get all messages in the log */
  getLog(): AgentMessage[] {
    return [...this.messageLog];
  }

  /** Get messages for a specific agent */
  getMessagesFor(agentId: AgentId): AgentMessage[] {
    return this.messageLog.filter(m => m.to === agentId || m.to === 'all');
  }

  /** Get conversation thread by following replyTo chain */
  getThread(messageId: string): AgentMessage[] {
    const thread: AgentMessage[] = [];
    const root = this.messageLog.find(m => m.id === messageId);
    if (!root) return thread;

    thread.push(root);
    const replies = this.messageLog.filter(m => m.replyTo === messageId);
    for (const reply of replies) {
      thread.push(reply, ...this.getThread(reply.id).slice(1));
    }
    return thread;
  }

  /** Get message count */
  get totalMessages(): number {
    return this.messageLog.length;
  }
}
