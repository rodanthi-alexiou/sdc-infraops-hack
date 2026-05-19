<!-- ref:faos-optimize-v1 -->

# FAOS Optimize Sub-Skill

Convert agent code to Foundry Agent Optimization Service (FAOS) optimization-ready format for
eval-driven prompt and model tuning. Required for RAG accuracy improvement loops (WAF Reliability).

## When to Use

- Running an eval loop to improve RAG accuracy or groundedness scores
- Tuning model temperature or system prompt based on evaluator output
- Preparing an agent for batch evaluation via the `observe` sub-skill
- Comparing two agent configurations by sweeping a single parameter

## FAOS Optimization Pattern

FAOS-ready agents externalize `instructions`, `model`, and `temperature` so the evaluator can
sweep parameters without code changes:

```python
import os
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential

client = AIProjectClient(
    endpoint=os.environ["AZURE_AI_PROJECT_ENDPOINT"],
    credential=DefaultAzureCredential(),
)

DEFAULT_INSTRUCTIONS = "You are a helpful helpdesk assistant..."

# FAOS-ready config: externalize all tunable parameters as env vars
faos_config = {
    "instructions": os.environ.get("AGENT_INSTRUCTIONS", DEFAULT_INSTRUCTIONS),
    "model":        os.environ.get("AGENT_MODEL", "gpt-4o"),
    "temperature":  float(os.environ.get("AGENT_TEMPERATURE", "0.7")),
}

agent = client.agents.create_version(
    name="helpdesk-agent",
    **faos_config,
)
```

## Required Environment Variables

| Variable             | Purpose                                       | Default  |
| -------------------- | --------------------------------------------- | -------- |
| `AGENT_INSTRUCTIONS` | System prompt — overridden during eval sweeps | inline   |
| `AGENT_MODEL`        | Model deployment name                         | `gpt-4o` |
| `AGENT_TEMPERATURE`  | Sampling temperature (0.0–2.0)                | `0.7`    |

Store sweep values in `azure.yaml` `env:` block so azd injects them per environment:

```yaml
services:
  helpdesk-agent:
    host: containerapp
    env:
      AGENT_INSTRUCTIONS: ${AGENT_INSTRUCTIONS}
      AGENT_MODEL: ${AGENT_MODEL}
      AGENT_TEMPERATURE: ${AGENT_TEMPERATURE}
```

## Eval Loop Integration

After making the agent FAOS-ready, pair with the `observe` sub-skill:

1. **Baseline:** deploy → invoke with test set → collect traces
2. **Eval:** `observe` → score RAG accuracy, groundedness, relevance
3. **Optimize:** adjust `AGENT_INSTRUCTIONS` and/or `AGENT_TEMPERATURE`
4. **Compare:** re-run eval, compare delta scores
5. **Promote:** if target accuracy met, pin config in `azure.yaml`

## WAF Reliability Mapping

| NFR Target         | FAOS Parameter                          | Guidance                                                                        |
| ------------------ | --------------------------------------- | ------------------------------------------------------------------------------- |
| RAG accuracy ≥ 80% | `AGENT_INSTRUCTIONS` (retrieval prompt) | Add chain-of-thought phrasing; instruct the model to cite sources               |
| Groundedness       | `AGENT_TEMPERATURE`                     | Lower values (0.2–0.4) reduce hallucination                                     |
| Latency p95        | `AGENT_MODEL`                           | `gpt-4o-mini` for latency-sensitive paths; `gpt-4o` for accuracy-critical paths |

## References

- [Foundry Evaluation Approach](https://learn.microsoft.com/azure/ai-foundry/concepts/evaluation-approach-gen-ai?view=foundry)
- [observe sub-skill](../observe/observe.md)
- [eval-datasets sub-skill](../eval-datasets/eval-datasets.md)
