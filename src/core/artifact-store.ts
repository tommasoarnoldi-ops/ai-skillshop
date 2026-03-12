// ============================================================
// Artifact Store — Agents produce real files and deliverables
// ============================================================

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { v4 as uuid } from 'uuid';
import type { AgentId } from '../types/index.js';

export type ArtifactType =
  | 'code'           // Source code files
  | 'config'         // Configuration files
  | 'migration'      // Database migrations
  | 'document'       // Documents (PRD, specs, plans)
  | 'test'           // Test files
  | 'prompt'         // AI prompts
  | 'marketing'      // Marketing materials
  | 'pipeline';      // CI/CD configs

export interface Artifact {
  id: string;
  type: ArtifactType;
  filePath: string;       // Relative path from output root
  content: string;
  description: string;
  createdBy: AgentId;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Manages artifacts (files) produced by agents.
 * Can write them to disk in a structured output directory.
 */
export class ArtifactStore {
  private artifacts = new Map<string, Artifact>();
  private pathIndex = new Map<string, string>(); // filePath → artifact ID
  private outputRoot: string;

  constructor(outputRoot: string = './output') {
    this.outputRoot = resolve(outputRoot);
  }

  /** Register a new artifact (or update existing at same path) */
  add(params: {
    type: ArtifactType;
    filePath: string;
    content: string;
    description: string;
    createdBy: AgentId;
  }): Artifact {
    const existing = this.getByPath(params.filePath);

    if (existing) {
      existing.content = params.content;
      existing.description = params.description;
      existing.version += 1;
      existing.updatedAt = new Date();
      return existing;
    }

    const artifact: Artifact = {
      id: uuid(),
      type: params.type,
      filePath: params.filePath,
      content: params.content,
      description: params.description,
      createdBy: params.createdBy,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.artifacts.set(artifact.id, artifact);
    this.pathIndex.set(params.filePath, artifact.id);
    return artifact;
  }

  /** Get artifact by file path */
  getByPath(filePath: string): Artifact | undefined {
    const id = this.pathIndex.get(filePath);
    if (!id) return undefined;
    return this.artifacts.get(id);
  }

  /** Get all artifacts by type */
  getByType(type: ArtifactType): Artifact[] {
    return Array.from(this.artifacts.values()).filter(a => a.type === type);
  }

  /** Get all artifacts by agent */
  getByAgent(agentId: AgentId): Artifact[] {
    return Array.from(this.artifacts.values()).filter(a => a.createdBy === agentId);
  }

  /** Write all artifacts to disk */
  writeAllToDisk(): { written: number; errors: string[] } {
    let written = 0;
    const errors: string[] = [];

    for (const artifact of this.artifacts.values()) {
      try {
        const fullPath = join(this.outputRoot, artifact.filePath);
        const dir = dirname(fullPath);

        if (!existsSync(dir)) {
          mkdirSync(dir, { recursive: true });
        }

        writeFileSync(fullPath, artifact.content, 'utf-8');
        written++;
      } catch (error) {
        errors.push(
          `Failed to write ${artifact.filePath}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return { written, errors };
  }

  /** Write a single artifact to disk */
  writeToDisk(artifactId: string): boolean {
    const artifact = this.artifacts.get(artifactId);
    if (!artifact) return false;

    try {
      const fullPath = join(this.outputRoot, artifact.filePath);
      const dir = dirname(fullPath);

      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(fullPath, artifact.content, 'utf-8');
      return true;
    } catch {
      return false;
    }
  }

  /** Read an artifact from disk (for comparing with stored version) */
  readFromDisk(filePath: string): string | null {
    try {
      const fullPath = join(this.outputRoot, filePath);
      return readFileSync(fullPath, 'utf-8');
    } catch {
      return null;
    }
  }

  /** Get summary of all artifacts */
  getSummary(): string {
    const byType = new Map<ArtifactType, Artifact[]>();
    for (const a of this.artifacts.values()) {
      if (!byType.has(a.type)) byType.set(a.type, []);
      byType.get(a.type)!.push(a);
    }

    const lines: string[] = [
      '═══════════════════════════════════════',
      'ARTIFACT STORE',
      '═══════════════════════════════════════',
      `Total artifacts: ${this.artifacts.size}`,
      `Output root: ${this.outputRoot}`,
      '',
    ];

    for (const [type, artifacts] of byType) {
      lines.push(`── ${type.toUpperCase()} (${artifacts.length}) ──`);
      for (const a of artifacts) {
        lines.push(`  ${a.filePath} (v${a.version}, by ${a.createdBy})`);
        lines.push(`    ${a.description}`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /** Total artifact count */
  get size(): number {
    return this.artifacts.size;
  }
}
