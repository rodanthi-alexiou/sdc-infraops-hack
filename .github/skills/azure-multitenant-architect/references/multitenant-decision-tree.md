# Multitenant Decision Tree

Tenancy model selection criteria and decision flow for Azure SaaS workloads.
Load this reference when evaluating which isolation model fits the project requirements.

Source: [SaaS and multitenant solution architecture](https://learn.microsoft.com/azure/architecture/guide/saas-multitenant-solution-architecture/)

---

## Models

### Model A: Fully Shared (Single Deployment, Logical Isolation)

| Aspect      | Detail                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------- |
| Description | Single deployment of all resources; tenant isolation via tenant ID filtering in application layer |
| Compute     | Shared App Service / Container Apps / Functions                                                   |
| Data        | Shared database with row-level or schema-level tenant discrimination                              |
| Identity    | Shared Entra ID app registration, tenant claim in token                                           |
| Networking  | Shared VNet, shared endpoints                                                                     |
| Cost model  | Lowest per-tenant cost; amortized across all tenants                                              |
| Best for    | B2C SaaS, high tenant count (100+), small per-tenant data footprint                               |
| Risks       | Noisy neighbor, cross-tenant data leakage if filtering fails, single blast radius                 |

**Decision criteria — choose this when:**

- Tenant count > 100
- Per-tenant data < 10 GB
- No regulatory requirement for physical data isolation
- Cost optimization is primary driver
- Tenants have similar workload profiles

---

### Model B: Shared Compute, Dedicated Data

| Aspect      | Detail                                                                               |
| ----------- | ------------------------------------------------------------------------------------ |
| Description | Shared application tier; per-tenant databases, storage accounts, or search indexes   |
| Compute     | Shared Container Apps / App Service                                                  |
| Data        | Database-per-tenant or schema-per-tenant (Cosmos DB partition key, SQL elastic pool) |
| Identity    | Shared app registration; tenant resolution from token + tenant catalog               |
| Networking  | Shared compute VNet; optionally separate data VNets per tenant                       |
| Cost model  | Moderate — shared compute reduces cost; per-tenant data adds overhead                |
| Best for    | B2B SaaS, regulatory compliance per tenant, moderate tenant count (10-100)           |
| Risks       | Operational complexity for data lifecycle, backup/restore per tenant                 |

**Decision criteria — choose this when:**

- Regulatory requirement for data isolation (GDPR, HIPAA, data residency)
- Tenants have different data retention policies
- Per-tenant data > 10 GB
- Need per-tenant backup/restore capability
- Acceptable to share compute resources

---

### Model C: Dedicated Per Tenant (Deployment Stamps)

| Aspect      | Detail                                                                              |
| ----------- | ----------------------------------------------------------------------------------- |
| Description | Separate resource group or subscription per tenant; complete resource isolation     |
| Compute     | Dedicated App Service plan / Container Apps environment per tenant                  |
| Data        | Dedicated database instance per tenant                                              |
| Identity    | Optionally separate Entra ID app registrations; or shared with tenant-scoped claims |
| Networking  | Dedicated VNet per tenant or dedicated subnet per tenant                            |
| Cost model  | Highest per-tenant cost; predictable per-tenant billing                             |
| Best for    | Enterprise B2B, maximum SLA guarantees, large tenants with dedicated contracts      |
| Risks       | High operational overhead, scaling challenges at high tenant count                  |

**Decision criteria — choose this when:**

- Tenant count < 20
- Enterprise SLA (99.99%) per tenant
- Per-tenant compliance or audit requirements
- Tenants willing to pay premium for isolation
- Need to support per-tenant customization (different SKUs, regions)

---

### Model D: Hybrid (Tiered)

| Aspect      | Detail                                                                                        |
| ----------- | --------------------------------------------------------------------------------------------- |
| Description | Free/basic tier tenants share infrastructure; premium/enterprise tenants get dedicated stamps |
| Compute     | Shared pool for small tenants; dedicated for large                                            |
| Data        | Shared multitenant store for basic; dedicated for premium                                     |
| Identity    | Shared app registration; tier metadata in tenant catalog                                      |
| Networking  | Shared for basic; dedicated VNet for premium                                                  |
| Cost model  | Optimizes cost for long tail while supporting premium isolation                               |
| Best for    | SaaS with multiple pricing tiers, growth-stage products                                       |
| Risks       | Dual operational model, tenant migration between tiers adds complexity                        |

**Decision criteria — choose this when:**

- Mix of small (free/trial) and large (enterprise) tenants
- Product has tiered pricing
- Need to optimize infrastructure cost for long tail
- Enterprise tenants demand dedicated resources
- Plan for tenant growth (start shared, upgrade to dedicated)

---

## Decision Flow

```
1. How many tenants will you serve?
   ├── > 100 tenants → Consider Model A or D
   ├── 10-100 tenants → Consider Model B or D
   └── < 20 tenants → Consider Model C or D

2. Is physical data isolation required (regulatory)?
   ├── Yes → Eliminate Model A; choose B, C, or D
   └── No → All models viable

3. Do tenants need different SLAs?
   ├── Yes → Choose Model C (all premium) or D (tiered)
   └── No → Model A or B

4. What is the per-tenant budget?
   ├── Low (< $100/mo) → Model A or D (shared tier)
   ├── Medium ($100-$1000/mo) → Model B or D
   └── High (> $1000/mo) → Model C or D (premium tier)

5. Is per-tenant customization needed?
   ├── Yes (different regions, SKUs) → Model C or D (premium tier)
   └── No → Any model
```

---

## Automation Patterns

### Tenant Onboarding Automation

| Model                               | Onboarding Pattern                                                                |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| A (Shared)                          | Add row to tenant catalog; no infrastructure changes                              |
| B (Shared compute + dedicated data) | Provision new database/index via IaC pipeline; update tenant catalog              |
| C (Dedicated)                       | Deploy full stamp via Bicep/Terraform parameterized template; update DNS, catalog |
| D (Hybrid)                          | Check tier → route to A/B automation or C automation                              |

### Recommended Automation Stack

| Concern                     | Tool                                                     |
| --------------------------- | -------------------------------------------------------- |
| Infrastructure provisioning | Bicep or Terraform with parameterized tenant modules     |
| Tenant catalog              | Azure Cosmos DB (partition key = tenant_id) or Azure SQL |
| Onboarding orchestration    | Azure Durable Functions or Logic Apps                    |
| DNS/routing                 | Azure Front Door with rules engine per tenant            |
| Monitoring per tenant       | Application Insights with `cloud_RoleName` = tenant_id   |

---

## Tenant Catalog Design

Every multi-tenant solution needs a tenant catalog (control plane database):

| Field                 | Purpose                                         |
| --------------------- | ----------------------------------------------- |
| `tenant_id`           | Unique identifier (GUID)                        |
| `tenant_name`         | Display name                                    |
| `tier`                | Pricing tier (free, basic, premium, enterprise) |
| `isolation_model`     | Which model applies (A, B, C, D)                |
| `region`              | Primary deployment region                       |
| `data_store_endpoint` | Connection info for tenant's data store         |
| `created_at`          | Onboarding timestamp                            |
| `status`              | active, suspended, deprovisioning               |

---

## References

- [Tenancy models for SaaS](https://learn.microsoft.com/azure/architecture/isv/application-tenancy)
- [Deployment stamps pattern](https://learn.microsoft.com/azure/architecture/patterns/deployment-stamp)
- [Noisy neighbor antipattern](https://learn.microsoft.com/azure/architecture/antipatterns/noisy-neighbor/)
- [Multitenant architecture approaches](https://learn.microsoft.com/azure/architecture/guide/multitenant/overview)
