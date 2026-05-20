# Context Window Optimization Report

**Generated**: 2026-05-20T11:02:00Z
**Sessions Analyzed**: 3
**Total Requests**: 1,218
**Focus Session**: `20260519T075318` (27-hour CareFlowAI workflow run)

---

## Executive Summary

| Metric                         | Current             | Target | Impact                                 |
| ------------------------------ | ------------------- | ------ | -------------------------------------- |
| Avg latency (Opus turns)       | 14.7s               | <10s   | Better responsiveness, fewer timeouts  |
| Summarization triggers         | 38 per session      | <10    | ~19.5M tokens saved from re-compaction |
| Context overflow errors        | 4 (HTTP 400)        | 0      | Eliminates wasted retry tokens         |
| Long turns (>15s)              | 210 / 1,078 (19.5%) | <10%   | Faster iteration cycles                |
| Estimated total input tokens   | ~120.8M             | ~80M   | ~34% reduction potential               |
| Challenger subagent token cost | 7.95M (6.6%)        | ~4M    | Better scoping of review context       |

### Key Insight

**61.3% of all tokens** are consumed by `panel/editAgent` turns (the main agent working).
**16.2%** is pure overhead from `summarizeConversationHistory` — context grew so large
the system needed 38 compaction cycles averaging 74 seconds each. This is the
single biggest optimization target.

---

## Session Breakdown

### Session 1: `20260426T155212` (Apr 27, ~2 min)

- 10 requests, 1 long turn, **escalating** latency trend
- Models: gpt-4o-mini (6), claude-sonnet-4-5 (4)
- Assessment: **Normal** — short exploratory session

### Session 2: `20260518T121109` (May 18, ~3.25 hours)

- 130 requests, 40 long turns, **decreasing** trend
- Models: claude-sonnet-4-6 (88), gpt-4o-mini (37), haiku (5)
- Assessment: **Moderate pressure** — avg 21.3s/turn, p95 at 93.5s
- 7 `summarizeConversationHistory` calls = context grew past limits multiple times

### Session 3: `20260519T075318` (May 19-20, ~27 hours) — CRITICAL

- 1,078 requests, 210 long turns, **stable** trend
- Models: claude-opus-4-6 (465), gpt-4o-mini (309), claude-sonnet-4-6 (267)
- Assessment: **Severe context pressure** throughout

#### Token Distribution by Model

| Model             | Requests | Est. Tokens | Share |
| ----------------- | -------- | ----------- | ----- |
| claude-opus-4-6   | 465      | ~64.9M      | 53.7% |
| claude-sonnet-4-6 | 267      | ~40.9M      | 33.8% |
| gpt-4o-mini       | 309      | ~8.7M       | 7.2%  |
| gpt-5.3-codex     | 14       | ~5.0M       | 4.1%  |

#### Token Distribution by Request Type

| Request Type                 | Est. Tokens | Share     | Notes              |
| ---------------------------- | ----------- | --------- | ------------------ |
| panel/editAgent              | ~74.1M      | 61.3%     | Primary agent work |
| summarizeConversationHistory | ~19.5M      | **16.2%** | PURE OVERHEAD      |
| challenger-review-subagent   | ~7.95M      | 6.6%      | 45 review passes   |
| copilotLanguageModelWrapper  | ~7.5M       | 6.2%      | Internal routing   |
| cost-estimate-subagent       | ~5.0M       | 4.1%      | 14 pricing lookups |
| tool/runSubagent (other)     | ~4.1M       | 3.4%      | General delegation |

---

## Finding Categories

### Critical — Context Overflow Risk

#### C1: 38 Summarization Cycles = 19.5M Tokens Wasted

The session triggered `summarizeConversationHistory` 38 times (avg latency 74s each).
This means the conversation outgrew the context window repeatedly and had to be
compacted — each compaction loses fidelity and costs ~500K tokens to execute.

**Root cause**: The Orchestrator drove the entire CareFlowAI workflow (Steps 1-5)
in a single session without natural breakpoints.

**Recommendation**: Implement session segmentation per workflow step. After each
step completion, checkpoint state to `00-session-state.json` and start a fresh
conversation for the next step. The Orchestrator already has hand-off patterns
but doesn't enforce conversation breaks.

#### C2: 4 Server 400 Errors (Context Overflow)

```
messages.1.content.2: `thinking` or `redacted_thin...
```

These are model-level rejections when the prompt exceeds the model's absolute limit.
Each costs ~120K tokens in the failed attempt, totaling ~480K wasted tokens.

**Root cause**: Accumulated context from multiple skill reads + conversation history +
tool results exceeded Claude's context window.

**Recommendation**: Add a defensive context budget check before large tool calls.
If estimated context > 80% of limit, trigger summarization proactively rather than
hitting the hard wall.

#### C3: 1,024-Second Turn (17 minutes)

A single `panel/editAgent` turn took 1,024.6 seconds — almost certainly a timeout
rather than genuine computation. This represents a full context window read + massive
output generation that likely failed or timed out internally.

**Recommendation**: Investigate what this turn was doing (likely Bicep CodeGen with
full implementation plan in context). Add circuit breaker: if a turn exceeds 120s,
abort and delegate to a subagent with narrower context.

### High — Significant Token Waste

#### H1: Challenger Subagent Context Bloat (7.95M tokens, 45 calls)

The challenger-review-subagent was invoked 45 times consuming ~177K tokens per call
on average. Each call likely loads the full artifact being reviewed PLUS the agent
definition PLUS the review rubric.

**Metrics**: 45 calls × 177K avg = 7.95M total
**Expected**: A well-scoped review should need ~60K tokens (artifact + rubric only)

**Recommendation**:

- Pass only the specific section under review, not the full artifact
- Use the challenger's `--lens` parameter to load only the relevant rubric section
- Consider batching: review 3 findings per invocation instead of 1

#### H2: Cost Estimate Subagent Overhead (5.0M tokens, 14 calls)

14 cost-estimate-subagent calls averaging ~357K tokens each. The subagent likely
re-loads the full architecture context for each pricing query.

**Recommendation**: Batch pricing queries — pass all SKUs in one call rather than
14 separate invocations. The Azure Pricing MCP supports multi-SKU queries.

#### H3: Agent Definition Sizes Near Threshold

| Agent                          | Lines | Status               |
| ------------------------------ | ----- | -------------------- |
| 03-architect.agent.md          | 437   | OVER threshold (350) |
| 04g-governance.agent.md        | 435   | OVER threshold (350) |
| 02-requirements.agent.md       | 416   | OVER threshold (350) |
| 01-orchestrator.agent.md       | 410   | OVER threshold (350) |
| 06t-terraform-codegen.agent.md | 391   | OVER threshold (350) |
| 06b-bicep-codegen.agent.md     | 382   | OVER threshold (350) |
| 05-iac-planner.agent.md        | 377   | OVER threshold (350) |

Each agent definition is loaded in full as system prompt tokens. At ~3 tokens/line,
the 437-line Architect adds ~1,300 fixed tokens per turn — multiplied by 606
`panel/editAgent` turns in this session = ~788K tokens just for agent definitions.

**Recommendation**: Move procedural details and examples to `references/` files
in the associated skill. Keep agent definitions under 350 lines with progressive
loading for the rest.

### Medium — Optimization Opportunity

#### M1: instruction `markdown.instructions.md` Has Overly Broad applyTo

```yaml
applyTo: "site/src/content/docs/**/*.{md,mdx}, .github/copilot-instructions.md,
  .github/PULL_REQUEST_TEMPLATE.md, .github/plugins/**/*.md,
  .github/prompts/**/*.md, .github/skills/**/templates/**/*.md,
  agent-output/**/*.md, docs/**/*.md, infra/**/*.md,
  tools/mcp-servers/**/*.md, tools/scripts/**/*.md, tests/**/*.md,
  AGENTS.md, README.md, CHANGELOG.md, CONTRIBUTING.md, CONTRIBUTORS.md,
  QUALITY_SCORE.md, VERSION.md"
```

This matches virtually every `.md` file in the repo. The 82-line instruction
gets loaded on every markdown-related operation (~4 tokens/line = 328 extra tokens
per markdown file touch).

**Recommendation**: Narrow to `site/src/content/docs/**/*.{md,mdx}, agent-output/**/*.md`
for doc-style rules. Other markdown files (agents, skills) have their own instructions.

#### M2: Skill reference/ Files Are Large But Appropriately Lazy-Loaded

The largest references (694 lines for foundry preset workflow, 613 for functions
templates) are only loaded on-demand, which is correct. No action needed unless
these are being loaded in turns where they're not used.

#### M3: 145 Burst Sequences (Rapid-Fire Requests)

145 burst events (requests <2s apart) indicate tight tool-call loops. The longest
burst (7 requests) was all `gpt-4o-mini` `copilotLanguageModelWrapper` — internal
routing, not user-facing. These are low-cost individually but indicate the system
is doing excessive internal coordination.

### Low — Minor Improvements

#### L1: 17 Git Remote Read Errors

```
[GitServiceImpl][getRepositoryFetchUrls] Failed to read remotes from .git/config
```

These are VS Code internal errors, not agent-related. Noise in the logs.

#### L2: `summarizeVirtualTools` Calls (2 × ~200K tokens)

Two calls to summarize available tools at 202K tokens each. These happen when the
tool list exceeds the model's comfortable threshold — related to the total number
of MCP tools + built-in tools registered.

**Recommendation**: Review whether all MCP servers need to be connected simultaneously.

---

## Recommended Hand-Off Points

| Current Agent                 | Breakpoint                       | New Pattern                                                    | Context Saved                       |
| ----------------------------- | -------------------------------- | -------------------------------------------------------------- | ----------------------------------- |
| Orchestrator (single session) | After each step approval gate    | Fresh conversation per step, state via `00-session-state.json` | ~19.5M (eliminates summarization)   |
| Orchestrator → Challenger     | Full artifact passed to reviewer | Pass only changed section + rubric lens                        | ~4M per session                     |
| Orchestrator → Cost Estimate  | 14 separate calls                | Single batched call with all SKUs                              | ~4.6M                               |
| Architect (437 lines)         | Inline procedural tables         | Move to skill `references/`                                    | ~400 tokens/turn × 400 turns = 160K |

---

## Instruction Consolidation

| Action                                    | Files Affected             | Token Savings                |
| ----------------------------------------- | -------------------------- | ---------------------------- |
| Narrow `markdown.instructions.md` applyTo | 1 instruction file         | ~328 tokens × N markdown ops |
| Trim agent defs to <350 lines             | 7 agent files              | ~1,300 tokens/turn reduction |
| Batch challenger reviews (3 per call)     | challenger-review-subagent | ~5.3M per full workflow      |

---

## Agent-Specific Recommendations

### 01-Orchestrator (410 lines)

- **Issue**: Drives entire multi-step workflow without conversation breaks
- **Recommendation**: After each approval gate, emit "Resume with: `apex-recall show <project>`" and end the conversation cleanly. User starts a new chat for the next step.
- **Impact**: Eliminates 38 summarization cycles worth ~19.5M tokens

### 03-Architect (437 lines, highest)

- **Issue**: 71 list items including inline WAF tables and decision frameworks
- **Recommendation**: Move WAF pillar evaluation criteria to `.github/skills/azure-defaults/references/waf-criteria.md`. Keep only the workflow steps in the agent definition.
- **Impact**: Agent definition drops to ~300 lines, saving ~400 tokens/turn

### challenger-review-subagent (288 lines, 45 invocations)

- **Issue**: Each invocation re-processes the full artifact under review
- **Recommendation**: Parent agent should extract the specific section(s) being challenged and pass only those, plus a compact rubric (not the full skill).
- **Impact**: ~60% reduction per call → ~4.8M saved over 45 calls

### cost-estimate-subagent (214 lines, 14 invocations)

- **Issue**: 14 separate pricing lookups, each re-loading architecture context
- **Recommendation**: Batch all SKU queries into 1-2 calls maximum. The MCP pricing tool supports multi-item queries.
- **Impact**: 12 fewer invocations × 357K = ~4.3M saved

---

## Implementation Priority

| Priority | Action                                     | Effort                           | Impact                   |
| -------- | ------------------------------------------ | -------------------------------- | ------------------------ |
| **P0**   | Session segmentation at approval gates     | Low (workflow guidance change)   | ~19.5M tokens/session    |
| **P1**   | Batch challenger reviews (3 findings/call) | Medium (subagent prompt change)  | ~5M tokens/session       |
| **P1**   | Batch cost estimate queries                | Low (parent agent prompt change) | ~4.3M tokens/session     |
| **P2**   | Trim agent definitions to <350 lines       | Medium (extract to references/)  | ~160K tokens/session     |
| **P2**   | Narrow markdown.instructions.md applyTo    | Low (1 line change)              | Variable                 |
| **P3**   | Proactive context budget check             | High (new mechanism needed)      | Prevents overflow errors |

---

## Cost Context

GitHub Copilot is **seat-licensed** — these token volumes don't generate per-token
charges. However, they directly impact:

1. **Response quality**: Context near limits → truncation → missed instructions
2. **Latency**: 210 turns >15s = significant developer wait time
3. **Reliability**: 4 overflow errors = lost work requiring retries
4. **Rate limits**: High token volume may trigger per-seat rate throttling

---

## Baseline Reference

Baseline snapshot: `ctx-opt-20260520-110236`

To compare after applying changes:

```bash
npm run diff:baseline -- --baseline ctx-opt-20260520-110236
```
