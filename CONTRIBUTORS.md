# Corroborations

Every result in this repo is reproducible by design — same prompts, temp 0, deterministic graders. When someone runs a benchmark on their own hardware and reports numbers (confirming *or* contradicting ours), they get credited here. Contradictions are the most valuable entries: they map where a result generalizes and where it doesn't.

**How to get on this list:** run any `run_*.py` harness from `data/`/the repo root on your machine, then open an issue with your hardware, the exact model tags, and your output JSON. That's it.

| Who | What they ran | Hardware | Result vs ours |
|---|---|---|---|
| *(your name here)* | | | |

## Open bounties (things we can't measure ourselves)
- **Ollama vs MLX on M4 / M4 Pro** — our dead-heat result (ep009) is from a base M3 8GB; does newer silicon change it?
- **Gemma 4 12B QAT vs PTQ on Apple Silicon 16GB** — we're running the datacenter-GPU version; a Mac datapoint would complete the picture.
- **The vector-DB recall curve (ep008) on a corpus that isn't synthetic** — same harness, your embeddings.
