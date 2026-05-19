# AI Gateway Patterns

Architecture-level guidance for deploying and configuring an AI gateway layer.
For APIM Bicep configuration and policy YAML snippets, see the `azure-aigateway` skill.

---

## When You Need an AI Gateway

| Scenario                                    | Gateway needed? |
| ------------------------------------------- | --------------- |
| Single team, single AI application          | Optional        |
| Multiple teams sharing AI services          | **Required**    |
| Cost attribution per team or use case       | **Required**    |
| Token rate limiting per client/subscription | **Required**    |
| Multi-model routing (OpenAI + others)       | **Required**    |
| Enterprise or regulated environment         | **Required**    |
| PTU + PAYG spillover routing                | Recommended     |

> Default to **Required** when any of the above applies.
> If gateway is waived for a single-team scenario, document the rationale in the architecture assessment.

---

## Citadel 4-Layer Governance Model

Source: [AI Hub Gateway Solution Accelerator (citadel-v1)](https://github.com/azure-samples/ai-hub-gateway-solution-accelerator/tree/citadel-v1)

| Layer                | Component                         | Responsibilities                                                                                                |
| -------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| L1 — Runtime         | Azure API Management (APIM)       | Token rate limiting, circuit breaker, LLM routing + failover, cost attribution, semantic caching, PII detection |
| L2 — Control Plane   | Microsoft Foundry                 | Agent traces, AI evaluations, automated compliance checks, content safety                                       |
| L3 — Agent Identity  | Entra ID (Agent 365)              | Unique identity per agent, Access Contract enforcement, usage governance                                        |
| L4 — Security Fabric | Defender for AI + Purview + Entra | Threat protection, data governance, unified access control                                                      |

All four layers must be present in enterprise AI deployments. Skipping L3 (agent identity)
is the most common gap — each agent must have its own managed identity and Access Contract.

---

## APIM as AI Gateway — Key Capabilities

| Capability             | How it works                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| Token rate limiting    | APIM policy: `azure-openai-token-limit` — sets TPM quota per API subscription                   |
| Circuit breaker        | APIM backend circuit breaker: fail-fast on 429/503; expose PTU spillover backend automatically  |
| LLM routing + failover | Priority-based backend pool: PTU primary → PAYG spillover → secondary region                    |
| Semantic caching       | Azure Managed Redis + APIM policy: skip inference if semantically similar request seen recently |
| Cost attribution       | Custom dimension in APIM telemetry: tag requests by team, use case, or agent identity           |
| PII detection          | Call Azure Language Service PII detection before forwarding to AI model; strip or mask results  |

For Bicep and policy YAML snippets implementing these capabilities, see the
[azure-aigateway skill](.github/skills/azure-aigateway/SKILL.md).

---

## AI Citadel Access Contract

The Access Contract declares governed dependencies in IaC, replacing ad-hoc credential sharing.
Each agent declares its requirements at provisioning time:

```bicep
// AI Citadel Access Contract — declare model, capacity, safety, quotas
var accessContract = {
  modelSelection: 'gpt-4o'                  // which model the agent is allowed to call
  capacityAllocation: 10                     // TPM quota (thousands) allocated to this agent
  regionalPreferences: ['swedencentral']     // required or preferred regions
  safetyGuardrails: {
    contentSafetyEnabled: true
    piiDetectionEnabled: true
    outputMonitoringEnabled: true
  }
  quotaLimits: {
    dailyTokenBudget: 1000000                // hard cap; exceeded → HTTP 429 from gateway
    monthlyBudgetEUR: 500                    // cost ceiling before alerting
  }
}
```

The Access Contract is stored in `bicep/infra/citadel-access-contracts/` (one file per agent/use case).

Benefits:

- All governance parameters defined declaratively in IaC — no runtime configuration drift
- APIM enforces at gateway; Foundry traces against contract at control plane

Reference: `https://aka.ms/foundry-citadel`

---

## Hub-Spoke Topology for AI

| Topology option                       | Description                                                                     | When to use                                       |
| ------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------- |
| AI gateway in hub VNet                | APIM deployed in existing enterprise hub; all spokes route through hub firewall | Existing CAF enterprise LZ with hub VNet          |
| AI gateway in dedicated AI spoke VNet | Separate spoke VNet peered to hub; additional isolation layer                   | New AI LZ greenfield; stricter isolation required |

Networking requirements apply regardless of topology choice:

- Private endpoints for all AI PaaS services (AI Services, AI Search, Cosmos DB)
- NSG on AI spoke VNet subnets; deny-all inbound default
- Private DNS zones (central preferred; in AI LZ if standalone deployment)

---

## Agent Onboarding Patterns

### Greenfield (New Spoke — New AI Workload)

1. Create dedicated spoke VNet for the business unit or use case
2. Choose agent runtime:
   - **Foundry Agents (managed)** — no infra, tied to Foundry platform lifecycle
   - **Container Apps** — bring-your-own-agent (BYOA); custom code; sidecar pattern
3. Deploy AI Services + Foundry Project in spoke
4. Declare AI Citadel Access Contract for governed model access
5. Connect to hub AI gateway via APIM subscription key (or managed identity + Entra token)

### Brownfield (Existing Agent — Migrate to Gateway)

1. Identify current inference endpoint (direct AI Services URL)
2. Replace endpoint URL with APIM gateway URL in Key Vault secret
3. Update authentication: switch from API key to APIM subscription key (or Entra bearer token)
4. Create Access Contract for the existing agent (capacity + safety + quotas)
5. Validate: confirm telemetry appears in APIM analytics + Foundry traces

Reference: https://aka.ms/ai-hub-gateway
