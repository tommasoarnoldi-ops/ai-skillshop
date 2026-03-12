// ============================================================
// Collaboration Protocols — Advanced agent interaction patterns
// ============================================================

import type { AgentId } from '../types/index.js';
import type { BaseAgent } from './base-agent.js';
import type { MessageBus } from './message-bus.js';
import type { TaskBoard } from './task-board.js';
import type { KnowledgeBase } from './knowledge-base.js';
import type { ArtifactStore, ArtifactType } from './artifact-store.js';

interface AgentRegistry {
  get(id: AgentId): BaseAgent | undefined;
}

/**
 * Review Protocol — One agent reviews another's work.
 * Returns structured feedback with approval/rejection.
 */
export interface ReviewResult {
  approved: boolean;
  reviewer: AgentId;
  author: AgentId;
  subject: string;
  feedback: string;
  issues: string[];
  suggestions: string[];
}

/**
 * Debate Protocol — Two agents discuss a topic, reach a conclusion.
 */
export interface DebateResult {
  topic: string;
  participants: AgentId[];
  rounds: DebateRound[];
  conclusion: string;
  decidedBy: AgentId;
}

export interface DebateRound {
  round: number;
  speaker: AgentId;
  argument: string;
}

/**
 * Pipeline Protocol — Sequential processing where each agent transforms
 * the output of the previous one.
 */
export interface PipelineStage {
  agentId: AgentId;
  instruction: string;
  outputType?: ArtifactType;
  outputPath?: string;
}

export interface PipelineResult {
  stages: Array<{
    agentId: AgentId;
    input: string;
    output: string;
    duration: number;
  }>;
  finalOutput: string;
}

/**
 * Collaboration engine that implements advanced multi-agent interaction patterns.
 */
export class CollaborationEngine {
  constructor(
    private agents: AgentRegistry,
    private bus: MessageBus,
    private board: TaskBoard,
    private kb: KnowledgeBase,
    private artifacts: ArtifactStore,
  ) {}

  // ---- Review Protocol ----

  /**
   * One agent reviews another's work.
   * The reviewer provides structured feedback.
   */
  async review(params: {
    authorId: AgentId;
    reviewerId: AgentId;
    subject: string;
    content: string;
  }): Promise<ReviewResult> {
    const reviewer = this.agents.get(params.reviewerId);
    if (!reviewer) throw new Error(`Reviewer ${params.reviewerId} not found`);

    // Create a review task
    const task = this.board.createTask({
      title: `Review: ${params.subject}`,
      description: `Review the following work by ${params.authorId}:\n\n${params.content}`,
      priority: 'high',
      assignedTo: params.reviewerId,
      createdBy: params.authorId,
      deliverables: ['Structured review with approval/rejection'],
      acceptanceCriteria: [
        'List specific issues found',
        'Provide actionable suggestions',
        'Clear approved/rejected decision',
      ],
    });

    reviewer.queueTask(task);
    const completed = await reviewer.executeNextTask();
    const feedback = completed?.output ?? 'No feedback generated';

    // Parse the feedback for structured data
    const approved =
      feedback.toLowerCase().includes('approved') ||
      feedback.toLowerCase().includes('approvato') ||
      (!feedback.toLowerCase().includes('rejected') && !feedback.toLowerCase().includes('rifiutato'));

    const issues = extractBulletPoints(feedback, ['issue', 'problema', 'bug', 'error']);
    const suggestions = extractBulletPoints(feedback, ['suggest', 'suggerim', 'miglior', 'recommend']);

    const result: ReviewResult = {
      approved,
      reviewer: params.reviewerId,
      author: params.authorId,
      subject: params.subject,
      feedback,
      issues,
      suggestions,
    };

    // Notify the author
    this.bus.send({
      type: 'feedback',
      from: params.reviewerId,
      to: params.authorId,
      subject: `Review: ${params.subject} — ${approved ? 'APPROVED' : 'CHANGES REQUESTED'}`,
      content: feedback,
      priority: approved ? 'medium' : 'high',
    });

    // Store review in knowledge base
    this.kb.put({
      category: 'decision',
      key: `review-${params.subject}`,
      content: feedback,
      contributedBy: params.reviewerId,
      tags: ['review', approved ? 'approved' : 'changes-requested'],
    });

    return result;
  }

  // ---- Debate Protocol ----

  /**
   * Two agents debate a topic for N rounds, then a decider makes the call.
   */
  async debate(params: {
    topic: string;
    participant1: AgentId;
    participant2: AgentId;
    deciderId: AgentId;
    rounds?: number;
    context?: string;
  }): Promise<DebateResult> {
    const maxRounds = params.rounds ?? 2;
    const rounds: DebateRound[] = [];
    let previousArguments = '';

    for (let i = 0; i < maxRounds; i++) {
      // Participant 1 argues
      const agent1 = this.agents.get(params.participant1);
      if (!agent1) throw new Error(`Agent ${params.participant1} not found`);

      const task1 = this.board.createTask({
        title: `Debate R${i + 1}: ${params.topic}`,
        description: `Topic: ${params.topic}\n${params.context ? `Context: ${params.context}\n` : ''}${previousArguments ? `Previous arguments:\n${previousArguments}\n` : ''}\nPresenta la tua posizione come ${params.participant1}. Sii specifico e concreto. Round ${i + 1}/${maxRounds}.`,
        priority: 'medium',
        assignedTo: params.participant1,
        createdBy: params.deciderId,
      });

      agent1.queueTask(task1);
      const result1 = await agent1.executeNextTask();
      const arg1 = result1?.output ?? '';
      rounds.push({ round: i + 1, speaker: params.participant1, argument: arg1 });
      previousArguments += `\n[${params.participant1}, R${i + 1}]: ${arg1}\n`;

      // Participant 2 responds
      const agent2 = this.agents.get(params.participant2);
      if (!agent2) throw new Error(`Agent ${params.participant2} not found`);

      const task2 = this.board.createTask({
        title: `Debate R${i + 1} response: ${params.topic}`,
        description: `Topic: ${params.topic}\nPrevious arguments:\n${previousArguments}\n\nRispondi all'argomento di ${params.participant1}. Presenta la tua posizione come ${params.participant2}. Round ${i + 1}/${maxRounds}.`,
        priority: 'medium',
        assignedTo: params.participant2,
        createdBy: params.deciderId,
      });

      agent2.queueTask(task2);
      const result2 = await agent2.executeNextTask();
      const arg2 = result2?.output ?? '';
      rounds.push({ round: i + 1, speaker: params.participant2, argument: arg2 });
      previousArguments += `\n[${params.participant2}, R${i + 1}]: ${arg2}\n`;
    }

    // Decider makes the final call
    const decider = this.agents.get(params.deciderId);
    if (!decider) throw new Error(`Decider ${params.deciderId} not found`);

    const decisionTask = this.board.createTask({
      title: `Decision: ${params.topic}`,
      description: `Debate sul topic: ${params.topic}\n\nArgomenti presentati:\n${previousArguments}\n\nCome ${params.deciderId}, prendi una decisione finale. Considera entrambe le posizioni e spiega il tuo reasoning.`,
      priority: 'high',
      assignedTo: params.deciderId,
      createdBy: params.deciderId,
    });

    decider.queueTask(decisionTask);
    const decisionResult = await decider.executeNextTask();
    const conclusion = decisionResult?.output ?? 'No conclusion reached';

    // Store decision in knowledge base
    this.kb.put({
      category: 'decision',
      key: `debate-${params.topic}`,
      content: `Debate: ${params.topic}\nParticipants: ${params.participant1}, ${params.participant2}\nDecider: ${params.deciderId}\n\nConclusion: ${conclusion}`,
      contributedBy: params.deciderId,
      tags: ['debate', 'decision'],
    });

    // Broadcast decision
    this.bus.send({
      type: 'broadcast',
      from: params.deciderId,
      to: 'all',
      subject: `Decision: ${params.topic}`,
      content: conclusion,
    });

    return {
      topic: params.topic,
      participants: [params.participant1, params.participant2],
      rounds,
      conclusion,
      decidedBy: params.deciderId,
    };
  }

  // ---- Pipeline Protocol ----

  /**
   * Run a sequential pipeline where each agent's output feeds the next.
   */
  async pipeline(params: {
    name: string;
    initialInput: string;
    stages: PipelineStage[];
  }): Promise<PipelineResult> {
    const stageResults: PipelineResult['stages'] = [];
    let currentInput = params.initialInput;

    for (const stage of params.stages) {
      const agent = this.agents.get(stage.agentId);
      if (!agent) throw new Error(`Agent ${stage.agentId} not found`);

      const startTime = Date.now();

      const task = this.board.createTask({
        title: `Pipeline ${params.name}: ${stage.instruction.substring(0, 50)}`,
        description: `${stage.instruction}\n\nInput from previous stage:\n${currentInput.substring(0, 3000)}`,
        priority: 'high',
        assignedTo: stage.agentId,
        createdBy: 'ceo',
        deliverables: stage.outputPath ? [stage.outputPath] : [],
      });

      agent.queueTask(task);
      const result = await agent.executeNextTask();
      const output = result?.output ?? '';
      const duration = Date.now() - startTime;

      stageResults.push({
        agentId: stage.agentId,
        input: currentInput.substring(0, 500),
        output: output.substring(0, 2000),
        duration,
      });

      // Save artifact if output path specified
      if (stage.outputPath && output) {
        this.artifacts.add({
          type: stage.outputType ?? 'document',
          filePath: stage.outputPath,
          content: output,
          description: `Pipeline ${params.name} — ${stage.instruction}`,
          createdBy: stage.agentId,
        });
      }

      currentInput = output;
    }

    return {
      stages: stageResults,
      finalOutput: currentInput,
    };
  }

  // ---- Parallel Execution ----

  /**
   * Execute multiple tasks in parallel across different agents.
   */
  async parallel(
    tasks: Array<{
      agentId: AgentId;
      instruction: string;
      outputKey?: string;
    }>,
  ): Promise<Map<string, string>> {
    const results = new Map<string, string>();

    const promises = tasks.map(async (t) => {
      const agent = this.agents.get(t.agentId);
      if (!agent) return;

      const task = this.board.createTask({
        title: t.instruction.substring(0, 80),
        description: t.instruction,
        priority: 'high',
        assignedTo: t.agentId,
        createdBy: 'ceo',
      });

      agent.queueTask(task);
      const completed = await agent.executeNextTask();
      const key = t.outputKey ?? t.agentId;
      results.set(key, completed?.output ?? '');
    });

    await Promise.all(promises);
    return results;
  }
}

// ---- Helpers ----

function extractBulletPoints(text: string, keywords: string[]): string[] {
  const lines = text.split('\n');
  const results: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isBullet = trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*') || /^\d+\./.test(trimmed);
    if (!isBullet) continue;

    const lower = trimmed.toLowerCase();
    if (keywords.some(kw => lower.includes(kw))) {
      results.push(trimmed.replace(/^[-•*]\s*|\d+\.\s*/, ''));
    }
  }

  // If no keyword matches, return all bullet points
  if (results.length === 0) {
    for (const line of lines) {
      const trimmed = line.trim();
      const isBullet = trimmed.startsWith('-') || trimmed.startsWith('•') || /^\d+\./.test(trimmed);
      if (isBullet) {
        results.push(trimmed.replace(/^[-•*]\s*|\d+\.\s*/, ''));
      }
    }
  }

  return results.slice(0, 10);
}
