# Multitenant Search Patterns

Azure AI Search isolation models for multi-tenant SaaS applications.
Load when the project uses Azure AI Search (vector, full-text, or hybrid) with multiple tenants.

Source: [Design patterns for multitenant SaaS applications and Azure AI Search](https://learn.microsoft.com/azure/search/search-modeling-multitenant-saas-applications)

---

## Three Isolation Models

### Model 1: Index-per-Tenant (Shared Service)

```
Azure AI Search Service (shared)
├── index-tenant-a
├── index-tenant-b
├── index-tenant-c
└── ...
```

| Aspect         | Detail                                                                                                      |
| -------------- | ----------------------------------------------------------------------------------------------------------- |
| Deployment     | Single Azure AI Search service; one index per tenant                                                        |
| Isolation      | Index-level — queries scoped to specific index; no cross-index access                                       |
| Scalability    | Partitions and replicas scale the service; individual indexes can grow                                      |
| Cost model     | Variable — oversubscribe capacity across tenants; unused capacity from low-activity tenants benefits others |
| SLA            | 2 replicas for read SLA (99.9%); 3 replicas for read-write SLA                                              |
| Service limits | Max indexes per service varies by tier (see limits below)                                                   |
| Best for       | 10-200 tenants with uneven workload distribution; B2B SaaS with moderate search needs                       |

**Advantages:**

- Oversubscription allows cost efficiency — active tenants use idle tenants' capacity
- Variable cost model (buy service upfront, fill with tenants)
- Complete data isolation at index level

**Limitations:**

- If index count exceeds service limit, need new service + manual data migration
- Global footprint requires per-region services (duplicated cost)
- If all tenants are concurrently active, cannot handle with oversubscription model

---

### Model 2: Service-per-Tenant (Dedicated)

```
Azure AI Search Service (Tenant A)
└── index-main

Azure AI Search Service (Tenant B)
└── index-main

Azure AI Search Service (Tenant C)
└── index-main
```

| Aspect      | Detail                                                                                               |
| ----------- | ---------------------------------------------------------------------------------------------------- |
| Deployment  | Dedicated Azure AI Search service per tenant                                                         |
| Isolation   | Maximum — separate storage, throughput, API keys                                                     |
| Scalability | Each service scales independently; tier cannot be upgraded in-place (requires data migration)        |
| Cost model  | Predictable fixed cost per tenant; higher per-tenant cost than shared model                          |
| SLA         | Per-service SLA; no noisy neighbor risk                                                              |
| Best for    | Large tenants with high/predictable workloads; global distribution (service in each tenant's region) |

**Advantages:**

- Maximum isolation (data + performance)
- No noisy neighbor possible
- Global footprint: place each service in tenant's preferred region
- Individual API key management per tenant

**Limitations:**

- Highest cost per tenant
- Cannot upgrade pricing tier without data migration to new service
- Operational overhead managing many services

---

### Model 3: Hybrid (Mixed)

```
Azure AI Search Service (shared)         Azure AI Search Service (Tenant X - Large)
├── index-small-tenant-1                 └── index-main
├── index-small-tenant-2
├── index-small-tenant-3                 Azure AI Search Service (Tenant Y - Large)
└── ...                                  └── index-main
```

| Aspect      | Detail                                                                                                |
| ----------- | ----------------------------------------------------------------------------------------------------- |
| Deployment  | Large/active tenants get dedicated services; small/inactive tenants share indexes in a single service |
| Isolation   | Mixed — dedicated tenants have full isolation; shared tenants have index-level isolation              |
| Scalability | Best of both models                                                                                   |
| Cost model  | Optimized — premium pricing for large tenants; amortized cost for small tenants                       |
| Best for    | SaaS with wide range of tenant sizes; tiered pricing models                                           |

**Advantages:**

- Largest tenants get predictable, dedicated performance
- Small tenants benefit from cost-effective shared infrastructure
- Protects small tenants from noisy neighbor of other small tenants (large tenants are isolated)

**Limitations:**

- Requires foresight to classify tenants (dedicated vs. shared)
- Dual operational model increases complexity
- Tenant migration (shared → dedicated) requires data reindexing

---

## S3 High Density (HD) Mode

For high tenant count scenarios with small per-tenant indexes:

| Property         | Detail                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------- |
| Tier             | S3 HD                                                                                                   |
| Design intent    | Many small indexes packed into single service                                                           |
| Trade-off        | Cannot scale indexes horizontally with partitions; instead, adding partitions increases max index count |
| Ideal index size | 50-80 GB per index (no hard limit, but performance optimized here)                                      |
| Use case         | B2C SaaS with 200+ tenants, each with small search corpus                                               |

---

## Filter-Based Isolation (Finer Granularity)

For when index-per-tenant is too coarse or per-tenant index count would exceed limits:

```
Single shared index
├── Document { tenant_id: "A", content: "..." }
├── Document { tenant_id: "A", content: "..." }
├── Document { tenant_id: "B", content: "..." }
└── ...

Query: search=*&$filter=tenant_id eq 'A'
```

| Aspect              | Detail                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| Isolation mechanism | Filterable field (`tenant_id`) on every document; mandatory filter on every query                           |
| Advantages          | Supports unlimited tenants in single index; works for sub-tenant scoping (user-level, department-level)     |
| Limitations         | **Relevance scores affected** — term frequency statistics computed across ALL tenants' data, not per-tenant |
| Security risk       | If filter is omitted, cross-tenant data leakage occurs                                                      |
| Mitigation          | Enforce filter at API layer; never trust client-side filtering                                              |

**Critical warning about relevance:**

> Using field-based filtering in a single shared index means search relevance scores (BM25/TF-IDF)
> are computed at the index level, not per-tenant. A rare term in Tenant A's corpus may appear
> frequently in Tenant B's documents, affecting Tenant A's relevance ranking. This is acceptable
> for simple lookups but problematic for relevance-sensitive applications.

---

## Decision Matrix

| Criterion              | Index-per-Tenant             | Service-per-Tenant          | Hybrid              | Filter-Based                 |
| ---------------------- | ---------------------------- | --------------------------- | ------------------- | ---------------------------- |
| Tenant count           | 10-200                       | < 50                        | 10-200+             | Unlimited                    |
| Data isolation         | Index-level                  | Complete                    | Mixed               | Logical only                 |
| Performance isolation  | None (shared service)        | Complete                    | Mixed               | None                         |
| Per-tenant cost        | Low-Medium                   | High                        | Variable            | Lowest                       |
| Relevance accuracy     | Per-index (accurate)         | Per-service (accurate)      | Mixed               | Cross-tenant (degraded)      |
| Operational complexity | Medium                       | High                        | Highest             | Low                          |
| Global distribution    | Requires per-region services | Natural (per-tenant region) | Mixed               | Requires per-region services |
| Noisy neighbor risk    | Yes                          | No                          | Reduced             | Yes                          |
| Compliance suitability | Good                         | Best                        | Good (premium tier) | Weakest                      |

---

## Integration with Multi-Tenant RAG

When Azure AI Search serves as the grounding data store for RAG:

| RAG Pattern                         | Search Model                                     | Notes                                                                            |
| ----------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------- |
| Shared model + tenant-filtered data | Filter-based OR index-per-tenant                 | Filter-based: cheaper but relevance affected; Index-per-tenant: better relevance |
| Per-tenant stores + shared model    | Index-per-tenant (minimum) or service-per-tenant | Route search queries to correct index via tenant catalog                         |
| Full isolation                      | Service-per-tenant                               | Each tenant's AI Search service is independent                                   |
| AI Gateway routing                  | Index-per-tenant with routing at APIM            | Gateway determines which index to query                                          |

### Vector Search Considerations

| Concern         | Guidance                                                             |
| --------------- | -------------------------------------------------------------------- |
| Embedding model | Can be shared across tenants (embeddings are tenant-agnostic)        |
| Vector index    | Per-tenant index recommended for relevance isolation                 |
| Hybrid search   | BM25 component affected by cross-tenant statistics in shared indexes |
| Semantic ranker | Operates per-query; not affected by multi-tenancy directly           |

---

## Service Limits (Key Values)

| Tier  | Max Indexes | Max Partitions | Notes                           |
| ----- | ----------- | -------------- | ------------------------------- |
| Basic | 15          | 1              | Single partition; limited scale |
| S1    | 50          | 12             | Good for moderate tenants       |
| S2    | 200         | 12             | Higher storage per partition    |
| S3    | 200         | 12             | Highest per-partition capacity  |
| S3 HD | 1000+       | Varies         | Designed for many small indexes |

> Always verify current limits: [Azure AI Search limits and quotas](https://learn.microsoft.com/azure/search/search-limits-quotas-capacity)

---

## References

- [Design patterns for multitenant SaaS and Azure AI Search](https://learn.microsoft.com/azure/search/search-modeling-multitenant-saas-applications)
- [Azure AI Search service limits](https://learn.microsoft.com/azure/search/search-limits-quotas-capacity)
- [Azure AI Search pricing tiers](https://azure.microsoft.com/pricing/details/search/)
- [Security filters for trimming results](https://learn.microsoft.com/azure/search/search-security-trimming-for-azure-search)
