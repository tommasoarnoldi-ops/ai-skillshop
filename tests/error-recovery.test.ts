import { describe, it, expect, vi } from 'vitest';
import { ErrorRecovery } from '../src/core/error-recovery.js';

describe('ErrorRecovery', () => {
  it('executes operation successfully on first try', async () => {
    const recovery = new ErrorRecovery();
    const result = await recovery.withRetry('ceo', 'test-op', async () => 'success');
    expect(result).toBe('success');
    expect(recovery.getErrors()).toHaveLength(0);
  });

  it('retries on retryable errors', async () => {
    const recovery = new ErrorRecovery({ baseDelayMs: 10, maxRetries: 2 });
    let attempts = 0;

    const result = await recovery.withRetry('cto', 'api-call', async () => {
      attempts++;
      if (attempts < 3) throw new Error('rate_limit exceeded');
      return 'recovered';
    });

    expect(result).toBe('recovered');
    expect(attempts).toBe(3);
  });

  it('throws after max retries', async () => {
    const recovery = new ErrorRecovery({ baseDelayMs: 10, maxRetries: 2 });

    await expect(
      recovery.withRetry('developer', 'compile', async () => {
        throw new Error('rate_limit error');
      }),
    ).rejects.toThrow('rate_limit error');

    expect(recovery.getErrors()).toHaveLength(3); // 1 initial + 2 retries
  });

  it('does not retry non-retryable errors', async () => {
    const recovery = new ErrorRecovery({
      baseDelayMs: 10,
      maxRetries: 3,
      retryableErrors: ['timeout'],
    });
    let attempts = 0;

    await expect(
      recovery.withRetry('cto', 'validate', async () => {
        attempts++;
        throw new Error('invalid argument');
      }),
    ).rejects.toThrow('invalid argument');

    expect(attempts).toBe(1);
  });

  it('uses fallback when all retries fail', async () => {
    const recovery = new ErrorRecovery({ baseDelayMs: 10, maxRetries: 1 });

    const result = await recovery.withFallback(
      'marketing',
      'fetch-data',
      async () => { throw new Error('timeout'); },
      'default-value',
    );

    expect(result).toBe('default-value');
  });

  it('tracks errors per agent', async () => {
    const recovery = new ErrorRecovery({ baseDelayMs: 10, maxRetries: 0 });

    try { await recovery.withRetry('cto', 'op1', async () => { throw new Error('503'); }); } catch {}
    try { await recovery.withRetry('developer', 'op2', async () => { throw new Error('timeout'); }); } catch {}
    try { await recovery.withRetry('cto', 'op3', async () => { throw new Error('503'); }); } catch {}

    expect(recovery.getErrorsFor('cto')).toHaveLength(2);
    expect(recovery.getErrorsFor('developer')).toHaveLength(1);
  });

  it('opens circuit breaker after repeated failures', async () => {
    const recovery = new ErrorRecovery({ baseDelayMs: 10, maxRetries: 0 });

    // Trigger 5 failures to open the circuit
    for (let i = 0; i < 5; i++) {
      try {
        await recovery.withRetry('cto', 'flaky', async () => { throw new Error('503'); });
      } catch {}
    }

    // Circuit should be open now
    await expect(
      recovery.withRetry('cto', 'flaky', async () => 'should not reach'),
    ).rejects.toThrow('Circuit breaker open');
  });

  it('generates summary', async () => {
    const recovery = new ErrorRecovery({ baseDelayMs: 10, maxRetries: 0 });

    try { await recovery.withRetry('ceo', 'plan', async () => { throw new Error('timeout'); }); } catch {}

    const summary = recovery.getSummary();
    expect(summary).toContain('Total errors: 1');
    expect(summary).toContain('ceo');
  });
});
