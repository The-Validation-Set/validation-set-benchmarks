# Data

One JSON file per episode — the exact source the on-screen charts render from.

**Convention used throughout:** values are tagged **MEASURED** (real telemetry — tok/s,
latency, recall, accuracy) or **MODELED** (costs derived from labelled inputs like
$/kWh, $/hr GPU, $/1M token rates). The videos label which is which on screen; the JSON
mirrors that split in its field names and notes.

| File | Episode | Contains |
|---|---|---|
| `ep001_local-vs-cloud.json` | 01 | The cost-model inputs for the original rent-vs-own argument. |
| `ep002_bench.json` | 02 | Measured throughput/latency, same model local vs a cloud T4; 12-month cost model. |
| `ep003_scaling.json` | 03 | Concurrency scaling: agg + effective per-agent tok/s, p50/p95/p99 latency vs N agents. |
| `ep003_sizewall.json` | 03 | The model-size memory wall (3B loads, 8B times out on 8GB). |
| `ep004_quality.json` | 04 | Exam accuracy + speed for 3B / 8B / 14B on one 8GB rig. |
| `eval_tasks.json` | 04/06 | The 15-task graded exam + deterministic grading spec (temp 0). |
| `workload.json` | 02/07 | The frozen prompt set used for throughput/latency runs. |
| `ep005_fable5.json` | 05 | Verified launch facts + pricing for Claude Fable 5 (2× Opus 4.8). |
| `ep006_fable_exam.json` | 06 | Fable 5's exam scores vs the locals + the per-correct-answer cost model. |
| `ep006_fable5_exam_answers.raw.json` | 06 | Fable 5's raw captured answers, graded raw and artifact-cleaned. |
| `ep007_breakeven.json` | 07 | Same 8B local vs Groq: measured tok/s + the break-even calculation. |
| `ep007_pricing.json` | 07 | The hosted/local $/1M inputs behind EP07. |
| `ep008_vectordb.json` | 08 | Measured recall@10, latency and RAM vs corpus size (NumPy vs a vector DB). |
| `ep008_vectordb_pricing.json` | 08 | Modelled managed-vector-DB cost at 1M / 10M / 100M vectors. |
| `ep009_runtimes.json` | 09 | Measured tok/s (Ollama vs MLX, same 3B) + the $/1M-token cost model across local electricity vs rented GPUs. |
| `ep010_injection.json` | 10 | Indirect prompt-injection attack-success rate per defense level + per attack category (defensive; OWASP LLM01; benign canary). |
| `ep011_quant.json` | 11 | Same 8B at FP16 / Q8 / Q4 on one 8GB rig: size, whether it fits/loads, tok/s, and the Q4 exam score (87%). |
| `ep012_qat.json` | 12 | Same Gemma 12B, two 4-bit builds (naive PTQ-Q4 vs training-aware QAT-Q4) on one box: size, tok/s, exam accuracy — a flat 80%/80% tie, QAT ~9% faster. |
| `ep013_frontier.json` | 13 | A frontier cloud model (Gemini 3 Pro) on the same 15-task exam: per-task grades + the modeled at-scale cost per correct answer. |
| `ep013_routing.json` | 13 | Local-vs-cloud routing arithmetic (all-local / smart-routing / all-cloud) over the measured per-bucket splits + the modeled cloud-bill cut. |
| `ep014_rerank.json` | 14 | RAG bi-encoder retrieval vs + a cross-encoder re-ranker on easy and hard corpora: recall@1 and latency — the re-ranker fixes order, not recall. |

All figures are reproducible — see the root README for how to re-run each benchmark.
