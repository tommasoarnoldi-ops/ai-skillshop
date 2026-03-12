# ForgeAI Multi-Agent System

6 AI agents with distinct roles that collaborate autonomously to build and scale the **ForgeAI** startup — a smartphone-first AI platform for guiding industrial workers in manufacturing SMEs.

## Architecture

```
                    ┌──────────────────────┐
                    │     CEO Agent        │
                    │  Strategy & Coord.   │
                    └──┬──────┬────────┬───┘
                       │      │        │
              ┌────────▼┐  ┌──▼────┐ ┌─▼───────────┐
              │CTO Agent│  │PM Agt │ │Marketing Agt│
              │Architect│  │Product│ │Go-to-Market │
              └────┬────┘  └──┬────┘ └─────────────┘
                   │          │
              ┌────▼──────────▼────┐
              │  Developer Agent   │
              │  Full-Stack Code   │
              └────────┬───────────┘
                       │
              ┌────────▼───────────┐
              │  QA/DevOps Agent   │
              │  Testing & CI/CD   │
              └────────────────────┘
```

### Agents

| Agent | Role | Capabilities |
|-------|------|-------------|
| **CEO** | Strategic leadership | Sprint planning, coordination, decision-making, progress evaluation |
| **CTO** | Technical architecture | System design, API contracts, stack decisions, code review |
| **Product Manager** | Product strategy | PRDs, user stories, UX flows, RICE prioritization, design system |
| **Developer** | Full-stack implementation | React Native, Supabase, Claude API, TypeScript code generation |
| **Marketing** | Go-to-market | GTM strategy, pitch decks, content creation, competitor analysis |
| **QA/DevOps** | Quality & infrastructure | Test plans, CI/CD pipelines, code review, security auditing |

### Core Systems

| System | Description |
|--------|-------------|
| **Message Bus** | Pub/sub inter-agent communication with 10 message types and threading |
| **Task Board** | Shared Kanban board (backlog → ready → in_progress → review → done) |
| **Knowledge Base** | Shared organizational memory with 12 categories and search |
| **Artifact Store** | File generation — agents produce real files written to disk |
| **Collaboration Engine** | Review, Debate, Pipeline, and Parallel execution protocols |
| **Autonomy Loop** | Self-directed plan → execute → evaluate cycles |
| **Metrics Tracker** | Agent performance monitoring and reporting |
| **Event Reactions** | Auto-trigger actions on conditions (e.g., auto QA review on dev complete) |
| **State Persistence** | Save/restore system state across sessions |

## Setup

```bash
# Install dependencies
npm install

# Set your Anthropic API key
export ANTHROPIC_API_KEY=sk-ant-...

# See system demo (no API key needed)
npm run demo
```

## Usage

### Interactive REPL

```bash
npm run repl
```

In the REPL:
```
forgeai> @cto Come strutturare l'offline mode con SQLite?
forgeai> @marketing Scrivi un pitch per Confindustria Emilia
forgeai> /sprint "Setup architettura base ForgeAI"
forgeai> /workflow "Scanner macchinari con AI Vision"
forgeai> /debate "React Native vs Flutter per ForgeAI"
forgeai> /auto "Costruisci l'MVP di ForgeAI in 5 cicli"
forgeai> /feature "Knowledge base chat con RAG"
forgeai> /status
forgeai> /metrics
```

### CLI Commands

```bash
# Full sprint (CEO plans, agents execute, CEO evaluates)
npm run dev -- sprint "Setup progetto e architettura base" -v

# Collaborative workflow (all agents on one topic)
npm run dev -- workflow "Scanner macchinari con AI Vision" -v

# Autonomous execution (self-directed cycles)
npm run dev -- autonomy "Costruisci l'MVP completo di ForgeAI" --cycles 10 --tasks 5 -v

# Debate between agents
npm run dev -- debate "Offline-first vs cloud-first" --agent1 cto --agent2 product-manager

# Sequential pipeline
npm run dev -- pipeline "feature-auth" "Sistema autenticazione ForgeAI"

# Parallel execution
npm run dev -- parallel "cto:Architettura auth" "product-manager:User stories auth"

# Ask specific agent
npm run dev -- ask ceo "Quali sono le priorità per il primo mese?"

# Full app bootstrap (generates entire ForgeAI app)
npm run dev -- bootstrap -v

# Workflow presets
npm run dev -- preset feature-spec "Scanner macchinari"
npm run dev -- preset pitch-prep "Pre-seed round"
npm run dev -- preset sprint-plan "MVP Sprint 1"
npm run dev -- preset market-analysis "PMI manifatturiere Emilia-Romagna"
```

## Collaboration Protocols

### Review
Agent A produces work, Agent B reviews with structured approve/reject feedback.
```bash
# Built into collaborative workflow — QA auto-reviews Developer output
```

### Debate
Two agents argue N rounds, a third agent makes the final decision.
```bash
npm run dev -- debate "Zustand vs Redux" --agent1 cto --agent2 developer --decider ceo --rounds 3
```

### Pipeline
Sequential processing — each agent transforms the previous agent's output.
```bash
npm run dev -- pipeline "new-feature" "Dashboard analytics per manager" \
  -s "product-manager:Scrivi PRD,cto:Progetta architettura,developer:Genera codice,qa-devops:Crea test plan"
```

### Parallel
Multiple agents work simultaneously on independent tasks.
```bash
npm run dev -- parallel \
  "ceo:Strategia Q1" \
  "marketing:Piano contenuti marzo" \
  "cto:Audit architettura"
```

### Autonomy Loop
The system self-directs through plan → execute → evaluate cycles until the objective is met.
```bash
npm run dev -- autonomy "Prepara tutto il materiale per il pitch agli investitori" --cycles 5 -v
```

## Event Reactions (Auto-triggers)

The system automatically reacts to events:

| Reaction | Trigger | Action |
|----------|---------|--------|
| Auto QA Review | Developer task completed | QA creates review task |
| Escalate Failures | Any task fails | CEO gets escalation |
| Security Alert | "security" mentioned | CTO notifies CEO |
| Blocked Alert | >3 tasks blocked | CEO intervention |

## Project Structure

```
src/
├── agents/                     # 6 specialized AI agents
│   ├── ceo-agent.ts
│   ├── cto-agent.ts
│   ├── product-manager-agent.ts
│   ├── developer-agent.ts
│   ├── marketing-agent.ts
│   └── qa-devops-agent.ts
├── core/                       # Infrastructure
│   ├── base-agent.ts           # Abstract base with Claude AI reasoning
│   ├── message-bus.ts          # Inter-agent pub/sub communication
│   ├── task-board.ts           # Shared Kanban board
│   ├── knowledge-base.ts       # Organizational memory
│   ├── artifact-store.ts       # File generation to disk
│   ├── collaboration.ts        # Review, Debate, Pipeline, Parallel
│   ├── autonomy-loop.ts        # Self-directed execution cycles
│   ├── metrics.ts              # Performance tracking
│   ├── event-reactions.ts      # Auto-trigger system
│   ├── state-persistence.ts    # Save/restore state
│   └── orchestrator.ts         # Central coordinator
├── workflows/                  # Pre-built workflows
│   ├── bootstrap.ts            # Full ForgeAI app generation
│   └── startup-presets.ts      # Common startup task presets
├── repl.ts                     # Interactive REPL
├── index.ts                    # CLI entry point
└── types/
    └── index.ts                # TypeScript types
```

## About ForgeAI

**ForgeAI** is a smartphone-first AI platform for guiding industrial workers in Italian manufacturing SMEs (50-500 employees). It uses multimodal AI (vision + language + voice) to:

1. **Recognize** machinery from camera input via Claude Vision
2. **Guide** workers step-by-step through procedures with visual verification
3. **Capture** senior operators' knowledge before retirement

**Target market**: Connected Worker Market — $8.6B (2025), CAGR 18.5%
**Launch**: Emilia-Romagna manufacturing district, then Veneto and Lombardia
**Model**: SaaS B2B — Starter €499/mo, Pro €1.499/mo, setup fee €5-15K
