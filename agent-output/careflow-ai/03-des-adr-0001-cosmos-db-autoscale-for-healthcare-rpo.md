# ADR-0001: Use Cosmos DB Autoscale with Continuous Backup for Healthcare RPO

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
> Deciders: Architecture team, DPO

## 🔍 Context

CareFlow AI stores protected health information (PHI) — patient records, clinical events,
and agent-generated recommendations — in a primary data store. The project requirements specify
a **Recovery Point Objective (RPO) of 1 hour**, meaning data loss must not exceed 60 minutes
in a disaster scenario.

Three Cosmos DB capacity modes are available: **Serverless**, **Autoscale Provisioned**, and
**Fixed Provisioned**. The choice directly impacts backup granularity, max throughput, and
monthly cost.

The initial architecture draft used Cosmos DB Serverless for cost predictability, but the
challenger review identified a compliance gap: Cosmos DB Serverless only supports **periodic
backup with a minimum 4-hour interval**, which violates the 1-hour RPO requirement.

Additionally, 25 hospitals generating concurrent queries creates unpredictable spike patterns.
A hard throughput cap increases risk of 429 (throttling) errors during hospital peak hours
(07:00–09:00 and 15:00–17:00 CET).

## ✅ Decision

**Use Cosmos DB Autoscale Provisioned (400–4,000 RU/s) with Continuous Backup mode.**

Continuous Backup enables point-in-time restore (PITR) to any second within the last
30 days (configurable to 7 days minimum), satisfying the RPO=1h requirement with significant
margin. Autoscale Provisioned automatically scales throughput up to 4,000 RU/s during peaks
and down to 400 RU/s at rest, providing cost efficiency comparable to Serverless without the
backup limitation.

## 🔄 Alternatives Considered

| Option                                      | Pros                                                                                                                   | Cons                                                                                                                 | WAF Impact                                                |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| **Serverless** (original draft)             | Zero idle cost, pure consumption billing                                                                               | Periodic backup only (4h interval) — **violates RPO=1h**; 5,000 RU/s container cap risks throttling for 25 hospitals | Reliability: ↓, Cost: ↑ initially                         |
| **Autoscale Provisioned 400–4,000 RU/s** ✅ | Continuous backup (PITR < 1 min); auto-scales for peaks; no hard cap; GDPR Art.17 deletion via partition key supported | Minimum cost ~€20/month at rest; capacity planning still required                                                    | Reliability: ↑, Cost: → (slight increase over Serverless) |
| **Fixed Provisioned 4,000 RU/s**            | Predictable cost, Continuous Backup, full throughput always available                                                  | Over-provisioned at idle (paying 4,000 RU/s 24/7); 2× the cost of Autoscale                                          | Cost: ↓, Reliability: ↑                                   |
| **Azure SQL (PaaS)**                        | Strong ACID, familiar SQL tooling, Geo-redundant backup                                                                | Schema rigidity conflicts with variable agent state shape; no partition-key-based GDPR deletion; migration risk      | Operations: ↓                                             |

## ⚖️ Consequences

### Positive

- RPO ≤ 1h satisfied: Continuous Backup enables restore to any second in the last 30 days
- No 5,000 RU/s container cap — prevents throttling during hospital peak hours
- GDPR Article 17 (right to erasure) implementable by deleting per-hospital partition, then compacting
- Autoscale from 400 RU/s → 4,000 RU/s eliminates over-provisioning at idle
- Multi-partition model (`hospital_id` as partition key) distributes hot partitions evenly

### Negative

- Minimum monthly cost ~€50–80 (vs. ~€0 at rest for Serverless)
- Continuous Backup has a small per-GB storage fee for the backup store
- Autoscale does not reduce below 10% of the configured maximum (400 RU/s floor)

### Neutral

- Continuous Backup must be selected at account creation; migrating from Periodic Backup requires account recreation
- 30-day PITR retention is the default; 7-day is minimum; longer retention increases backup storage cost

## 🏛️ WAF Pillar Analysis

| Pillar         | Impact | Notes                                                                                                                  |
| -------------- | ------ | ---------------------------------------------------------------------------------------------------------------------- |
| 🔒 Security    | ↑      | Continuous Backup enables rapid recovery post-ransomware or accidental deletion; partition-key GDPR deletion preserved |
| 🔄 Reliability | ↑↑     | Satisfies RPO=1h (vs. 4h violation with Serverless); PITR to any second; zone-redundant replicas                       |
| ⚡ Performance | ↑      | Autoscale removes 5,000 RU/s cap that could cause 429 throttling under 25-hospital concurrent load                     |
| 💰 Cost        | ↓      | ~€50–80/month vs. ~€0 idle for Serverless; justified by compliance requirement; cheaper than Fixed Provisioned         |
| 🔧 Operations  | →      | PITR simplifies DR runbooks; no manual backup management; slightly more config to set autoscale max                    |

## 🔒 Compliance Considerations

- **NEN 7510 Annex A.12.3 (Information Backup)**: Continuous Backup satisfies the requirement for regular, tested backups of PHI systems. Periodic 4h backup would not meet the recovery objectives for a patient-critical system.
- **GDPR Article 5(1)(e) (Storage Limitation)**: PITR retention configured to 30 days for operational recovery; archive tier in Storage Account used for long-term retention (7 years per Dutch healthcare law).
- **GDPR Article 17 (Right to Erasure)**: Deletion of all records for a departing hospital tenant is achieved by deleting all documents with `hospital_id = <tenant>`, followed by a background compaction. Cosmos DB TTL can automate expiry for time-limited agent state records.
- **ISO 27001 A.12.3**: Backup and restore procedures must be documented and tested. PITR restore procedure must be included in the DR runbook.

## 📝 Implementation Notes

- Set `backupPolicy: { type: "Continuous", continuousModeProperties: { tier: "Continuous7Days" } }` in Bicep (upgrade to 30-day tier in production)
- Autoscale configured at account level: `autoscaleSettings: { maxThroughput: 4000 }`
- Partition key: `/hospital_id` — all queries must include `hospital_id` in filter to avoid cross-partition fan-out
- Enable `analyticalStorageTtl: -1` on containers used for agent state to allow Synapse Link integration (Phase 2)
- Restore procedure: `az cosmosdb restorable-database-accounts list` → identify restore point → `az cosmosdb create --is-restore-request true`
- Monitor: Alert on `NormalizedRUConsumption > 80%` to detect approaching autoscale ceiling before throttling

---

<div align="center">

| ⬅️ [Project Index](README.md) | ➡️ [ADR-0002](03-des-adr-0002-shared-multitenant-agent-model.md) |
| ----------------------------- | ---------------------------------------------------------------- |

</div>

> Generated by design agent | 2026-05-19
