// ============================================================
// ForgeAI Multi-Agent System — Core Types
// ============================================================

/** Unique identifier for agents */
export type AgentId =
  | 'ceo'
  | 'cto'
  | 'product-manager'
  | 'developer'
  | 'marketing'
  | 'qa-devops';

/** Current operational status of an agent */
export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'waiting' | 'error';

/** Priority levels for messages and tasks */
export type Priority = 'low' | 'medium' | 'high' | 'critical';

/** Task lifecycle states */
export type TaskStatus = 'backlog' | 'ready' | 'in_progress' | 'review' | 'done' | 'blocked';

// ------------------------------------------------------------
// Message Protocol
// ------------------------------------------------------------

/** Types of messages agents can exchange */
export type MessageType =
  | 'task_assignment'    // CEO/PM assigns a task
  | 'task_update'        // Progress update on a task
  | 'task_completed'     // Task finished
  | 'question'           // Agent asks another agent
  | 'answer'             // Response to a question
  | 'decision_request'   // Needs a decision from a higher-level agent
  | 'decision'           // Decision made
  | 'report'             // Status report / deliverable
  | 'broadcast'          // Message to all agents
  | 'feedback'           // Feedback on work done
  | 'escalation';        // Problem escalation

/** A message exchanged between agents */
export interface AgentMessage {
  id: string;
  type: MessageType;
  from: AgentId;
  to: AgentId | 'all';
  subject: string;
  content: string;
  priority: Priority;
  replyTo?: string;          // ID of message being replied to
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// ------------------------------------------------------------
// Task Management
// ------------------------------------------------------------

/** A task in the system */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  assignedTo: AgentId;
  createdBy: AgentId;
  dependencies: string[];    // Task IDs this depends on
  deliverables: string[];    // Expected outputs
  acceptanceCriteria: string[];
  subtasks: SubTask[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  output?: string;           // Final output/deliverable
}

/** A subtask within a task */
export interface SubTask {
  id: string;
  title: string;
  status: TaskStatus;
  output?: string;
}

// ------------------------------------------------------------
// Agent Configuration
// ------------------------------------------------------------

/** Configuration for an agent's role and capabilities */
export interface AgentConfig {
  id: AgentId;
  name: string;
  role: string;
  expertise: string[];
  responsibilities: string[];
  canDelegateTo: AgentId[];
  reportsTo: AgentId | null;
  systemPrompt: string;
}

/** The state of an agent at a point in time */
export interface AgentState {
  id: AgentId;
  status: AgentStatus;
  currentTask: Task | null;
  taskQueue: Task[];
  messageInbox: AgentMessage[];
  completedTasks: Task[];
  memory: AgentMemory;
}

/** Agent's working memory */
export interface AgentMemory {
  decisions: DecisionRecord[];
  context: Record<string, string>;
  learnings: string[];
}

/** Record of a decision made */
export interface DecisionRecord {
  id: string;
  topic: string;
  decision: string;
  reasoning: string;
  madeBy: AgentId;
  timestamp: Date;
}

// ------------------------------------------------------------
// Orchestrator
// ------------------------------------------------------------

/** Sprint planning structure */
export interface Sprint {
  id: string;
  name: string;
  goal: string;
  tasks: Task[];
  startDate: Date;
  endDate: Date;
  status: 'planning' | 'active' | 'review' | 'completed';
}

/** Overall system state */
export interface SystemState {
  agents: Map<AgentId, AgentState>;
  currentSprint: Sprint | null;
  messageLog: AgentMessage[];
  taskBoard: Task[];
  projectContext: ProjectContext;
}

/** ForgeAI project context shared across agents */
export interface ProjectContext {
  projectName: string;
  description: string;
  techStack: string[];
  targetMarket: string;
  currentPhase: string;
  keyMetrics: Record<string, string>;
  constraints: string[];
}
