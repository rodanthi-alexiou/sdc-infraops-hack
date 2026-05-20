# How APEX Works — The 5-Minute Version

> TL;DR: You describe what you need. Specialized AI agents inside VS Code produce architecture, governance checks, IaC code, and deployment automation — with you approving at every critical junction.

---

## The Workflow at a Glance

```mermaid
flowchart LR
    S1[1. Requirements] --> S2[2. Architecture]
    S2 --> S3[3. Design]
    S3 --> S3G[3.5 Governance]
    S3G --> S4[4. IaC Plan]
    S4 --> S5[5. IaC Code]
    S5 --> S6[6. Deploy]
    S6 --> S7[7. As-Built Docs]

    S1 -.->|"🚦 Approval Gate"| S2
    S2 -.->|"🚦 Approval Gate"| S3
    S3G -.->|"🚦 Approval Gate"| S4
    S4 -.->|"🚦 Approval Gate"| S5
    S6 -.->|"🚦 Approval Gate"| S7
```

You stay in control. Nothing progresses without your explicit "ship it."

---

## What Each Step Produces

| Step                     | What the Agent Does                                            | Artifact You Get                                 | Why It Matters                           |
| ------------------------ | -------------------------------------------------------------- | ------------------------------------------------ | ---------------------------------------- |
| **1. Requirements**      | Interviews you (or reads your scenario doc) to capture needs   | `01-requirements.md`                             | Clear scope = no scope creep             |
| **2. Architecture**      | Designs Azure services, evaluates WAF pillars, estimates costs | `02-architecture-assessment.md` + cost breakdown | WAF-aligned architecture before any code |
| **3. Design** (optional) | Generates diagrams + Architecture Decision Records             | `.drawio` diagrams, ADR documents                | Visual proof of decisions                |
| **3.5 Governance**       | Queries YOUR Azure subscription's actual policies              | `04-governance-constraints.md/.json`             | No surprises at deploy time              |
| **4. IaC Plan**          | Plans modules, dependencies, security controls                 | `04-implementation-plan.md` + diagrams           | Blueprint for code generation            |
| **5. IaC Code**          | Generates Bicep or Terraform with AVM modules                  | Full `infra/` directory                          | Production-grade IaC                     |
| **6. Deploy**            | Runs `azd up` or `terraform apply` with what-if preview        | Deployed resources + summary                     | Actual Azure resources                   |
| **7. As-Built**          | Generates ops runbooks, compliance matrix, backup plan         | Documentation suite                              | Day-2 operations ready                   |

All outputs land in `agent-output/{your-project-name}/`.

---

## How GitHub Copilot Agents Power It

Each workflow step is driven by a specialized agent — a custom Copilot "personality" with:

- **Domain expertise** (architecture, governance, Bicep, Terraform, deployment)
- **Tool access** (Azure Pricing API, Policy discovery, AVM registry, Draw.io)
- **Skills** (reusable knowledge packages for Azure patterns, diagrams, compliance)

The **Orchestrator** agent coordinates the full workflow:

1. You talk to the Orchestrator
2. It delegates to the right specialist
3. The specialist produces artifacts
4. The Orchestrator presents results for your approval
5. You approve (or redirect) → next step

You never need to know which agent handles what — just talk to the Orchestrator.

---

## The Agent Cast

| Agent        | Specialty                             | Analogy                     |
| ------------ | ------------------------------------- | --------------------------- |
| Orchestrator | Workflow coordination, approval gates | Project manager             |
| Requirements | Business + technical needs capture    | Business analyst            |
| Architect    | WAF-aligned design, cost estimation   | Solutions architect         |
| Governance   | Policy discovery, compliance mapping  | Security/compliance advisor |
| IaC Planner  | Module planning, dependency mapping   | Tech lead                   |
| IaC CodeGen  | Bicep or Terraform generation         | Senior engineer             |
| Deploy       | Deployment execution, rollback        | DevOps engineer             |
| As-Built     | Documentation generation              | Technical writer            |
| Challenger   | Adversarial review (finds holes)      | Devil's advocate reviewer   |

---

## What Makes This Different From...

### "Just asking Copilot to write Bicep"

Copilot alone gives you code fragments without context. APEX gives you:

- Architecture BEFORE code (so you build the right thing)
- Governance checks against YOUR actual policies (not generic best practices)
- Cost projections BEFORE you deploy (not surprise bills after)
- Adversarial review that challenges assumptions (not just "looks good to me")

### "Hiring a consultant for 6 weeks"

APEX compresses the architecture → plan → code → deploy cycle from weeks to hours. The human (you) still makes every critical decision — but the grunt work of researching services, checking WAF pillars, writing IaC, and generating docs is handled by agents.

### "Using an ARM/Bicep quickstart template"

Templates are rigid. They work for the exact scenario they were built for. APEX generates infrastructure tailored to YOUR requirements, YOUR compliance environment, YOUR cost constraints. Different scenario = different output.

---

## The Approval Gate Pattern

At every gate, you see the full artifact and choose:

- **Approve** → Move to next step
- **Revise** → Tell the agent what to change, iterate
- **Reject** → Stop and rethink

This is NOT a "fire and forget" system. You are the human-in-the-loop at every decision point. The agents propose — you decide.

---

## Time to Value

| What You Want                       | Steps Needed | Typical Time  |
| ----------------------------------- | ------------ | ------------- |
| Architecture + cost estimate only   | Steps 1-2    | 30-60 minutes |
| Full plan with governance clearance | Steps 1-4    | 2-4 hours     |
| Deployed infrastructure             | Steps 1-6    | 4-8 hours     |
| Complete with documentation         | Steps 1-7    | 6-10 hours    |

These assume a single person working with the agents. In a workshop setting with a team, Steps 1-4 fit comfortably in a full day.

---

## Next Steps

- **Ready to build?** → [Fill in the BYOS template](byos-template.md) and start the Orchestrator
- **Want to see an example first?** → [Browse the pre-built scenarios](scenarios/)
- **Running a workshop?** → [Read the facilitator guide](workshop-guide.md)
- **Not sure if APEX fits?** → [Check the decision guide](when-to-use-apex.md)
