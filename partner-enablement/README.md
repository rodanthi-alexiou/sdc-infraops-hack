# Partner Enablement — APEX for ISVs

> From "we want to add AI agents" to "deployed, Well-Architected Azure infrastructure" in days, not months.

---

## The Problem

Every ISV adding AI agents to their product hits the same wall:

1. **Architecture overwhelm** — "Which Azure services? How do they fit together? What about multi-tenancy?"
2. **Governance paralysis** — "Security review says no. Compliance says maybe. Nobody knows what policies exist."
3. **POC graveyard** — Beautiful prototypes that never ship because the gap between "it works on my laptop" and "it's production-ready on Azure" is a canyon.

The result? Months of architecture meetings, consultant engagements, and false starts — while competitors ship.

---

## What is APEX?

**APEX** (Agentic Platform Engineering eXperience) is a system of specialized AI agents created by [Jonathan Vella](https://www.linkedin.com/in/jonathan-vella/) that run inside VS Code via GitHub Copilot. These agents collaborate through a structured workflow to produce production-grade Azure infrastructure — from requirements gathering through deployment.

You describe your scenario. The agents produce:

- Validated architecture aligned with the Azure Well-Architected Framework
- Governance constraints mapped to your Azure subscription's actual policies
- Infrastructure as Code (Bicep or Terraform) with security baseline baked in
- Deployment automation with approval gates at every critical decision

**It's not a template you fork and hope fits. It's an AI-powered engineering process that adapts to YOUR scenario.**

---

## Who Is This For?

| You are...                                                              | APEX helps you...                                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| An **ISV adding AI/agents** to an existing SaaS product                 | Design the Azure platform layer without rebuilding everything                   |
| A **startup going to production** with an AI-first architecture         | Get WAF-aligned infrastructure instead of "it works on my machine"              |
| A **Microsoft partner engineer (SDC/CSA)** running customer engagements | Deliver architecture + IaC in a 1-2 day workshop instead of a 6-week engagement |
| A **platform team** adopting Azure AI Foundry, OpenAI, or AI Search     | Get governance-cleared, cost-projected infrastructure plans fast                |

---

## How APEX Extends Beyond Generic IaC

The original APEX accelerator handles any Azure infrastructure scenario. This repo fine-tunes it for **AI-first ISV workloads** — the messy reality where:

- You already HAVE a product (brownfield, not greenfield)
- You need **multi-tenant agent isolation** (your customers don't share data)
- You need **cost projections per customer** (agents can't eat your margin)
- You need to pass **security review** before writing a single line of code
- You need architecture that **scales from 5 customers to 500** without rearchitecting

Added capabilities for ISV scenarios:

- **AI Workload Architecture** — PTU vs PAYG decisions, RAG patterns, content safety gates
- **Multi-Tenant Patterns** — Per-tenant isolation for AI Search, Cosmos DB, agent runtimes
- **Governance Discovery** — Queries your ACTUAL Azure Policy assignments (not generic checklists)
- **Cost Economics** — Token cost projections, PTU break-even analysis, per-customer cost attribution

---

## Prerequisites

| Requirement        | Details                                                    |
| ------------------ | ---------------------------------------------------------- |
| VS Code            | Latest stable release                                      |
| GitHub Copilot     | Active license (Individual, Business, or Enterprise)       |
| Docker Desktop     | For the Dev Container (all tools pre-installed)            |
| Azure Subscription | Optional for Steps 1-4 (required for Steps 5-7 deployment) |
| Git                | To clone this repo                                         |

---

## What's In This Folder

| File                                       | What It Is                                                                                      |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| [00-how-it-works.md](00-how-it-works.md)   | "APEX in 5 minutes" — the workflow, what each step produces, how Copilot agents power it        |
| [workshop-guide.md](workshop-guide.md)     | Full workshop facilitator + self-service guide with timing, role cards, and challenge structure |
| [byos-template.md](byos-template.md)       | **Blank scenario template** — fill it in, paste into the Orchestrator, get architecture out     |
| [when-to-use-apex.md](when-to-use-apex.md) | Decision guide: "Is APEX right for my situation?"                                               |
| [scenarios/](scenarios/)                   | Pre-built example scenarios you can run immediately or adapt                                    |

### Example Scenarios

| Scenario                                                      | Industry        | Pattern                                                 |
| ------------------------------------------------------------- | --------------- | ------------------------------------------------------- |
| [Healthcare AI Platform](scenarios/healthcare-ai-platform.md) | Healthcare      | Multi-agent, multi-tenant, GDPR, event-driven           |
| [Customer Ops SaaS](scenarios/customer-ops-saas.md)           | B2B SaaS        | Ticket triage + workflow agents, brownfield integration |
| [DevTools Platform](scenarios/devtools-platform.md)           | Developer Tools | Code review agents, CI optimization, GitHub-heavy       |

---

## Quick Start (5 minutes)

```bash
# 1. Clone this repo
git clone https://github.com/rodanthi-alexiou/sdc-infraops-hack.git
cd sdc-infraops-hack

# 2. Open in VS Code and reopen in Dev Container
code .
# F1 → Dev Containers: Reopen in Container

# 3. Fill in your scenario (or pick one from scenarios/)
# Open partner-enablement/byos-template.md and fill in your details

# 4. Start the Orchestrator
# Open Copilot Chat → Select "01-Orchestrator" agent
# Paste your completed scenario and say "Let's go"
```

That's it. The agents take it from there — with you in the driver's seat at every approval gate.

---

## Questions?

- **"How long does this take?"** → See [when-to-use-apex.md](when-to-use-apex.md) for time-to-value expectations
- **"What if my scenario is complex?"** → The agents handle complexity. Start with the template, let the workflow adapt.
- **"Do I need Azure access?"** → Not for Steps 1-4 (architecture + planning). Only for Steps 5-7 (actual deployment).
- **"Can I use Terraform instead of Bicep?"** → Yes. Specify your preference in the template. Both tracks are fully supported.
