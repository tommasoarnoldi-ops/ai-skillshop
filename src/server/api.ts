// ============================================================
// REST API Server — HTTP interface for the multi-agent system
// ============================================================

import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Orchestrator } from '../core/orchestrator.js';
import { BootstrapWorkflow } from '../workflows/bootstrap.js';
import { StartupWorkflows } from '../workflows/startup-presets.js';
import type { AgentId } from '../types/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface ServerConfig {
  apiKey: string;
  port?: number;
  verbose?: boolean;
}

/**
 * Creates and starts the HTTP + WebSocket server.
 */
export function createApiServer(config: ServerConfig) {
  const port = config.port ?? 3000;
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // Serve static dashboard
  app.use('/dashboard', express.static(join(__dirname, '..', '..', 'public')));

  const orchestrator = new Orchestrator({
    apiKey: config.apiKey,
    verbose: config.verbose ?? true,
  });

  const bootstrap = new BootstrapWorkflow(orchestrator);
  const workflows = new StartupWorkflows(orchestrator);

  // WebSocket clients
  const clients = new Set<WebSocket>();

  function broadcast(event: string, data: unknown) {
    const message = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.send(JSON.stringify({
      event: 'connected',
      data: { agents: ['ceo', 'cto', 'product-manager', 'developer', 'marketing', 'qa-devops'] },
    }));

    ws.on('close', () => clients.delete(ws));
  });

  // ---- Health ----
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', agents: 6, systems: 18 });
  });

  // ---- Status & Monitoring ----
  app.get('/api/status', (_req, res) => {
    res.json({ status: orchestrator.getStatus() });
  });

  app.get('/api/dashboard', (_req, res) => {
    res.json({ dashboard: orchestrator.getDashboard() });
  });

  app.get('/api/metrics', (_req, res) => {
    res.json({ metrics: orchestrator.getMetricsReport() });
  });

  app.get('/api/health-report', (_req, res) => {
    res.json({ health: orchestrator.getHealthReport() });
  });

  app.get('/api/errors', (_req, res) => {
    res.json({ errors: orchestrator.getErrorSummary() });
  });

  app.get('/api/kb', (_req, res) => {
    res.json({ knowledgeBase: orchestrator.getKnowledgeSummary() });
  });

  app.get('/api/artifacts', (_req, res) => {
    res.json({ artifacts: orchestrator.getArtifactsSummary() });
  });

  app.get('/api/messages', (_req, res) => {
    res.json({ messages: orchestrator.getMessageLog() });
  });

  app.get('/api/reactions', (_req, res) => {
    res.json({ reactions: orchestrator.getReactionsSummary() });
  });

  app.get('/api/scheduler', (_req, res) => {
    res.json({ scheduler: orchestrator.getSchedulerSummary() });
  });

  // ---- Agent Communication ----
  app.post('/api/ask', async (req, res) => {
    const { agent, question } = req.body as { agent: AgentId; question: string };
    if (!agent || !question) {
      res.status(400).json({ error: 'Missing agent or question' });
      return;
    }

    broadcast('agent:thinking', { agent, question });

    try {
      const answer = await orchestrator.askAgent(agent, question);
      broadcast('agent:response', { agent, answer: answer.substring(0, 500) });
      res.json({ agent, answer });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  // ---- Workflows ----
  app.post('/api/sprint', async (req, res) => {
    const { goal } = req.body as { goal: string };
    if (!goal) { res.status(400).json({ error: 'Missing goal' }); return; }

    broadcast('workflow:start', { type: 'sprint', goal });
    try {
      const report = await orchestrator.runSprint(goal);
      broadcast('workflow:complete', { type: 'sprint', goal });
      res.json({ report });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/workflow', async (req, res) => {
    const { topic } = req.body as { topic: string };
    if (!topic) { res.status(400).json({ error: 'Missing topic' }); return; }

    broadcast('workflow:start', { type: 'collaborative', topic });
    try {
      const report = await orchestrator.runCollaborativeWorkflow(topic);
      broadcast('workflow:complete', { type: 'collaborative', topic });
      res.json({ report });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/debate', async (req, res) => {
    const { topic, agent1 = 'cto', agent2 = 'product-manager', decider = 'ceo', rounds = 2 } =
      req.body as { topic: string; agent1?: AgentId; agent2?: AgentId; decider?: AgentId; rounds?: number };
    if (!topic) { res.status(400).json({ error: 'Missing topic' }); return; }

    broadcast('workflow:start', { type: 'debate', topic });
    try {
      const report = await orchestrator.runDebate(topic, agent1, agent2, decider, rounds);
      broadcast('workflow:complete', { type: 'debate', topic });
      res.json({ report });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/chat', async (req, res) => {
    const { topic, participants = ['ceo', 'cto', 'product-manager', 'developer'], maxRounds = 2 } =
      req.body as { topic: string; participants?: AgentId[]; maxRounds?: number };
    if (!topic) { res.status(400).json({ error: 'Missing topic' }); return; }

    broadcast('workflow:start', { type: 'chatroom', topic });
    try {
      const report = await orchestrator.runChatRoom({
        topic,
        participants,
        maxRounds,
        moderator: 'ceo',
        verbose: config.verbose ?? true,
      });
      broadcast('workflow:complete', { type: 'chatroom', topic });
      res.json({ report });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/auto', async (req, res) => {
    const { objective, maxCycles = 5, maxTasksPerCycle = 4 } =
      req.body as { objective: string; maxCycles?: number; maxTasksPerCycle?: number };
    if (!objective) { res.status(400).json({ error: 'Missing objective' }); return; }

    broadcast('workflow:start', { type: 'autonomous', objective });
    try {
      const report = await orchestrator.runAutonomous(objective, { maxCycles, maxTasksPerCycle, verbose: true });
      broadcast('workflow:complete', { type: 'autonomous', objective });
      res.json({ report });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  // ---- Presets ----
  app.post('/api/preset/feature', async (req, res) => {
    const { name } = req.body as { name: string };
    if (!name) { res.status(400).json({ error: 'Missing name' }); return; }
    try {
      const report = await workflows.featureSpec(name);
      res.json({ report });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/preset/pitch', async (req, res) => {
    const { topic = 'Pre-seed round per ForgeAI' } = req.body as { topic?: string };
    try {
      const report = await workflows.pitchPrep(topic);
      res.json({ report });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/preset/market', async (req, res) => {
    const { topic } = req.body as { topic: string };
    if (!topic) { res.status(400).json({ error: 'Missing topic' }); return; }
    try {
      const report = await workflows.marketAnalysis(topic);
      res.json({ report });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  app.post('/api/bootstrap', async (_req, res) => {
    broadcast('workflow:start', { type: 'bootstrap' });
    try {
      const report = await bootstrap.run(true);
      broadcast('workflow:complete', { type: 'bootstrap' });
      res.json({ report });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      res.status(500).json({ error: msg });
    }
  });

  // ---- Session ----
  app.post('/api/export', (req, res) => {
    const { summary } = req.body as { summary?: string };
    const filepath = orchestrator.exportConversation(summary);
    res.json({ filepath });
  });

  app.post('/api/import', (req, res) => {
    const { filepath } = req.body as { filepath?: string };
    const context = orchestrator.importConversation(filepath);
    if (context) {
      res.json({ context });
    } else {
      res.status(404).json({ error: 'No previous session found' });
    }
  });

  // ---- Dashboard redirect ----
  app.get('/', (_req, res) => {
    res.redirect('/dashboard');
  });

  return { app, server, wss, orchestrator, start: () => {
    server.listen(port, () => {
      console.log(`\n  ForgeAI API Server running on http://localhost:${port}`);
      console.log(`  Dashboard:  http://localhost:${port}/dashboard`);
      console.log(`  WebSocket:  ws://localhost:${port}`);
      console.log(`  API docs:   http://localhost:${port}/api/health\n`);
    });
  }};
}
