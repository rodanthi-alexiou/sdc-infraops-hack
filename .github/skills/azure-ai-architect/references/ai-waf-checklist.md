# AI WAF Checklist

WAF-aligned gates and NFR mappings for Azure AI workloads.
Apply during the Architect step (Step 2) when requirements include AI services.

---

## Security

### Gates (non-negotiable for production)

| Gate                                | Setting                          | Resource                     |
| ----------------------------------- | -------------------------------- | ---------------------------- |
| No public inference endpoint        | `publicNetworkAccess: Disabled`  | AI Services account          |
| No public search endpoint           | `publicNetworkAccess: Disabled`  | AI Search service            |
| Private endpoint required           | Deploy PE in workload subnet     | Both AI Services + AI Search |
| No shared key access on AI Services | Managed Identity only            | AI Services account          |
| No local auth on AI Search          | `disableLocalAuth: true`         | AI Search service            |
| HTTPS-only                          | `supportsHttpsTrafficOnly: true` | All cognitive endpoints      |

> **Escalation:** If requirements specify a public-facing chatbot or copilot endpoint,
> the inference call must still route through a private backend (e.g. Container Apps with
> egress to private AI endpoint). The user-facing surface ≠ the AI service endpoint.

### Content Safety

Content safety filters add latency (~100ms) and per-call cost.

| Condition                          | Requirement                                 |
| ---------------------------------- | ------------------------------------------- |
| Public-facing inference endpoint   | **Required** — flag as Security gate        |
| Internal-only, authenticated users | Recommended — document if explicitly waived |
| Jailbreak / prompt injection risk  | Required — also add to threat model         |

Verify available filter categories for the target region via the
[Azure AI Content Safety docs](https://learn.microsoft.com/azure/ai-services/content-safety/).

### Security Posture Management

| Control                                                              | Requirement                                                        |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Defender for Cloud + AI threat protection (Defender for AI)          | **Required** — enable on AI Services and AI Search resources       |
| Microsoft Cloud Security Benchmark applied to AI Services            | Verify compliance posture in Defender for Cloud recommendations    |
| Purview Insider Risk Management for AI-processed data                | Required for regulated industries or PII-containing corpora        |
| Threat model includes MITRE ATLAS + OWASP Generative AI Top 10 risks | Required for public-facing AI apps; recommended for internal       |
| Prompt shielding + output monitoring on all inference calls          | **Required** for public endpoints — integrates with content safety |
| PII detection via Azure Language Service before forwarding to model  | Required for workloads processing user-provided unstructured text  |

---

## Reliability

### RAG Accuracy as a Reliability NFR

If requirements state an accuracy target (e.g., "80% answer relevance",
"< 5% hallucination rate"), this maps to WAF Reliability — not to the application layer.

| Accuracy target               | Architecture implication                                  |
| ----------------------------- | --------------------------------------------------------- |
| Any stated accuracy target    | AI Search tier ≥ Standard S1; document in NFR table       |
| > 80% answer relevance        | Standard S1 + 2 replicas minimum for consistent retrieval |
| > 90% answer relevance        | Standard S2 or semantic ranker enabled                    |
| < 5% hallucination rate       | Embedding model: `text-embedding-3-large` (not `ada-002`) |
| Low hallucination + citations | Hybrid search (keyword + vector) required                 |

**AI Search tier guidance:**

| Tier              | Max replicas | Semantic ranker | Use case                       |
| ----------------- | ------------ | --------------- | ------------------------------ |
| Basic             | 3            | No              | Dev/test only                  |
| Standard S1       | 12           | Yes (add-on)    | Production RAG                 |
| Standard S2       | 12           | Yes (included)  | High-accuracy RAG              |
| Storage Optimized | 12           | Yes             | Large document corpora > 100GB |

### OpenAI Reliability Patterns

| Pattern                                           | When to apply                             |
| ------------------------------------------------- | ----------------------------------------- |
| Retry with exponential backoff on HTTP 429        | Always — throttling is expected at scale  |
| Circuit breaker on model endpoint                 | Production workloads with SLA             |
| PTU + PAYG overflow                               | If P99 latency SLA stated in requirements |
| Multi-region active-active                        | RPO = 0 or RTO < 1 hour                   |
| Secondary AI Services instance in failover region | RTO < 4 hours                             |

---

## Cost Optimization

See [ai-deployment-decisions.md](ai-deployment-decisions.md) for full PTU vs PAYG decision tree
and token cost projection workflow.

### Cost Flags for Architecture Review

| Condition                                | Action                                                      |
| ---------------------------------------- | ----------------------------------------------------------- |
| AI Search Standard + semantic ranker     | ~€750/month baseline — include in cost estimate             |
| GPT-4o output tokens > 10M/month         | Evaluate PTU; calculate break-even with Pricing MCP         |
| Document Intelligence > 500K pages/month | High-volume pricing tier — get page count from requirements |
| Content safety enabled on all calls      | Add per-call overhead to token cost projection              |

---

## Operational Excellence

### Monitoring Requirements

| Signal                           | Tool                                 | Why                                        |
| -------------------------------- | ------------------------------------ | ------------------------------------------ |
| Token consumption per deployment | Azure Monitor metrics on AI Services | Throttle prediction and cost tracking      |
| Search latency (P99)             | AI Search diagnostic logs            | RAG accuracy degradation early warning     |
| Content safety block rate        | Application Insights                 | Detects adversarial prompt campaigns       |
| Embedding drift                  | Custom evaluation pipeline (FAOS)    | RAG accuracy over time                     |
| Model/data drift                 | Foundry evaluations + custom alerts  | Model output quality over time (M-R5)      |
| Baseline metric alerts           | Azure Monitor Baseline Alerts (AMBA) | Automated alerting for AI resources (M-R2) |
| Network flow monitoring          | Network Watcher flow logs            | Detect unexpected AI service access (M-R6) |

All AI services must emit diagnostics to the Log Analytics workspace.
Add `Microsoft.CognitiveServices/accounts` and `Microsoft.Search/searchServices`
to the diagnostic settings module in the IaC plan.

### Model Version Management

| Practice                           | Guidance                                    |
| ---------------------------------- | ------------------------------------------- |
| Pin model version in deployment    | Never use `latest` alias in production      |
| Test model upgrades in dev first   | Schedule upgrade window; re-run eval suite  |
| Document model version in as-built | Required for compliance and reproducibility |

---

## Governance

### AI Policy Governance

| Control                                       | Default effect | When to switch to Deny                       |
| --------------------------------------------- | -------------- | -------------------------------------------- |
| Azure Policy: model catalog governance        | Audit          | After baseline established in dev/staging    |
| Restrict allowed Azure OpenAI model versions  | Audit → Deny   | Before production sign-off                   |
| Require private endpoints on AI Services      | Audit → Deny   | Enforce at subscription scope for production |
| Require content safety filter ≥ Standard tier | Audit          | Escalate to Deny for regulated scopes        |

Apply the built-in Azure Policy initiative:
`[Preview]: Azure AI Services resources should use private links` (G-R1).
Map to NIST AI RMF and record compliance posture in `04-governance-constraints.md` (G-R2).

### Responsible AI Dashboard

For workloads surfacing model outputs to end users, deploy the
[Responsible AI Dashboard](https://learn.microsoft.com/azure/machine-learning/concept-responsible-ai-dashboard)
to generate model output reports (fairness, error analysis, data exploration) (G-R3).

Record `responsible_ai_dashboard: <deployed | waived with justification>` in the architecture assessment.

---

## Networking

Reference: [AI Landing Zone design checklist](https://azure.github.io/AI-Landing-Zones/architecture/design-checklist/)

### Network Gates (non-negotiable for production)

| Gate                                                              | Control                                          | Source |
| ----------------------------------------------------------------- | ------------------------------------------------ | ------ |
| Private endpoint for every PaaS AI service                        | Deploy PE in workload subnet; no public endpoint | N-R3   |
| NSG on all VNets in the AI Landing Zone                           | Deny-all inbound default; allow explicitly       | N-R4   |
| App Gateway or Azure Front Door + WAF for public-facing frontends | WAF policy in Prevention mode for production     | N-R5   |
| APIM as AI gateway for multi-team or enterprise workloads         | Required; optional for single-team internal apps | N-R6   |
| Azure Firewall + UDR for outbound traffic                         | Central (platform LZ preferred) or in AI LZ      | N-R7   |
| Private DNS Zones for all private endpoints                       | Central (platform LZ preferred) or in AI LZ      | N-R8   |
| Outbound traffic restricted by default                            | Allowlist required egress only                   | N-R9   |

### Supporting Network Controls

| Control                                    | Guidance                                                                  | Source |
| ------------------------------------------ | ------------------------------------------------------------------------- | ------ |
| DDoS protection                            | Enable at VNet level; reuse central DDoS plan from platform LZ if present | N-R1   |
| Bastion / jump box for AI developer access | Required for production; reuse central Bastion if platform LZ is present  | N-R2   |

> **Hub-spoke topology**: For enterprise deployments, place the AI gateway (APIM) in the
> hub VNet or a dedicated AI spoke peered to the hub. See
> [ai-gateway-patterns.md](ai-gateway-patterns.md) for topology decisions.
