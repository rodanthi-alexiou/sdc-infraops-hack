# AI Deployment Decisions

Reference for the 03-Architect agent (and 05-IaC Planner) when sizing Azure OpenAI
model deployments and projecting token-based costs.

---

## PTU Decision Tree

**PTU (Provisioned Throughput Units)** — reserved capacity; predictable low latency.
**PAYG (Pay-As-You-Go)** — on-demand; variable latency under load; no upfront commitment.

```
Does the workload have a P99 latency SLA ≤ 2s for inference?
├── YES → Is monthly token volume > 5M tokens/month?
│         ├── YES → PTU — size to peak TPM; use PAYG as overflow
│         └── NO  → PAYG sufficient; revisit at 3M tokens/month
└── NO  → PAYG for dev/test; evaluate PTU at production sign-off

Is this a dev/test environment?
└── YES → Always PAYG regardless of volume
```

### PTU Sizing Formula

```
PTU required = Peak TPM (tokens per minute) / 1000
```

Where:

- Peak TPM = (queries/minute) × (avg input tokens + avg output tokens)
- Add 20% headroom for bursts

### Trade-offs Table

| Factor              | PTU                             | PAYG                               |
| ------------------- | ------------------------------- | ---------------------------------- |
| Latency (P99)       | Predictable; ~200-500ms         | Variable; spikes under load        |
| Cost at high volume | Lower per-token                 | Higher per-token                   |
| Cost at low volume  | Higher (reserved)               | Lower (pay per call)               |
| Quota dependency    | Requires capacity reservation   | Uses shared pool                   |
| DR failover         | Requires PTU in failover region | Automatic                          |
| Recommended for     | Production, latency-sensitive   | Dev/test, spiky/variable workloads |

### Global Deployment Type

`GlobalStandard` routes tokens across Microsoft's global infrastructure for lower
cost-per-token than `Standard` (region-pinned). Use for non-latency-sensitive,
high-volume scenarios (CO-R3):

| SKU name                   | Routing         | Data residency guarantee | When to use                                                              |
| -------------------------- | --------------- | ------------------------ | ------------------------------------------------------------------------ |
| `GlobalStandard`           | Global          | None — may leave EU/EEA  | PAYG; non-latency-sensitive; highest TPM quota; **not for EU-regulated** |
| `DataZoneStandard`         | Geographic zone | Within EU/EEA zone       | PAYG; EU data residency (GDPR Art.44, NEN 7510); swedencentral supported |
| `Standard`                 | Region-pinned   | Single region only       | PAYG; fallback if DataZone quota unavailable; lower TPM ceiling          |
| `ProvisionedManaged`       | Region-pinned   | Single region only       | PTU; reserved capacity; lowest P99 latency                               |
| `GlobalProvisionedManaged` | Global          | None                     | PTU; global routing; highest throughput                                  |
| `DataZoneProvisioned`      | Geographic zone | Within EU/EEA zone       | PTU; EU-zone reserved capacity                                           |

**Default choice by compliance profile:**

- EU-regulated workloads (GDPR, NEN 7510, healthcare, public sector): use `DataZoneStandard`
- Non-EU or no data residency constraint: use `GlobalStandard`
- PTU blocked by Azure Policy: `DataZoneStandard` or `Standard` (PAYG only)

Set `sku.name: 'DataZoneStandard'` for EU-regulated workloads. Use `GlobalStandard`
only when requirements explicitly confirm no data residency constraint.

### PTU + PAYG Spillover Pattern

Deploy PTU as primary endpoint + PAYG as spillover to absorb burst traffic (CO-R2):

```
Primary:   ProvisionedManaged deployment (PTU)  → handles steady-state traffic
Spillover: GlobalStandard deployment (PAYG)    → activated on HTTP 429 from PTU
Routing:   APIM backend pool (priority-based)  → automatic failover on 429/503
```

Benefits:

- Predictable baseline cost (PTU handles 80%+ of traffic)
- No dropped requests during bursts (PAYG absorbs overflow)
- Both deployments in same AI Services account; no cross-region latency penalty

---

## Token Cost Projection

### Workflow

1. Extract from requirements:
   - `Q` = queries per month
   - `I` = average input tokens per query (include system prompt + retrieved context chunks)
   - `O` = average output tokens per query

2. Call Azure Pricing MCP — use the **AI / Cognitive Services token pricing endpoint**,
   not the VM or compute endpoint:

   ```
   service: "Azure OpenAI"
   model: <model name from requirements, e.g. "gpt-4o">
   region: <deployment region, default swedencentral>
   ```

3. Calculate:

   ```
   Monthly input cost  = Q × I / 1000 × price_per_1K_input_tokens
   Monthly output cost = Q × O / 1000 × price_per_1K_output_tokens
   Monthly total       = input cost + output cost
   ```

4. Add embedding cost if RAG is used:

   ```
   Monthly embedding cost = (new_docs_per_month × avg_chunk_tokens) / 1000 × embedding_price
   ```

   Re-embedding cost is typically negligible unless the document corpus changes frequently.

### Example (gpt-4o, swedencentral, PAYG — verify prices with Pricing MCP)

| Component                           | Volume    | Unit      | Cost         |
| ----------------------------------- | --------- | --------- | ------------ |
| Input tokens                        | 50M/month | per 1K    | ~€X          |
| Output tokens                       | 10M/month | per 1K    | ~€X          |
| Embeddings (text-embedding-3-large) | 5M/month  | per 1K    | ~€X          |
| AI Search Standard S1 (1 replica)   | —         | per month | ~€X          |
| **Total**                           |           |           | **€X/month** |

> Always call the Pricing MCP for current prices — do not hardcode values.

### Cost Flags

| Condition                              | Flag                                                               |
| -------------------------------------- | ------------------------------------------------------------------ |
| Projected token cost > €500/month      | Cost Optimization risk — evaluate PTU                              |
| AI Search Standard tier + 3+ replicas  | Adds ~€750/month — flag in cost estimate                           |
| Document Intelligence high-volume scan | Priced per page — get doc count from requirements                  |
| Content safety enabled                 | Adds per-call cost on top of inference — include in projection     |
| Non-production compute running 24/7    | Enforce auto-shutdown policy; saves 60-70% of compute cost (CO-R4) |

---

## Compute Options for AI Workloads

| Compute                  | Best for AI workloads                                   | Notes                                                         |
| ------------------------ | ------------------------------------------------------- | ------------------------------------------------------------- |
| Container Apps           | **Primary recommendation** — AI apps and agents         | Auto-scale, Dapr, managed identity, sidecar support           |
| App Service              | Simple inference APIs, legacy migration                 | Less flexible for agent patterns; fewer scaling options       |
| AKS                      | Custom model serving, GPU inference, large-scale agents | Highest ops overhead; use only if Container Apps insufficient |
| Foundry Agents (managed) | Agent orchestration without a custom runtime            | No infra management; tied to Foundry platform lifecycle       |

> **Default choice**: Start with Container Apps unless requirements specify GPU inference
> or a custom model runtime that Container Apps cannot support.
