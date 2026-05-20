# APEX Repo Changes Log — HelpdeskAI PoC Session

**Date:** May 19, 2026
**Branch:** `main`
**Triggered by:** Gap analysis of [`apex-improvement-backlog.md`](apex-improvement-backlog.md)
**Scope:** P2 and P3 only. P1, P4, CT are out of scope for this session.

---

## Summary

| Backlog Item                                       | Status        | Files Changed               |
| -------------------------------------------------- | ------------- | --------------------------- |
| P2 — Sync `microsoft-foundry` SKILL.md             | ✅ Done       | 2 files (1 new, 1 modified) |
| P3 — Add AI services AVM patterns                  | ✅ Done       | 2 files (1 new, 1 modified) |
| P1 — Add Foundry MCP to `.vscode/mcp.json`         | ☐ Not started | —                           |
| P4 — Import `azure-reliability` + `entra-agent-id` | ☐ Not started | —                           |
| CT — Correct deprecated Hub terminology            | ☐ Not started | —                           |

---

## P2 — Sync `microsoft-foundry` SKILL.md

### New file: `.github/skills/microsoft-foundry/foundry-agent/faos-optimize/faos-optimize.md`

**Why:** The `faos-optimize` sub-skill was completely absent from APEX. It is required for
HelpdeskAI's RAG accuracy eval loop (WAF Reliability NFR).

**What it contains:**

- `<!-- ref:faos-optimize-v1 -->` reference tag
- **When to Use** — four trigger conditions (eval loops, temperature tuning, batch eval,
  A/B configuration comparison)
- **FAOS Optimization Pattern** — Python code block using `AIProjectClient` that externalizes
  `AGENT_INSTRUCTIONS`, `AGENT_MODEL`, and `AGENT_TEMPERATURE` as env vars so the FAOS
  evaluator can sweep parameters without code changes
- **Required Environment Variables** table (`AGENT_INSTRUCTIONS`, `AGENT_MODEL`,
  `AGENT_TEMPERATURE`) with defaults
- **`azure.yaml` snippet** — shows how to wire the three env vars into azd's `services.env:`
  block so each environment gets its own values
- **Eval Loop Integration** — 5-step cycle: baseline → eval → optimize → compare → promote
- **WAF Reliability Mapping** table — maps RAG accuracy ≥ 80% NFR and groundedness to
  specific FAOS parameters with concrete guidance

### Modified file: `.github/skills/microsoft-foundry/SKILL.md`

Three additions:

1. **Sub-Skills table** (line ~30): added two new rows after the existing `rbac` row:

   | Sub-Skill                  | Description                                                                                 |
   | -------------------------- | ------------------------------------------------------------------------------------------- |
   | `faos-optimize`            | Optimize agent config for FAOS eval sweeps → `foundry-agent/faos-optimize/faos-optimize.md` |
   | `resource/private-network` | Deploy Foundry with VNet isolation → `references/private-network-standard-agent-setup.md`   |

2. **Hub deprecation `[!CAUTION]` block** (line ~76): inserted before `## Agent: Setup Types`.
   Warns that `kind: Hub` / `Microsoft.MachineLearningServices/workspaces` is deprecated
   as of 2025 and redirects to `Microsoft.CognitiveServices/accounts` with `kind: AIServices`.

3. **Reference Index** (line ~126): added entry:

   ```
   | `foundry-agent/faos-optimize/faos-optimize.md` | FAOS Optimization (eval-driven tuning) |
   ```

---

## P3 — Add AI Services AVM Patterns to `azure-bicep-patterns`

### New file: `.github/skills/azure-bicep-patterns/references/ai-services-patterns.md`

**Why:** The `06b-Bicep CodeGen` agent uses `azure-bicep-patterns` as its primary AVM module
reference. Without AI patterns it would hallucinate module paths or emit raw resource
definitions — violating the AVM-first mandate.

**What it contains:**

- `<!-- ref:ai-services-patterns-v1 -->` reference tag

- **AVM Module Paths** table with minimum version pins:

  | Resource                       | AVM Module                                       | Min Version |
  | ------------------------------ | ------------------------------------------------ | ----------- |
  | AI Services (Foundry resource) | `br/public:avm/res/cognitive-services/account`   | `0.9.x`     |
  | AI Search                      | `br/public:avm/res/search/search-service`        | `0.9.x`     |
  | Cosmos DB (NoSQL)              | `br/public:avm/res/document-db/database-account` | `0.10.x`    |
  | Container Apps Environment     | `br/public:avm/res/app/managed-environment`      | `0.8.x`     |
  | Container Apps                 | `br/public:avm/res/app/container-app`            | `0.11.x`    |

- **AI Services Bicep example** — full `module` block with `kind: 'AIServices'`,
  `publicNetworkAccess: 'Disabled'`, `managedIdentities`, `deployments` array (GPT-4o,
  `GlobalStandard` SKU), and diagnostic settings

- **AI Search Bicep example** — `replicaCount: 2` (WAF Reliability HA requirement),
  `publicNetworkAccess: 'disabled'`, `authOptions` (AAD-only with `http403`)

- **Cosmos DB Bicep example** — `disableLocalAuth: true` (Entra ID-only auth),
  `publicNetworkAccess: 'Disabled'`, system-assigned identity

- **Managed Identity → RBAC Role Assignments** table with role definition IDs:

  | Assignment                          | Role Name                      | Role Definition ID                     |
  | ----------------------------------- | ------------------------------ | -------------------------------------- |
  | Container Apps → AI Services        | Cognitive Services OpenAI User | `5e0bd9bd-7b93-4f28-af87-19fc36ad61bd` |
  | Container Apps → AI Search          | Search Index Data Contributor  | `8ebe5a00-799e-43f5-93ac-243d3dce84a7` |
  | AI Services → AI Search (grounding) | Search Index Data Reader       | `1407120a-92aa-4202-b7e9-c0e197c71c8f` |

  Plus a reusable Bicep `roleAssignment` pattern using `guid()` for deterministic names.

- **Private Endpoint DNS Zone Names** table:

  | Service         | Private DNS Zone                          |
  | --------------- | ----------------------------------------- |
  | AI Services     | `privatelink.cognitiveservices.azure.com` |
  | AI Search       | `privatelink.search.windows.net`          |
  | Cosmos DB (SQL) | `privatelink.documents.azure.com`         |

- **Learn More** links to AVM registry GitHub entries for all five modules

### Modified file: `.github/skills/azure-bicep-patterns/SKILL.md`

Three additions:

1. **Quick Reference table** (line ~26): added row:

   ```
   | Azure AI Services Patterns | AI workloads: AI Services, AI Search, Cosmos DB, Container Apps |
     [ai-services-patterns](references/ai-services-patterns.md) |
   ```

2. **`## Azure AI Services Patterns` section** (line ~77): new summary section listing the
   four key rules agents must follow:
   - Use `kind: 'AIServices'` — never `kind: 'Hub'` (deprecated 2025)
   - Private endpoints are mandatory for production AI services
   - Use RBAC role assignments over keys — never use connection strings
   - `replicaCount ≥ 2` for AI Search to qualify for the 99.9% SLA

3. **Reference Index** (line ~98): added entry:

   ```
   | [ai-services-patterns.md](references/ai-services-patterns.md) |
     AVM modules, RBAC, and private DNS for AI Services, AI Search, Cosmos DB, Container Apps |
   ```

---

## Backlog file updated

**Modified file:** `agent-output/helpdeskAI/apex-improvement-backlog.md`

P2 and P3 rows in the summary table changed from `☐` to `✅`.

---

## What Was NOT Changed

| Item                                  | Reason                                                                                     |
| ------------------------------------- | ------------------------------------------------------------------------------------------ |
| `.vscode/mcp.json`                    | P1 out of scope — requires verifying `@azure/ai-foundry-mcp` package name against upstream |
| `.github/skills/azure-reliability/`   | P4 out of scope                                                                            |
| `.github/skills/entra-agent-id/`      | P4 out of scope                                                                            |
| `tools/registry/count-manifest.json`  | P4 prerequisite — not needed until P4 is executed                                          |
| All `.github/agents/*.agent.md` files | CT out of scope                                                                            |
| All existing `infra/bicep/` templates | CT out of scope                                                                            |

---

## Validation Steps (Recommended)

```bash
# Markdown lint — catches line-length and heading violations
npm run lint:md

# Skills format — validates SKILL.md frontmatter
npm run lint:skills-format

# Full suite
npm run validate:all
```

---

## CareFlow AI — EU Data Residency Fix (GlobalStandard → DataZoneStandard)

**Date:** May 20, 2026
**Triggered by:** Governance review of `04-implementation-plan.md` — `GlobalStandard` Azure OpenAI SKU routes inference globally and violates GDPR Art.44 + NEN 7510 §13 for Dutch hospital PHI.
**Scope:** `agent-output/careflow-ai/` + `azure-ai-architect` and `azure-bicep-patterns` skills.

### What Changed (4 files)

| File                                                                      | Change                                                                                                                                                                                                                           |
| ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agent-output/careflow-ai/04-implementation-plan.md`                      | 8 occurrences of `GlobalStandard` → `DataZoneStandard`; governance constraint reference updated to `#1 + #3`                                                                                                                     |
| `agent-output/careflow-ai/04-governance-constraints.md`                   | Added Regulatory Constraint #3 (EU data residency); fixed stale `Standard` references in compliance table and deployment blockers; added GDPR/NEN 7510 rows to Security Policies table; updated Healthcare Regulatory Note       |
| `.github/skills/azure-ai-architect/references/ai-deployment-decisions.md` | SKU table expanded to 6 rows with `DataZoneStandard`, `DataZoneProvisioned`, `GlobalProvisionedManaged`; added data residency guarantee column; added decision guide defaulting to `DataZoneStandard` for EU-regulated workloads |
| `.github/skills/azure-bicep-patterns/references/ai-services-patterns.md`  | Bicep example SKU changed from `GlobalStandard` → `DataZoneStandard`; inline comment and key-parameters note updated to prohibit `GlobalStandard` for EU workloads                                                               |

### Key SKU Distinction

| SKU                | Routing                       | GDPR/NEN 7510 | Use for CareFlow AI                    |
| ------------------ | ----------------------------- | ------------- | -------------------------------------- |
| `GlobalStandard`   | Global — may leave EU/EEA     | ❌ Prohibited | Never                                  |
| `DataZoneStandard` | EU geographic zone only       | ✅ Compliant  | Default (PAYG)                         |
| `Standard`         | Region-pinned (swedencentral) | ✅ Compliant  | Fallback if DataZone quota unavailable |

### Governance Constraint #3 Summary

- **Type**: Regulatory (not Azure Policy-detected)
- **Frameworks**: GDPR Article 44, NEN 7510:2017 §13
- **Rule**: All `Microsoft.CognitiveServices/accounts/deployments` must set `sku.name = 'DataZoneStandard'`
- **Enforcement point**: Step 5 Bicep CodeGen — verified by `adversarial-checklist-ai-architecture.md` item 9

---

## Conditional AI-Architecture Challenger Lens

**Date:** June 2025
**Triggered by:** Gap analysis of `04-implementation-plan.md` for CareFlow AI against the
`azure-ai-architect` skill — 9 gaps found that the existing challenger lenses would not catch.
**Scope:** New conditional `ai-architecture` challenger lens wired across Steps 4, 5b, and 5t.

### Why

The CareFlow AI implementation plan passed through standard challenger review (security-governance,
architecture-reliability, cost-feasibility) but missed AI-specific concerns:

1. AI resource naming (`oai-` used instead of CAF `aisa-` prefix)
2. No content safety filters specified for Azure OpenAI deployments
3. Missing Microsoft Defender for AI enrollment
4. No APIM AI gateway policies (token limits, semantic caching, jailbreak detection)
5. Missing Azure Firewall rules for AI service egress
6. No DDoS protection for AI endpoints
7. Missing AI-specific diagnostics (token metrics, model latency, RAG accuracy)
8. Generic RBAC — no specific Cognitive Services role IDs
9. No token cost breakdown (PTU vs PAYG analysis absent)

**Root cause**: The challenger subagent had no mechanism to load domain-specific AI knowledge.
Generic security/reliability/cost lenses lack the specificity to catch AI workload gaps.

### What Changed (7 files)

| File                                                                                | Change                                                                                               |
| ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `.github/skills/azure-defaults/references/adversarial-checklist-ai-architecture.md` | **New** — 24-item machine-actionable checklist (6 sections, must_fix/should_fix/suggestion severity) |
| `.github/agents/_subagents/challenger-review-subagent.agent.md`                     | Added `ai-architecture` lens definition, conditional skill loading section, reference index entries  |
| `.github/skills/workflow-engine/templates/workflow-graph.json`                      | Added `conditional_lenses` array to step-4, step-5b, step-5t challenger configs                      |
| `.github/agents/05-iac-planner.agent.md`                                            | Updated Phase 4.3–4.4 heading to "2–3 lenses", added conditional AI pass paragraph                   |
| `.github/agents/06b-bicep-codegen.agent.md`                                         | Updated Phase 4.5 heading to "1–4 passes", added conditional AI pass paragraph                       |
| `.github/agents/06t-terraform-codegen.agent.md`                                     | Updated Phase 4.5 heading to "1–4 passes", added conditional AI pass paragraph                       |
| `.github/skills/azure-defaults/references/adversarial-review-protocol.md`           | Added Pass 4 row (conditional) to Multi-Pass Rotating Lenses table with activation rules             |

### How It Works

1. **Keyword detection**: When `01-requirements.md` contains any of:
   `Azure OpenAI`, `AI Search`, `AI Services`, `Foundry`, `RAG`, `embedding`,
   `LLM`, `AI agent`, `Copilot`, `Document Intelligence`
2. **Additional pass triggered**: The challenger subagent is invoked with
   `review_focus = "ai-architecture"` after all standard passes complete
3. **Skill + checklist loaded**: The subagent loads `adversarial-checklist-ai-architecture.md`
   (24 items) and the `azure-ai-architect` SKILL.md for domain knowledge
4. **Standard early-exit unaffected**: The conditional pass runs independently of
   pass 2/3 early-exit decisions — if AI keywords exist, it always runs

### Design Decisions

- **Conditional, not always-on**: Avoids wasting a review pass on non-AI projects
- **Keywords from requirements (not plan)**: Requirements are available earliest;
  keyword list matches the `azure-ai-architect` skill trigger keywords
- **`adds_pass: true`**: Increases max pass count rather than replacing an existing lens
- **Checklist + skill dual-source**: Checklist provides structured items with severity;
  skill provides deeper domain reasoning for nuanced judgments
