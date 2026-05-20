# Scenario: Customer Operations SaaS — OpsBridge

## UNDER CONSTRUCTION !!!!

> AI-powered ticket triage and workflow automation for mid-market B2B support teams. Brownfield integration, multi-tenant, cost-sensitive.

---

## The Scenario: OpsBridge

> Your Challenge: Design and deploy the Azure platform that enables OpsBridge to run intelligent support agents that triage tickets, suggest resolutions, and automate repetitive workflows — all integrated with existing helpdesk tools.

⚠️ You are NOT building application code or AI models.
You are designing and deploying the **cloud platform and agent runtime that enables OpsBridge to operate reliably, securely, and at scale**.

---

### The Business

**OpsBridge** is a B2B SaaS company providing AI-enhanced customer operations tooling to mid-market companies. Their platform integrates with existing helpdesks (Zendesk, ServiceNow, Freshdesk) to add intelligent triage, automated responses, and escalation workflows.

| Fact         | Details                                                           |
| ------------ | ----------------------------------------------------------------- |
| Founded      | 2021                                                              |
| Customers    | 180 mid-market companies                                          |
| Data Volume  | ~50K support tickets/day across all tenants                       |
| Current Tech | Azure App Service + PostgreSQL + Azure OpenAI (manual deployment) |
| Funding      | Self-funded, profitable. $3K/month cloud budget                   |

---

### The Problem

The VP of Engineering needs to transition OpsBridge from a manually-deployed monolith to a scalable, multi-tenant agent platform. Current pain points:

1. **Deployment bottleneck** — Every new feature requires manual deployment steps. 2-week release cycles because nobody trusts the deploy process.
2. **No tenant isolation** — All customers share a single database with row-level filtering. A bad query from one tenant affects everyone. Compliance-conscious prospects are walking away.
3. **AI bolted on** — Azure OpenAI is called ad-hoc from application code. No structured agent orchestration, no tool calling, no evaluation framework. Prompt changes require full redeploys.
4. **Scaling pain** — Onboarding a customer with 5K tickets/day requires manual capacity adjustments. No autoscaling, no graceful degradation.
5. **Integration fragility** — Webhook integrations with Zendesk/ServiceNow break silently. No dead-letter queues, no retry logic, no alerting on integration failures.
6. **Cost blindness** — No per-tenant cost attribution. Can't tell which customers are profitable vs. which are consuming disproportionate AI tokens.

---

### The Vision

The VP of Engineering envisions a **platform-native agent architecture**:

- AI agents that receive tickets, classify urgency, suggest resolutions, and escalate intelligently
- Structured tool-calling: agents invoke helpdesk APIs, search knowledge bases, create follow-up tasks
- Per-tenant isolation for data and compute (at least at the data layer)
- Self-healing integrations with retry, dead-letter, and alerting
- Cost attribution per tenant with budget alerts

---

### Your Mission

You are the **Platform Engineering team**.

> Use APEX to design and deploy the Azure platform that enables OpsBridge to run its support agents reliably across 180+ tenants.

---

### MVP Requirements

**Functional:**

| Capability       | Description                                                                   |
| ---------------- | ----------------------------------------------------------------------------- |
| Ticket Ingestion | Receive tickets via webhooks from Zendesk, ServiceNow, Freshdesk              |
| Message Queue    | Buffer and route tickets with retry, dead-letter, and poison message handling |
| Agent Runtime    | Host triage agents (classify, suggest, escalate) with structured tool calling |
| Knowledge Search | Vector search over customer knowledge bases for resolution suggestions        |
| API Layer        | REST APIs for dashboards + webhook callbacks to helpdesk systems              |
| Cost Attribution | Track AI token usage and compute per tenant                                   |

**Constraints:**

| Constraint | Value                                | Notes                                                       |
| ---------- | ------------------------------------ | ----------------------------------------------------------- |
| Budget     | ~$3,000/month                        | Tight — must use consumption/serverless where possible      |
| Compliance | SOC2 (in progress), no PCI           | Customer data must be encrypted at rest and in transit      |
| Region     | westeurope                           | Most customers in EU; US expansion planned but out of scope |
| Timeline   | 3 months                             | Before Q4 customer acquisition push                         |
| Team       | 4 full-stack devs, 1 DevOps engineer | Terraform preferred (existing investment)                   |
| IaC Tool   | Terraform                            | Team has existing Terraform modules and CI pipelines        |

**Out of scope (MVP):**

- US region deployment (Phase 2)
- Custom ML model training (use Azure OpenAI as-is)
- Real-time voice/phone channel integration
- Full SOC2 audit completion (in progress separately)

**Non-functional:**

| Requirement    | Target                                                                          |
| -------------- | ------------------------------------------------------------------------------- |
| SLA            | 99.9%                                                                           |
| RTO            | 2 hours                                                                         |
| RPO            | 30 minutes                                                                      |
| Peak Load      | 500 tickets/minute sustained, 2,000/minute burst                                |
| Scale Event    | Large customer onboarding (5K tickets/day → 15K tickets/day)                    |
| Authentication | Entra ID for internal; API keys + OAuth2 for tenant integrations                |
| Network        | Service Bus + private endpoints for data; public API gateway with rate limiting |

**Key Stakeholders:**

| Stakeholder                  | Primary Concern                                                |
| ---------------------------- | -------------------------------------------------------------- |
| VP Engineering               | Reliability, developer velocity, architecture modernization    |
| Head of Sales                | Fast customer onboarding, SOC2 compliance story                |
| CFO                          | Per-tenant unit economics, cost predictability                 |
| Support Leads (at customers) | Accuracy of triage, speed of suggestions, no false escalations |

---

### Scale Curveball (Challenge 5)

> Reveal this at Challenge 5 — NOT before.

**The curveball:** Your largest customer (a Fortune 500) demands dedicated compute isolation and an SLA guarantee of 99.95% — or they'll churn. They generate 40% of your revenue. Additionally, they require all their data processed in a dedicated Azure region (northeurope) separate from other tenants.

**New constraints after curveball:**

| Constraint       | Previous Value                 | New Value                                          |
| ---------------- | ------------------------------ | -------------------------------------------------- |
| Tenant isolation | Shared compute, row-level data | Dedicated compute for premium tier                 |
| SLA              | 99.9%                          | 99.95% for premium tenants                         |
| Regions          | westeurope only                | westeurope + northeurope (premium)                 |
| Budget           | $3,000/month                   | $5,500/month (premium tier subsidized by customer) |
| Additional       | —                              | Premium tier needs zone-redundant databases        |

---

## What Makes This Scenario Interesting

| Architecture Pattern    | Why It Matters                                           |
| ----------------------- | -------------------------------------------------------- |
| Brownfield integration  | Must work with existing helpdesk APIs, not replace them  |
| Multi-tenant tiering    | Shared vs. dedicated compute based on customer tier      |
| Event-driven processing | Async ticket processing with dead-letter and retry       |
| Cost attribution        | Per-tenant AI token and compute tracking                 |
| Tight budget            | Forces creative SKU selection and consumption-tier usage |
| Agent + tool calling    | Structured agents that invoke external APIs as tools     |

---

## Running This Scenario

1. Open VS Code with this repo in Dev Container
2. Open Copilot Chat → select **01-Orchestrator**
3. Paste this scenario document
4. Say: "Here's our scenario — OpsBridge. Let's start the APEX workflow."
5. Follow the challenges in [workshop-guide.md](../workshop-guide.md)
