// ============================================================
// Error Recovery — Resilient execution with retry and fallback
// ============================================================

import type { AgentId } from '../types/index.js';

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  retryableErrors?: string[];
}

export interface ErrorRecord {
  agentId: AgentId;
  operation: string;
  error: string;
  attempt: number;
  timestamp: Date;
  recovered: boolean;
}

const DEFAULT_RETRY: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffFactor: 2,
  retryableErrors: ['rate_limit', 'timeout', 'overloaded', 'ECONNRESET', 'ETIMEDOUT', '529', '503'],
};

/**
 * Centralized error recovery and retry system for agent operations.
 */
export class ErrorRecovery {
  private errorLog: ErrorRecord[] = [];
  private circuitBreakers = new Map<string, { failures: number; openUntil: Date | null }>();
  private config: RetryConfig;

  constructor(config?: Partial<RetryConfig>) {
    this.config = { ...DEFAULT_RETRY, ...config };
  }

  /**
   * Execute an operation with automatic retry and exponential backoff.
   */
  async withRetry<T>(
    agentId: AgentId,
    operation: string,
    fn: () => Promise<T>,
    config?: Partial<RetryConfig>,
  ): Promise<T> {
    const cfg = { ...this.config, ...config };
    const circuitKey = `${agentId}:${operation}`;

    // Check circuit breaker
    const breaker = this.circuitBreakers.get(circuitKey);
    if (breaker?.openUntil && breaker.openUntil > new Date()) {
      throw new Error(`Circuit breaker open for ${circuitKey} until ${breaker.openUntil.toISOString()}`);
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= cfg.maxRetries; attempt++) {
      try {
        const result = await fn();

        // Reset circuit breaker on success
        this.circuitBreakers.set(circuitKey, { failures: 0, openUntil: null });

        if (attempt > 0) {
          this.logError(agentId, operation, lastError?.message ?? 'unknown', attempt, true);
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        this.logError(agentId, operation, lastError.message, attempt + 1, false);

        // Check if error is retryable
        if (attempt < cfg.maxRetries && this.isRetryable(lastError, cfg)) {
          const delay = Math.min(
            cfg.baseDelayMs * Math.pow(cfg.backoffFactor, attempt),
            cfg.maxDelayMs,
          );
          await this.sleep(delay);
          continue;
        }

        // Update circuit breaker
        const cb = this.circuitBreakers.get(circuitKey) ?? { failures: 0, openUntil: null };
        cb.failures += 1;
        if (cb.failures >= 5) {
          cb.openUntil = new Date(Date.now() + 60000); // Open for 1 minute
          cb.failures = 0;
        }
        this.circuitBreakers.set(circuitKey, cb);

        break;
      }
    }

    throw lastError ?? new Error(`Operation ${operation} failed after ${cfg.maxRetries} retries`);
  }

  /**
   * Execute with a fallback value if all retries fail.
   */
  async withFallback<T>(
    agentId: AgentId,
    operation: string,
    fn: () => Promise<T>,
    fallback: T,
    config?: Partial<RetryConfig>,
  ): Promise<T> {
    try {
      return await this.withRetry(agentId, operation, fn, config);
    } catch {
      this.logError(agentId, operation, 'Falling back to default', 0, true);
      return fallback;
    }
  }

  /** Get all error records */
  getErrors(): ErrorRecord[] {
    return [...this.errorLog];
  }

  /** Get errors for a specific agent */
  getErrorsFor(agentId: AgentId): ErrorRecord[] {
    return this.errorLog.filter(e => e.agentId === agentId);
  }

  /** Get circuit breaker status */
  getCircuitStatus(): Map<string, { failures: number; isOpen: boolean }> {
    const status = new Map<string, { failures: number; isOpen: boolean }>();
    for (const [key, val] of this.circuitBreakers) {
      status.set(key, {
        failures: val.failures,
        isOpen: val.openUntil !== null && val.openUntil > new Date(),
      });
    }
    return status;
  }

  /** Reset circuit breaker for a specific agent+operation */
  resetCircuitBreaker(agentId: AgentId, operation: string): void {
    this.circuitBreakers.delete(`${agentId}:${operation}`);
  }

  /** Summary for dashboard */
  getSummary(): string {
    const total = this.errorLog.length;
    const recovered = this.errorLog.filter(e => e.recovered).length;
    const recent = this.errorLog.slice(-5);

    const lines = [
      `Total errors: ${total} (${recovered} recovered)`,
    ];

    if (recent.length > 0) {
      lines.push('Recent:');
      for (const e of recent) {
        const status = e.recovered ? '✓' : '✗';
        lines.push(`  ${status} [${e.agentId}] ${e.operation} — ${e.error.substring(0, 60)}`);
      }
    }

    const openBreakers = Array.from(this.circuitBreakers.entries())
      .filter(([, v]) => v.openUntil !== null && v.openUntil > new Date());
    if (openBreakers.length > 0) {
      lines.push('Open circuit breakers:');
      for (const [key] of openBreakers) {
        lines.push(`  ⚡ ${key}`);
      }
    }

    return lines.join('\n');
  }

  // ---- Private ----

  private isRetryable(error: Error, cfg: RetryConfig): boolean {
    if (!cfg.retryableErrors?.length) return true;
    const msg = error.message.toLowerCase();
    return cfg.retryableErrors.some(pattern => msg.includes(pattern.toLowerCase()));
  }

  private logError(agentId: AgentId, operation: string, error: string, attempt: number, recovered: boolean): void {
    this.errorLog.push({ agentId, operation, error, attempt, timestamp: new Date(), recovered });
    // Keep log bounded
    if (this.errorLog.length > 500) {
      this.errorLog = this.errorLog.slice(-400);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
