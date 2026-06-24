# The Validation Set — benchmark data & render engine

> Test the hype against real data. This repo holds the **raw measured data** and the
> **React / [Remotion](https://www.remotion.dev) render code** behind the benchmarks on
> **[The Validation Set]([CHANNEL_URL])** — so you can re-run, re-chart, and argue with
> every number in the videos.

**No vibes, just data.** Across the series, accuracy and throughput are **MEASURED**;
every dollar figure is **MODELED from labelled inputs** and called out as such on screen.
Each JSON file in [`data/`](./data) is the exact source the charts are rendered from.

---

## What's in here

| Path | What it is |
|---|---|
| [`data/`](./data) | One JSON file per episode — the measured + modelled numbers behind every chart. Plus `eval_tasks.json` (the 15-task graded exam) and `workload.json` (the prompt set). |
| [`src/`](./src) | The Remotion render engine: data-driven chart components, theming, and the `TimelineManager` that turns an aligned script into a video. |
| [`src/data/script.aligned.example.json`](./src/data/script.aligned.example.json) | A small **synthetic** example script so the engine compiles and renders out of the box. (Real episode scripts are not published.) |

## The data — one row per episode

| Ep | The question | The measured headline | Files |
|----|--------------|------------------------|-------|
| 01–02 | Is local AI actually cheaper than the cloud? | Same model both sides: cloud ~4.3× faster, but a managed API ≈ **$7,200/yr** per always-on agent vs an owned rig that **breaks even ~month 5**. | `ep001_local-vs-cloud.json`, `ep002_bench.json` |
| 03 | How many agents can one cheap 8GB rig run? | Usable knee = **2 agents** (Ollama serialises by default; tail latency climbs ~6s → 60s+). The 8B won't load at all. ≈ **$1,326/agent/yr** vs $7,200. | `ep003_scaling.json`, `ep003_sizewall.json` |
| 04 | Is a cheap local model smart enough? | 15-task exam, deterministic grader, temp 0: **3B 80%** @ ~25 tok/s, **8B 87%** @ ~6 tok/s, **14B won't run**. The entire gap is multi-step math. | `ep004_quality.json`, `eval_tasks.json`, `workload.json` |
| 05 | What does Claude Fable 5 actually cost? | **$10 / $50 per 1M** tokens — exactly **2× Opus 4.8**. | `ep005_fable5.json` |
| 06 | How does the frontier model do on the same exam? | **15/15**. Whole exam ≈ **$0.02**, but ≈ **657×** the 3B's cost per correct answer — and the gap was all math. | `ep006_fable_exam.json`, `ep006_fable5_exam_answers.raw.json` |
| 07 | Does self-hosting ever beat a hosted API? | Same 8B on a laptop vs Groq: hosted ~**56× faster** *and* cheaper per token → **no break-even at any volume**. | `ep007_breakeven.json`, `ep007_pricing.json` |
| 08 | Do you even need a vector database? | Chroma's default recall slides **97% → ~50%** as the corpus grows to 200k vectors; brute-force NumPy stays at **100%**. | `ep008_vectordb.json`, `ep008_vectordb_pricing.json` |
| 09 | Is one local runtime secretly faster? | Same 3B, same Mac: **Ollama 23.95 vs MLX 23.8 tok/s — a dead heat** (~0% apart). The real gap is cost: **~$0.12 per 1M tokens** on the laptop's electricity vs rented GPUs. | `ep009_runtimes.json` |
| 10 | How many prompt injections get through your agent? | Indirect injection on a local model: **80% obeyed undefended → 0%** after one defense (context segregation). Honest caveat on screen: 0% ≠ "solved". Defensive, OWASP LLM01. | `ep010_injection.json` |
| 11 | Which quant actually fits an 8GB laptop? | Same 8B at FP16 / Q8 / Q4: FP16 (~16GB) & Q8 (~8.5GB) **won't fit** (Q8 swap-thrashed to ~0.03 tok/s); **only Q4 (~4.8GB) runs — and scored 87%** on the 15-task exam. | `ep011_quant.json` |

## Reproduce a benchmark

The method is deliberately boring so it's checkable:

- **Local models** run on [Ollama](https://ollama.com): e.g. `ollama pull llama3.2:3b`, then fire `workload.json` at it and read tok/s + latency straight off the engine.
- **The exam (EP04/06)** is in `data/eval_tasks.json`: 15 tasks, each graded by a deterministic checker (a number, an A–D letter, a JSON shape, or code that must pass asserts) at **temperature 0**. No LLM-as-judge. Re-run it and you get the same score.
- **The cloud / hosted lane** needs rented compute — see *Infrastructure* below.
- Every chart reads its numbers from the matching `data/*.json`, so you can change an input and re-render to see the chart move.

## Reproduce the cloud lane

Most episodes pit a **local** model (Ollama on an 8GB Apple Silicon laptop) against a
**cloud / hosted** lane. To re-run the cloud side you'll need rented compute — any of
these work; pick on price, nothing here depends on a specific provider:

- **Rent a GPU** (the "cloud" lane in EP02/03/07): [RunPod](https://runpod.io), [Vast.ai](https://vast.ai), or [Lambda](https://lambda.ai).
- **Hosted inference API** (EP07's 8B ran on Groq): [Groq](https://groq.com), [Together AI](https://together.ai), or [Fireworks](https://fireworks.ai).
- **Local rig:** any 8GB+ Apple Silicon Mac (16GB+ for the models that won't fit 8GB).

These are plain references, not endorsements — there are no referral links here, and the
published numbers are whatever the data says.

## The render engine

The pipeline is data-driven on purpose: an **aligned script** (each paragraph tagged
with a `visual_cue` + `visual_data` and start/end times) is fed to `TimelineManager`,
which mounts the right chart component for each beat inside a Remotion `<Sequence>`.
A `themeId` varies colours/fonts/layout per render so a run of episodes never looks
like one mass-produced template. See [`src/types.ts`](./src/types.ts) for the full schema.

```bash
npm install
npm run dev          # Remotion Studio — preview the example composition
npx remotion render ValidationSetVideo out/video.mp4 --props='{"themeId":3}'
npx remotion still   Thumbnail out/thumbnail.png --scale=2 --image-format=jpeg --jpeg-quality=92
```

To render a real episode: produce your own aligned script in the schema above (or adapt
the example), point `TimelineManager`'s import at it, drop your voiceover in `public/`,
and wire the `<Audio>` line noted in [`src/components/TimelineManager.tsx`](./src/components/TimelineManager.tsx).

## License

- **Code** (`src/`): MIT — see [LICENSE](./LICENSE).
- **Data** (`data/`): free to use with attribution to The Validation Set.

---

*Built by [The Validation Set]([CHANNEL_URL]). Found a flaw in a benchmark? Open an issue or PR — that's the whole point.*
