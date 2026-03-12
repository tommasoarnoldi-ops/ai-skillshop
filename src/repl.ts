// ============================================================
// Interactive REPL — Live multi-agent interaction
// ============================================================

import { createInterface } from 'readline';
import chalk from 'chalk';
import { Orchestrator } from './core/orchestrator.js';
import { BootstrapWorkflow } from './workflows/bootstrap.js';
import { StartupWorkflows } from './workflows/startup-presets.js';
import type { AgentId } from './types/index.js';

const AGENTS: AgentId[] = ['ceo', 'cto', 'product-manager', 'developer', 'marketing', 'qa-devops'];

const HELP = `
${chalk.bold('Available Commands:')}

  ${chalk.cyan('@<agent> <message>')}       Talk to a specific agent
    Example: ${chalk.gray('@cto Come strutturare l\'offline mode?')}
    Agents: ${AGENTS.join(', ')}

  ${chalk.cyan('/sprint <goal>')}           Run a full sprint with all agents
  ${chalk.cyan('/workflow <topic>')}        Run collaborative workflow on a topic
  ${chalk.cyan('/debate <topic>')}          CTO vs PM debate, CEO decides
  ${chalk.cyan('/feature <name>')}          Full feature spec pipeline
  ${chalk.cyan('/pitch')}                   Generate pitch materials
  ${chalk.cyan('/sprint-plan <goal>')}      Plan a sprint
  ${chalk.cyan('/market <topic>')}          Market analysis pipeline
  ${chalk.cyan('/bootstrap')}               Generate full ForgeAI app (takes a while!)
  ${chalk.cyan('/auto <objective>')}        Run autonomous loop (CEO plans, agents iterate)
  ${chalk.cyan('/chat <topic>')}           Multi-agent group discussion

  ${chalk.cyan('/dashboard')}              Full project health dashboard
  ${chalk.cyan('/status')}                  Show all agents status
  ${chalk.cyan('/kb')}                      Show knowledge base
  ${chalk.cyan('/artifacts')}               Show generated artifacts
  ${chalk.cyan('/messages')}                Show message log
  ${chalk.cyan('/metrics')}                 Show agent performance metrics
  ${chalk.cyan('/reactions')}               Show event reaction rules
  ${chalk.cyan('/scheduler')}               Show scheduled jobs
  ${chalk.cyan('/help')}                    Show this help
  ${chalk.cyan('/quit')}                    Exit

${chalk.gray('Tip: You can talk to any agent directly with @agent syntax')}
`;

/**
 * Interactive REPL for chatting with agents and running workflows.
 */
export async function startRepl(apiKey: string): Promise<void> {
  const orchestrator = new Orchestrator({
    apiKey,
    verbose: true,
  });

  const bootstrap = new BootstrapWorkflow(orchestrator);
  const workflows = new StartupWorkflows(orchestrator);

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log(chalk.bold.cyan('\n  ForgeAI Multi-Agent Interactive Mode'));
  console.log(chalk.gray('  Type /help for commands, @agent to talk to an agent\n'));

  const prompt = (): void => {
    rl.question(chalk.cyan('forgeai> '), async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        prompt();
        return;
      }

      try {
        await handleInput(trimmed, orchestrator, bootstrap, workflows);
      } catch (error) {
        console.error(chalk.red(`Error: ${error instanceof Error ? error.message : String(error)}`));
      }

      prompt();
    });
  };

  rl.on('close', () => {
    console.log(chalk.gray('\nGoodbye!'));
    process.exit(0);
  });

  prompt();
}

async function handleInput(
  input: string,
  orchestrator: Orchestrator,
  bootstrap: BootstrapWorkflow,
  workflows: StartupWorkflows,
): Promise<void> {
  // ---- Agent direct message ----
  if (input.startsWith('@')) {
    const spaceIdx = input.indexOf(' ');
    if (spaceIdx === -1) {
      console.log(chalk.yellow('Usage: @agent <message>'));
      return;
    }

    const agentName = input.substring(1, spaceIdx) as AgentId;
    const message = input.substring(spaceIdx + 1);

    if (!AGENTS.includes(agentName)) {
      console.log(chalk.red(`Unknown agent: ${agentName}`));
      console.log(chalk.gray(`Available: ${AGENTS.join(', ')}`));
      return;
    }

    console.log(chalk.gray(`\n  Asking ${agentName}...\n`));
    const answer = await orchestrator.askAgent(agentName, message);
    console.log(answer);
    console.log();
    return;
  }

  // ---- Slash commands ----
  if (input.startsWith('/')) {
    const parts = input.split(' ');
    const cmd = parts[0];
    const arg = parts.slice(1).join(' ');

    switch (cmd) {
      case '/help':
        console.log(HELP);
        break;

      case '/quit':
      case '/exit':
        console.log(chalk.gray('Goodbye!'));
        process.exit(0);

      case '/status':
        console.log(orchestrator.getStatus());
        break;

      case '/kb':
        console.log(orchestrator.getKnowledgeSummary());
        break;

      case '/artifacts':
        console.log(orchestrator.getArtifactsSummary());
        break;

      case '/messages':
        console.log(orchestrator.getMessageLog());
        break;

      case '/metrics':
        console.log(orchestrator.getMetricsReport());
        break;

      case '/reactions':
        console.log(orchestrator.getReactionsSummary());
        break;

      case '/sprint': {
        if (!arg) {
          console.log(chalk.yellow('Usage: /sprint <goal>'));
          break;
        }
        const report = await orchestrator.runSprint(arg);
        console.log(report);
        break;
      }

      case '/workflow': {
        if (!arg) {
          console.log(chalk.yellow('Usage: /workflow <topic>'));
          break;
        }
        const report = await orchestrator.runCollaborativeWorkflow(arg);
        console.log(report);
        break;
      }

      case '/debate': {
        if (!arg) {
          console.log(chalk.yellow('Usage: /debate <topic>'));
          break;
        }
        const report = await orchestrator.runDebate(arg, 'cto', 'product-manager', 'ceo');
        console.log(report);
        break;
      }

      case '/feature': {
        if (!arg) {
          console.log(chalk.yellow('Usage: /feature <feature-name>'));
          break;
        }
        const report = await workflows.featureSpec(arg);
        console.log(report);
        break;
      }

      case '/pitch': {
        const report = await workflows.pitchPrep(arg || 'Pre-seed round per ForgeAI');
        console.log(report);
        break;
      }

      case '/sprint-plan': {
        if (!arg) {
          console.log(chalk.yellow('Usage: /sprint-plan <goal>'));
          break;
        }
        const report = await workflows.sprintPlan(arg);
        console.log(report);
        break;
      }

      case '/market': {
        if (!arg) {
          console.log(chalk.yellow('Usage: /market <topic>'));
          break;
        }
        const report = await workflows.marketAnalysis(arg);
        console.log(report);
        break;
      }

      case '/bootstrap': {
        console.log(chalk.cyan('\n  Starting full ForgeAI bootstrap...\n'));
        console.log(chalk.yellow('  This will generate the entire ForgeAI app with all 6 agents.'));
        console.log(chalk.yellow('  It may take several minutes.\n'));
        const report = await bootstrap.run(true);
        console.log(report);
        break;
      }

      case '/auto': {
        if (!arg) {
          console.log(chalk.yellow('Usage: /auto <objective>'));
          break;
        }
        console.log(chalk.hex('#A78BFA')(`\n  Starting autonomous execution: "${arg}"\n`));
        const report = await orchestrator.runAutonomous(arg, {
          maxCycles: 5,
          maxTasksPerCycle: 4,
          verbose: true,
        });
        console.log(report);
        break;
      }

      case '/chat': {
        if (!arg) {
          console.log(chalk.yellow('Usage: /chat <topic>'));
          break;
        }
        const report = await orchestrator.runChatRoom({
          topic: arg,
          participants: ['ceo', 'cto', 'product-manager', 'developer'],
          maxRounds: 2,
          moderator: 'ceo',
          verbose: true,
        });
        console.log(report);
        break;
      }

      case '/dashboard':
        console.log(orchestrator.getDashboard());
        break;

      case '/scheduler':
        console.log(orchestrator.getSchedulerSummary());
        break;

      default:
        console.log(chalk.yellow(`Unknown command: ${cmd}. Type /help for available commands.`));
    }
    return;
  }

  // ---- Default: ask CEO ----
  console.log(chalk.gray('\n  Forwarding to CEO agent...\n'));
  const answer = await orchestrator.askAgent('ceo', input);
  console.log(answer);
  console.log();
}
