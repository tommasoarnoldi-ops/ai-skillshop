// ============================================================
// Chat Room — Multi-agent group conversations
// ============================================================

import chalk from 'chalk';
import type { AgentId } from '../types/index.js';
import type { BaseAgent } from './base-agent.js';
import type { TaskBoard } from './task-board.js';
import type { KnowledgeBase } from './knowledge-base.js';

interface AgentRegistry {
  get(id: AgentId): BaseAgent | undefined;
}

export interface ChatMessage {
  speaker: AgentId | 'user' | 'system';
  content: string;
  timestamp: Date;
}

export interface ChatRoomConfig {
  topic: string;
  participants: AgentId[];
  maxRounds: number;
  moderator?: AgentId;     // Agent that guides the conversation
  verbose?: boolean;
}

/**
 * Chat Room — Multiple agents discuss a topic in a structured group conversation.
 *
 * Unlike debates (2 agents arguing), a chat room allows N agents to have
 * a flowing conversation where each agent builds on what others said.
 *
 * The moderator (default: CEO) guides the discussion and produces a summary.
 */
export class ChatRoom {
  private history: ChatMessage[] = [];

  constructor(
    private agents: AgentRegistry,
    private board: TaskBoard,
    private kb: KnowledgeBase,
  ) {}

  /**
   * Run a group conversation on a topic.
   * Each round, every participant speaks in order.
   * The moderator opens and closes the discussion.
   */
  async run(config: ChatRoomConfig): Promise<{ history: ChatMessage[]; summary: string }> {
    this.history = [];
    const moderator = config.moderator ?? 'ceo';
    const verbose = config.verbose ?? true;

    this.log(verbose, `Chat Room: "${config.topic}"`);
    this.log(verbose, `Participants: ${config.participants.join(', ')} | Moderator: ${moderator}`);

    // ── Opening: Moderator sets the context ──
    const openingOutput = await this.agentSpeak(moderator, `
Sei il moderatore di una discussione di team su: "${config.topic}"

Partecipanti: ${config.participants.join(', ')}

Apri la discussione:
1. Definisci il contesto e l'obiettivo della conversazione
2. Poni 2-3 domande specifiche per guidare la discussione
3. Indica chi dovrebbe parlare per primo e su cosa

Sii conciso e diretto.
`);
    this.addMessage(moderator, openingOutput);
    this.log(verbose, `\n[${moderator.toUpperCase()}] (moderator):\n${openingOutput}\n`);

    // ── Rounds: Each participant speaks ──
    for (let round = 1; round <= config.maxRounds; round++) {
      this.log(verbose, `── Round ${round}/${config.maxRounds} ──`);

      for (const participantId of config.participants) {
        if (participantId === moderator && round > 1) continue; // Moderator speaks at end

        const conversationSoFar = this.formatHistory();
        const output = await this.agentSpeak(participantId, `
Sei in una discussione di team su: "${config.topic}"
Il tuo ruolo: ${participantId}

Conversazione finora:
${conversationSoFar}

È il tuo turno. Rispondi:
- Reagisci a quello che è stato detto (accordo, disaccordo, aggiunta)
- Porta la tua prospettiva unica come ${participantId}
- Proponi azioni concrete se appropriato
- Sii conciso (max 200 parole)
`);
        this.addMessage(participantId, output);
        this.log(verbose, `\n[${participantId.toUpperCase()}]:\n${output}\n`);
      }
    }

    // ── Closing: Moderator summarizes ──
    const conversationFull = this.formatHistory();
    const summary = await this.agentSpeak(moderator, `
Sei il moderatore. La discussione su "${config.topic}" è terminata.

Conversazione completa:
${conversationFull}

Produci un riassunto strutturato:
1. DECISIONI PRESE: Lista delle decisioni emerse
2. PUNTI DI ACCORDO: Su cosa tutti concordano
3. PUNTI APERTI: Questioni ancora da risolvere
4. AZIONI: Chi deve fare cosa (assegna responsabilità specifiche)
5. PROSSIMI PASSI: Cosa fare dopo questa riunione

Sii specifico e azionabile.
`);
    this.addMessage('system', `[SUMMARY]\n${summary}`);
    this.log(verbose, `\n── SUMMARY ──\n${summary}\n`);

    // Store in knowledge base
    this.kb.put({
      category: 'decision',
      key: `chatroom-${config.topic}`.substring(0, 80),
      content: `Topic: ${config.topic}\nParticipants: ${config.participants.join(', ')}\n\n${summary}`,
      contributedBy: moderator,
      tags: ['chat-room', 'discussion', ...config.participants],
    });

    return { history: [...this.history], summary };
  }

  // ── Internal ──

  private async agentSpeak(agentId: AgentId, prompt: string): Promise<string> {
    const agent = this.agents.get(agentId);
    if (!agent) return `[Agent ${agentId} not available]`;

    const task = this.board.createTask({
      title: `Chat: ${agentId} speaks`,
      description: prompt,
      priority: 'medium',
      assignedTo: agentId,
      createdBy: agentId,
    });

    agent.queueTask(task);
    const result = await agent.executeNextTask();
    return result?.output ?? '[No response]';
  }

  private addMessage(speaker: ChatMessage['speaker'], content: string): void {
    this.history.push({ speaker, content, timestamp: new Date() });
  }

  private formatHistory(): string {
    return this.history
      .filter(m => m.speaker !== 'system')
      .map(m => `[${m.speaker.toUpperCase()}]: ${m.content}`)
      .join('\n\n');
  }

  private log(verbose: boolean, message: string): void {
    if (!verbose) return;
    console.log(chalk.hex('#EC4899')(message));
  }
}
