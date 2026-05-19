<!-- ref:ai-services-patterns-v1 -->

# Azure AI Services Bicep Patterns

AVM module paths, required parameters, and Managed Identity RBAC wiring for Azure AI workloads.

---

## AVM Module Paths

| Resource                       | AVM Module                                       | Min Version |
| ------------------------------ | ------------------------------------------------ | ----------- |
| AI Services (Foundry resource) | `br/public:avm/res/cognitive-services/account`   | `0.9.x`     |
| AI Search                      | `br/public:avm/res/search/search-service`        | `0.9.x`     |
| Cosmos DB (NoSQL)              | `br/public:avm/res/document-db/database-account` | `0.10.x`    |
| Container Apps Environment     | `br/public:avm/res/app/managed-environment`      | `0.8.x`     |
| Container Apps                 | `br/public:avm/res/app/container-app`            | `0.11.x`    |

> **Version pin:** Always pin to a specific patch version. Discover current tags via:
> `mcr.microsoft.com/v2/bicep/public/avm/res/{provider}/{resource}/tags/list`

---

## AI Services Resource (Foundry resource)

```bicep
module aiServices 'br/public:avm/res/cognitive-services/account:0.9.0' = {
  name: 'ai-services'
  params: {
    name: 'ais-${projectName}-${environment}-${uniqueSuffix}'
    location: location
    tags: tags
    kind: 'AIServices'          // Required — do NOT use 'Hub' (deprecated 2025)
    sku: { name: 'S0' }
    publicNetworkAccess: 'Disabled'  // Production: private endpoints only
    managedIdentities: { systemAssigned: true }
    deployments: [
      {
        name: 'gpt-4o'
        model: { format: 'OpenAI', name: 'gpt-4o', version: '2024-11-20' }
        sku: { name: 'GlobalStandard', capacity: 10 }
      }
    ]
    diagnosticSettings: [
      {
        workspaceResourceId: logAnalyticsWorkspace.id
        logCategoriesAndGroups: [{ categoryGroup: 'allLogs' }]
      }
    ]
  }
}
```

**Key parameters:**

- `kind: 'AIServices'` — bundles OpenAI, Document Intelligence, and agent orchestration in one resource
- `publicNetworkAccess: 'Disabled'` — mandatory for production; pair with a private endpoint
- `deployments` — declare model deployments inline; use `GlobalStandard` SKU first, fall back to `Standard`

---

## AI Search

```bicep
module aiSearch 'br/public:avm/res/search/search-service:0.9.0' = {
  name: 'ai-search'
  params: {
    name: 'srch-${projectName}-${environment}-${uniqueSuffix}'
    location: location
    tags: tags
    sku: 'standard'             // 'basic' for dev/test; 'standard' minimum for production vector search
    replicaCount: 2             // Minimum 2 for HA SLA (WAF Reliability)
    partitionCount: 1
    publicNetworkAccess: 'disabled'
    managedIdentities: { systemAssigned: true }
    authOptions: {
      aadOrApiKey: { aadAuthFailureMode: 'http403' }
    }
    diagnosticSettings: [
      {
        workspaceResourceId: logAnalyticsWorkspace.id
        logCategoriesAndGroups: [{ categoryGroup: 'allLogs' }]
      }
    ]
  }
}
```

**Key parameters:**

- `replicaCount: 2` — required for the 99.9% SLA; single replica has no SLA
- `authOptions` — prefer AAD auth; disable API key auth for production

---

## Cosmos DB (NoSQL — agent thread storage)

```bicep
module cosmosDb 'br/public:avm/res/document-db/database-account:0.10.0' = {
  name: 'cosmos-db'
  params: {
    name: 'cosmos-${projectName}-${environment}-${uniqueSuffix}'
    location: location
    tags: tags
    kind: 'GlobalDocumentDB'
    capabilityNoSQL: true
    defaultConsistencyLevel: 'Session'
    disableLocalAuth: true          // Entra ID-only auth — satisfies security baseline
    enableAutomaticFailover: true
    publicNetworkAccess: 'Disabled'
    managedIdentities: { systemAssigned: true }
  }
}
```

**Key parameters:**

- `disableLocalAuth: true` — equivalent to `allowSharedKeyAccess: false`; enforces Entra ID auth
- `publicNetworkAccess: 'Disabled'` — pair with private endpoint

---

## Managed Identity → RBAC Role Assignments

Wire Container Apps identity to AI services with least-privilege built-in roles:

| Assignment                            | Role Name                      | Role Definition ID                     |
| ------------------------------------- | ------------------------------ | -------------------------------------- |
| Container Apps → AI Services (OpenAI) | Cognitive Services OpenAI User | `5e0bd9bd-7b93-4f28-af87-19fc36ad61bd` |
| Container Apps → AI Search            | Search Index Data Contributor  | `8ebe5a00-799e-43f5-93ac-243d3dce84a7` |
| AI Services → AI Search (grounding)   | Search Index Data Reader       | `1407120a-92aa-4202-b7e9-c0e197c71c8f` |

```bicep
// Container Apps → AI Services (Cognitive Services OpenAI User)
resource openAiUserRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(
    aiServices.outputs.resourceId,
    containerApp.outputs.systemAssignedMIPrincipalId,
    '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
  )
  scope: resourceGroup()
  properties: {
    roleDefinitionId: subscriptionResourceId(
      'Microsoft.Authorization/roleDefinitions',
      '5e0bd9bd-7b93-4f28-af87-19fc36ad61bd'
    )
    principalId: containerApp.outputs.systemAssignedMIPrincipalId
    principalType: 'ServicePrincipal'
  }
}
```

Repeat the pattern for the other two assignments, substituting the correct `roleDefinitionId`
and `principalId` (`aiServices.outputs.systemAssignedMIPrincipalId` for the grounding assignment).

---

## Private Endpoint DNS Zone Names

Use the [private-endpoint-pattern](private-endpoint-pattern.md) for all three services.

| Service         | Private DNS Zone                          |
| --------------- | ----------------------------------------- |
| AI Services     | `privatelink.cognitiveservices.azure.com` |
| AI Search       | `privatelink.search.windows.net`          |
| Cosmos DB (SQL) | `privatelink.documents.azure.com`         |

---

## Learn More

| Topic                             | Link                                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------------------- |
| AVM: cognitive-services/account   | https://github.com/Azure/bicep-registry-modules/tree/main/avm/res/cognitive-services/account   |
| AVM: search/search-service        | https://github.com/Azure/bicep-registry-modules/tree/main/avm/res/search/search-service        |
| AVM: document-db/database-account | https://github.com/Azure/bicep-registry-modules/tree/main/avm/res/document-db/database-account |
| AVM: app/container-app            | https://github.com/Azure/bicep-registry-modules/tree/main/avm/res/app/container-app            |
