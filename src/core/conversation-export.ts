// ============================================================
// Conversation Export/Import — Session continuity for agents
// ============================================================

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { AgentId, AgentMessage } from '../types/index.js';
import type { KnowledgeEntry } from './knowledge-base.js';

/** Exported conversation session */
export interface ConversationExport {
  version: string;
  exportedAt: string;
  sessionId: string;
  agents: AgentConversation[];
  messages: AgentMessage[];
  knowledgeSnapshot: KnowledgeEntry[];
  summary: string;
}

export interface AgentConversation {
  agentId: AgentId;
  decisions: { topic: string; decision: string; timestamp: string }[];
  learnings: string[];
  context: Record<string, string>;
  taskCount: number;
}

/**
 * Export and import agent conversations for session continuity.
 * Allows the system to resume context from prior sessions.
 */
export class ConversationManager {
  private exportDir: string;

  constructor(exportDir: string = './.forgeai-conversations') {
    this.exportDir = exportDir;
  }

  /** Export current conversation state */
  export(data: {
    agents: AgentConversation[];
    messages: AgentMessage[];
    knowledge: KnowledgeEntry[];
    summary?: string;
  }): string {
    if (!existsSync(this.exportDir)) {
      mkdirSync(this.exportDir, { recursive: true });
    }

    const sessionId = `session-${Date.now()}`;
    const exportData: ConversationExport = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      sessionId,
      agents: data.agents,
      messages: data.messages,
      knowledgeSnapshot: data.knowledge,
      summary: data.summary ?? this.generateSummary(data),
    };

    const filename = `${sessionId}.json`;
    const filepath = join(this.exportDir, filename);

    writeFileSync(filepath, JSON.stringify(exportData, null, 2), 'utf-8');

    // Also save as latest
    const latestPath = join(this.exportDir, 'latest-conversation.json');
    writeFileSync(latestPath, JSON.stringify(exportData, null, 2), 'utf-8');

    return filepath;
  }

  /** Import a conversation from file */
  import(filepath: string): ConversationExport | null {
    if (!existsSync(filepath)) return null;
    try {
      const raw = readFileSync(filepath, 'utf-8');
      return JSON.parse(raw) as ConversationExport;
    } catch {
      return null;
    }
  }

  /** Import the latest conversation */
  importLatest(): ConversationExport | null {
    const latestPath = join(this.exportDir, 'latest-conversation.json');
    return this.import(latestPath);
  }

  /** Check if a previous conversation exists */
  hasConversation(): boolean {
    return existsSync(join(this.exportDir, 'latest-conversation.json'));
  }

  /** Generate a context prompt from an imported conversation */
  buildContextPrompt(conversation: ConversationExport): string {
    const parts: string[] = [
      `[PREVIOUS SESSION CONTEXT — ${conversation.exportedAt}]`,
      '',
      conversation.summary,
      '',
    ];

    // Add key decisions from each agent
    for (const agent of conversation.agents) {
      if (agent.decisions.length > 0) {
        parts.push(`${agent.agentId.toUpperCase()} decisions:`);
        for (const d of agent.decisions.slice(-5)) {
          parts.push(`  • ${d.topic}: ${d.decision}`);
        }
        parts.push('');
      }
    }

    // Add recent learnings
    const allLearnings = conversation.agents.flatMap(a => a.learnings);
    if (allLearnings.length > 0) {
      parts.push('Key learnings:');
      for (const l of allLearnings.slice(-10)) {
        parts.push(`  • ${l}`);
      }
    }

    return parts.join('\n');
  }

  // ---- Private ----

  private generateSummary(data: {
    agents: AgentConversation[];
    messages: AgentMessage[];
    knowledge: KnowledgeEntry[];
  }): string {
    const totalTasks = data.agents.reduce((sum, a) => sum + a.taskCount, 0);
    const totalDecisions = data.agents.reduce((sum, a) => sum + a.decisions.length, 0);

    return [
      `Session with ${data.agents.length} agents.`,
      `${totalTasks} tasks completed, ${totalDecisions} decisions made.`,
      `${data.messages.length} messages exchanged.`,
      `${data.knowledge.length} knowledge entries captured.`,
    ].join(' ');
  }
}
