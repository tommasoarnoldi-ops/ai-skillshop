#!/usr/bin/env node
// ============================================================
// ForgeAI Multi-Agent System — Entry Point & CLI
// ============================================================

import { Command } from 'commander';
import chalk from 'chalk';
import { Orchestrator } from './core/orchestrator.js';
import type { AgentId } from './types/index.js';

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
${chalk.bold.cyan('╠═══════════════════════════════════════════════════════════╣')}
${chalk.bold.cyan('║')}  ${chalk.hex('#8B5CF6')('Systems')}:  Message Bus · Task Board · Knowledge Base  ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}             Artifact Store · Collaboration Engine       ${chalk.bold.cyan('║')}
${chalk.bold.cyan('║')}             State Persistence                           ${chalk.bold.cyan('║')}
${chalk.bold.cyan('╚═══════════════════════════════════════════════════════════╝')}
`;

const VALID_AGENTS: AgentId[] = ['ceo', 'cto', 'product-manager', 'developer', 'marketing', 'qa-devops'];

function getApiKey(): string {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    console.error(chalk.red('Error: ANTHROPIC_API_KEY environment variable is required.'));
    console.error(chalk.gray('Set it with: export ANTHROPIC_API_KEY=sk-ant-...'));
    process.exit(1);
  }
  return key;
}

function validateAgent(agent: string): AgentId {
  if (!VALID_AGENTS.includes(agent as AgentId)) {
    console.error(chalk.red(`Invalid agent: ${agent}`));
    console.error(chalk.gray(`Valid agents: ${VALID_AGENTS.join(', ')}`));
    process.exit(1);
  }
  return agent as AgentId;
}

function createOrchestrator(verbose: boolean): Orchestrator {
  return new Orchestrator({
    apiKey: getApiKey(),
    verbose,
  });
}

const program = new Command();

program
  .name('forgeai-agents')
  .description('ForgeAI Multi-Agent System — AI agents that collaborate to build and scale ForgeAI')
  .version('1.0.0');

// ════════════════════════════════════════════════
// SPRINT — Full sprint execution
// ════════════════════════════════════════════════
program
  .command('sprint')
  .description('Run a full sprint: CEO plans → agents execute → CEO evaluates')
  .argument('<goal>', 'Sprint goal')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (goal: string, opts: { verbose: boolean }) => {
    console.log(BANNER);
    console.log(chalk.cyan(`\n🚀 Starting sprint: "${goal}"\n`));
    const report = await createOrchestrator(opts.verbose).runSprint(goal);
    console.log('\n' + report);
  });

// ════════════════════════════════════════════════
// WORKFLOW — Collaborative multi-agent workflow
// ════════════════════════════════════════════════
program
  .command('workflow')
  .description('Run collaborative workflow: CEO → PM → CTO → Dev → QA → Marketing')
  .argument('<topic>', 'Topic to work on')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (topic: string, opts: { verbose: boolean }) => {
    console.log(BANNER);
    console.log(chalk.magenta(`\n🔄 Starting collaborative workflow: "${topic}"\n`));
    const report = await createOrchestrator(opts.verbose).runCollaborativeWorkflow(topic);
    console.log('\n' + report);
  });

// ════════════════════════════════════════════════
// DEBATE — Two agents debate, third decides
// ════════════════════════════════════════════════
program
  .command('debate')
  .description('Run a debate between two agents, with a decider')
  .argument('<topic>', 'Topic to debate')
  .option('-1, --agent1 <agent>', 'First participant', 'cto')
  .option('-2, --agent2 <agent>', 'Second participant', 'product-manager')
  .option('-d, --decider <agent>', 'Decision maker', 'ceo')
  .option('-r, --rounds <number>', 'Number of debate rounds', '2')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (topic: string, opts: { agent1: string; agent2: string; decider: string; rounds: string; verbose: boolean }) => {
    console.log(BANNER);
    console.log(chalk.hex('#8B5CF6')(`\n⚖️  Starting debate: "${topic}"\n`));
    console.log(chalk.gray(`   ${opts.agent1} vs ${opts.agent2} — decided by ${opts.decider}\n`));

    const orchestrator = createOrchestrator(opts.verbose);
    const report = await orchestrator.runDebate(
      topic,
      validateAgent(opts.agent1),
      validateAgent(opts.agent2),
      validateAgent(opts.decider),
      parseInt(opts.rounds, 10),
    );
    console.log('\n' + report);
  });

// ════════════════════════════════════════════════
// PIPELINE — Sequential agent processing
// ════════════════════════════════════════════════
program
  .command('pipeline')
  .description('Run a sequential pipeline: each agent\'s output feeds the next')
  .argument('<name>', 'Pipeline name')
  .argument('<input>', 'Initial input/instruction')
  .option('-s, --stages <stages>', 'Comma-separated agent:instruction pairs', 'product-manager:Define requirements,cto:Design architecture,developer:Implement,qa-devops:Create tests')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (name: string, input: string, opts: { stages: string; verbose: boolean }) => {
    console.log(BANNER);
    console.log(chalk.hex('#06B6D4')(`\n📦 Starting pipeline: "${name}"\n`));

    const stages = opts.stages.split(',').map(s => {
      const [agentId, ...instructionParts] = s.trim().split(':');
      return {
        agentId: validateAgent(agentId.trim()),
        instruction: instructionParts.join(':').trim() || `Process as ${agentId}`,
      };
    });

    const orchestrator = createOrchestrator(opts.verbose);
    const report = await orchestrator.runPipeline(name, input, stages);
    console.log('\n' + report);
  });

// ════════════════════════════════════════════════
// PARALLEL — Execute tasks simultaneously
// ════════════════════════════════════════════════
program
  .command('parallel')
  .description('Run tasks in parallel across different agents')
  .argument('<tasks...>', 'Tasks in "agent:instruction" format')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (taskArgs: string[], opts: { verbose: boolean }) => {
    console.log(BANNER);
    console.log(chalk.hex('#14B8A6')(`\n⚡ Running ${taskArgs.length} tasks in parallel\n`));

    const tasks = taskArgs.map(t => {
      const [agentId, ...instructionParts] = t.split(':');
      return {
        agentId: validateAgent(agentId.trim()),
        instruction: instructionParts.join(':').trim(),
        label: `${agentId.trim()}: ${instructionParts.join(':').trim().substring(0, 40)}`,
      };
    });

    const orchestrator = createOrchestrator(opts.verbose);
    const report = await orchestrator.runParallel(tasks);
    console.log('\n' + report);
  });

// ════════════════════════════════════════════════
// ASK — Direct question to an agent
// ════════════════════════════════════════════════
program
  .command('ask')
  .description('Ask a specific agent a question')
  .argument('<agent>', `Agent: ${VALID_AGENTS.join(', ')}`)
  .argument('<question>', 'Question to ask')
  .option('-v, --verbose', 'Enable verbose logging', false)
  .action(async (agent: string, question: string, opts: { verbose: boolean }) => {
    console.log(BANNER);
    const agentId = validateAgent(agent);
    console.log(chalk.gray(`\n💬 Asking ${agentId}...\n`));
    const answer = await createOrchestrator(opts.verbose).askAgent(agentId, question);
    console.log(answer);
  });

// ════════════════════════════════════════════════
// STATUS — System status overview
// ════════════════════════════════════════════════
program
  .command('status')
  .description('Show current status of all agents and systems')
  .action(() => {
    console.log(BANNER);
    const orchestrator = createOrchestrator(false);
    console.log(orchestrator.getStatus());
    console.log('\n' + orchestrator.getKnowledgeSummary());
  });

// ════════════════════════════════════════════════
// DEMO — Architecture overview (no API key)
// ════════════════════════════════════════════════
program
  .command('demo')
  .description('Show system architecture and capabilities (no API key needed)')
  .action(() => {
    console.log(BANNER);
    console.log(chalk.bold('\n📐 Agent Communication Architecture:\n'));
    console.log(`
    ┌─────────────────────────────────────────────────────┐
    │                   ${chalk.yellow('CEO Agent')}                         │
    │          Strategy · Coordination · Decisions        │
    └──────────┬──────────────┬───────────────┬───────────┘
               │              │               │
       ┌───────▼──────┐ ┌────▼──────┐ ┌──────▼──────────┐
       │  ${chalk.blue('CTO Agent')}   │ │ ${chalk.green('PM Agent')}  │ │${chalk.hex('#F59E0B')('Marketing Agent')} │
       │  Architecture│ │ Product   │ │  Go-to-Market   │
       │  + Standards │ │ + UX      │ │  + Growth       │
       └──────┬───────┘ └────┬──────┘ └─────────────────┘
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

    console.log(chalk.bold('🔧 Systems:\n'));
    console.log(`
  ${chalk.cyan('Message Bus')}        Pub/sub inter-agent communication with threading
  ${chalk.cyan('Task Board')}         Shared Kanban (backlog → ready → in_progress → review → done)
  ${chalk.cyan('Knowledge Base')}     Shared organizational memory across all agents
  ${chalk.cyan('Artifact Store')}     File generation system — agents produce real files
  ${chalk.cyan('Collaboration')}      Advanced protocols: Review, Debate, Pipeline, Parallel
  ${chalk.cyan('State Persistence')}  Save/restore system state across sessions
    `);

    console.log(chalk.bold('📋 Collaboration Protocols:\n'));
    console.log(`
  ${chalk.hex('#8B5CF6')('Review')}     Agent A produces work → Agent B reviews → approve/reject
  ${chalk.hex('#8B5CF6')('Debate')}     Agent A vs Agent B debate topic → Agent C decides
  ${chalk.hex('#8B5CF6')('Pipeline')}   Sequential: each agent transforms previous output
  ${chalk.hex('#8B5CF6')('Parallel')}   Concurrent: multiple agents work simultaneously
    `);

    console.log(chalk.bold('💻 Commands:\n'));
    console.log(`  ${chalk.green('$')} export ANTHROPIC_API_KEY=sk-ant-...`);
    console.log();
    console.log(`  ${chalk.gray('# Full sprint (CEO plans, agents execute, CEO evaluates)')}`);
    console.log(`  ${chalk.green('$')} npm run dev -- sprint "Setup progetto ForgeAI" -v`);
    console.log();
    console.log(`  ${chalk.gray('# Collaborative workflow (all agents on one topic)')}`);
    console.log(`  ${chalk.green('$')} npm run dev -- workflow "Scanner macchinari con AI Vision" -v`);
    console.log();
    console.log(`  ${chalk.gray('# Debate between agents')}`);
    console.log(`  ${chalk.green('$')} npm run dev -- debate "React Native vs Flutter" --agent1 cto --agent2 developer --decider ceo`);
    console.log();
    console.log(`  ${chalk.gray('# Sequential pipeline')}`);
    console.log(`  ${chalk.green('$')} npm run dev -- pipeline "feature-auth" "User authentication per ForgeAI"`);
    console.log();
    console.log(`  ${chalk.gray('# Parallel execution')}`);
    console.log(`  ${chalk.green('$')} npm run dev -- parallel "cto:Definisci architettura auth" "product-manager:Scrivi user stories auth" "marketing:Analisi competitor auth"`);
    console.log();
    console.log(`  ${chalk.gray('# Ask a specific agent')}`);
    console.log(`  ${chalk.green('$')} npm run dev -- ask ceo "Quali sono le priorità per il Q1?"`);
    console.log(`  ${chalk.green('$')} npm run dev -- ask cto "Come gestire l'offline mode?"`);
    console.log(`  ${chalk.green('$')} npm run dev -- ask marketing "Pitch per Confindustria Emilia"`);
    console.log();
  });

program.parse();
