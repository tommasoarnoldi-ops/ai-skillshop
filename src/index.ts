#!/usr/bin/env node
// ============================================================
// ForgeAI Multi-Agent System — Entry Point & CLI
// ============================================================

import { Command } from 'commander';
import chalk from 'chalk';
import { Orchestrator } from './core/orchestrator.js';

const BANNER = `
${chalk.bold.cyan('╔═══════════════════════════════════════════════════════════╗')}
${chalk.bold.cyan('║')}  ${chalk.bold.white('ForgeAI Multi-Agent System')}                               ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}  ${chalk.gray('6 AI agents collaborating to build & scale ForgeAI')}       ${chalk.bold.cyan('║')}
${chalk.bold.cyan('╠═══════════════════════════════════════════════════════════╣')}
${chalk.bold.cyan('║')}  ${chalk.yellow('CEO')}          — Strategy & Coordination                   ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}  ${chalk.blue('CTO')}          — Technical Architecture                   ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}  ${chalk.green('PM')}           — Product & UX Requirements                ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}  ${chalk.white('Developer')}    — Full-Stack Implementation                ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}  ${chalk.hex('#F59E0B')('Marketing')}    — Go-to-Market & Growth                    ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}  ${chalk.red('QA/DevOps')}    — Quality & Infrastructure                 ${chalk.bold.cyan('║')}
${chalk.bold.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error(chalk.red('Error: ANTHROPIC_API_KEY environment variable is required.'));
    console.error(chalk.gray('Set it with: export ANTHROPIC_API_KEY=sk-ant-...'));
    process.exit(1);
  }
  return key;
}

const program = new Command();

program
  .name('forgeai-agents')
  .description('ForgeAI Multi-Agent System — AI agents that collaborate to build and scale ForgeAI')
  .version('1.0.0');

// ---- Sprint command ----
program
  .command('sprint')
  .description('Run a full sprint: CEO plans tasks → agents execute → CEO evaluates')
  .argument('<goal>', 'Sprint goal (e.g., "Setup progetto e architettura base")')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (goal: string, opts: { verbose: boolean }) => {
    console.log(BANNER);
    console.log(chalk.cyan(`\nStarting sprint: "${goal}"\n`));

    const orchestrator = new Orchestrator({
      apiKey: getApiKey(),
      verbose: opts.verbose,
    });

    const report = await orchestrator.runSprint(goal);
    console.log('\n' + report);
  });

// ---- Workflow command ----
program
  .command('workflow')
  .description('Run collaborative workflow: all agents work together on a topic')
  .argument('<topic>', 'Topic to work on (e.g., "Scanner macchinari con AI Vision")')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (topic: string, opts: { verbose: boolean }) => {
    console.log(BANNER);
    console.log(chalk.magenta(`\nStarting collaborative workflow: "${topic}"\n`));

    const orchestrator = new Orchestrator({
      apiKey: getApiKey(),
      verbose: opts.verbose,
    });

    const report = await orchestrator.runCollaborativeWorkflow(topic);
    console.log('\n' + report);
  });

// ---- Ask command ----
program
  .command('ask')
  .description('Ask a specific agent a question')
  .argument('<agent>', 'Agent to ask (ceo, cto, product-manager, developer, marketing, qa-devops)')
  .argument('<question>', 'Question to ask')
  .action(async (agent: string, question: string) => {
    console.log(BANNER);

    const validAgents = ['ceo', 'cto', 'product-manager', 'developer', 'marketing', 'qa-devops'];
    if (!validAgents.includes(agent)) {
      console.error(chalk.red(`Invalid agent: ${agent}`));
      console.error(chalk.gray(`Valid agents: ${validAgents.join(', ')}`));
      process.exit(1);
    }

    const orchestrator = new Orchestrator({
      apiKey: getApiKey(),
      verbose: false,
    });

    console.log(chalk.gray(`\nAsking ${agent}...\n`));
    const answer = await orchestrator.askAgent(agent as any, question);
    console.log(answer);
  });

// ---- Status command ----
program
  .command('status')
  .description('Show current status of all agents')
  .action(() => {
    console.log(BANNER);
    const orchestrator = new Orchestrator({
      apiKey: getApiKey(),
      verbose: false,
    });
    console.log(orchestrator.getStatus());
  });

// ---- Demo command (runs without API key) ----
program
  .command('demo')
  .description('Show system architecture and agent roles (no API key needed)')
  .action(() => {
    console.log(BANNER);
    console.log(chalk.bold('\nAgent Communication Flow:\n'));
    console.log(`
    ┌─────────────────────────────────────────────────┐
    │                   ${chalk.yellow('CEO Agent')}                      │
    │          Strategy · Coordination · Decisions     │
    └──────────┬──────────────┬───────────────┬────────┘
               │              │               │
       ┌───────▼──────┐ ┌────▼─────┐ ┌───────▼────────┐
       │  ${chalk.blue('CTO Agent')}   │ │ ${chalk.green('PM Agent')} │ │${chalk.hex('#F59E0B')('Marketing Agent')}│
       │  Architecture│ │ Product  │ │  Go-to-Market  │
       │  + Standards │ │ + UX     │ │  + Growth      │
       └──────┬───────┘ └────┬─────┘ └────────────────┘
              │              │
       ┌──────▼──────────────▼──────┐
       │     ${chalk.white('Developer Agent')}           │
       │     Full-Stack Code        │
       └──────────────┬─────────────┘
                      │
       ┌──────────────▼─────────────┐
       │     ${chalk.red('QA/DevOps Agent')}          │
       │     Testing · CI/CD        │
       └────────────────────────────┘
    `);

    console.log(chalk.bold('Communication Protocol:'));
    console.log(`
  ${chalk.cyan('Message Bus')} — Central pub/sub system for inter-agent communication
  ${chalk.cyan('Task Board')}  — Shared Kanban board (backlog → ready → in_progress → review → done)
  ${chalk.cyan('Memory')}      — Each agent maintains decisions, context, and learnings

  Message Types:
    task_assignment   — Assign work to an agent
    task_update       — Progress report
    task_completed    — Work finished
    question/answer   — Inter-agent Q&A
    decision_request  — Escalate for decision
    broadcast         — Announce to all agents
    escalation        — Problem escalation
    `);

    console.log(chalk.bold('Usage:\n'));
    console.log(`  ${chalk.green('$')} export ANTHROPIC_API_KEY=sk-ant-...`);
    console.log(`  ${chalk.green('$')} npm run dev -- sprint "Setup progetto e architettura base" -v`);
    console.log(`  ${chalk.green('$')} npm run dev -- workflow "Scanner macchinari con AI Vision" -v`);
    console.log(`  ${chalk.green('$')} npm run dev -- ask cto "Come strutturare l'offline mode?"`);
    console.log(`  ${chalk.green('$')} npm run dev -- ask ceo "Quali sono le priorità per il primo mese?"`);
    console.log();
  });

program.parse();
