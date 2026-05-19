# Workshop Prep & Scenario

Read before the microhack | Scenario brief and team role cards

## The Scenario: CareFlow AI

> Your Challenge: Design and deploy the Azure data and AI platform that enables a healthcare startup to run intelligent agents at scale.

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

1. **Order chaos in data**: Patient data arrives from multiple hospital systems — EHR, scheduling, and billing — with no unified ingestion pipeline. Teams manually reconcile datasets and lose critical signal to data latency.
2. **AI not operationalized**: Predictive models exist in notebooks but are not connected to real workflows. Insights never reach the staff who need them in time to act.
3. **No intelligent orchestration**: There is no system to reason across multiple data signals and trigger coordinated decisions or alerts across hospital departments.
4. **Deployment friction**: Moving models to production requires weeks of manual effort. Every hospital onboarding is a bespoke project with no repeatability.
5. **Compliance risk**: Sensitive healthcare data (patient PII, clinical records) must meet GDPR and Dutch healthcare data standards — but current controls are undocumented and inconsistent.
6. **Scalability gaps**: The platform struggles when onboarding new hospitals. A single large hospital network signing would overwhelm current capacity.

---

### The Vision

The CTO has outlined a vision for a unified **AI-driven operational platform powered by intelligent agents**:

- Ingest hospital data continuously from batch feeds and real-time event streams
- Use Azure AI Foundry agents to analyze signals and generate actionable recommendations
- Automate operational workflows — alerts, staffing suggestions, scheduling adjustments
- Provide real-time insights via APIs consumed by hospital dashboards
- Scale securely across multiple hospitals with full tenant isolation

> 🧠 This is not just ML deployment. This is a **multi-agent system powered by Azure AI Foundry Agent Service**, where agents reason across data, call tools and APIs, and coordinate workflows and actions.

---

### Your Mission

You are the **Platform Engineering team**.

> Use APEX to design and deploy the Azure platform that enables CareFlow AI to run its agent system at scale.

⚠️ You are NOT building application code or AI models. You are designing and deploying the cloud infrastructure and agent runtime that the AI and development teams will use.

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

| Constraint | Value                            | Notes                                                          |
| ---------- | -------------------------------- | -------------------------------------------------------------- |
| Budget     | ~€2,000/month                    | Infrastructure only (increases to €3,500 after Challenge 5)    |
| Compliance | GDPR + Dutch healthcare data law | Patient PII must stay in EU                                    |
| Region     | swedencentral                    | Primary region (most AI features are available in this region) |
| Timeline   | 4 months                         | MVP before peak hospital onboarding season                     |
| Team       | 5 developers, 2 data engineers   | Managed services preferred                                     |

**Out of scope (MVP):**

- Advanced model training pipelines (Phase 2)
- Full multi-region disaster recovery (initially — see Challenge 5!)
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

**Key stakeholders:**

| Stakeholder         | Primary Concern                                  |
| ------------------- | ------------------------------------------------ |
| CEO                 | On-time delivery, hospital NPS, budget control   |
| CTO                 | Scalability, modern agentic architecture         |
| CFO                 | Cost optimization, ROI across hospital contracts |
| Clinical Operations | Reliability of alerts, ease of maintenance       |

---

### The MicroHack Journey

8 challenges across a 1-day hackathon:

1. **Requirements** — Capture business and technical needs using the Requirements agent
2. **Architecture** — Design the Azure data + AI platform aligned with the Well-Architected Framework
3. **Governance** — Discover Azure Policy assignments and define compliance controls for healthcare data
4. **Implementation** — Generate IaC templates (Bicep or Terraform) and deploy the platform
5. **Scale Curveball** — A large hospital network signs: adapt the platform to handle 5× load
6. **Load Testing** — Validate agent execution performance under stress
7. **Documentation & Diagnostics** — Create operational runbooks and troubleshooting procedures
8. **Team Showcase** — Present your platform architecture and decisions professionally

Not all teams will complete all challenges — the goal is mastering the agentic platform engineering workflow.

---

## Team Role Cards

> Print and distribute to each team member (up to 5 per team).

### Team Structure

|                 |                          |
| --------------- | ------------------------ |
| Team Size       | Up to 5 members per team |
| Number of Teams | Maximum 4 teams          |

> Note: With 5 members, one person can float across roles or two can share the Architect role (one on security, one on cost/AI).

---

### 🚗 Driver

**Primary Responsibility:** Hands on keyboard

**You Will:**

- Type all commands and code
- Navigate VS Code and Azure Portal
- Execute agent prompts when team agrees
- Run deployments and tests

**Tips:**

- Share your screen so team can follow
- Verbalize what you're doing: "I'm about to invoke the Architect agent…"
- Pause before executing — wait for team consensus
- Ask "Should I run this?" before deployments

**Collaboration is Key:**

- Don't make decisions alone — this is team-based discovery
- Embrace pauses for discussion — silence means thinking!
- When stuck, ask: "What question should I ask the agent?"

---

### 🧭 Navigator

**Primary Responsibility:** Guide strategy and next steps

**You Will:**

- Read challenge instructions aloud
- Guide Driver on what to type/click next
- Watch for errors and typos
- Keep team focused and on time

**Tips:**

- Have the challenge doc open on your device
- Call out the next step before Driver finishes the current one
- Track time per challenge — 8 challenges in one day means the pace stays tight
- In Challenge 5 (Scale Curveball): Help team pivot quickly

**Coaching Mindset:**

- When team is stuck, ask questions: "What are we trying to achieve?"
- Guide exploration: "Have we considered…?"

---

### 🏗️ Architect

**Primary Responsibility:** Technical decisions and quality

**You Will:**

- Review agent suggestions before team approves
- Validate architecture against WAF pillars
- Make SKU and service choices
- Ensure security and healthcare compliance best practices

**Tips:**

- Have the quick reference card handy
- Question each agent recommendation: "Why this service?"
- Check: "Does this meet our NFRs?"
- Watch the budget! (€2,000 → €3,500 after Challenge 5)

**Critical Questions to Ask:**

- "Is this the right SKU for our SLA?"
- "Are we using managed identities everywhere?"
- "Does this handle the scale-out requirement?"
- "What's the cost impact of running agents at 5× load?"

---

### 📝 Documenter

**Primary Responsibility:** Capture decisions and prepare showcase

**You Will:**

- Note key decisions and rationale
- Track which challenges are complete
- Document blockers and solutions
- Prepare for Challenge 8: Team Showcase

**Tips:**

- Keep a running log in a text file or notepad
- Screenshot interesting architecture outputs and agent responses
- Prepare 2-minute summary for final presentation
- In Challenge 5: Document the ADR (Architecture Decision Record) reasoning for scale changes
- In Challenges 7–8: Lead documentation agent interactions

**Capture These Details:**

- "We chose X because…" (business justification)
- "The agent suggested Y but we changed to Z because…"
- "We got stuck on… and solved it by…"

---

### Role Rotation (Optional)

For 8 challenges, consider rotating every 2 challenges:

| Challenges | Driver | Navigator | Architect | Documenter |
| ---------- | ------ | --------- | --------- | ---------- |
| 1–2        | A      | B         | C         | D          |
| 3–4        | B      | C         | D         | A          |
| 5–6        | C      | D         | A         | B          |
| 7–8        | D      | A         | B         | C          |

**Suggested Leads:**

- Challenge 7 (Documentation & Diagnostics): Documenter leads
- Challenge 8 (Showcase): Documenter presents, everyone supports

---

## Team Agreement

Before starting, agree on:

- [ ] Who plays which role initially
- [ ] Will we rotate roles? After which challenges?
- [ ] How do we make decisions when we disagree? (Vote? Discuss? Architect decides?)
- [ ] Break strategy (together or staggered? Lunch 12:00–12:45, Break 15:00–15:15)
- [ ] How do we support each other when stuck?

**Team Name:** **\*\***\_\_\_\_**\*\***

| Role              | Name |
| ----------------- | ---- |
| 🚗 Driver         |      |
| 🧭 Navigator      |      |
| 🏗️ Architect      |      |
| 📝 Documenter     |      |
| 🔄 Floater (opt.) |      |

> Coaching Philosophy: We discover solutions together through questions, not by following prescriptive steps!
