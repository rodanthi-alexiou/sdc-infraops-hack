# ADR-0002: Shared Multi-Tenant Agent Model (4 Agent Types) Over Per-Hospital Instances

![Step](https://img.shields.io/badge/Step-3-blue?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Proposed-orange?style=for-the-badge)
![Type](https://img.shields.io/badge/Type-ADR-purple?style=for-the-badge)

<details open>
<summary><strong>📑 Decision Contents</strong></summary>

- [🔍 Context](#-context)
- [✅ Decision](#-decision)
- [🔄 Alternatives Considered](#-alternatives-considered)
- [⚖️ Consequences](#%EF%B8%8F-consequences)
- [🏛️ WAF Pillar Analysis](#%EF%B8%8F-waf-pillar-analysis)
- [🔒 Compliance Considerations](#-compliance-considerations)
- [📝 Implementation Notes](#-implementation-notes)

</details>

> Status: Proposed
> Date: 2026-05-19
> Deciders: Architecture team, Product, DPO

## 🔍 Context

CareFlow AI serves 25 Dutch hospitals. Each hospital requires AI-powered workflow automation
across four domains: triage routing, clinical operations, staff scheduling, and reporting.

An early design explored **per-hospital agent instantiation** — each hospital gets its own
set of AI agent instances. This would guarantee compute isolation but results in 25 × N agent
replicas running concurrently, with significant cost and operational overhead.

The product team confirmed that clinical reasoning logic is **identical across hospitals** —
only the input data and output context differ per hospital. This opens the door to a
**shared agent model** where a small number of agent types serve all hospitals by loading
per-hospital context at invocation time.

The multi-tenancy risk is data leakage between hospitals: an agent serving Hospital A must
never expose data from Hospital B. This must be enforced at the application layer, as
Cosmos DB partition keys provide logical (not cryptographic) separation.

## ✅ Decision

**Deploy 4 shared agent types on Container Apps, with `hospital_id` as the mandatory
tenant discriminator enforced at every layer.**

The 4 agent types are:

1. **Triage Agent** — GPT-4o-mini; classifies incoming events, routes to specialist agents
2. **Clinical Ops Agent** — GPT-4o; patient flow optimization, capacity planning
3. **Scheduling Agent** — GPT-4o; staff scheduling, resource allocation
4. **Reporting Agent** — GPT-4o-mini; KPI aggregation, compliance reports

Tenant isolation is enforced through a defense-in-depth chain:

- **API layer**: Each hospital has a dedicated APIM Subscription Key; requests carry `hospital_id` in JWT claims
- **Agent SDK middleware**: Validates `hospital_id` presence and injects it into every Cosmos DB query predicate
- **Data layer**: Cosmos DB partition key `/hospital_id` physically co-locates hospital data; cross-partition queries are disabled in SDK configuration
- **Audit**: All agent invocations log `hospital_id` to Log Analytics for cross-tenant anomaly detection

## 🔄 Alternatives Considered

| Option                                                     | Pros                                                                                                                    | Cons                                                                                                                                        | WAF Impact                          |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| **Per-hospital agent instances** (rejected)                | Strong compute isolation; one hospital outage doesn't affect others                                                     | 25× resource multiplication; ~€3,500/month extra compute; 25× deployment pipelines; SKU limits may apply                                    | Cost: ↓↓, Operations: ↓↓            |
| **Shared agents with `hospital_id` enforcement** ✅        | ~60% lower compute cost; single deployment pipeline; horizontal scale on demand; 50–75 concurrent executions (not 200+) | Application-layer isolation requires thorough testing; data leakage risk if middleware has a bug; compliance documentation must be explicit | Cost: ↑↑, Operations: ↑             |
| **Per-hospital Azure AI Foundry Projects**                 | Native isolation at Foundry project level; easier audit trails                                                          | Foundry project limits may apply at 25+ projects; per-project billing overhead; more complex RBAC management                                | Security: ↑, Cost: ↓, Operations: ↓ |
| **VNet-isolated per-hospital Container Apps Environments** | Network-layer isolation; each hospital has its own IP address space                                                     | 25× Container Apps Environment cost (~€140/month each = €3,500+/month); massive over-engineering for shared logic                           | Cost: ↓↓↓                           |

## ⚖️ Consequences

### Positive

- Reduces Container Apps compute from ~200 concurrent instances to ~50–75 (25 hospitals × 2–3 active workflows)
- Single Bicep deployment pipeline covers all hospitals; new hospital onboarding is a data operation (add `hospital_id` record + APIM subscription)
- GPT-4o-mini used for high-volume, low-complexity agents (Triage, Reporting) reduces OpenAI cost by ~75% on those invocations
- Shared prompt templates and clinical rules benefit all hospitals simultaneously (model improvements roll out once)
- Scales to 50+ hospitals without architecture changes (just more concurrent executions)

### Negative

- Application-layer isolation is the primary security boundary; a middleware bug could expose cross-tenant data — requires mandatory integration tests before every release
- Shared infrastructure means a noisy neighbour with extreme query volume could impact other hospitals (mitigated by Cosmos DB Autoscale and APIM per-subscription rate limits)
- Compliance documentation must explicitly describe the isolation model and why it is sufficient under GDPR and NEN 7510

### Neutral

- Hospital-specific customizations (system prompts, clinical thresholds) stored in Cosmos DB per `hospital_id`; agents load them at invocation start
- Per-hospital APIM Subscription Keys provide individual auditability and revocation without requiring separate agent deployments

## 🏛️ WAF Pillar Analysis

| Pillar         | Impact | Notes                                                                                                                                                                                     |
| -------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔒 Security    | →      | Application-layer isolation is the primary boundary; APIM subscription keys + JWT `hospital_id` + SDK middleware provide defense-in-depth; mandatory integration test gate before release |
| 🔄 Reliability | ↑      | Lower concurrent replica count reduces blast radius; fewer services to monitor and scale; single deployment means less configuration drift                                                |
| ⚡ Performance | ↑      | 50–75 concurrent executions vs. 200+; Cosmos DB Autoscale serves all hospitals without individual RU/s allocation per hospital                                                            |
| 💰 Cost        | ↑↑     | ~60% reduction in Container Apps compute; GPT-4o-mini for Triage/Reporting reduces OpenAI spend by ~€80–120/month                                                                         |
| 🔧 Operations  | ↑↑     | Single deployment pipeline; onboard new hospital with APIM subscription + data seed (no infra changes); shared telemetry across all hospitals in Log Analytics                            |

## 🔒 Compliance Considerations

- **GDPR Article 5(1)(f) (Integrity and Confidentiality)**: The shared agent model must implement appropriate technical measures to prevent accidental cross-tenant data disclosure. The three-layer enforcement (APIM, SDK middleware, Cosmos DB partition key) satisfies this requirement, but must be documented in the DPIA.
- **GDPR Article 28 (Data Processing Agreement)**: Each hospital must sign a DPA before their `hospital_id` is enabled in APIM. The DPA onboarding gate is a hard prerequisite (enforced as an APIM product subscription gate).
- **NEN 7510 §9.1 (Access Control Policy)**: The policy must explicitly state that logical isolation via application-layer `hospital_id` enforcement is the adopted control, with compensating monitoring (cross-tenant query anomaly alerts in Log Analytics).
- **ISO 27001 A.9.4 (System and Application Access Control)**: Access control is enforced per invocation via APIM subscription key + JWT validation in the agent SDK; this must be included in the System Hardening Standard.
- **DPIA Requirement**: The shared infrastructure model means all hospital data co-resides in the same Cosmos DB account (different partition keys). This must be explicitly evaluated in the DPIA. Compensating control: data is pseudonymized before entry (Ingestion Proxy), and the partition key is non-guessable (internal UUID, not hospital name).

## 📝 Implementation Notes

- Agent SDK middleware (Python): validate `hospital_id` is present in every request context before any Cosmos DB call; raise `403 Forbidden` if missing or mismatched
- Cosmos DB queries: all queries must include `WHERE c.hospital_id = @hospitalId` using parameterized queries; SDK config: `enableCrossPartitionQuery: false`
- APIM: create one Product per hospital; each Product has one Subscription Key; rate limit set at 100 req/min per subscription
- APIM policy: extract `hospital_id` from JWT `sub` claim and inject as `X-Hospital-ID` header for downstream validation
- Container Apps: configure `--min-replicas 1` to avoid cold start latency at hospital shift changes (07:00, 14:00, 21:00 CET)
- Cross-tenant anomaly detection: Log Analytics alert on `hospital_id` in query response differing from `hospital_id` in request JWT

---

<div align="center">

| ⬅️ [ADR-0001](03-des-adr-0001-cosmos-db-autoscale-for-healthcare-rpo.md) | 🏠 [Project Index](README.md) | ➡️ [ADR-0003](03-des-adr-0003-ingestion-proxy-for-phi-isolation.md) |
| ------------------------------------------------------------------------ | ----------------------------- | ------------------------------------------------------------------- |

</div>

> Generated by design agent | 2026-05-19
