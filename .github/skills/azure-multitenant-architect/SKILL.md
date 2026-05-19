---
name: azure-multitenant-architect
description: "Azure multitenancy architecture guidance: tenant isolation models, SaaS deployment patterns, noisy neighbor mitigation, per-tenant cost attribution, data residency per tenant. USE FOR: designing multi-tenant SaaS applications on Azure; evaluating tenant isolation strategies (shared vs dedicated resources); WAF assessment of multi-tenant workloads; architecture reviews mentioning tenants, SaaS, or customer isolation. DO NOT USE FOR: general Azure infrastructure (use azure-defaults), single-tenant workloads, Bicep/Terraform code generation (use azure-bicep-patterns or terraform-patterns), diagram creation."
compatibility: Works with Claude Code, GitHub Copilot, VS Code, and any Agent Skills compatible tool.
license: MIT
metadata:
  author: rodanthi-alexiou
  version: "1.0"
  category: azure-architecture
---

# Azure Multitenant Architect Skill

WAF-aligned architecture guidance for multi-tenant SaaS workloads on Azure.
Auto-activates when requirements contain: `multitenant`, `multi-tenant`, `SaaS`,
`tenant isolation`, `per-tenant`, `customer isolation`, `noisy neighbor`,
`shared infrastructure`, `tenant onboarding`, or `B2B platform`.

Deep-dive content lives in `references/` — load on demand.

---

## Quick Reference

| Decision Area | Reference | WAF Pillar |
|---|---|---|
| Tenancy model selection (shared vs dedicated vs hybrid) | [multitenant-decision-tree](references/multitenant-decision-tree.md) | All pillars |
| Noisy neighbor prevention and performance isolation | [multitenant-waf-checklist](references/multitenant-waf-checklist.md) | Performance, Reliability |
| Tenant data isolation and compliance | [multitenant-waf-checklist](references/multitenant-waf-checklist.md) | Security |
| Per-tenant cost attribution | [multitenant-waf-checklist](references/multitenant-waf-checklist.md) | Cost Optimization |
| Multi-tenant AI/RAG patterns (Foundry, AI Search) | [multitenant-ai-patterns](references/multitenant-ai-patterns.md) | Security, Cost Optimization |
| Multi-tenant search index strategies | [multitenant-search-patterns](references/multitenant-search-patterns.md) | Performance, Cost Optimization |

---

## When to Use This Skill

| Trigger | Use Case |
|---|---|
| Requirements mention `SaaS`, `multi-tenant`, or `B2B platform` | Tenancy model WAF assessment |
| Requirements describe serving multiple customers from shared infra | Isolation model decision |
| Architecture includes per-tenant data stores or indexes | Data isolation pattern selection |
| Requirements mention customer onboarding automation | Tenant lifecycle workflow |
| AI workload serves multiple tenants (RAG, agents, Foundry) | Multi-tenant AI pattern selection |
| Requirements include per-tenant billing or cost attribution | Cost isolation model |
| Requirements mention regulatory compliance per tenant (GDPR, HIPAA) | Data residency and compliance isolation |
| Architect step (Step 2) of APEX workflow | Supplement general WAF with tenancy gates |

---

## Step-by-Step Workflows

### 1. Tenancy Model Selection (MANDATORY for multi-tenant workloads)

Before proceeding with WAF assessment, the tenancy model must be validated with the user.
This is a blocking architectural decision.

**Step 1 — Detect multi-tenant signals in `01-requirements.md`**

Scan for: `multitenant`, `multi-tenant`, `SaaS`, `tenant`, `customer isolation`,
`B2B`, `platform`, `per-customer`, `noisy neighbor`, `shared infrastructure`.
If found, this workflow is mandatory.

**Step 2 — Present tenancy model options to user via `askQuestions`**

Load [multitenant-decision-tree](references/multitenant-decision-tree.md) §Models.
Present the following options with context:

| Model | Description | Best For |
|---|---|---|
| **Fully shared** | Single deployment, logical isolation via tenant ID | Cost-optimized, low-scale tenants |
| **Shared with dedicated data** | Shared compute, per-tenant databases/indexes | Data compliance, moderate isolation |
| **Dedicated per tenant** | Separate resource groups per tenant | Maximum isolation, enterprise SLA |
| **Hybrid (tiered)** | Free/basic tenants share; premium tenants get dedicated | SaaS with multiple pricing tiers |

Include links to Microsoft Learn guidance:
- [SaaS multitenant solution architecture](https://learn.microsoft.com/azure/architecture/guide/saas-multitenant-solution-architecture/)
- [Tenancy models for SaaS](https://learn.microsoft.com/azure/architecture/isv/application-tenancy)

**Step 3 — Record decision**

```
apex-recall decide <project> --decision "Tenancy model: <selected>" --rationale "<why>" --step 2 --json
```

**Step 4 — Apply tenancy-specific WAF gates**

Load [multitenant-waf-checklist](references/multitenant-waf-checklist.md) and apply
all gates relevant to the selected model.

### 2. Multi-Tenant WAF Assessment Supplement

Run this alongside the standard WAF assessment when tenancy model is confirmed.

**Step 1 — Security pillar additions**

Apply tenant isolation gates from [multitenant-waf-checklist](references/multitenant-waf-checklist.md) §Security:
- Data isolation enforcement (row-level, schema-level, or database-level)
- Cross-tenant access prevention
- Tenant-scoped authentication (Entra ID tenant restrictions)
- Encryption key isolation (per-tenant CMK vs shared)

**Step 2 — Reliability pillar additions**

Apply from [multitenant-waf-checklist](references/multitenant-waf-checklist.md) §Reliability:
- Noisy neighbor mitigation (resource limits per tenant)
- Blast radius containment (failure in one tenant must not cascade)
- Per-tenant SLA differentiation (if tiered pricing)

**Step 3 — Cost pillar additions**

Apply from [multitenant-waf-checklist](references/multitenant-waf-checklist.md) §Cost:
- Per-tenant cost attribution model (tags, meters, resource groups)
- Shared cost allocation strategy
- Scaling economics (cost per tenant at 10, 100, 1000 tenants)

**Step 4 — Performance pillar additions**

Apply from [multitenant-waf-checklist](references/multitenant-waf-checklist.md) §Performance:
- Resource quota per tenant (throttling, rate limiting)
- Connection pooling strategy for shared resources
- Cache isolation (per-tenant cache keys vs shared)

### 3. Multi-Tenant AI Workload Assessment

Run when the multi-tenant workload includes AI services (RAG, Foundry agents, AI Search).

**Step 1 — Identify AI tenancy pattern**

Load [multitenant-ai-patterns](references/multitenant-ai-patterns.md).
Present options to user:

| Pattern | Description | Trade-off |
|---|---|---|
| Shared model, tenant-filtered context | Single AI deployment, tenant ID in metadata filter | Cost-efficient but shared quota |
| Per-tenant indexes with shared model | Shared inference, separate search indexes per tenant | Good isolation/cost balance |
| Per-tenant AI deployments | Dedicated OpenAI/Foundry per tenant | Maximum isolation, highest cost |
| AI Gateway with tenant routing | APIM routes to tenant-specific backends | Governance + flexibility |

Reference: [Secure multitenant RAG](https://learn.microsoft.com/azure/architecture/ai-ml/guide/secure-multitenant-rag)

**Step 2 — Search index tenancy model**

Load [multitenant-search-patterns](references/multitenant-search-patterns.md).
Select based on tenant count, data volume, and compliance requirements.

Reference: [Search modeling for multitenant SaaS](https://learn.microsoft.com/azure/search/search-modeling-multitenant-saas-applications)

**Step 3 — Record AI tenancy decision**

```
apex-recall decide <project> --decision "AI tenancy: <pattern>" --rationale "<why>" --step 2 --json
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Cross-tenant data leakage in search results | Missing tenant filter in query pipeline | Add mandatory `security_filter` on tenant_id — see [multitenant-search-patterns](references/multitenant-search-patterns.md) |
| Noisy neighbor performance degradation | No per-tenant throttling | Add rate limiting per tenant via APIM or app-level — see [multitenant-waf-checklist](references/multitenant-waf-checklist.md) §Performance |
| Cost attribution impossible | All resources in single resource group without tags | Use tenant-scoped tags or separate RGs per tenant — see [multitenant-waf-checklist](references/multitenant-waf-checklist.md) §Cost |
| Tenant onboarding takes hours | Manual resource provisioning per tenant | Automate via deployment pipelines — see [multitenant-decision-tree](references/multitenant-decision-tree.md) §Automation |
| AI model quota exhausted by one tenant | Shared PTU without per-tenant limits | Add APIM token rate limiting per tenant — see [multitenant-ai-patterns](references/multitenant-ai-patterns.md) §Quota |
| GDPR violation — tenant data in wrong region | Shared database without data residency controls | Use geo-partitioning or per-tenant databases in compliant regions — see [multitenant-waf-checklist](references/multitenant-waf-checklist.md) §Security |

---

## References

- [multitenant-decision-tree.md](references/multitenant-decision-tree.md) — Tenancy model selection, decision criteria, automation patterns
- [multitenant-waf-checklist.md](references/multitenant-waf-checklist.md) — Multi-tenant WAF gates per pillar, noisy neighbor, data isolation
- [multitenant-ai-patterns.md](references/multitenant-ai-patterns.md) — Multi-tenant RAG, Foundry agents, AI gateway, per-tenant model deployments
- [multitenant-search-patterns.md](references/multitenant-search-patterns.md) — AI Search tenant isolation strategies (index-per-tenant, filters, service-per-tenant)

---

## Microsoft Learn Sources

- [Architect multitenant solutions on Azure](https://learn.microsoft.com/azure/architecture/guide/saas-multitenant-solution-architecture/)
- [Tenancy models for SaaS applications](https://learn.microsoft.com/azure/architecture/isv/application-tenancy)
- [Secure multitenant RAG on Azure](https://learn.microsoft.com/azure/architecture/ai-ml/guide/secure-multitenant-rag)
- [Search modeling for multitenant SaaS](https://learn.microsoft.com/azure/search/search-modeling-multitenant-saas-applications)
- [Multi-tenant apps in Microsoft Entra ID](https://learn.microsoft.com/entra/identity-platform/howto-convert-app-to-be-multi-tenant)
- [Noisy neighbor antipattern](https://learn.microsoft.com/azure/architecture/antipatterns/noisy-neighbor/)
- [Azure Well-Architected Framework for SaaS](https://learn.microsoft.com/azure/well-architected/service-guides/saas-overview)
