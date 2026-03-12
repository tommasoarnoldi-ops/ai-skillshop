// ============================================================
// Knowledge Base — Shared project knowledge across all agents
// ============================================================

import { v4 as uuid } from 'uuid';
import type { AgentId } from '../types/index.js';

export interface KnowledgeEntry {
  id: string;
  category: KnowledgeCategory;
  key: string;
  content: string;
  contributedBy: AgentId;
  version: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type KnowledgeCategory =
  | 'architecture'      // Decisioni architetturali
  | 'requirements'      // Requisiti di prodotto
  | 'api_contract'      // Contratti API definiti
  | 'schema'            // Schema database
  | 'component'         // Specifiche componenti
  | 'decision'          // ADR — Architecture Decision Records
  | 'market_intel'      // Intelligence di mercato
  | 'user_research'     // Ricerca utenti
  | 'brand'             // Brand guidelines, messaging
  | 'testing'           // Strategie e risultati test
  | 'infrastructure'    // Configurazioni infra
  | 'learning';         // Lezioni apprese

/**
 * Centralized knowledge base that all agents can read and write to.
 * Acts as the organizational memory of the startup.
 */
export class KnowledgeBase {
  private entries = new Map<string, KnowledgeEntry>();
  private index = new Map<KnowledgeCategory, Set<string>>(); // category → entry IDs

  /** Add or update a knowledge entry */
  put(params: {
    category: KnowledgeCategory;
    key: string;
    content: string;
    contributedBy: AgentId;
    tags?: string[];
  }): KnowledgeEntry {
    // Check if entry with same category+key exists
    const existing = this.findByKey(params.category, params.key);

    if (existing) {
      existing.content = params.content;
      existing.version += 1;
      existing.updatedAt = new Date();
      if (params.tags) existing.tags = params.tags;
      return existing;
    }

    const entry: KnowledgeEntry = {
      id: uuid(),
      category: params.category,
      key: params.key,
      content: params.content,
      contributedBy: params.contributedBy,
      version: 1,
      tags: params.tags ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.entries.set(entry.id, entry);

    if (!this.index.has(params.category)) {
      this.index.set(params.category, new Set());
    }
    this.index.get(params.category)!.add(entry.id);

    return entry;
  }

  /** Find entry by category and key */
  findByKey(category: KnowledgeCategory, key: string): KnowledgeEntry | undefined {
    const ids = this.index.get(category);
    if (!ids) return undefined;
    for (const id of ids) {
      const entry = this.entries.get(id);
      if (entry?.key === key) return entry;
    }
    return undefined;
  }

  /** Get all entries in a category */
  getByCategory(category: KnowledgeCategory): KnowledgeEntry[] {
    const ids = this.index.get(category);
    if (!ids) return [];
    return Array.from(ids)
      .map(id => this.entries.get(id)!)
      .filter(Boolean);
  }

  /** Search entries by tag */
  searchByTag(tag: string): KnowledgeEntry[] {
    return Array.from(this.entries.values()).filter(e =>
      e.tags.some(t => t.toLowerCase().includes(tag.toLowerCase())),
    );
  }

  /** Search entries by content keyword */
  search(query: string): KnowledgeEntry[] {
    const lower = query.toLowerCase();
    return Array.from(this.entries.values()).filter(
      e =>
        e.key.toLowerCase().includes(lower) ||
        e.content.toLowerCase().includes(lower) ||
        e.tags.some(t => t.toLowerCase().includes(lower)),
    );
  }

  /** Get all entries contributed by an agent */
  getByAgent(agentId: AgentId): KnowledgeEntry[] {
    return Array.from(this.entries.values()).filter(e => e.contributedBy === agentId);
  }

  /** Get a context summary for a specific topic (used in agent prompts) */
  getContextFor(topic: string): string {
    const relevant = this.search(topic);
    if (relevant.length === 0) return 'No existing knowledge on this topic.';

    return relevant
      .slice(0, 10)
      .map(e => `[${e.category}/${e.key}] (by ${e.contributedBy}, v${e.version})\n${e.content}`)
      .join('\n\n---\n\n');
  }

  /** Export all knowledge as structured summary */
  exportSummary(): string {
    const categories = Array.from(this.index.keys());
    const lines: string[] = [
      '═══════════════════════════════════════',
      'KNOWLEDGE BASE SUMMARY',
      '═══════════════════════════════════════',
      `Total entries: ${this.entries.size}`,
      '',
    ];

    for (const cat of categories) {
      const entries = this.getByCategory(cat);
      lines.push(`── ${cat.toUpperCase()} (${entries.length}) ──`);
      for (const e of entries) {
        lines.push(`  • ${e.key} (v${e.version}, by ${e.contributedBy})`);
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /** Total entries count */
  get size(): number {
    return this.entries.size;
  }
}
