# Scenario: Developer Tools Platform — CodePilot Platform

## UNDER CONSTRUCTION !!!!

> AI-powered code review, CI optimization, and developer productivity agents. GitHub-native, developer-audience SaaS, high-throughput event processing.

---

## The Scenario: CodePilot Platform

> Your Challenge: Design and deploy the Azure platform that enables CodePilot Platform to run AI agents that analyze pull requests, optimize CI pipelines, and surface developer productivity insights — all deeply integrated with GitHub.

⚠️ You are NOT building AI models or application code.
You are designing and deploying the **cloud platform and agent runtime that enables CodePilot to analyze code, process events, and serve insights at scale**.

---

### The Business

**CodePilot Platform** is a developer tools SaaS providing AI-enhanced code review, CI pipeline optimization, and team productivity analytics. Their product installs as a GitHub App and processes events from repositories — PRs, commits, workflow runs — to provide intelligent feedback and recommendations.

| Fact         | Details                                                |
| ------------ | ------------------------------------------------------ |
| Founded      | 2023                                                   |
| Customers    | 350 engineering teams (startup to mid-market)          |
| Data Volume  | ~200K GitHub events/day, ~15K PRs analyzed/week        |
| Current Tech | Vercel (frontend) + AWS Lambda + DynamoDB + OpenAI API |
| Funding      | $4M Seed, $2.5K/month target cloud budget for backend  |

---

### The Problem

The founding engineer (now CTO) needs to migrate the backend from AWS to Azure for strategic alignment with GitHub and to unlock Azure AI capabilities. Current pain points:

1. **AWS-GitHub impedance mismatch** — GitHub webhooks → AWS Lambda works but loses context. No native GitHub integration features available in AWS. Can't leverage GitHub Copilot extensibility points.
2. **Cold start kills UX** — Lambda cold starts mean PR review comments arrive 8-15 seconds after the event. Developers expect near-instant feedback (< 3 seconds).
3. **No agent orchestration** — Current architecture is pure request-response. No ability to chain analyses: "review code → check test coverage → suggest CI optimization → comment on PR" as a coordinated workflow.
4. **Cost spikes on large repos** — When a customer pushes a 500-file PR, the AI analysis cost spikes unpredictably. No token budgeting, no graceful degradation.
5. **No team analytics** — Can analyze individual PRs but can't aggregate insights across a team or org ("Your team's average review cycle is 3.2 days — here's why").
6. **Single-point failure** — DynamoDB is the only data store. No vector search for code similarity, no time-series for productivity trends, no caching layer.

---

### The Vision

The CTO envisions a **GitHub-native AI agent platform on Azure**:

- Agents that respond to GitHub events in < 3 seconds for common analyses
- Multi-step agent workflows: code review → coverage check → CI suggestion → PR comment
- Vector search over code patterns for "similar code" and "known issues" detection
- Time-series analytics for team productivity dashboards
- Token budget management per customer with graceful fallback (smaller model, cached results)
- Deep GitHub integration via GitHub App + Copilot Extensions

---

### Your Mission

You are the **Platform Engineering team**.

> Use APEX to design and deploy the Azure platform that enables CodePilot to process GitHub events and run AI code analysis agents at scale.

---

### MVP Requirements

**Functional:**

| Capability             | Description                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------- |
| Event Ingestion        | Receive GitHub webhook events (PR opened, push, workflow completed) at high throughput |
| Event Processing       | Route events to appropriate agent workflows based on event type and customer config    |
| Code Analysis Agents   | AI agents that review code, detect patterns, and generate inline PR comments           |
| CI Optimization Agent  | Analyze workflow run times and suggest pipeline improvements                           |
| Vector Store           | Index code patterns and known issues for similarity search                             |
| GitHub API Integration | Post review comments, check statuses, create issues via GitHub API                     |

**Constraints:**

| Constraint | Value                                           | Notes                                                       |
| ---------- | ----------------------------------------------- | ----------------------------------------------------------- |
| Budget     | ~$2,500/month                                   | Backend only; frontend stays on Vercel                      |
| Compliance | SOC2 Type II (required by enterprise prospects) | Source code is customer IP — must be encrypted, short-lived |
| Region     | eastus2                                         | Lowest latency to GitHub API servers                        |
| Timeline   | 3 months                                        | Before enterprise pilot program launches                    |
| Team       | 3 backend devs, 1 infra/DevOps                  | Terraform (existing AWS Terraform skills transfer)          |
| IaC Tool   | Terraform                                       | Team has Terraform experience from AWS era                  |

**Out of scope (MVP):**

- Frontend migration from Vercel (stays as-is)
- GitLab/Bitbucket support (GitHub-only for MVP)
- Custom model fine-tuning (use Azure OpenAI GPT-4o as-is)
- Self-hosted / on-premises deployment option

**Non-functional:**

| Requirement    | Target                                                                            |
| -------------- | --------------------------------------------------------------------------------- |
| SLA            | 99.9%                                                                             |
| RTO            | 1 hour                                                                            |
| RPO            | 15 minutes                                                                        |
| Latency        | < 3 seconds for PR comment after webhook received                                 |
| Peak Load      | 1,000 events/minute sustained, 5,000/minute burst (during work hours)             |
| Scale Event    | Enterprise customer onboarding (50 repos, 200 devs, 10× event volume)             |
| Authentication | GitHub App JWT (inbound); Managed Identity (Azure internal); API keys (dashboard) |
| Network        | Public webhook endpoint (GitHub can't call private); private for data stores      |

**Key Stakeholders:**

| Stakeholder          | Primary Concern                                        |
| -------------------- | ------------------------------------------------------ |
| CTO                  | Latency, GitHub integration depth, migration risk      |
| Head of Product      | Feature velocity after migration, developer experience |
| Enterprise Prospects | SOC2 compliance, data handling, uptime guarantees      |
| Developer Users      | Speed of feedback, accuracy of suggestions, no noise   |

---

### Scale Curveball (Challenge 5)

> Reveal this at Challenge 5 — NOT before.

**The curveball:** A large enterprise prospect (2,000 developers, 500 repositories) wants to pilot. They require: (1) Dedicated Azure OpenAI deployment with PTU for predictable latency, (2) All their source code analysis must happen in an isolated compute boundary, and (3) They need a 99.95% SLA on the code review response path. Their annual contract value would 4× your ARR.

**New constraints after curveball:**

| Constraint       | Previous Value             | New Value                                           |
| ---------------- | -------------------------- | --------------------------------------------------- |
| Peak Load        | 1,000 events/min           | 5,000 events/min sustained                          |
| AI Deployment    | Shared Azure OpenAI (PAYG) | Dedicated PTU for enterprise tier                   |
| Tenant Isolation | Shared compute             | Dedicated Container Apps environment for enterprise |
| SLA              | 99.9%                      | 99.95% for enterprise tier                          |
| Budget           | $2,500/month               | $6,000/month (enterprise tier self-funding)         |
| Additional       | —                          | Separate vector store per enterprise tenant         |

---

## What Makes This Scenario Interesting

| Architecture Pattern      | Why It Matters                                                     |
| ------------------------- | ------------------------------------------------------------------ |
| Event-driven at scale     | High-throughput webhook processing with low latency requirements   |
| GitHub-native integration | GitHub App, Copilot Extensions, API rate limits                    |
| Latency-critical agents   | < 3 second response time demands warm containers and smart caching |
| Token budget management   | Per-tenant AI cost control with graceful degradation               |
| Cloud migration           | AWS → Azure migration with zero downtime                           |
| Tiered compute isolation  | Shared (startup) vs. dedicated (enterprise) compute boundaries     |

---

## Running This Scenario

1. Open VS Code with this repo in Dev Container
2. Open Copilot Chat → select **01-Orchestrator**
3. Paste this scenario document
4. Say: "Here's our scenario — CodePilot Platform. Let's start the APEX workflow."
5. Follow the challenges in [workshop-guide.md](../workshop-guide.md)
