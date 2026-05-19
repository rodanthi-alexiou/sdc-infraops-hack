# Multitenant WAF Checklist

WAF-aligned gates and NFR mappings specific to multi-tenant Azure workloads.
Apply during the Architect step (Step 2) when requirements describe multi-tenant SaaS.

Source: [Azure Well-Architected Framework for SaaS](https://learn.microsoft.com/azure/well-architected/saas/)

---

## Security

### Gates (non-negotiable for production multi-tenant workloads)

| Gate                                           | Setting                                                                         | Resource                             |
| ---------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------ |
| Cross-tenant data isolation enforced           | Tenant discriminator in every data query                                        | All data stores                      |
| No tenant can access another tenant's data     | Security filter mandatory at API layer                                          | Orchestrator / data access layer     |
| Tenant-scoped authentication                   | Claims include `tenant_id`; validate on every request                           | Identity provider (Entra ID)         |
| Encryption key isolation for regulated tenants | Per-tenant CMK in Key Vault (dedicated model) or shared DEK with per-tenant KEK | Key Vault + data stores              |
| Tenant admin cannot escalate to platform admin | RBAC boundary between tenant scope and control plane                            | Entra ID + app roles                 |
| Audit log per tenant                           | Tenant ID in all log entries; tenant-scoped log export                          | Application Insights / Log Analytics |
| Data residency compliance                      | Tenant data stored in declared region only                                      | Storage, databases, AI services      |

> **Escalation:** If a single data store is shared across tenants (Model A/B), the
> application MUST enforce tenant filtering at the data access layer. Do NOT rely
> solely on database-level features (row-level security) without defense-in-depth
> at the API layer.

### Identity Patterns per Model

| Isolation Model    | Identity Pattern                                                    | Entra ID Configuration                                           |
| ------------------ | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Shared (A)         | Single multi-tenant app registration; tenant claim in token         | `signInAudience: AzureADMultipleOrgs` + custom `tenant_id` claim |
| Dedicated data (B) | Shared app reg; tenant resolved from token → catalog lookup         | Same as A; catalog maps user→tenant→data endpoint                |
| Dedicated (C)      | Per-tenant app registration OR shared with strict tenant validation | Separate app reg per tenant or `tenant_restrictions_v2`          |
| Hybrid (D)         | Shared for basic; per-tenant for premium                            | Tier-dependent configuration                                     |

---

## Reliability

### Noisy Neighbor Prevention (Gates)

| Gate                          | Mechanism                                                  | Resource                                      |
| ----------------------------- | ---------------------------------------------------------- | --------------------------------------------- |
| Per-tenant rate limiting      | Token bucket or sliding window per `tenant_id`             | APIM / app middleware                         |
| Per-tenant resource quotas    | Max RU/s, DTU, or compute units per tenant                 | Cosmos DB (partition-level), SQL elastic pool |
| Circuit breaker per tenant    | Isolate failures to single tenant                          | App code / Polly / Dapr resiliency            |
| Queue depth limits per tenant | Reject or backpressure when tenant queue exceeds threshold | Service Bus / Event Hubs                      |

### Blast Radius Containment

| Scenario                                          | Mitigation                                                                 |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| Runaway tenant query exhausts shared pool         | Per-tenant max RU/s + autoscale ceiling                                    |
| Tenant data corruption                            | Per-tenant backup with point-in-time restore capability                    |
| Compute crash from tenant workload                | Health check + pod/instance restart; dedicated compute for premium tenants |
| Dependency failure (one tenant's external system) | Timeout + circuit breaker scoped to tenant                                 |

### SLA Differentiation

| Tier                | Target SLA          | Mechanism                                                      |
| ------------------- | ------------------- | -------------------------------------------------------------- |
| Free/Basic (shared) | 99.9% (best effort) | Shared infrastructure; no dedicated resources                  |
| Standard            | 99.9% (guaranteed)  | Dedicated data tier; shared compute with guaranteed allocation |
| Premium/Enterprise  | 99.95%+             | Dedicated stamp (deployment stamp pattern); zone-redundant     |

---

## Cost Optimization

### Per-Tenant Cost Attribution

| Model                               | Attribution Method                                                                                                        |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| A (Shared)                          | Application-level metering: track API calls, storage, compute per tenant_id; tag shared resources with allocation formula |
| B (Shared compute + dedicated data) | Data resources tagged per tenant (direct attribution); compute costs split by usage metrics                               |
| C (Dedicated)                       | Resource group per tenant → direct Azure Cost Management attribution via RG scope                                         |
| D (Hybrid)                          | Combine: shared tier uses metering; dedicated tier uses RG-based attribution                                              |

### Required Tags for Multi-Tenant Resources

| Tag              | Value                                  | Purpose                         |
| ---------------- | -------------------------------------- | ------------------------------- |
| `TenantId`       | `{tenant_guid}` or `shared`            | Cost attribution                |
| `IsolationModel` | `A`, `B`, `C`, `D`                     | Operational routing             |
| `Tier`           | `free`, `basic`, `standard`, `premium` | SLA and billing differentiation |
| `DataResidency`  | `swedencentral`, `westeurope`, etc.    | Compliance verification         |

### Cost Scaling Analysis (required in architecture assessment)

Document projected cost at these breakpoints:

| Tenant Count | Expected Monthly Cost | Cost per Tenant | Notes                               |
| ------------ | --------------------- | --------------- | ----------------------------------- |
| 10 tenants   | $X                    | $X/10           | Early stage                         |
| 100 tenants  | $Y                    | $Y/100          | Growth stage — economies of scale   |
| 1000 tenants | $Z                    | $Z/1000         | Scale stage — verify limits not hit |

---

## Performance Efficiency

### Resource Quota Management

| Concern                     | Gate                               | Mechanism                                                                            |
| --------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| Per-tenant throughput limit | Required for shared resources      | APIM rate-limit-by-key (tenant_id) or app middleware                                 |
| Connection pool isolation   | Required for shared databases      | Per-tenant connection string with max pool size OR shared pool with semaphore        |
| Cache isolation             | Required if caching sensitive data | Per-tenant cache prefix (e.g., `{tenant_id}:key`) or dedicated Redis database number |
| Search query isolation      | Required for shared AI Search      | Mandatory filter on `tenant_id` field in every query                                 |
| Storage IOPS limits         | Monitor per tenant                 | Per-tenant storage account (Model B/C) or quota monitoring                           |

### Scaling Triggers

| Metric                 | Threshold                   | Action                                        |
| ---------------------- | --------------------------- | --------------------------------------------- |
| Shared compute CPU     | > 80% sustained             | Scale out + evaluate noisy neighbor           |
| Shared database DTU/RU | > 70% per tenant allocation | Throttle tenant or upgrade tier               |
| Queue depth per tenant | > 1000 messages             | Alert + investigate; consider dedicated queue |
| API latency P99        | > 2s for any tenant         | Identify tenant causing degradation           |

---

## Operational Excellence

### Tenant Lifecycle Gates

| Phase       | Requirement                                                                         |
| ----------- | ----------------------------------------------------------------------------------- |
| Onboarding  | Automated provisioning via IaC; < 5 minutes for Model A/B; < 30 minutes for Model C |
| Scaling     | Tenant can upgrade tier without data migration (where possible)                     |
| Offboarding | Data export → secure deletion → resource deprovisioning; audit trail                |
| Suspension  | Disable access without deleting data; retain for billing grace period               |

### Monitoring per Tenant

| Signal                          | Implementation                                             |
| ------------------------------- | ---------------------------------------------------------- |
| Request count per tenant        | Application Insights custom dimension: `tenant_id`         |
| Error rate per tenant           | Alert when single tenant error rate exceeds baseline       |
| Resource consumption per tenant | Custom metrics: RU/s consumed, storage bytes, API calls    |
| SLA compliance per tenant       | Availability metric tracked per tenant against tier target |

---

## References

- [Noisy neighbor antipattern](https://learn.microsoft.com/azure/architecture/antipatterns/noisy-neighbor/)
- [Azure Well-Architected Framework for SaaS](https://learn.microsoft.com/azure/well-architected/saas/)
- [Tenancy models for SaaS](https://learn.microsoft.com/azure/architecture/isv/application-tenancy)
- [Multi-tenant identity](https://learn.microsoft.com/azure/architecture/guide/multitenant/considerations/identity)
- [Storage and data approaches for multitenancy](https://learn.microsoft.com/azure/architecture/guide/multitenant/approaches/storage-data)
