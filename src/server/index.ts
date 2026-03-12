// ============================================================
// Server Entry Point
// ============================================================

import { createApiServer } from './api.js';

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is required');
  process.exit(1);
}

const port = parseInt(process.env.PORT ?? '3000', 10);

const { start } = createApiServer({
  apiKey,
  port,
  verbose: true,
});

start();
