# Scenario: Healthcare AI Platform — CareFlow AI

## UNDER CONSTRUCTION !!!!

> Multi-agent operational intelligence for hospitals. Event-driven, multi-tenant, GDPR-bound.

---

## The Scenario: CareFlow AI

> Your Challenge: Design and deploy the Azure platform that enables CareFlow AI to run intelligent operational agents at scale across hospital networks.

⚠️ You are NOT building AI models or application code.
You are designing and deploying the **cloud platform and agent runtime that enables AI to operate reliably, securely, and at scale**.

---

### The Business

**CareFlow AI** is a healthcare technology startup providing operational intelligence solutions to hospitals and care providers across the Netherlands. Their platform helps hospitals predict patient demand, optimize staff scheduling, detect operational bottlenecks, and improve patient experience.

| Fact         | Details                             |
| ------------ | ----------------------------------- |
| Founded      | 2022                                |
| Customers    | 25 hospitals                        |
| Data Volume  | Millions of patient records monthly |
| Current Tech | Fragmented cloud and AI pipelines   |
| Funding      | €8M Series A                        |

---

### The Problem

The CTO has secured €8M in Series A funding and needs to move CareFlow AI from pilot to production within 4 months. Current pain points:

1. **Order chaos in data** — Patient data arrives from multiple hospital systems (EHR, scheduling, billing) with no unified ingestion pipeline. Teams manually reconcile datasets and lose critical signal to data latency.
2. **AI not operationalized** — Predictive models exist in notebooks but aren't connected to real workflows. Insights never reach the staff who need them in time to act.
3. **No intelligent orchestration** — There is no system to reason across multiple data signals and trigger coordinated decisions or alerts across hospital departments.
4. **Deployment friction** — Moving models to production requires weeks of manual effort. Every hospital onboarding is a bespoke project with no repeatability.
5. **Compliance risk** — Sensitive healthcare data (patient PII, clinical records) must meet GDPR and Dutch healthcare data standards — but current controls are undocumented and inconsistent.
6. **Scalability gaps** — The platform struggles when onboarding new hospitals. A single large hospital network signing would overwhelm current capacity.

---

### The Vision

The CTO has outlined a vision for a unified **AI-driven operational platform powered by intelligent agents**:

- Ingest hospital data continuously from batch feeds and real-time event streams
- Use Azure AI Foundry agents to analyze signals and generate actionable recommendations
- Automate operational workflows — alerts, staffing suggestions, scheduling adjustments
- Provide real-time insights via APIs consumed by hospital dashboards
- Scale securely across multiple hospitals with full tenant isolation

> This is a **multi-agent system powered by Azure AI Foundry Agent Service**, where agents reason across data, call tools and APIs, and coordinate workflows and actions.

---

### Your Mission

You are the **Platform Engineering team**.

> Use APEX to design and deploy the Azure platform that enables CareFlow AI to run its agent system at scale.

---

### MVP Requirements

**Functional:**

| Capability         | Description                                                                      |
| ------------------ | -------------------------------------------------------------------------------- |
| Data Ingestion     | Ingest hospital data via batch and real-time streaming pipelines                 |
| Data Processing    | Transform, enrich, and prepare datasets for agent consumption                    |
| AI Agent Runtime   | Host and orchestrate AI Foundry agents (demand, anomaly, optimization, alerting) |
| API Layer          | Serve agent recommendations to hospital dashboards and integrations              |
| Secrets Management | API keys, connection strings, certificates — centrally managed                   |
| Monitoring         | Agent execution health, latency, infrastructure metrics, and cost visibility     |

**Constraints:**

| Constraint | Value                              | Notes                                                           |
| ---------- | ---------------------------------- | --------------------------------------------------------------- |
| Budget     | ~€2,000/month                      | Infrastructure only (increases to €3,500 after scale curveball) |
| Compliance | GDPR + Dutch healthcare data law   | Patient PII must stay in EU                                     |
| Region     | swedencentral                      | Primary region (most AI features available)                     |
| Timeline   | 4 months                           | MVP before peak hospital onboarding season                      |
| Team       | 5 developers, 2 data engineers     | Managed services preferred                                      |
| IaC Tool   | Bicep (or Terraform — team choice) | AVM modules preferred                                           |

**Out of scope (MVP):**

- Advanced model training pipelines (Phase 2)
- Full multi-region disaster recovery (initially)
- Deep legacy EHR system integration (Phase 2)
- Real-time IoT from medical devices (Phase 3)

**Non-functional:**

| Requirement     | Target                                                                         |
| --------------- | ------------------------------------------------------------------------------ |
| SLA             | 99.9%                                                                          |
| RTO             | 4 hours (initially)                                                            |
| RPO             | 1 hour (initially)                                                             |
| Peak Agent Load | 200 concurrent agent executions                                                |
| Scale Event     | 5× volume when large hospital network onboards                                 |
| Authentication  | Managed Identity (internal), Entra External ID (hospital users)                |
| Network         | Private endpoints for all data services; public API gateway acceptable for MVP |

**Key Stakeholders:**

| Stakeholder         | Primary Concern                                  |
| ------------------- | ------------------------------------------------ |
| CEO                 | On-time delivery, hospital NPS, budget control   |
| CTO                 | Scalability, modern agentic architecture         |
| CFO                 | Cost optimization, ROI across hospital contracts |
| Clinical Operations | Reliability of alerts, ease of maintenance       |

---

### Scale Curveball (Challenge 5)

> Reveal this at Challenge 5 — NOT before.

**The curveball:** A major academic hospital network (3× your current largest customer) signs a contract. They bring 5× current data volume, stricter compliance requirements, and need onboarding within 2 months.

**New constraints after curveball:**

| Constraint      | Previous Value | New Value                          |
| --------------- | -------------- | ---------------------------------- |
| Peak Agent Load | 4 concurrent   | 1,000 concurrent                   |
| Data Volume     | Millions/month | 5× current volume                  |
| Budget          | €2,000/month   | €3,500/month                       |
| RTO             | 4 hours        | 1 hour                             |
| RPO             | 1 hour         | 15 minutes                         |
| Additional      | —              | Require zone-redundant deployments |

---

## What Makes This Scenario Interesting

| Architecture Pattern      | Why It Matters                                                       |
| ------------------------- | -------------------------------------------------------------------- |
| Multi-agent orchestration | Multiple specialized agents coordinating via AI Foundry              |
| Multi-tenant isolation    | Each hospital's data must be isolated                                |
| Event-driven ingestion    | Batch + streaming pipelines from diverse hospital systems            |
| GDPR data sovereignty     | EU region lock, encryption at rest/transit, audit trails             |
| Cost pressure             | Real budget forces SKU decisions (not just "use Premium everything") |
| Scale-out readiness       | Architecture must handle 5× without rearchitecting                   |

---

## Running This Scenario

1. Open VS Code with this repo in Dev Container
2. Open Copilot Chat → select **01-Orchestrator**
3. Paste this scenario document
4. Say: "Here's our scenario — CareFlow AI. Let's start the APEX workflow."
5. Follow the challenges in [workshop-guide.md](../workshop-guide.md)
