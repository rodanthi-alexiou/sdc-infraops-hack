# Workshop Guide

> Run a full APEX workshop in 1 day (Steps 1-4) or 2 days (Steps 1-7). Works for facilitator-led sessions AND self-service.

---

## Two Modes

| Mode                | When to Use                                                   | Participants                      |
| ------------------- | ------------------------------------------------------------- | --------------------------------- |
| **Facilitator-led** | Microsoft SDC/CSA engagement, partner hackathon, customer day | 4-20 people in 1-5 teams          |
| **Self-service**    | ISV engineer following at their own pace                      | 1-3 people, no facilitator needed |

Everything below applies to both modes. Sections marked 🎤 are facilitator-specific.

---

## Pre-Workshop Checklist

### Participants Need

- [ ] VS Code installed (latest stable)
- [ ] GitHub Copilot license active (verify with `@workspace /help` in chat)
- [ ] Docker Desktop running (for Dev Container)
- [ ] Git installed and authenticated to GitHub
- [ ] Azure subscription (optional for Day 1 / Steps 1-4; required for Day 2 / Steps 5-7)
- [ ] This repo cloned and opened in Dev Container

### 🎤 Facilitator Also Needs

- [ ] Projector / screen share setup
- [ ] Printed role cards (see below) — 1 set per team
- [ ] Pre-filled scenario document (use one from `scenarios/` or customize)
- [ ] Teams channel or shared doc for Q&A
- [ ] Backup Azure subscription with contributor access (for live deploy demos)

---

## Day 1 Agenda — Architecture + Planning (Steps 1-4)

| Time  | Duration | Activity                                                  | APEX Step           |
| ----- | -------- | --------------------------------------------------------- | ------------------- |
| 09:00 | 30 min   | Kickoff: Problem framing + APEX intro                     | —                   |
| 09:30 | 15 min   | Environment check + Dev Container setup                   | —                   |
| 09:45 | 45 min   | **Challenge 1:** Requirements capture                     | Step 1              |
| 10:30 | 15 min   | Break                                                     | —                   |
| 10:45 | 60 min   | **Challenge 2:** Architecture design + WAF review         | Step 2              |
| 11:45 | 30 min   | **Challenge 3:** Governance discovery                     | Step 3.5            |
| 12:15 | 45 min   | Lunch                                                     | —                   |
| 13:00 | 60 min   | **Challenge 4:** Implementation planning                  | Step 4              |
| 14:00 | 30 min   | **Challenge 5:** Scale curveball (requirements change!)   | Steps 1-2 (revisit) |
| 14:30 | 15 min   | Break                                                     | —                   |
| 14:45 | 45 min   | **Challenge 6:** Iterate architecture for new constraints | Steps 2-4 (revisit) |
| 15:30 | 30 min   | **Challenge 7:** Documentation + ADRs                     | Step 3 (Design)     |
| 16:00 | 45 min   | **Challenge 8:** Team showcase presentations              | —                   |
| 16:45 | 15 min   | Wrap-up + next steps                                      | —                   |

### Pacing Tips

- Challenges 1-2 are the foundation — don't rush them
- Challenge 5 is designed to break assumptions. Let teams struggle briefly before hinting
- Not all teams will complete all challenges — that's fine. Depth > breadth
- The goal is learning the workflow, not producing perfect artifacts

---

## Day 2 Agenda — Code + Deploy (Steps 5-7) — Optional

| Time  | Duration | Activity                              | APEX Step |
| ----- | -------- | ------------------------------------- | --------- |
| 09:00 | 15 min   | Recap Day 1 decisions                 | —         |
| 09:15 | 90 min   | IaC code generation + validation      | Step 5    |
| 10:45 | 15 min   | Break                                 | —         |
| 11:00 | 60 min   | Deployment (what-if + apply)          | Step 6    |
| 12:00 | 45 min   | Lunch                                 | —         |
| 12:45 | 60 min   | As-built documentation                | Step 7    |
| 13:45 | 30 min   | Load testing / diagnostics (optional) | —         |
| 14:15 | 45 min   | Final showcase + lessons learned      | —         |

---

## Challenge Structure

Each challenge follows this pattern:

```
┌─────────────────────────────────────────┐
│  CHALLENGE N: [Title]                   │
│                                         │
│  🎯 Objective: What you're achieving    │
│  📥 Input: What you need to start       │
│  🤖 Agent: Which agent to invoke        │
│  📤 Output: What artifact to produce    │
│  ✅ Done When: Success criteria         │
│  ⏱️ Time Box: Suggested max duration    │
│                                         │
│  💡 Hints (if stuck):                   │
│  - Hint 1                               │
│  - Hint 2                               │
└─────────────────────────────────────────┘
```

### Challenge 1: Requirements

|              |                                                                           |
| ------------ | ------------------------------------------------------------------------- |
| 🎯 Objective | Capture complete requirements from the scenario                           |
| 📥 Input     | Your scenario document (from `scenarios/` or your own BYOS template)      |
| 🤖 Agent     | Orchestrator → delegates to Requirements agent                            |
| 📤 Output    | `agent-output/{project}/01-requirements.md`                               |
| ✅ Done When | Functional requirements, NFRs, constraints, and stakeholders are captured |
| ⏱️ Time Box  | 45 minutes                                                                |

**How:** Open Copilot Chat → select the **01-Orchestrator** agent → paste your scenario → follow the conversation.

💡 **Hints:**

- The agent will ask clarifying questions. Answer from the scenario doc — don't invent.
- If the agent misses something, point it out: "What about compliance requirements?"
- Review the output. Does it capture your budget, region, team size, compliance needs?

### Challenge 2: Architecture

|              |                                                                 |
| ------------ | --------------------------------------------------------------- |
| 🎯 Objective | Produce a WAF-aligned architecture with cost estimate           |
| 📥 Input     | Approved `01-requirements.md`                                   |
| 🤖 Agent     | Orchestrator → delegates to Architect agent                     |
| 📤 Output    | `02-architecture-assessment.md` + cost estimate                 |
| ✅ Done When | All 5 WAF pillars scored, services selected, cost within budget |
| ⏱️ Time Box  | 60 minutes                                                      |

💡 **Hints:**

- Ask "Why this service instead of X?" — the agent should justify choices
- Challenge the cost estimate: "What if we used consumption tier instead?"
- Check: Does it address your scale requirements? Multi-tenancy needs?

### Challenge 3: Governance

|              |                                                                 |
| ------------ | --------------------------------------------------------------- |
| 🎯 Objective | Discover actual Azure Policy assignments that affect deployment |
| 📥 Input     | Azure subscription access (or use the provided policy fixture)  |
| 🤖 Agent     | Orchestrator → delegates to Governance agent                    |
| 📤 Output    | `04-governance-constraints.md/.json`                            |
| ✅ Done When | Policy effects classified, potential blockers identified        |
| ⏱️ Time Box  | 30 minutes                                                      |

💡 **Hints:**

- If no Azure subscription available, the agent can work with a policy fixture file
- Look for "Deny" policies — these WILL block deployment if not addressed
- Check: Are there policies that force specific regions, tags, or networking?

### Challenge 4: Implementation Plan

|              |                                                                    |
| ------------ | ------------------------------------------------------------------ |
| 🎯 Objective | Create a detailed IaC implementation plan with module dependencies |
| 📥 Input     | Approved architecture + governance constraints                     |
| 🤖 Agent     | Orchestrator → delegates to IaC Planner agent                      |
| 📤 Output    | `04-implementation-plan.md` + dependency diagram                   |
| ✅ Done When | Modules listed, dependencies mapped, deployment phases defined     |
| ⏱️ Time Box  | 60 minutes                                                         |

💡 **Hints:**

- Ask the agent to use Azure Verified Modules (AVM) where available
- Check: Are governance constraints reflected in the plan?
- Verify deployment phases make sense (networking → compute → data → AI)

### Challenge 5: Scale Curveball

|              |                                                                   |
| ------------ | ----------------------------------------------------------------- |
| 🎯 Objective | Adapt the architecture when requirements change dramatically      |
| 📥 Input     | **Curveball prompt** (facilitator reveals, or read from scenario) |
| 🤖 Agent     | Orchestrator (re-enter at Step 2)                                 |
| 📤 Output    | Updated architecture and plan                                     |
| ✅ Done When | Architecture handles new scale with justified decisions           |
| ⏱️ Time Box  | 30 minutes                                                        |

💡 **Hints:**

- This is where ADRs (Architecture Decision Records) shine
- Document WHY you changed, not just WHAT you changed
- The budget usually increases with scale — factor that in

### Challenges 6-8: Documentation, Testing, Showcase

These challenges are flexible — adapt to your audience:

- **Challenge 6:** Use the Diagnostics agent to validate architecture assumptions
- **Challenge 7:** Generate ADRs and operational runbooks using Design/As-Built agents
- **Challenge 8:** Each team presents their architecture, decisions, and lessons learned (5-10 min per team)

---

## Team Role Cards

Teams of 3-5 work best. Assign these roles at the start:

### 🚗 Driver

- Hands on keyboard
- Types all commands, executes agent prompts
- Shares screen so team can follow
- **Rule:** Never execute without team consensus

### 🧭 Navigator

- Reads challenge instructions aloud
- Guides what to do next
- Watches for errors and time
- Keeps team on track when rabbit holes appear

### 🏗️ Architect

- Reviews every agent suggestion before approval
- Validates against WAF pillars and NFRs
- Makes SKU and service decisions
- Questions everything: "Why? What's the cost? Does it scale?"

### 📝 Documenter

- Notes key decisions and rationale
- Captures "we chose X because Y"
- Tracks blockers and how they were resolved
- Prepares the team showcase presentation

### 🔄 Floater (5th member)

- Supports whoever is bottlenecked
- Researches Azure docs when team needs info
- Helps Documenter prepare showcase
- Fresh eyes on architecture decisions

### Role Rotation

For an 8-challenge day, rotate every 2 challenges:

| Challenges | Driver | Navigator | Architect | Documenter |
| ---------- | ------ | --------- | --------- | ---------- |
| 1-2        | A      | B         | C         | D          |
| 3-4        | B      | C         | D         | A          |
| 5-6        | C      | D         | A         | B          |
| 7-8        | D      | A         | B         | C          |

---

## 🎤 Facilitator Notes

### Opening the Session

Frame it as discovery, not training:

> "We're not here to follow a script. We're here to explore how AI agents can accelerate platform engineering. You'll make real architecture decisions, challenge agent recommendations, and produce artifacts you could actually use. The agents propose — your team decides."

### Managing Pace

- Watch for teams stuck > 10 min on a single issue → offer a hint
- If a team finishes early → challenge them: "What if your budget was halved?" or "What if you needed multi-region?"
- Challenge 5 should feel disruptive — that's the point

### Common Stumbling Points

| Issue                              | Quick Fix                                                  |
| ---------------------------------- | ---------------------------------------------------------- |
| Dev Container won't start          | Check Docker Desktop is running, try "Rebuild Container"   |
| Agent not responding               | Verify Copilot license, try `@workspace /help`             |
| "Permission denied" on governance  | Ensure Reader role on subscription (or use policy fixture) |
| Architecture seems over-engineered | Remind them of budget constraint — cost is a WAF pillar    |
| Team disagreement on decisions     | That's healthy! Architect role gets tie-breaker            |

### Closing the Session

- Each team presents (5-10 min): Architecture diagram → key decisions → lessons
- Celebrate what worked AND what didn't (failures = learning)
- Share the BYOS template for teams to use with their own scenarios post-workshop

---

## Self-Service Mode

If you're running this solo or in a small team without a facilitator:

1. Pick a scenario from `scenarios/` (or fill in your own via `byos-template.md`)
2. Follow the challenge structure above at your own pace
3. Use the time boxes as rough guides, not hard limits
4. You can skip Challenges 6-8 and go straight to Steps 5-7 (Code + Deploy) if you prefer
5. The agents provide all the guidance you need — no facilitator required

The key insight: **talk to the Orchestrator agent as if it's your tech lead**. Ask it questions. Push back on suggestions. The more you engage, the better the output.

---

## After the Workshop

Participants leave with:

- [ ] Real architecture artifacts (requirements, architecture doc, governance constraints, implementation plan)
- [ ] Experience using AI agents for platform engineering
- [ ] The BYOS template to run the same workflow on their own product
- [ ] Understanding of WAF pillars and how to evaluate architecture decisions
- [ ] (Day 2) Deployed Azure infrastructure + operational documentation
