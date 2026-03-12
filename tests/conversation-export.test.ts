import { describe, it, expect, afterEach } from 'vitest';
import { ConversationManager } from '../src/core/conversation-export.js';
import { rmSync, existsSync } from 'fs';

const TEST_DIR = './.test-conversations';

describe('ConversationManager', () => {
  afterEach(() => {
    if (existsSync(TEST_DIR)) {
      rmSync(TEST_DIR, { recursive: true, force: true });
    }
  });

  it('exports and imports conversations', () => {
    const manager = new ConversationManager(TEST_DIR);

    const filepath = manager.export({
      agents: [
        {
          agentId: 'ceo',
          decisions: [{ topic: 'strategy', decision: 'Focus on MVP', timestamp: new Date().toISOString() }],
          learnings: ['Market is ready'],
          context: { phase: 'mvp' },
          taskCount: 5,
        },
      ],
      messages: [],
      knowledge: [],
    });

    expect(existsSync(filepath)).toBe(true);

    const imported = manager.import(filepath);
    expect(imported).not.toBeNull();
    expect(imported!.agents).toHaveLength(1);
    expect(imported!.agents[0].agentId).toBe('ceo');
    expect(imported!.agents[0].decisions[0].decision).toBe('Focus on MVP');
  });

  it('imports latest conversation', () => {
    const manager = new ConversationManager(TEST_DIR);

    manager.export({
      agents: [{ agentId: 'cto', decisions: [], learnings: [], context: {}, taskCount: 3 }],
      messages: [],
      knowledge: [],
    });

    expect(manager.hasConversation()).toBe(true);

    const latest = manager.importLatest();
    expect(latest).not.toBeNull();
    expect(latest!.agents[0].agentId).toBe('cto');
  });

  it('builds context prompt from imported conversation', () => {
    const manager = new ConversationManager(TEST_DIR);

    const filepath = manager.export({
      agents: [
        {
          agentId: 'ceo',
          decisions: [{ topic: 'pricing', decision: 'SaaS model', timestamp: new Date().toISOString() }],
          learnings: ['Italian SMEs prefer monthly billing'],
          context: {},
          taskCount: 10,
        },
      ],
      messages: [],
      knowledge: [],
      summary: 'Completed MVP planning phase.',
    });

    const conversation = manager.import(filepath)!;
    const prompt = manager.buildContextPrompt(conversation);

    expect(prompt).toContain('PREVIOUS SESSION CONTEXT');
    expect(prompt).toContain('Completed MVP planning phase.');
    expect(prompt).toContain('pricing: SaaS model');
    expect(prompt).toContain('Italian SMEs prefer monthly billing');
  });

  it('generates auto summary', () => {
    const manager = new ConversationManager(TEST_DIR);

    const filepath = manager.export({
      agents: [
        { agentId: 'ceo', decisions: [{ topic: 'a', decision: 'b', timestamp: '' }], learnings: [], context: {}, taskCount: 5 },
        { agentId: 'cto', decisions: [], learnings: [], context: {}, taskCount: 3 },
      ],
      messages: [],
      knowledge: [],
    });

    const conversation = manager.import(filepath)!;
    expect(conversation.summary).toContain('2 agents');
    expect(conversation.summary).toContain('8 tasks completed');
  });

  it('returns null for non-existent files', () => {
    const manager = new ConversationManager(TEST_DIR);
    expect(manager.import('/nonexistent/file.json')).toBeNull();
    expect(manager.importLatest()).toBeNull();
    expect(manager.hasConversation()).toBe(false);
  });
});
