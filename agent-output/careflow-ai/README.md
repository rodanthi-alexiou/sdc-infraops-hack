<!-- markdownlint-disable MD033 MD041 -->

<a id="readme-top"></a>

<div align="center">

![Status](https://img.shields.io/badge/Status-In%20Progress-yellow?style=for-the-badge)
![Step](https://img.shields.io/badge/Step-4%20of%207-blue?style=for-the-badge)
![Cost](https://img.shields.io/badge/Est.%20Cost-€2K--5K%2Fmo-purple?style=for-the-badge)

# 🏗️ CareFlow AI

**AI-driven operational intelligence platform for hospitals using Azure AI Foundry agents**

[View Architecture](#-architecture) · [View Artifacts](#-generated-artifacts) · [View Progress](#-workflow-progress)

</div>

---

## 📋 Project Summary

| Property           | Value               |
| ------------------ | ------------------- |
| **Created**        | 2026-05-19          |
| **Last Updated**   | 2026-05-20          |
| **Region**         | swedencentral       |
| **Environment**    | Dev + Production    |
| **Estimated Cost** | €2,000-€5,000/month |
| **AVM Coverage**   | TBD%                |

---

## ✅ Workflow Progress

```text
[█████░░░░░] 57% Complete
```

| Step | Phase          |                                    Status                                     | Artifact                                                                                                                                                                                                                                                       |
| :--: | -------------- | :---------------------------------------------------------------------------: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  1   | Requirements   |     ![Done](https://img.shields.io/badge/-Done-success?style=flat-square)     | [01-requirements.md](./01-requirements.md)                                                                                                                                                                                                                     |
|  2   | Architecture   |     ![Done](https://img.shields.io/badge/-Done-success?style=flat-square)     | [02-architecture-assessment.md](./02-architecture-assessment.md), [03-des-cost-estimate.md](./03-des-cost-estimate.md)                                                                                                                                         |
|  3   | Design         |     ![Done](https://img.shields.io/badge/-Done-success?style=flat-square)     | [03-des-diagram.drawio](./03-des-diagram.drawio), [ADR-0001](./03-des-adr-0001-cosmos-db-autoscale-for-healthcare-rpo.md), [ADR-0002](./03-des-adr-0002-shared-multitenant-agent-model.md), [ADR-0003](./03-des-adr-0003-ingestion-proxy-for-phi-isolation.md) |
| 3.5  | Governance     |     ![Done](https://img.shields.io/badge/-Done-success?style=flat-square)     | [04-governance-constraints.md](./04-governance-constraints.md), [04-governance-constraints.json](./04-governance-constraints.json)                                                                                                                             |
|  4   | Planning       |     ![Done](https://img.shields.io/badge/-Done-success?style=flat-square)     | [04-implementation-plan.md](./04-implementation-plan.md), [04-dependency-diagram.py](./04-dependency-diagram.py), [04-runtime-diagram.py](./04-runtime-diagram.py)                                                                                             |
|  5   | Implementation | ![Pending](https://img.shields.io/badge/-Pending-lightgrey?style=flat-square) | —                                                                                                                                                                                                                                                              |
|  6   | Deployment     | ![Pending](https://img.shields.io/badge/-Pending-lightgrey?style=flat-square) | —                                                                                                                                                                                                                                                              |
|  7   | Documentation  | ![Pending](https://img.shields.io/badge/-Pending-lightgrey?style=flat-square) | —                                                                                                                                                                                                                                                              |

> **Legend**:
> ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) Complete
> | ![WIP](https://img.shields.io/badge/-WIP-yellow?style=flat-square) In Progress
> | ![Pending](https://img.shields.io/badge/-Pending-lightgrey?style=flat-square) Pending
> | ![Skip](https://img.shields.io/badge/-Skipped-blue?style=flat-square) Skipped

---

## 🏛️ Architecture

4 shared AI agent types (Triage, Clinical Ops, Scheduling, Reporting) on Azure AI Foundry + Container Apps. Multi-tenant via `hospital_id` context routing. See [02-architecture-assessment.md](./02-architecture-assessment.md) for full Mermaid diagram and WAF analysis.

### Key Resources

| Resource              | Type              | SKU              | Purpose                                       |
| --------------------- | ----------------- | ---------------- | --------------------------------------------- |
| AI Foundry            | Azure AI Services | Standard         | Agent orchestration + LLM hosting             |
| Event Hubs            | Streaming         | Standard         | Real-time hospital data ingestion             |
| Data Factory          | Data Integration  | V2               | Batch ETL pipelines                           |
| API Management        | API Gateway       | Standard         | Hospital-facing API layer                     |
| Container Apps        | Compute           | Consumption      | Agent runtime hosting                         |
| Key Vault             | Security          | Standard         | Secrets and certificate management            |
| Storage Account       | Data Lake         | Standard         | Raw and processed data lake                   |
| Service Bus           | Messaging         | Standard         | Inter-service messaging                       |
| Azure OpenAI          | AI                | DataZoneStandard | GPT-4o + embeddings (EU zone — GDPR/NEN 7510) |
| Monitor + AppInsights | Observability     | —                | Telemetry and alerting                        |

---

## 📄 Generated Artifacts

<details open>
<summary><strong>📁 Step 1: Requirements</strong></summary>

| File                                       | Description                    |                                Status                                 | Created    |
| ------------------------------------------ | ------------------------------ | :-------------------------------------------------------------------: | ---------- |
| [01-requirements.md](./01-requirements.md) | Project requirements with NFRs | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-19 |

</details>

<details open>
<summary><strong>📁 Step 2: Architecture</strong></summary>

| File                                                             | Description                       |                                Status                                 | Created    |
| ---------------------------------------------------------------- | --------------------------------- | :-------------------------------------------------------------------: | ---------- |
| [02-architecture-assessment.md](./02-architecture-assessment.md) | WAF assessment (scores 8/7/8/7/7) | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-19 |
| [03-des-cost-estimate.md](./03-des-cost-estimate.md)             | Cost estimate ~€2,600–3,400/mo    | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-19 |
| [02-waf-scores.png](./02-waf-scores.png)                         | WAF pillar bar chart              | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-19 |
| [03-des-cost-distribution.png](./03-des-cost-distribution.png)   | Cost distribution donut chart     | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-19 |
| [03-des-cost-projection.png](./03-des-cost-projection.png)       | 6-month cost projection chart     | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-19 |

</details>

<details open>
<summary><strong>📁 Step 3: Design</strong></summary>

| File                                                                                                                     | Description                                          |                                Status                                 | Created    |
| ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------- | :-------------------------------------------------------------------: | ---------- |
| [03-des-diagram.drawio](./03-des-diagram.drawio)                                                                         | Architecture diagram (Draw.io, 19 Azure icons)       | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-19 |
| [03-des-adr-0001-cosmos-db-autoscale-for-healthcare-rpo.md](./03-des-adr-0001-cosmos-db-autoscale-for-healthcare-rpo.md) | ADR: Cosmos DB Autoscale vs Serverless               | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-19 |
| [03-des-adr-0002-shared-multitenant-agent-model.md](./03-des-adr-0002-shared-multitenant-agent-model.md)                 | ADR: Shared 4-agent model vs per-hospital instances  | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-19 |
| [03-des-adr-0003-ingestion-proxy-for-phi-isolation.md](./03-des-adr-0003-ingestion-proxy-for-phi-isolation.md)           | ADR: Ingestion Proxy for PHI isolation at Event Hubs | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-19 |

</details>

<details open>
<summary><strong>📁 Step 3.5: Governance</strong></summary>

| File                                                                           | Description                          |                                Status                                 | Created    |
| ------------------------------------------------------------------------------ | ------------------------------------ | :-------------------------------------------------------------------: | ---------- |
| [04-governance-constraints.md](./04-governance-constraints.md)                 | Governance constraints (3 active)    | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-19 |
| [04-governance-constraints.json](./04-governance-constraints.json)             | Machine-readable governance envelope | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-19 |
| [04-governance-constraints.preview.md](./04-governance-constraints.preview.md) | Governance preview/diff summary      | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-19 |

</details>

<details open>
<summary><strong>📁 Step 4: Planning</strong></summary>

| File                                                     | Description                          |                                Status                                 | Created    |
| -------------------------------------------------------- | ------------------------------------ | :-------------------------------------------------------------------: | ---------- |
| [04-implementation-plan.md](./04-implementation-plan.md) | IaC implementation plan (Bicep)      | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-20 |
| [04-dependency-diagram.py](./04-dependency-diagram.py)   | Dependency diagram source (Python)   | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-20 |
| [04-dependency-diagram.png](./04-dependency-diagram.png) | Dependency diagram (rendered)        | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-20 |
| [04-runtime-diagram.py](./04-runtime-diagram.py)         | Runtime flow diagram source (Python) | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-20 |
| [04-runtime-diagram.png](./04-runtime-diagram.png)       | Runtime flow diagram (rendered)      | ![Done](https://img.shields.io/badge/-Done-success?style=flat-square) | 2026-05-20 |

</details>

---

## 🔗 Related Resources

| Resource            | Path                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Bicep Templates** | [`infra/bicep/careflow-ai/`](../../infra/bicep/careflow-ai/)                                                       |
| **Workflow Docs**   | [Published workflow guide](https://jonathan-vella.github.io/azure-agentic-infraops/concepts/workflow/)             |
| **Troubleshooting** | [Published troubleshooting guide](https://jonathan-vella.github.io/azure-agentic-infraops/guides/troubleshooting/) |

---

<div align="center">

**Generated by [APEX](../../README.md)** · [Report Issue](https://github.com/jonathan-vella/azure-agentic-infraops/issues/new)

<a href="#readme-top">⬆️ Back to Top</a>

</div>
