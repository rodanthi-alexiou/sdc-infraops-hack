# When to Use APEX

> Decision guide: Is APEX the right tool for your scenario?

---

## The Short Version

**Use APEX when:**

- You need to design and deploy Azure infrastructure for a product/workload
- You want WAF-aligned architecture with real governance compliance
- You value structured, reviewable decisions over "just ship it"

**Skip APEX when:**

- You need a one-off VM or single resource
- Your infrastructure is already designed and you just need to type the Bicep/Terraform
- You're not deploying to Azure

---

## Decision Tree

```text
Do you need Azure infrastructure?
├── No → APEX isn't for you (yet)
└── Yes
    ├── Is it a single resource (1 VM, 1 storage account)?
    │   ├── Yes → Just use Copilot directly. APEX is overkill.
    │   └── No → Continue ↓
    │
    ├── Do you need architecture decisions documented?
    │   ├── Yes → APEX is a great fit ✓
    │   └── No, I just need IaC code fast
    │       ├── Do you have clear requirements already written?
    │       │   ├── Yes → Start at Step 4 (IaC Planning) or Step 5 (Code)
    │       │   └── No → Start at Step 1. Trust the process.
    │       └── Continue ↓
    │
    ├── Are there compliance/governance requirements?
    │   ├── Yes → APEX Step 3.5 discovers real Azure Policy constraints ✓
    │   └── No → You can skip Step 3.5, but the rest still applies
    │
    └── Is this a team exercise or solo?
        ├── Team → Use the workshop format with role cards
        └── Solo → Use self-service mode (still valuable)
```

---

## APEX vs. Alternatives

| Scenario                         | APEX                          | Copilot (raw)                  | Consultant       | ARM/Bicep by hand   |
| -------------------------------- | ----------------------------- | ------------------------------ | ---------------- | ------------------- |
| Multi-service Azure architecture | Best choice                   | Possible but unstructured      | Expensive, slow  | Tedious             |
| Single resource deployment       | Overkill                      | Perfect                        | Overkill         | Fine                |
| WAF-aligned design with ADRs     | Built-in                      | You'd have to prompt carefully | Their specialty  | Not applicable      |
| Governance compliance check      | Automated discovery           | Manual                         | Manual audit     | Not applicable      |
| Cost estimation                  | Automated (Azure Pricing API) | Estimates at best              | Expensive to get | Manual research     |
| Repeatable across projects       | Template it (BYOS)            | Start from scratch each time   | Per-engagement   | Copy-paste and edit |
| Team learning exercise           | Workshop format               | Individual only                | Passive learning | Individual only     |

---

## Ideal Scenarios for APEX

### Greenfield Platform Design

You're building something new on Azure. You have requirements but no architecture yet.

- **Example:** "We need a multi-tenant SaaS platform with AI agents, event-driven ingestion, and GDPR compliance"
- **APEX gives you:** Requirements doc → WAF-scored architecture → governance check → implementation plan → IaC code → deployment → documentation
- **Time:** 1-2 days (vs. 2-4 weeks traditionally)

### Architecture Modernization

You have existing infrastructure but need to redesign for scale, compliance, or cost.

- **Example:** "We're on VMs and need to move to containers with proper networking and identity"
- **APEX gives you:** Gap analysis via requirements, modern architecture proposal, migration-aware implementation plan
- **Start at:** Step 1 (capture current state as requirements)

### Pre-Engagement Architecture

Before a customer engagement, you need a reference architecture to discuss.

- **Example:** "Customer wants a healthcare data platform — what should we propose?"
- **APEX gives you:** Defensible architecture with WAF scores, cost estimate, and governance awareness
- **Time:** 2-4 hours to a presentable proposal

### Team Skill Building

Your team needs to learn Azure architecture patterns, WAF pillars, and IaC best practices.

- **Example:** "Our devs can code but don't understand Azure architecture decisions"
- **APEX gives you:** Structured learning through doing (workshop format), real decisions, not slideshows
- **Format:** Use the workshop guide with role rotation

### Partner Hackathon

Microsoft partner event where ISVs design their Azure platform together.

- **Example:** "10 ISVs, 2 days, each designs their own platform"
- **APEX gives you:** Repeatable framework with BYOS template, facilitator guide, and curveball moments
- **Format:** BYOS template + workshop guide + scenario library

---

## When NOT to Use APEX

| Scenario                             | Why Not                              | What to Use Instead                         |
| ------------------------------------ | ------------------------------------ | ------------------------------------------- |
| "Deploy a VM"                        | APEX adds ceremony for simple tasks  | `az vm create` or a Copilot one-shot prompt |
| "Write me a Bicep file for X"        | You already know the architecture    | Copilot with Bicep instructions loaded      |
| AWS/GCP infrastructure               | APEX is Azure-focused                | Cloud-native tools for those platforms      |
| Application code                     | APEX is infrastructure/platform only | Standard Copilot, framework docs            |
| Existing IaC that just needs a tweak | No need to re-architect              | Edit directly with Copilot assistance       |
| One-person hobby project             | The ceremony isn't worth it          | Direct prompting is faster                  |

---

## Partial Usage — Start Mid-Workflow

You don't always have to start at Step 1. APEX supports mid-entry:

| If You Already Have...             | Start At              | What You Skip               |
| ---------------------------------- | --------------------- | --------------------------- |
| Clear written requirements         | Step 2 (Architecture) | Requirements gathering      |
| Architecture designed and approved | Step 4 (IaC Planning) | Requirements + Architecture |
| Implementation plan ready          | Step 5 (IaC Code)     | Everything before code      |
| IaC code written, need to deploy   | Step 6 (Deploy)       | All planning phases         |
| Deployed infra, need docs          | Step 7 (As-Built)     | Everything — just document  |

> Tell the Orchestrator: "We already have requirements. Here they are: [paste]. Start at Step 2."

---

## Time-to-Value Expectations

| Project Complexity                                | Steps 1-4 (Design) | Steps 5-7 (Code + Deploy) | Total      |
| ------------------------------------------------- | ------------------ | ------------------------- | ---------- |
| Simple (3-5 resources)                            | 2-3 hours          | 1-2 hours                 | Half a day |
| Medium (8-15 resources, multi-tier)               | 4-6 hours          | 3-4 hours                 | 1 day      |
| Complex (20+ resources, multi-tenant, compliance) | 1-2 days           | 1 day                     | 2-3 days   |
| Workshop format (team, 8 challenges)              | 1 day              | 1 day (optional)          | 1-2 days   |

These are "human time" estimates including review and approval gates.

---

## What You Get Out

By the end of a full APEX run (Steps 1-7), you have:

- [ ] Formal requirements document with NFRs and constraints
- [ ] WAF-scored architecture with service selection rationale
- [ ] Architecture Decision Records (ADRs)
- [ ] Governance constraints document (real Azure Policy data)
- [ ] Implementation plan with module dependencies
- [ ] IaC code (Bicep or Terraform) validated against security baseline
- [ ] Deployed infrastructure (or deployment-ready code)
- [ ] Operations runbook, cost estimate, and compliance matrix
- [ ] All decisions documented and auditable

That's not a PoC. That's a production-ready platform foundation.
