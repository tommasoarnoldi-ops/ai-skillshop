// ============================================================
// State Persistence — Save and restore agent system state
// ============================================================

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import type { AgentId, AgentMessage, Task, DecisionRecord } from '../types/index.js';
import type { KnowledgeEntry } from './knowledge-base.js';
import type { Artifact } from './artifact-store.js';

/** Serializable snapshot of the entire system state */
export interface SystemSnapshot {
  version: string;
  timestamp: string;
  agents: AgentSnapshot[];
  tasks: Task[];
  messages: AgentMessage[];
  knowledge: KnowledgeEntry[];
  artifacts: ArtifactSnapshot[];
  metadata: Record<string, unknown>;
}

export interface AgentSnapshot {
  id: AgentId;
  completedTaskCount: number;
  queuedTaskCount: number;
  decisions: DecisionRecord[];
  context: Record<string, string>;
  learnings: string[];
}

export interface ArtifactSnapshot {
  id: string;
  type: string;
  filePath: string;
  description: string;
  createdBy: AgentId;
  version: number;
  createdAt: string;
  // Content is saved in separate files, not in the snapshot
}

/**
 * Handles saving and loading the entire system state to/from disk.
 * Allows agents to resume work across sessions.
 */
export class StatePersistence {
  private stateDir: string;

  constructor(stateDir: string = './.forgeai-state') {
    this.stateDir = stateDir;
  }

  /** Save a system snapshot to disk */
  save(snapshot: SystemSnapshot): string {
    if (!existsSync(this.stateDir)) {
      mkdirSync(this.stateDir, { recursive: true });
    }

    const filename = `state-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    const filepath = join(this.stateDir, filename);

    // Convert dates for serialization
    const serializable = JSON.parse(JSON.stringify(snapshot, dateReplacer));
    writeFileSync(filepath, JSON.stringify(serializable, null, 2), 'utf-8');

    // Also save as "latest"
    const latestPath = join(this.stateDir, 'latest.json');
    writeFileSync(latestPath, JSON.stringify(serializable, null, 2), 'utf-8');

    return filepath;
  }

  /** Load the latest state snapshot */
  loadLatest(): SystemSnapshot | null {
    const latestPath = join(this.stateDir, 'latest.json');
    if (!existsSync(latestPath)) return null;

    try {
      const raw = readFileSync(latestPath, 'utf-8');
      return JSON.parse(raw, dateReviver) as SystemSnapshot;
    } catch {
      return null;
    }
  }

  /** Load a specific state file */
  load(filepath: string): SystemSnapshot | null {
    if (!existsSync(filepath)) return null;

    try {
      const raw = readFileSync(filepath, 'utf-8');
      return JSON.parse(raw, dateReviver) as SystemSnapshot;
    } catch {
      return null;
    }
  }

  /** Check if a saved state exists */
  hasState(): boolean {
    const latestPath = join(this.stateDir, 'latest.json');
    return existsSync(latestPath);
  }

  /** Get state directory path */
  getStateDir(): string {
    return this.stateDir;
  }
}

// ---- JSON serialization helpers for Date objects ----

function dateReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Date) {
    return { __type: 'Date', value: value.toISOString() };
  }
  return value;
}

function dateReviver(_key: string, value: unknown): unknown {
  if (
    value &&
    typeof value === 'object' &&
    (value as Record<string, unknown>).__type === 'Date'
  ) {
    return new Date((value as Record<string, string>).value);
  }
  return value;
}
