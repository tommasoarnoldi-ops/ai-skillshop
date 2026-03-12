import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createApiServer } from '../src/server/api.js';
import type { Server } from 'http';

// Use a mock API key — agents won't actually call Claude in these tests
const TEST_PORT = 9876;
let server: Server;
let baseUrl: string;

beforeAll(async () => {
  const api = createApiServer({
    apiKey: 'test-key-not-real',
    port: TEST_PORT,
    verbose: false,
  });
  server = api.server;
  baseUrl = `http://localhost:${TEST_PORT}`;

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, resolve);
  });
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

describe('API Server', () => {
  it('GET /api/health returns ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ok');
    expect(data.agents).toBe(6);
    expect(data.systems).toBe(18);
  });

  it('GET /api/status returns status text', async () => {
    const res = await fetch(`${baseUrl}/api/status`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toContain('FORGEAI AGENT SYSTEM STATUS');
  });

  it('GET /api/kb returns knowledge base', async () => {
    const res = await fetch(`${baseUrl}/api/kb`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.knowledgeBase).toContain('KNOWLEDGE BASE SUMMARY');
  });

  it('GET /api/health-report returns health info', async () => {
    const res = await fetch(`${baseUrl}/api/health-report`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.health).toContain('System uptime');
  });

  it('GET /api/errors returns error summary', async () => {
    const res = await fetch(`${baseUrl}/api/errors`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.errors).toContain('Total errors');
  });

  it('GET /api/scheduler returns scheduler summary', async () => {
    const res = await fetch(`${baseUrl}/api/scheduler`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(typeof data.scheduler).toBe('string');
  });

  it('POST /api/ask validates required fields', async () => {
    const res = await fetch(`${baseUrl}/api/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe('Missing agent or question');
  });

  it('POST /api/sprint validates required fields', async () => {
    const res = await fetch(`${baseUrl}/api/sprint`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe('Missing goal');
  });

  it('POST /api/workflow validates required fields', async () => {
    const res = await fetch(`${baseUrl}/api/workflow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/debate validates required fields', async () => {
    const res = await fetch(`${baseUrl}/api/debate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });

  it('POST /api/export creates export', async () => {
    const res = await fetch(`${baseUrl}/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary: 'Test export' }),
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.filepath).toContain('session-');
  });

  it('GET / redirects to dashboard', async () => {
    const res = await fetch(`${baseUrl}/`, { redirect: 'manual' });
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/dashboard');
  });
});
