import { describe, it, expect, vi } from 'vitest';
import { MessageBus } from '../src/core/message-bus.js';

describe('MessageBus', () => {
  it('delivers messages to registered agents', () => {
    const bus = new MessageBus();
    const handler = vi.fn();
    bus.register('cto', handler);

    bus.send({
      type: 'question',
      from: 'ceo',
      to: 'cto',
      subject: 'Architecture',
      content: 'How should we structure offline?',
    });

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0]).toMatchObject({
      type: 'question',
      from: 'ceo',
      to: 'cto',
      subject: 'Architecture',
    });
  });

  it('broadcasts to all agents except sender', () => {
    const bus = new MessageBus();
    const ctoHandler = vi.fn();
    const pmHandler = vi.fn();
    const ceoHandler = vi.fn();

    bus.register('cto', ctoHandler);
    bus.register('product-manager', pmHandler);
    bus.register('ceo', ceoHandler);

    bus.send({
      type: 'broadcast',
      from: 'ceo',
      to: 'all',
      subject: 'Sprint started',
      content: 'New sprint begins now',
    });

    expect(ctoHandler).toHaveBeenCalledTimes(1);
    expect(pmHandler).toHaveBeenCalledTimes(1);
    expect(ceoHandler).not.toHaveBeenCalled(); // Sender excluded
  });

  it('tracks message log', () => {
    const bus = new MessageBus();
    bus.register('cto', vi.fn());

    bus.send({ type: 'question', from: 'ceo', to: 'cto', subject: 'Q1', content: 'Test' });
    bus.send({ type: 'answer', from: 'cto', to: 'ceo', subject: 'A1', content: 'Answer' });

    expect(bus.totalMessages).toBe(2);
    expect(bus.getLog()).toHaveLength(2);
  });

  it('returns messages for a specific agent', () => {
    const bus = new MessageBus();
    bus.register('cto', vi.fn());
    bus.register('developer', vi.fn());

    bus.send({ type: 'task_assignment', from: 'ceo', to: 'cto', subject: 'Task 1', content: 'Do X' });
    bus.send({ type: 'task_assignment', from: 'ceo', to: 'developer', subject: 'Task 2', content: 'Do Y' });
    bus.send({ type: 'broadcast', from: 'ceo', to: 'all', subject: 'All', content: 'Info' });

    const ctoMessages = bus.getMessagesFor('cto');
    expect(ctoMessages).toHaveLength(2); // Direct + broadcast
  });

  it('assigns unique IDs to messages', () => {
    const bus = new MessageBus();
    const msg1 = bus.send({ type: 'question', from: 'ceo', to: 'cto', subject: 'Q', content: 'C' });
    const msg2 = bus.send({ type: 'question', from: 'ceo', to: 'cto', subject: 'Q', content: 'C' });
    expect(msg1.id).not.toBe(msg2.id);
  });

  it('supports reply threading', () => {
    const bus = new MessageBus();
    bus.register('cto', vi.fn());

    const original = bus.send({ type: 'question', from: 'ceo', to: 'cto', subject: 'Q', content: 'Question' });
    bus.send({ type: 'answer', from: 'cto', to: 'ceo', subject: 'A', content: 'Answer', replyTo: original.id });

    const thread = bus.getThread(original.id);
    expect(thread).toHaveLength(2);
    expect(thread[0].id).toBe(original.id);
    expect(thread[1].replyTo).toBe(original.id);
  });

  it('unregisters agents', () => {
    const bus = new MessageBus();
    const handler = vi.fn();
    bus.register('cto', handler);
    bus.unregister('cto');

    bus.send({ type: 'question', from: 'ceo', to: 'cto', subject: 'Q', content: 'C' });
    expect(handler).not.toHaveBeenCalled();
  });
});
