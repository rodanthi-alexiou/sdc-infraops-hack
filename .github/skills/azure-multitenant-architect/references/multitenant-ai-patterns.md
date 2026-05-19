# Multitenant AI Patterns

Multi-tenant patterns for RAG, AI agents, and Azure OpenAI workloads.
Load when the project includes AI/ML components that serve multiple tenants.

Source: [Design a secure multitenant RAG inferencing solution](https://learn.microsoft.com/azure/architecture/ai-ml/guide/secure-multitenant-rag)

---

## Multi-Tenant RAG Architecture Patterns

### Pattern 1: Shared Model + Tenant-Filtered Grounding Data

```
User → App → Identity Provider → Orchestrator → [Tenant Data Store] → Foundation Model
                                      ↓
                              Tenant filter applied
                              at data access layer
```

| Aspect              | Detail                                                                                                                 |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Model deployment    | Shared Azure OpenAI instance across all tenants                                                                        |
| Grounding data      | Multitenant store with mandatory `tenant_id` filter on every query                                                     |
| Isolation mechanism | API encapsulation layer acts as gatekeeper                                                                             |
| Cost model          | Shared PTU or PAYG; per-tenant metering at orchestrator                                                                |
| Best for            | High tenant count, similar AI use cases, cost-optimized                                                                |
| Risk                | Prompt injection could bypass tenant filter if not defended; relevance scores affected by cross-tenant term statistics |

**Non-negotiable gates:**

- Tenant filter MUST be applied at the orchestrator/API layer — never rely on client-side filtering
- Security trimming on returned documents BEFORE passing to model
- Audit log of all grounding data accessed per request (tenant_id + document IDs)

---

### Pattern 2: Per-Tenant Grounding Stores + Shared Model

```
User → App → Identity Provider → Orchestrator → [Tenant-Specific Store] → Foundation Model
                                      ↓
                              Route to tenant's
                              dedicated data store
```

| Aspect              | Detail                                                                               |
| ------------------- | ------------------------------------------------------------------------------------ |
| Model deployment    | Shared Azure OpenAI instance                                                         |
| Grounding data      | Dedicated store per tenant (dedicated AI Search index, dedicated Cosmos DB database) |
| Isolation mechanism | Routing at orchestrator based on tenant catalog lookup                               |
| Cost model          | Shared model cost amortized; dedicated data store cost per tenant                    |
| Best for            | B2B SaaS with data compliance requirements; 10-100 tenants                           |
| Risk                | Store proliferation at scale; operational overhead for lifecycle management          |

**Non-negotiable gates:**

- Tenant catalog MUST map user → tenant → data store endpoint
- Never allow cross-tenant store access even at orchestrator level
- Per-tenant backup and point-in-time restore capability

---

### Pattern 3: Per-Tenant AI Deployments (Full Isolation)

```
User → App → Identity Provider → [Tenant's Orchestrator] → [Tenant's Store] → [Tenant's Model]
```

| Aspect              | Detail                                                                                |
| ------------------- | ------------------------------------------------------------------------------------- |
| Model deployment    | Dedicated Azure OpenAI resource or deployment per tenant                              |
| Grounding data      | Dedicated store per tenant                                                            |
| Isolation mechanism | Complete resource isolation; separate Azure OpenAI endpoints                          |
| Cost model          | Highest — full PTU or PAYG per tenant; justified for enterprise SLAs                  |
| Best for            | < 10 large enterprise tenants; strict compliance; custom model fine-tuning per tenant |
| Risk                | Azure OpenAI quota limits per subscription; high cost                                 |

**Non-negotiable gates:**

- Separate API keys and managed identities per tenant deployment
- Per-tenant content filtering configuration
- Independent scaling (PTU allocation per tenant's throughput needs)

---

### Pattern 4: AI Gateway Routing (Hybrid)

```
User → App → AI Gateway (APIM) → Route by tenant tier:
                                    ├── Free/Basic → Shared model pool
                                    └── Premium → Dedicated model deployment
```

| Aspect              | Detail                                                                   |
| ------------------- | ------------------------------------------------------------------------ |
| Model deployment    | Pool of shared + dedicated Azure OpenAI deployments                      |
| Gateway             | Azure API Management as AI gateway with per-tenant routing policies      |
| Isolation mechanism | APIM policy routes by tenant tier; token rate limiting per tenant        |
| Cost model          | Tiered — basic tenants share PTU pool; premium get guaranteed capacity   |
| Best for            | Hybrid model D; growth-stage SaaS with multiple pricing tiers            |
| Risk                | Routing complexity; need to handle failover between shared and dedicated |

**Non-negotiable gates:**

- Per-tenant token rate limiting at gateway
- Content safety policies applied uniformly regardless of tier
- Token consumption metering per tenant for billing

---

## API Encapsulation Layer (Mandatory for All Patterns)

Per Microsoft guidance, implement an API layer as gatekeeper between orchestrator and data stores:

### Responsibilities

| Function           | Implementation                                                                     |
| ------------------ | ---------------------------------------------------------------------------------- |
| Tenant resolution  | Extract `tenant_id` from authenticated token; lookup in tenant catalog             |
| Data routing       | Route to correct store based on isolation model (tenant-specific or shared)        |
| Security filtering | Apply row-level or document-level filtering for user within tenant                 |
| Audit logging      | Log every data access: `{tenant_id, user_id, query_hash, document_ids, timestamp}` |
| Rate limiting      | Enforce per-tenant and per-user query budgets                                      |

### Design Rules

1. **No direct store access** — All grounding data requests MUST flow through the API layer
2. **Defense in depth** — Even with per-tenant stores, validate tenant ownership at API layer
3. **Identity flow** — User identity MUST propagate through entire chain (app → orchestrator → API → store)
4. **Fail closed** — If tenant resolution fails, deny the request (do not default to any tenant)

---

## Foundry Agent Service Patterns

> Note: Azure OpenAI "On Your Data" is deprecated. Use Foundry Agent Service with Foundry IQ for new workloads.

### Multi-Tenant Agent Patterns

| Pattern                          | Description                                                               | Tenant Count              |
| -------------------------------- | ------------------------------------------------------------------------- | ------------------------- |
| Shared agent, filtered knowledge | Single Foundry agent; per-tenant knowledge base filtering via metadata    | 100+                      |
| Per-tenant agent configuration   | Shared agent code; per-tenant system prompt + knowledge base references   | 10-100                    |
| Per-tenant agent deployment      | Dedicated agent instance per tenant with isolated configuration           | < 20                      |
| Agent-per-workflow               | Each tenant gets a dedicated agent for their specific workflow automation | < 10 (complex enterprise) |

### Foundry Multi-Agent Considerations

| Concern              | Guidance                                                                           |
| -------------------- | ---------------------------------------------------------------------------------- |
| Agent identity       | Each agent uses managed identity scoped to its tenant's resources                  |
| Tool access          | Tools configured per tenant (e.g., tenant A's agent can only call tenant A's APIs) |
| Conversation history | Isolated per tenant — never share thread state across tenants                      |
| Knowledge base       | Foundry IQ indexes scoped per tenant or with mandatory tenant filter               |
| Cost attribution     | Track token consumption per agent instance → map to tenant                         |

---

## Security Patterns for Multi-Tenant AI

### Prompt Injection Defense (Multi-Tenant Specific)

| Threat                                                          | Mitigation                                                                 |
| --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Tenant A's grounding data contains injection targeting Tenant B | Per-tenant data isolation prevents cross-contamination                     |
| User attempts to override tenant filter in prompt               | System prompt hardcodes tenant context; user input cannot override filters |
| Indirect injection via shared knowledge base                    | Shared data must be sanitized; content safety filters on input AND output  |
| Token enumeration across tenants                                | Rate limiting + anomaly detection per tenant                               |

### Data Leakage Prevention

| Layer                | Control                                                                           |
| -------------------- | --------------------------------------------------------------------------------- |
| Grounding data       | Tenant filter at API layer (mandatory)                                            |
| Model responses      | Output filtering — validate response doesn't contain other tenants' data patterns |
| Conversation history | Never include another tenant's conversation context                               |
| Fine-tuning data     | Per-tenant fine-tuning MUST use only that tenant's data                           |
| Embeddings           | Per-tenant vector namespaces or mandatory metadata filter on similarity search    |

---

## References

- [Design a secure multitenant RAG inferencing solution](https://learn.microsoft.com/azure/architecture/ai-ml/guide/secure-multitenant-rag)
- [Baseline Microsoft Foundry chat architecture](https://learn.microsoft.com/azure/architecture/ai-ml/architecture/baseline-microsoft-foundry-chat)
- [Azure OpenAI Gateway guide](https://learn.microsoft.com/azure/architecture/ai-ml/guide/azure-openai-gateway-guide)
- [RAG solution design and evaluation guide](https://learn.microsoft.com/azure/architecture/ai-ml/guide/rag/rag-solution-design-and-evaluation-guide)
- [Foundry Agent Service overview](https://learn.microsoft.com/azure/ai-foundry/agents/overview)
