# BYOS Template — Bring Your Own Scenario

> Fill in the sections below, then paste the entire document into the **01-Orchestrator** agent in VS Code Copilot Chat. The agents will take it from there.

---

## Instructions

1. Replace all `[PLACEHOLDER]` values with your specifics
2. Delete any sections that don't apply (mark them "N/A" if you're unsure)
3. Don't worry about perfection — the Requirements agent will ask clarifying questions
4. Keep the structure intact — the agents parse these sections

---

## The Scenario: [YOUR PRODUCT NAME]

> Your Challenge: Design and deploy the Azure platform that enables [YOUR PRODUCT NAME] to [PRIMARY GOAL — e.g., "run intelligent agents at scale", "serve AI recommendations to customers", "process documents with AI"].

⚠️ You are NOT building application code or AI models.
You are designing and deploying the **cloud platform and runtime that enables your product to operate reliably, securely, and at scale**.

---

### The Business

**[YOUR PRODUCT NAME]** is a [TYPE — e.g., "healthcare technology startup", "B2B SaaS company", "developer tools platform"] providing [WHAT YOU DO] to [WHO YOUR CUSTOMERS ARE].

| Fact           | Details                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Founded        | [YEAR]                                                                                                |
| Customers      | [NUMBER and TYPE — e.g., "25 hospitals", "200 mid-market companies"]                                  |
| Data Volume    | [SCALE — e.g., "Millions of records monthly", "10K API calls/hour"]                                   |
| Current Tech   | [CURRENT STATE — e.g., "Fragmented cloud pipelines", "Single VM deployment", "AWS Lambda + DynamoDB"] |
| Funding/Budget | [CONTEXT — e.g., "€8M Series A", "Self-funded, profitable", "$500K annual cloud budget"]              |

---

### The Problem

[ROLE — e.g., "The CTO", "The VP Engineering"] needs to [HIGH-LEVEL GOAL] within [TIMELINE]. Current pain points:

1. **[PROBLEM 1 TITLE]** — [Description of the pain point and its business impact]
2. **[PROBLEM 2 TITLE]** — [Description]
3. **[PROBLEM 3 TITLE]** — [Description]
4. **[PROBLEM 4 TITLE]** — [Description]
5. **[PROBLEM 5 TITLE]** — [Description]
6. **[PROBLEM 6 TITLE]** — [Description]

> Tip: 3-6 problems is the sweet spot. Focus on infrastructure/platform problems, not application logic.

---

### The Vision

[ROLE] has outlined a vision for [WHAT THE PLATFORM SHOULD BECOME]:

- [CAPABILITY 1 — e.g., "Ingest customer data continuously from batch and streaming sources"]
- [CAPABILITY 2 — e.g., "Run AI agents that process data and trigger automated workflows"]
- [CAPABILITY 3 — e.g., "Serve recommendations via APIs consumed by customer dashboards"]
- [CAPABILITY 4 — e.g., "Scale securely across customers with tenant isolation"]
- [CAPABILITY 5 — e.g., "Provide full observability into agent execution and costs"]

---

### Platform Decisions (Answer Before Starting)

> These are **gate decisions** — the ones that cause the most back-and-forth if left vague.
> Answer them now and the agent workflow runs 3× faster with fewer clarification turns.

**Tenancy Model:**

| Question                                  | Your Answer                                                                                                                                                                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Who are your "tenants"?                   | [e.g., "Enterprise customers", "Internal teams", "End users", "Not applicable — single tenant"]                                                                                                                                  |
| Isolation model?                          | [Pick one: **Fully shared** (logical isolation via tenant ID) / **Shared compute, dedicated data** (per-tenant DBs/indexes) / **Fully dedicated** (separate resources per tenant) / **Hybrid** (free=shared, premium=dedicated)] |
| How many tenants at launch? At 12 months? | [e.g., "5 at launch, 50 at 12 months"]                                                                                                                                                                                           |
| Noisy-neighbor concern?                   | [e.g., "Yes — one large customer could consume all AI tokens" / "No — tenants are similar size"]                                                                                                                                 |
| Per-tenant cost attribution needed?       | [Yes/No — If yes, how do you bill customers?]                                                                                                                                                                                    |

**AI & Agent Readiness:**

| Question                                         | Your Answer                                                                                                                                         |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Do you already have Azure AI resources deployed? | [e.g., "Yes — Azure OpenAI in swedencentral (PAYG)", "Yes — Foundry agent prototype in dev RG", "No — greenfield"]                                  |
| If yes, what's deployed vs. what's missing?      | [e.g., "Foundry agent works in dev but has no private endpoints, no managed identity, no monitoring, public network access"]                        |
| AI deployment model needed?                      | [Pick: **PAYG** (variable, low commitment) / **PTU** (reserved, latency-guaranteed) / **Both** (PTU primary + PAYG spillover) / **Don't know yet**] |
| Token volume estimate?                           | [e.g., "~2M tokens/month", "Unknown — early stage", "50M+ tokens/month"]                                                                            |
| AI Gateway / multi-model routing needed?         | [Yes — multiple teams/models / No — single model, single team / **Don't know**]                                                                     |
| Content safety / responsible AI requirements?    | [e.g., "Required — healthcare/finance", "Standard filters sufficient", "Custom content filters needed"]                                             |

**Existing Infrastructure (Brownfield):**

| Question                                           | Your Answer                                                                                          |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Starting from scratch or existing Azure resources? | [Greenfield / Brownfield — describe what exists]                                                     |
| Existing IaC?                                      | [None / Bicep / Terraform / ARM templates / Portal-deployed (no IaC)]                                |
| What needs to become production-ready?             | [e.g., "Dev prototype → add networking, identity, monitoring, DR" / "Nothing — clean start"]         |
| Existing VNet/networking?                          | [e.g., "Hub-spoke already exists", "VNet with NSGs in place", "Nothing — APEX designs from scratch"] |

**Security Posture:**

| Question                            | Your Answer                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Private endpoints required for MVP? | [Yes — all data services / Yes — only for production / No — public is acceptable for MVP]                        |
| Identity model?                     | [Managed Identity only / Service principals exist / Keys/connection strings currently used (need migration)]     |
| Data classification?                | [e.g., "PHI/PII — healthcare", "Financial data — regulated", "Business data — standard controls", "Public data"] |

> **Why this matters:** If you skip these, the Architect agent will ask them one by one during Step 2.
> The Requirements agent can't infer your tenancy model. The IaC Planner can't choose PTU vs PAYG without token volume.
> Front-loading these decisions saves 5-10 clarification turns in the workflow.

---

### Your Mission

You are the **Platform Engineering team**.

> Use APEX to design and deploy the Azure platform that enables [YOUR PRODUCT NAME] to [PRIMARY GOAL].

---

### MVP Requirements

**Functional:**

| Capability     | Description                                                                      |
| -------------- | -------------------------------------------------------------------------------- |
| [CAPABILITY 1] | [What it does — e.g., "Ingest data via batch and real-time streaming pipelines"] |
| [CAPABILITY 2] | [What it does]                                                                   |
| [CAPABILITY 3] | [What it does]                                                                   |
| [CAPABILITY 4] | [What it does]                                                                   |
| [CAPABILITY 5] | [What it does]                                                                   |
| [CAPABILITY 6] | [What it does]                                                                   |

**Constraints:**

| Constraint | Value                                                           | Notes                                       |
| ---------- | --------------------------------------------------------------- | ------------------------------------------- |
| Budget     | [MONTHLY AMOUNT — e.g., "~€2,000/month"]                        | [Infrastructure only? Including AI tokens?] |
| Compliance | [REQUIREMENTS — e.g., "GDPR", "SOC2", "HIPAA", "None specific"] | [Data residency requirements?]              |
| Region     | [AZURE REGION — e.g., "swedencentral", "westeurope", "eastus"]  | [Why this region?]                          |
| Timeline   | [DEADLINE — e.g., "4 months", "Q2 2025"]                        | [What drives this?]                         |
| Team       | [SIZE AND SKILLS — e.g., "5 devs, 2 data engineers"]            | [Managed services preferred?]               |
| IaC Tool   | [PREFERENCE — "Bicep" or "Terraform"]                           | [Existing investment? Team skills?]         |

**Out of scope (MVP):**

- [THING 1 — e.g., "Advanced ML training pipelines (Phase 2)"]
- [THING 2 — e.g., "Multi-region disaster recovery (later phase)"]
- [THING 3 — e.g., "Legacy system deep integration"]
- [THING 4]

**Non-functional:**

| Requirement    | Target                                                                    |
| -------------- | ------------------------------------------------------------------------- |
| SLA            | [e.g., "99.9%", "99.95%"]                                                 |
| RTO            | [e.g., "4 hours", "1 hour", "15 minutes"]                                 |
| RPO            | [e.g., "1 hour", "5 minutes"]                                             |
| Peak Load      | [e.g., "200 concurrent agent executions", "10K requests/second"]          |
| Scale Event    | [e.g., "5× volume when large customer onboards"]                          |
| Authentication | [e.g., "Managed Identity (internal), Entra External ID (customers)"]      |
| Network        | [e.g., "Private endpoints for data services; public API gateway for MVP"] |

**Key Stakeholders:**

| Stakeholder                | Primary Concern        |
| -------------------------- | ---------------------- |
| [ROLE 1 — e.g., CEO]       | [WHAT THEY CARE ABOUT] |
| [ROLE 2 — e.g., CTO]       | [WHAT THEY CARE ABOUT] |
| [ROLE 3 — e.g., CFO]       | [WHAT THEY CARE ABOUT] |
| [ROLE 4 — e.g., End Users] | [WHAT THEY CARE ABOUT] |

---

### Scale Curveball (Optional — for workshops)

> Use this as Challenge 5 material. Reveal mid-workshop to force architecture adaptation.

**The curveball:** [DESCRIBE A DRAMATIC CHANGE — e.g., "A customer 10× your current largest signs. Handle 5× total volume within the same budget ceiling." or "A new compliance requirement (SOC2) is mandated. All data services must have private endpoints."]

**New constraints after curveball:**

| Constraint     | Previous Value | New Value                               |
| -------------- | -------------- | --------------------------------------- |
| [WHAT CHANGED] | [BEFORE]       | [AFTER]                                 |
| [WHAT CHANGED] | [BEFORE]       | [AFTER]                                 |
| Budget         | [PREVIOUS]     | [NEW — e.g., increased to €3,500/month] |

---

## How to Use This Template

### Option A: Self-Service (Solo/Small Team)

1. Fill in all sections above
2. Open VS Code → Copilot Chat → select **01-Orchestrator**
3. Paste this document and say: "Here's our scenario. Let's start the APEX workflow."
4. Follow the agent's lead through Steps 1-7

### Option B: Workshop (Facilitator-Led)

1. Facilitator fills in the template before the workshop (or picks from `scenarios/`)
2. Distribute to all teams at session start
3. Teams work through [the challenge structure](workshop-guide.md)
4. Reveal the Scale Curveball at Challenge 5

### Option C: Adapt an Example

1. Browse `scenarios/` for a pre-built scenario close to your domain
2. Copy it, rename it, change the specifics to match your product
3. Run it through APEX

---

## Tips for Good Scenarios

**DO:**

- Include specific numbers (users, budget, timeline, data volume)
- Specify compliance requirements explicitly
- State team size and skill mix
- Include a realistic budget constraint
- Define at least 3 concrete functional capabilities

**DON'T:**

- Leave constraints vague ("reasonable budget", "good performance")
- Include application-level logic ("the AI model should use GPT-4")
- Over-scope (6 capabilities is plenty for MVP)
- Forget the "out of scope" section (prevents scope creep)
