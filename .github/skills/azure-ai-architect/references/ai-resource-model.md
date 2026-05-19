# AI Resource Model

Current (2026) Azure AI resource model for Foundry-based workloads.
The Azure AI Foundry Hub (`kind: Hub`) was deprecated in 2025 — do not generate it.

---

## Resource Model

```
Azure AI Services account (kind: AIServices)       ← "Foundry resource"
  ├─ Microsoft.CognitiveServices/accounts
  ├─ kind: AIServices
  ├─ Hosts: OpenAI model deployments, Document Intelligence, Vision, Speech
  └─ Managed Identity (system-assigned) → RBAC → AI Search

Microsoft Foundry Project
  ├─ Microsoft.MachineLearningServices/workspaces
  ├─ kind: Project
  ├─ Linked to: the AI Services account above
  └─ Used for: agent orchestration, eval runs, prompt flow

Azure AI Search
  ├─ Microsoft.Search/searchServices
  └─ Vector store + hybrid search for RAG
```

### What Changed (Hub deprecation)

| Old (deprecated, pre-2025)                                                   | Current (2026)                                                                               |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `Microsoft.MachineLearningServices/workspaces` (kind: Hub)                   | Removed — do not generate                                                                    |
| `Microsoft.MachineLearningServices/workspaces` (kind: Project) linked to Hub | `Microsoft.MachineLearningServices/workspaces` (kind: Project) linked to AI Services account |
| Separate `Microsoft.CognitiveServices/accounts` (kind: OpenAI)               | Folded into `kind: AIServices` multi-service resource                                        |
| Separate `Microsoft.CognitiveServices/accounts` (kind: FormRecognizer)       | Folded into `kind: AIServices` multi-service resource                                        |

---

## AVM Module Paths

> Verify version pins against the AVM registry before use:
> `https://mcr.microsoft.com/v2/bicep/public/avm/res/`

| Resource                       | AVM module path                                  | Min version |
| ------------------------------ | ------------------------------------------------ | ----------- |
| AI Services (Foundry resource) | `br/public:avm/res/cognitive-services/account`   | `0.9.x`     |
| AI Search                      | `br/public:avm/res/search/search-service`        | `0.9.x`     |
| Cosmos DB (NoSQL)              | `br/public:avm/res/document-db/database-account` | `0.10.x`    |
| Container Apps Environment     | `br/public:avm/res/app/managed-environment`      | `0.8.x`     |
| Container Apps                 | `br/public:avm/res/app/container-app`            | `0.11.x`    |
| Key Vault                      | `br/public:avm/res/key-vault/vault`              | `0.11.x`    |

---

## Required Parameters — AI Services Account

```bicep
module aiServices 'br/public:avm/res/cognitive-services/account:<version>' = {
  name: 'aiServices'
  params: {
    name: 'aisa-${project}-${env}-${suffix}'    // CAF: aisa- prefix
    location: location
    tags: tags
    kind: 'AIServices'                           // NOT 'OpenAI', NOT 'Hub'
    sku: 'S0'
    publicNetworkAccess: 'Disabled'              // Security gate (production)
    managedIdentities: {
      systemAssigned: true
    }
    deployments: [
      {
        name: 'gpt-4o'
        model: {
          format: 'OpenAI'
          name: 'gpt-4o'
          version: '2024-11-20'                 // pin — never use 'latest'
        }
        sku: {
          name: 'GlobalStandard'               // PAYG; use 'ProvisionedManaged' for PTU
          capacity: 10                          // TPM units (10 = 10K TPM for PAYG)
        }
      }
    ]
    diagnosticSettings: [
      {
        workspaceResourceId: logAnalyticsWorkspaceId
      }
    ]
  }
}
```

---

## RBAC Role Assignments

Use Managed Identity for all service-to-service authentication. Never use keys.

| Principal                       | Role                                    | Target resource     | Purpose                                |
| ------------------------------- | --------------------------------------- | ------------------- | -------------------------------------- |
| Container App (system MI)       | `Cognitive Services OpenAI User`        | AI Services account | Inference calls                        |
| Container App (system MI)       | `Search Index Data Contributor`         | AI Search           | Index writes (ingestion pipeline)      |
| Container App (system MI)       | `Search Index Data Reader`              | AI Search           | Query at runtime                       |
| AI Services account (system MI) | `Search Index Data Reader`              | AI Search           | Grounding / retrieval during inference |
| Foundry Project (system MI)     | `Cognitive Services OpenAI Contributor` | AI Services account | Agent orchestration                    |

### Bicep Role Assignment Pattern

```bicep
// Cognitive Services OpenAI User role — built-in ID
var cognitiveServicesOpenAIUserRoleId = '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'

resource roleAssignment 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(aiServices.outputs.resourceId, containerApp.outputs.systemAssignedMIPrincipalId, cognitiveServicesOpenAIUserRoleId)
  scope: resourceGroup()
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', cognitiveServicesOpenAIUserRoleId)
    principalId: containerApp.outputs.systemAssignedMIPrincipalId
    principalType: 'ServicePrincipal'
  }
}
```

---

## CAF Naming for AI Resources

| Resource                   | Abbreviation | Example                     |
| -------------------------- | ------------ | --------------------------- |
| AI Services account        | `aisa-`      | `aisa-helpdeskAI-prod-a3b9` |
| AI Search service          | `srch-`      | `srch-helpdeskAI-prod-a3b9` |
| Foundry Project            | `fdry-`      | `fdry-helpdeskAI-prod`      |
| Container Apps Environment | `cae-`       | `cae-helpdeskAI-prod`       |

---

## Identity

### Access Control for AI Resources

| Control                                            | Implementation                                                | Source |
| -------------------------------------------------- | ------------------------------------------------------------- | ------ |
| Disable key-based access on all AI Services        | `disableLocalAuth: true` on AI Services account               | I-R6   |
| Disable local auth on AI Search                    | `disableLocalAuth: true`; `authOptions: null`                 | I-R6   |
| Use Managed Identity for all service-to-service    | System-assigned MI; no client secrets or connection strings   | I-R1   |
| Conditional Access policies for AI control plane   | Require MFA + compliant device for AI Services portal access  | I-R4   |
| PIM for accounts with AI Services Contributor role | Just-in-time elevation; no standing admin access              | I-R2   |
| Entra ID-only authentication                       | No local users; integrate AI Search and Foundry with Entra ID | I-R3   |

```bicep
// Disable local auth on AI Services — Security gate (I-R6)
// Add to AI Services module params:
disableLocalAuth: true
```

```bicep
// Disable local auth on AI Search — Security gate (I-R6)
// Add to AI Search module params:
disableLocalAuth: true
authOptions: null   // forces Entra ID-only; removes shared key
```

---

## Data

### Storage Isolation and Thread/Run State

| Decision                      | Options                                                                              | Source |
| ----------------------------- | ------------------------------------------------------------------------------------ | ------ |
| Thread/run state storage      | **Standard**: Microsoft-managed storage in AI Services (default, no setup required)  | D-R1   |
|                               | **Custom**: Customer-owned Cosmos DB (required for data sovereignty or audit trails) | D-R1   |
| Per-project storage isolation | Separate Cosmos DB account, blob container, and AI Search index per Foundry Project  | D-R2   |

**When to use custom storage (D-R1):**

- Data sovereignty requirements (regulatory mandate that conversation history stays in customer tenant)
- Audit trail requirements for agent thread data
- Need to query or retain thread data beyond Foundry's default retention period

**Storage isolation pattern (D-R2):**

- One AI Services account per billing boundary (team / BU / environment)
- One Foundry Project per application or use case
- Each Project gets its own blob container + AI Search index — never share indexes across Projects

---

## Multi-Region Disaster Recovery

### AI Resource Failover Strategy

| Resource            | DR approach                                                                 | Notes                                             |
| ------------------- | --------------------------------------------------------------------------- | ------------------------------------------------- |
| AI Services (PAYG)  | Deploy in primary + secondary region; no state to replicate                 | APIM or Front Door routes to failover on 429/503  |
| AI Services (PTU)   | PTU reservation required in **both** regions                                | Reserve capacity before deployment; adds cost     |
| AI Search           | Geo-redundancy (replicas in multiple availability zones) OR second instance | Push indexer from primary keeps secondary in sync |
| Cosmos DB (threads) | Multi-region write or read replica via geo-redundancy setting               | Enable if custom thread storage selected (D-R1)   |

### Failover Routing Pattern

```
APIM / Azure Front Door
  ├─ Primary AI Services (ProvisionedManaged PTU)  — region: swedencentral
  │    └─ on HTTP 429 or 503 → route to →
  └─ Secondary AI Services (GlobalStandard PAYG)  — region: germanywestcentral
```

- APIM retry policy: retry on 429/503 with 1 s delay, max 3 attempts before spillover
- Front Door: health probe on `/status-0123456789abcdef` (built-in endpoint for AI Services)
- AI Search: health probe on `/` with `api-version=2024-07-01` (returns 200 when healthy)
