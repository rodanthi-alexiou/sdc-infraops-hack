# Plan: APEX Agentic AI Technical Sales Motion

**TL;DR**: Fine-tune the repo for brownfield ISV scenarios (your partners' reality), complete the end-to-end proof point, then package as a "idea → deployed MVP in days" motion with a LinkedIn post + internal share + repeatable 1-day workshop format.

---

## Phase 1: Repo Fine-Tuning (Technical Work)

**P0 — Must-haves before posting:**

1. **Complete CareFlowAI IaC (Step 5)** — Run Bicep CodeGen to generate `infra/bicep/careflow-ai/` from the existing implementation plan. Right now you have a great story that stops at "here's the plan" — finishing the code proves the full pipeline. _(depends on nothing, can start immediately)_

2. **Add brownfield integration patterns** — Your ISVs aren't greenfield. Add a reference doc (`.github/skills/azure-ai-architect/references/brownfield-integration-patterns.md`) covering:
   - API Gateway injection (APIM AI Gateway in front of existing APIs)
   - Event-driven agent triggering (Service Bus → Agent → existing DB)
   - Sidecar agent pattern (agent alongside existing microservices)
   - "Strangler fig" for AI (gradually replace rules-based logic with agents)
     _(parallel with step 1)_

**P1 — High-value enhancements:**

3. **Generic ISV demo scenario** — CareFlowAI is healthcare-locked. Create a second scenario like "Customer Ops Agent Platform" (B2B SaaS adding ticket triage + knowledge retrieval + workflow agents) that 80% of your SDCs will identify with. _(depends on step 2 for patterns)_

4. **ISV cost economics reference** — Answers the exec question "will agents eat my margin?" Add: per-customer token cost estimation, PTU break-even guidance, "build from scratch vs. APEX-accelerated" timeline comparison. _(parallel with step 3)_

**P2 — Nice-to-haves:**

5. **BYOS (Bring Your Own Scenario) workshop template** — Generalize the MicroHack format from `CareFlowAI.md` so any ISV can plug their product context into Step 1 and get architecture out. _(depends on steps 3-4)_

---

## Phase 2: Content (Post)

**LinkedIn + Internal simultaneously:**

| Element | LinkedIn                                                                                                 | Internal (Teams/Viva)                                                               |
| ------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Hook    | "ISVs adding AI agents hit the same wall: architecture overwhelm → governance paralysis → POC graveyard" | "Here's a repeatable engagement model I built for ISV partners building agentic AI" |
| Proof   | CareFlowAI: full architecture + governance + IaC in a single session                                     | Same + "how to run this with your ISVs"                                             |
| CTA     | Link to repo                                                                                             | "DM me to co-deliver with your partners"                                            |
| Angle   | Technical credibility + business outcome                                                                 | Reusable PSA/CSA tool + consumption driver                                          |

---

## Phase 3: SDC Engagement Model

**Sequence**: Discovery call (30 min) → 1-day Workshop (BYOS) → Output (Steps 1-4 artifacts for their scenario) → Optional follow-up (Steps 5-7)

**What's most valuable for them technically:**

| ISV Pain                      | What APEX Delivers                                | Azure Consumption It Drives               |
| ----------------------------- | ------------------------------------------------- | ----------------------------------------- |
| "Where do I start?"           | Architecture generated from requirements in hours | AI Foundry, OpenAI, AI Search             |
| "Security review blocks us"   | Governance pre-cleared before code                | Defender, Policy, Private Endpoints       |
| "POC never ships"             | Production-grade IaC with security baseline       | Container Apps, APIM, Cosmos DB           |
| "Cost surprises at scale"     | Token cost projection + PTU decision tree         | Committed PTU capacity                    |
| "Every new customer = rework" | Multi-tenant patterns baked in                    | Per-tenant AI Search, Cosmos partitioning |

---

## Relevant Files

- `agent-output/careflow-ai/04-implementation-plan.md` — input for IaC code generation
- `CareFlowAI.md` — MicroHack narrative to generalize
- `.github/skills/azure-ai-architect/` — where brownfield patterns would live
- `.github/skills/azure-multitenant-architect/` — already has per-tenant AI patterns
- `tools/registry/agent-registry.json` — agent pipeline structure

---

## Verification

1. After Step 1: `bicep build infra/bicep/careflow-ai/main.bicep` passes
2. After Step 2: New patterns doc is referenced in `azure-ai-architect` SKILL.md
3. After Phase 2: Post draft reviewed for technical accuracy against repo artifacts
4. After Phase 3: Workshop can be run on a non-healthcare scenario end-to-end

---

## Further Considerations

1. **Second scenario choice** — "Customer Ops Agent Platform" is generic, but would a **developer tools ISV** scenario (code review agents, CI/CD optimization agents) resonate better with your specific SDCs? You know them best.

2. **Repo visibility** — Is this repo public-shareable with partners, or do you need a sanitized fork? The CareFlowAI narrative is fiction but the skills/agents are the real IP.

3. **Co-delivery model** — Do you want to position this as "I run the workshop for you" or "here's a self-service accelerator you clone and run yourself"? This affects how much documentation vs. tooling you need.
