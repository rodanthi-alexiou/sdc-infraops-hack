# ADR-0003: Ingestion Proxy Pattern for PHI Isolation at Event Hubs Boundary

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
> Deciders: Architecture team, DPO, Security lead

## 🔍 Context

CareFlow AI ingests real-time clinical events from 25 hospital EHR systems (Chipsoft HiX,
Epic, and EPIC-compatible HL7 FHIR APIs). These event streams potentially contain raw
**Protected Health Information (PHI)** — patient identifiers, diagnoses, medication records,
and admission events.

Azure Event Hubs is the chosen streaming backbone for this data. However, Event Hubs has a
critical data-retention characteristic: **events are immutable once written and retained
for up to 7 days** (Standard tier). If raw PHI enters Event Hubs, it cannot be selectively
deleted to fulfill a GDPR Article 17 (right to erasure) request without deleting the entire
partition — which would destroy all hospital events for that period, not just the individual's data.

The GDPR Data Protection Officer (DPO) has confirmed that **raw PHI must not be written to
any immutable or append-only store**. This includes Event Hubs, Azure Blob Storage append
blobs, and immutable WORM storage.

## ✅ Decision

**Deploy a lightweight Ingestion Proxy (Container App, 1 vCPU / 2 GiB) that intercepts all
hospital event streams before they reach Event Hubs, enforces a PHI schema allowlist, and
pseudonymizes patient identifiers before forwarding.**

The Ingestion Proxy performs three operations on every inbound event:

1. **Schema validation**: Checks the payload against a per-hospital PHI allowlist maintained
   in Azure App Configuration. Fields containing direct identifiers (BSN, date of birth,
   full name, address) are not in the allowlist. A payload containing any disallowed field
   is rejected with HTTP 422 and logged to the audit trail.

2. **Pseudonymization**: Patient identifiers (patient reference numbers) are replaced with
   an HMAC-SHA256 keyed hash. The HMAC key is per-hospital, stored in Key Vault, and rotated
   quarterly. The original identifier is never written to any downstream system.

3. **Selective forwarding**: Only validated, pseudonymized events are written to Event Hubs.
   PHI-containing events are quarantined in an isolated Storage Account container pending
   DPO review and are never forwarded.

## 🔄 Alternatives Considered

| Option                                          | Pros                                                                                                                                                                    | Cons                                                                                                                                      | WAF Impact                                        |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| **Ingestion Proxy (Container App)** ✅          | PHI never enters Event Hubs; GDPR Art.17 deletion limited to Cosmos DB PHI store; clear audit trail of rejections; HMAC pseudonymization reversible if legally required | Adds ~30ms latency; one more component to deploy and monitor; HMAC key rotation needs coordination                                        | Security: ↑↑, Reliability: →, Cost: +€30–50/month |
| **Event Hubs Capture + post-processing filter** | No additional component; capture raw events then clean                                                                                                                  | Raw PHI enters Event Hubs before cleaning; violates "PHI must not enter immutable stores" constraint; risk window between write and clean | Security: ↓↓ — **rejected**                       |
| **Schema Registry enforcement (Event Hubs)**    | Native Event Hubs feature; schema validation before write                                                                                                               | Schema Registry validates structure, not field-level PHI content; cannot pseudonymize identifiers; no reject-and-log capability           | Security: ↓ — insufficient for PHI                |
| **FHIR API layer (Azure API for FHIR)**         | Purpose-built for healthcare HL7 FHIR; native PHI handling; audit logging                                                                                               | Significant cost (€500+/month); over-engineered for CareFlow AI's anonymized-pointer event model; adds complex FHIR→internal mapping      | Cost: ↓↓, Operations: ↓                           |
| **Client-side pseudonymization (at hospital)**  | PHI never leaves hospital premises                                                                                                                                      | Relies on hospital IT implementing pseudonymization correctly; unverifiable by CareFlow; DPA scope unclear                                | Security: ↓ (unauditable), Operations: ↓↓         |

## ⚖️ Consequences

### Positive

- GDPR Article 5(1)(f) and Article 17 compliance: PHI never enters Event Hubs or any immutable store
- Azure OpenAI ZDR (Zero Data Retention) policy combined with Ingestion Proxy means PHI is never exposed to any third-party model provider
- Rejection log provides an audit trail of suspicious payloads (anomalous field counts, unexpected PHI patterns)
- Pseudonymization is reversible by the Data Controller (CareFlow AI) if legally required (e.g., court order), using the Key Vault HMAC key
- Decouples hospital integration complexity from the streaming backbone; hospitals with messy EHR exports are handled at the proxy boundary

### Negative

- Adds ~30ms synchronous latency to the ingestion path (acceptable for non-real-time clinical events)
- One additional operational component (1 vCPU Container App); must be included in DR procedures
- HMAC key rotation requires coordinated rollover to avoid rejecting valid events during the transition window
- PHI quarantine container in Storage Account requires access policy separate from the main data lake

### Neutral

- Ingestion Proxy is stateless; it does not store events — it transforms and forwards them
- The pseudonymization approach (HMAC-SHA256) is deterministic: the same patient reference produces the same pseudonym, enabling event correlation across time without requiring a lookup table

## 🏛️ WAF Pillar Analysis

| Pillar         | Impact | Notes                                                                                                                                                                 |
| -------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 🔒 Security    | ↑↑     | PHI eliminated from all streaming and immutable stores; audit trail of rejections; HMAC keys in Key Vault Premium; defense against hospital EHR misconfigurations     |
| 🔄 Reliability | →      | Additional component in the ingestion path; if the proxy fails, ingestion halts (Circuit Breaker pattern recommended); mitigated by min-replicas=1 and health probes  |
| ⚡ Performance | ↓      | ~30ms added latency per event; negligible for batch analytics workloads; potential bottleneck if hospital sends > 10K events/second (monitored via APIM/App Insights) |
| 💰 Cost        | →      | €30–50/month for 1 vCPU Container App; justified by avoiding €500+ FHIR API alternative                                                                               |
| 🔧 Operations  | ↑      | Rejection logs simplify compliance audits; quarantine bucket provides DPO visibility into problematic hospital integrations; one more component to patch and update   |

## 🔒 Compliance Considerations

- **GDPR Article 5(1)(c) (Data Minimisation)**: Only fields required for AI agent processing are forwarded; all direct identifiers are pseudonymized or stripped. This satisfies the data minimisation principle.
- **GDPR Article 5(1)(f) (Integrity and Confidentiality)**: The Ingestion Proxy is the primary technical measure ensuring patient data confidentiality downstream. This control must be referenced in the DPIA.
- **GDPR Article 17 (Right to Erasure)**: Because PHI never enters Event Hubs, erasure requests are fulfilled by deleting records from Cosmos DB (partition key delete). No Event Hub partition management required for GDPR erasure.
- **GDPR Article 25 (Data Protection by Design)**: The proxy implements privacy-by-design — PHI is pseudonymized before entering the processing pipeline, not after.
- **NEN 7510 §12.2 (Protection of Test Data)**: The quarantine container containing rejected PHI payloads is classified as sensitive and must have the same access controls as production PHI stores (RBAC only, no public access, audit logging enabled).
- **HMAC key management**: HMAC-SHA256 keys are 32-byte secrets stored in Key Vault Premium. Key rotation policy: 90 days. Rotation procedure must be documented in the operational runbook to prevent a rotation window gap.

## 📝 Implementation Notes

- Deploy Ingestion Proxy as a Container App with `ingress: external: false` (internal only); expose via internal VNet DNS
- PHI allowlist stored in Azure App Configuration (Feature Flags) keyed by `hospital_id`; proxy loads allowlist at startup and refreshes every 5 minutes
- HMAC-SHA256 pseudonymization: `pseudonym = HMAC-SHA256(key=KV_SECRET, message=patient_ref_id)`; key retrieved from Key Vault via Managed Identity at startup (cached in memory, not environment variable)
- Quarantine: rejected events written to `st{env}careflowphiq` container with Immutable WORM policy for DPO audit access (separate Storage Account from the data lake to avoid contamination)
- Health probe: `/health/live` returns 200 if Key Vault and App Configuration are reachable; Container App health probe uses this endpoint
- Circuit Breaker: if rejection rate exceeds 20% in a 5-minute window, emit alert to Log Analytics and page on-call; do not auto-stop ingestion (hospitals with poor EHR exports should not block others)
- HMAC key rotation rollover: store two valid keys simultaneously in Key Vault (current + previous); proxy accepts events signed with either key during a 24-hour overlap window

---

<div align="center">

| ⬅️ [ADR-0002](03-des-adr-0002-shared-multitenant-agent-model.md) | 🏠 [Project Index](README.md) |
| ---------------------------------------------------------------- | ----------------------------- |

</div>

> Generated by design agent | 2026-05-19
