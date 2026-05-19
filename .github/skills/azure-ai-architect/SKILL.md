---
name: azure-ai-architect
description: "Azure AI workload architecture guidance: PTU vs PAYG decisions, token cost projection, RAG accuracy as WAF Reliability NFR, content safety gates, private endpoints for AI services. USE FOR: designing Azure OpenAI, AI Search, AI Services, or Foundry-based workloads; WAF assessment of AI scenarios; architecture reviews that mention RAG, agents, or LLMs. DO NOT USE FOR: general Azure infrastructure (use azure-defaults), Bicep/Terraform code generation (use azure-bicep-patterns), diagram creation."
compatibility: Works with Claude Code, GitHub Copilot, VS Code, and any Agent Skills compatible tool.
license: MIT
metadata:
  author: jonathan-vella
  version: "1.0"
  category: azure-ai
---

# Azure AI Architect Skill

WAF-aligned architecture guidance for Azure AI and agentic workloads.
Auto-activates when requirements contain: `Azure OpenAI`, `AI Search`, `AI Services`,
`Foundry`, `RAG`, `embedding`, `LLM`, `AI agent`, `Copilot`, or `Document Intelligence`.

Deep-dive content lives in `references/` — load on demand.

---

## Quick Reference

| Decision Area                                                   | Reference                                                          | WAF Pillar                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------ | --------------------------- |
| PTU vs. PAYG model deployment                                   | [ai-deployment-decisions](references/ai-deployment-decisions.md)   | Cost Optimization           |
| Token cost projection                                           | [ai-deployment-decisions](references/ai-deployment-decisions.md)   | Cost Optimization           |
| RAG accuracy target → infrastructure sizing                     | [ai-waf-checklist](references/ai-waf-checklist.md)                 | Reliability                 |
| Content safety filters                                          | [ai-waf-checklist](references/ai-waf-checklist.md)                 | Security                    |
| Private endpoints as Security gate                              | [ai-waf-checklist](references/ai-waf-checklist.md)                 | Security                    |
| AI Services resource naming + kind                              | [ai-resource-model](references/ai-resource-model.md)               | Operational Excellence      |
| RBAC role assignments for AI services                           | [ai-resource-model](references/ai-resource-model.md)               | Security                    |
| AI gateway patterns (APIM, hub-spoke, Access Contracts)         | [ai-gateway-patterns](references/ai-gateway-patterns.md)           | Security, Cost Optimization |
| AI Landing Zone reference architectures and deployment patterns | [ai-landing-zone-patterns](references/ai-landing-zone-patterns.md) | All pillars                 |

---

## When to Use This Skill

| Trigger                                                                | Use Case                                                 |
| ---------------------------------------------------------------------- | -------------------------------------------------------- |
| Requirements mention `Azure OpenAI`, `AI Search`, or `Foundry`         | AI workload WAF assessment                               |
| Requirements contain a RAG accuracy NFR (e.g., "80% answer relevance") | Map accuracy to infrastructure sizing                    |
| Architecture review includes an LLM or embedding model                 | PTU vs PAYG + token budget analysis                      |
| Security review for AI-facing endpoints                                | Content safety + private endpoint gates                  |
| Cost estimate for an AI workload                                       | Token cost projection workflow                           |
| Architect step (Step 2) of APEX workflow                               | Supplement general WAF assessment with AI decision trees |
| Multiple teams sharing AI services                                     | APIM AI gateway decision + Access Contract pattern       |
| Deploying AI workload in enterprise with existing Azure Landing Zone   | AI LZ brownfield vs greenfield pattern                   |

---

## Step-by-Step Workflows

### 1. AI Workload WAF Assessment

Run this in addition to the standard WAF pillars when the workload includes AI services.

**Step 1 — Check trigger keywords in `01-requirements.md`**

Scan for: `OpenAI`, `AI Search`, `Foundry`, `RAG`, `embedding`, `agent`, `LLM`, `Document Intelligence`.
If found, load `references/ai-waf-checklist.md` and apply all checklist items.

**Step 2 — PTU vs PAYG decision**

Read [ai-deployment-decisions](references/ai-deployment-decisions.md) §PTU Decision Tree.
Record the decision in the architecture assessment under `## AI Deployment Model`.

**Step 3 — Token cost projection**

Read [ai-deployment-decisions](references/ai-deployment-decisions.md) §Token Cost Projection.
Call the Azure Pricing MCP with the token pricing endpoint — not VM/compute pricing.
Record estimated monthly token cost as a separate line item in the cost estimate table.

**Step 4 — Security gates**

Apply the AI security gates from [ai-waf-checklist](references/ai-waf-checklist.md) §Security.
`publicNetworkAccess: Disabled` on AI Services + AI Search is a **gate**, not a recommendation.
Content safety: flag as required for any public-facing inference endpoint.

**Step 5 — Reliability NFRs**

Map any accuracy or availability NFR from requirements to the checklist items in
[ai-waf-checklist](references/ai-waf-checklist.md) §Reliability.
A stated RAG accuracy target (e.g., 80%) must drive AI Search tier, replica count, and
embedding model choice — these are architectural decisions, not deployment details.

### 2. AI Resource Model Identification

When the workload uses Azure AI, always confirm the correct resource model
before generating any architecture diagram or IaC plan.

Read [ai-resource-model](references/ai-resource-model.md) for:

- Current resource types (AI Services + Foundry Project, no Hub layer)
- AVM module paths
- Managed Identity → RBAC role chain

### 3. AI Gateway Decision

Run when requirements mention multiple teams, cost attribution, token rate limiting, or multi-model.

**Step 1 — Check gateway trigger signals in requirements**

Scan for: multiple teams, cost per team, token rate limiting, multi-model routing,
enterprise / regulated, PTU + spillover.

**Step 2 — Determine if gateway is required or optional**

Read [ai-gateway-patterns](references/ai-gateway-patterns.md) §When You Need an AI Gateway.
If any Required signal is present → gateway is mandatory.
Document outcome in the architecture assessment under `## AI Gateway`.

**Step 3 — Select hub-spoke topology**

Is there an existing enterprise Azure Landing Zone?

- YES → AI gateway in hub VNet (brownfield pattern)
- NO → AI gateway in dedicated AI spoke (greenfield pattern)

Read [ai-landing-zone-patterns](references/ai-landing-zone-patterns.md) §Deployment Patterns.

**Step 4 — Record Access Contract requirements**

For each agent or use case, document the required Access Contract fields
(model, capacity, safety guardrails, quota limits) in the architecture assessment
under `## AI Citadel Access Contracts`.

---

## Troubleshooting

| Symptom                               | Cause                                          | Fix                                                                                                                       |
| ------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| IaC uses `kind: Hub`                  | Outdated Foundry Hub pattern (deprecated 2025) | Replace with `kind: AIServices` — see [ai-resource-model](references/ai-resource-model.md)                                |
| Cost estimate omits token cost        | Pricing MCP called with VM endpoint            | Use token pricing endpoint; see [ai-deployment-decisions](references/ai-deployment-decisions.md)                          |
| Accuracy NFR not mapped to infra      | RAG accuracy treated as app concern            | Map to AI Search tier + replica count; see [ai-waf-checklist](references/ai-waf-checklist.md) §Reliability                |
| Private endpoint listed as "optional" | General infra defaults applied                 | For AI services in production: this is a Security gate — see [ai-waf-checklist](references/ai-waf-checklist.md) §Security |
| No APIM in multi-team AI design       | Single endpoint shared without governance      | AI gateway required; see [ai-gateway-patterns](references/ai-gateway-patterns.md) §When You Need an AI Gateway            |
| No NSG on AI service subnet           | Default allow inbound on VNet                  | NSG with deny-all inbound required; see [ai-waf-checklist](references/ai-waf-checklist.md) §Networking                    |

---

## References

- [ai-deployment-decisions.md](references/ai-deployment-decisions.md) — PTU vs PAYG, global deployment type, token cost projection, compute options
- [ai-waf-checklist.md](references/ai-waf-checklist.md) — AI-specific WAF gates and NFR mapping, networking, governance
- [ai-resource-model.md](references/ai-resource-model.md) — Current AI Services + Foundry resource model, AVM paths, RBAC, identity, DR
- [ai-gateway-patterns.md](references/ai-gateway-patterns.md) — Citadel 4-layer governance, APIM capabilities, Access Contracts, agent onboarding
- [ai-landing-zone-patterns.md](references/ai-landing-zone-patterns.md) — AI LZ reference architectures, greenfield/brownfield patterns, quota checks
