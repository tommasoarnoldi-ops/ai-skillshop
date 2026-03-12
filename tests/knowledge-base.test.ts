import { describe, it, expect } from 'vitest';
import { KnowledgeBase } from '../src/core/knowledge-base.js';

describe('KnowledgeBase', () => {
  it('adds and retrieves entries', () => {
    const kb = new KnowledgeBase();
    const entry = kb.put({
      category: 'architecture',
      key: 'tech-stack',
      content: 'React Native + Supabase + Claude API',
      contributedBy: 'cto',
      tags: ['stack', 'mobile'],
    });

    expect(entry.id).toBeDefined();
    expect(entry.version).toBe(1);
    expect(kb.size).toBe(1);
  });

  it('updates existing entries by category+key', () => {
    const kb = new KnowledgeBase();
    kb.put({
      category: 'architecture',
      key: 'tech-stack',
      content: 'Version 1',
      contributedBy: 'cto',
    });

    const updated = kb.put({
      category: 'architecture',
      key: 'tech-stack',
      content: 'Version 2',
      contributedBy: 'cto',
    });

    expect(updated.version).toBe(2);
    expect(updated.content).toBe('Version 2');
    expect(kb.size).toBe(1); // No duplicate
  });

  it('finds entries by key', () => {
    const kb = new KnowledgeBase();
    kb.put({ category: 'decision', key: 'offline-strategy', content: 'SQLite + sync', contributedBy: 'cto' });
    kb.put({ category: 'decision', key: 'auth-method', content: 'Supabase Auth', contributedBy: 'cto' });

    const found = kb.findByKey('decision', 'offline-strategy');
    expect(found).toBeDefined();
    expect(found!.content).toBe('SQLite + sync');

    expect(kb.findByKey('decision', 'nonexistent')).toBeUndefined();
  });

  it('retrieves entries by category', () => {
    const kb = new KnowledgeBase();
    kb.put({ category: 'architecture', key: 'k1', content: 'C1', contributedBy: 'cto' });
    kb.put({ category: 'architecture', key: 'k2', content: 'C2', contributedBy: 'cto' });
    kb.put({ category: 'market_intel', key: 'k3', content: 'C3', contributedBy: 'marketing' });

    expect(kb.getByCategory('architecture')).toHaveLength(2);
    expect(kb.getByCategory('market_intel')).toHaveLength(1);
    expect(kb.getByCategory('testing')).toHaveLength(0);
  });

  it('searches by tag', () => {
    const kb = new KnowledgeBase();
    kb.put({ category: 'architecture', key: 'k1', content: 'C', contributedBy: 'cto', tags: ['mobile', 'react-native'] });
    kb.put({ category: 'architecture', key: 'k2', content: 'C', contributedBy: 'cto', tags: ['backend', 'supabase'] });

    const results = kb.searchByTag('mobile');
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('k1');
  });

  it('searches by content keyword', () => {
    const kb = new KnowledgeBase();
    kb.put({ category: 'requirements', key: 'offline', content: 'App must work offline with SQLite', contributedBy: 'product-manager' });
    kb.put({ category: 'requirements', key: 'auth', content: 'Use Supabase Auth with magic links', contributedBy: 'product-manager' });

    const results = kb.search('sqlite');
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('offline');
  });

  it('retrieves entries by agent', () => {
    const kb = new KnowledgeBase();
    kb.put({ category: 'architecture', key: 'k1', content: 'C', contributedBy: 'cto' });
    kb.put({ category: 'market_intel', key: 'k2', content: 'C', contributedBy: 'marketing' });
    kb.put({ category: 'decision', key: 'k3', content: 'C', contributedBy: 'cto' });

    expect(kb.getByAgent('cto')).toHaveLength(2);
    expect(kb.getByAgent('marketing')).toHaveLength(1);
  });

  it('generates context for a topic', () => {
    const kb = new KnowledgeBase();
    kb.put({ category: 'architecture', key: 'offline', content: 'SQLite for offline storage', contributedBy: 'cto', tags: ['offline'] });

    const context = kb.getContextFor('offline');
    expect(context).toContain('SQLite');
    expect(context).toContain('architecture/offline');

    expect(kb.getContextFor('nonexistent-topic')).toBe('No existing knowledge on this topic.');
  });

  it('exports summary', () => {
    const kb = new KnowledgeBase();
    kb.put({ category: 'architecture', key: 'stack', content: 'React Native', contributedBy: 'cto' });
    kb.put({ category: 'decision', key: 'db', content: 'Supabase', contributedBy: 'cto' });

    const summary = kb.exportSummary();
    expect(summary).toContain('KNOWLEDGE BASE SUMMARY');
    expect(summary).toContain('ARCHITECTURE');
    expect(summary).toContain('DECISION');
    expect(summary).toContain('Total entries: 2');
  });
});
