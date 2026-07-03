#!/usr/bin/env python3
"""Build the static Validation Set site into docs/ (served by GitHub Pages).

Usage:  python3 site/build_site.py     (from the repo root)

Everything is generated from data/*.json plus the REGISTRY below. Adding an
episode = add a REGISTRY entry, re-run, commit. No dependencies, no frameworks:
plain HTML + one stylesheet + build-time SVG charts, so pages are fast,
crawlable, and citable by search engines and LLMs alike.
"""
from __future__ import annotations

import json
import html
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
OUT = ROOT / "docs"
BASE_URL = "https://the-validation-set.github.io/validation-set-benchmarks"
REPO_URL = "https://github.com/The-Validation-Set/validation-set-benchmarks"
CHANNEL_URL = "https://www.youtube.com/@TheValidationSet"
SITE_NAME = "The Validation Set"
TAGLINE = "Reproducible AI benchmarks. Measured, not guessed."

# Set to the Substack URL once it exists; the email box renders only when set.
NEWSLETTER_URL = ""

# Per-episode YouTube URLs (fill as they're supplied; falls back to channel).
VIDEO_URLS = {
    "ep001": "https://youtu.be/z1SoM8poVgc",
    "ep002": "https://youtu.be/mCyl1YJCmuw",
    "ep003": "https://youtu.be/2aDlOvu8jcc",
    "ep004": "https://youtu.be/SMr9o7ZECyc",
    "ep005": "https://youtu.be/hI15-Ja71oM",
    "ep006": "https://youtu.be/9RJcnsh3W44",
    "ep007": "https://youtu.be/ZHV_EdqEaf8",
    "ep008": "https://youtu.be/4TjaWVoBPiE",
    "ep009": "https://youtu.be/ttwDVH_jFs4",
    "ep010": "https://youtu.be/hsE2o2gtV98",
    "ep011": "https://youtu.be/jIwKEnhbbRo",
    "ep012": "https://youtu.be/w4Rfa_ryymM",
}


def _j(name: str):
    try:
        return json.loads((DATA / name).read_text())
    except Exception:
        return None


# ---------------------------------------------------------------- registry --
# question/verdict copy mirrors data/README.md (the audited public claims).
REGISTRY = [
    {
        "id": "ep001", "slug": "local-ai-vs-cloud-api-cost",
        "title": "Local AI vs cloud API: what one always-on agent really costs",
        "question": "Is local AI actually cheaper than the cloud?",
        "verdict": "A managed API ≈ $7,200/yr per always-on agent; an owned rig breaks even ~month 5.",
        "numbers": [("$7,200/yr", "managed API, one always-on agent", "modeled"),
                    ("~4.3×", "cloud speed advantage, same model", "measured"),
                    ("month 5", "owned-rig break-even", "modeled")],
        "files": ["ep001_local-vs-cloud.json", "ep002_bench.json"],
        "search": "local llm vs cloud api cost",
    },
    {
        "id": "ep002", "slug": "self-hosting-llm-break-even",
        "title": "Self-hosting an LLM: the break-even, measured on both sides",
        "question": "Where is the break-even between renting and owning?",
        "verdict": "Same model both sides: cloud ~4.3× faster, but the owned rig pays for itself ~month 5 and banks ~$4,500 in year one.",
        "numbers": [("16.5 vs 70.9", "tok/s local vs cloud, same model", "measured"),
                    ("$4,500", "kept in year one after break-even", "modeled")],
        "files": ["ep002_bench.json"],
        "search": "self host llm break even cost",
    },
    {
        "id": "ep003", "slug": "how-many-ai-agents-8gb-laptop",
        "title": "How many AI agents can an 8GB laptop actually run?",
        "question": "How many agents before a cheap rig chokes?",
        "verdict": "Usable knee = 2 agents (Ollama serialises; tail latency ~6s → 60s+). The 8B won't even load. ≈ $1,326/agent/yr vs $7,200 rented.",
        "numbers": [("2 agents", "usable concurrency knee", "measured"),
                    ("$1,326/yr", "per owned agent", "modeled"),
                    ("$7,200/yr", "per rented agent", "modeled")],
        "files": ["ep003_scaling.json", "ep003_sizewall.json"],
        "search": "run multiple ai agents locally 8gb",
    },
    {
        "id": "ep004", "slug": "small-vs-big-local-llm-graded",
        "title": "3B vs 8B vs 14B on one 8GB laptop — the same graded exam",
        "question": "Is a cheap local model actually smart enough?",
        "verdict": "3B: 80% at ~26 tok/s. 8B: 87% at ~6 tok/s — one extra answer for 4× the wait. 14B: never finished. The gap is all multi-step math.",
        "numbers": [("80%", "llama3.2:3b, 15-task exam", "measured"),
                    ("87%", "llama3.1:8b, same exam", "measured"),
                    ("4×", "slower for those 7 points", "measured")],
        "files": ["ep004_quality.json", "eval_tasks.json", "workload.json"],
        "search": "3b vs 8b local llm quality benchmark",
        "chart": "ep004",
    },
    {
        "id": "ep005", "slug": "claude-fable-5-pricing",
        "title": "Claude Fable 5 pricing: exactly 2× Opus 4.8",
        "question": "What does the newest frontier model actually cost?",
        "verdict": "$10 in / $50 out per 1M tokens — exactly 2× Opus 4.8. Whether that matters depends on cost per correct answer, not per token.",
        "numbers": [("$10 / $50", "per 1M tokens in/out", "public price"),
                    ("2×", "vs Opus 4.8", "public price")],
        "files": ["ep005_fable5.json"],
        "search": "claude fable 5 price per token",
    },
    {
        "id": "ep006", "slug": "frontier-llm-cost-per-correct-answer",
        "title": "A frontier model took the local exam: 15/15 — at 657× the cost per answer",
        "question": "How much better is the frontier, per dollar?",
        "verdict": "Claude Fable 5: 15/15, whole exam ≈ $0.02 — but ≈657× the free local 3B's cost per correct answer. Everything it fixed was math.",
        "numbers": [("15/15", "Fable 5 on the same exam", "measured"),
                    ("~657×", "cost per correct answer vs local 3B", "modeled"),
                    ("~$0.02", "whole 15-task exam via API", "measured")],
        "files": ["ep006_fable_exam.json", "ep006_fable5_exam_answers.raw.json"],
        "search": "frontier llm vs local cost per answer",
    },
    {
        "id": "ep007", "slug": "self-host-vs-hosted-api-break-even",
        "title": "Self-hosting an 8B vs a hosted API: there is no break-even",
        "question": "Does self-hosting ever beat a hosted API?",
        "verdict": "Same 8B, laptop vs hosted: hosted ~56× faster AND cheaper per token → no break-even at any volume for this workload.",
        "numbers": [("8.5 vs ~472", "tok/s local vs hosted", "measured"),
                    ("$0.34 vs $0.065", "per 1M tokens", "modeled"),
                    ("none", "break-even point", "modeled")],
        "files": ["ep007_breakeven.json", "ep007_pricing.json"],
        "search": "self hosting llm never cheaper api",
    },
    {
        "id": "ep008", "slug": "vector-database-recall-benchmark",
        "title": "Vector DB vs 10 lines of NumPy: the silent recall collapse",
        "question": "Do you even need a vector database?",
        "verdict": "Chroma (defaults) slid to ~49.5% recall@10 by 200k vectors — no error, no warning. Brute-force NumPy held 100% at ~23ms.",
        "numbers": [("49.5%", "recall@10 at 200k vectors, defaults", "measured"),
                    ("100%", "NumPy exact search, all sizes", "measured"),
                    ("~23ms", "NumPy p50 per query at 200k", "measured")],
        "files": ["ep008_vectordb.json", "ep008_vectordb_pricing.json"],
        "search": "vector database recall benchmark chroma",
        "chart": "ep008",
    },
    {
        "id": "ep009", "slug": "ollama-vs-mlx-speed-benchmark",
        "title": "Ollama vs MLX on Apple Silicon: a measured dead heat",
        "question": "Is one local runtime secretly faster?",
        "verdict": "Same 3B, same base M3: Ollama 23.95 vs MLX 23.8 tok/s — 0% apart, within noise. The real lever is local vs cloud, not runtime.",
        "numbers": [("23.95 vs 23.8", "tok/s, same model & machine", "measured"),
                    ("~$0.12", "per 1M tokens on laptop electricity", "modeled"),
                    ("~$8", "per 1M tokens on a rented H100", "modeled")],
        "files": ["ep009_runtimes.json"],
        "search": "ollama vs mlx speed apple silicon",
        "caveat": "Caveat (added 2026-07-03): this benchmark predates Ollama 0.19's MLX backend (March 2026). That backend requires 32GB+ unified memory, so it doesn't change this 8GB result.",
    },
    {
        "id": "ep010", "slug": "prompt-injection-local-llm",
        "title": "Indirect prompt injection on a local model: 80% obeyed the attacker",
        "question": "How many injections get through an undefended agent?",
        "verdict": "Undefended: 80% of textbook OWASP LLM01 payloads obeyed. One defense (context segregation): 0% — and 0% still ≠ solved.",
        "numbers": [("80%", "payloads obeyed, undefended", "measured"),
                    ("0%", "after context segregation", "measured")],
        "files": ["ep010_injection.json"],
        "search": "prompt injection local llm defense benchmark",
    },
    {
        "id": "ep011", "slug": "llm-quantization-8gb-laptop",
        "title": "FP16 vs Q8 vs Q4 on an 8GB laptop: only one of them loads",
        "question": "Which quantization actually fits consumer hardware?",
        "verdict": "FP16 (~16GB) and Q8 (~8.5GB) don't fit — Q8 swap-thrashed to ~0.03 tok/s. Q4 (~4.8GB) runs and scored 87% on the exam.",
        "numbers": [("only Q4", "loads on 8GB", "measured"),
                    ("87%", "Q4 on the 15-task exam", "measured"),
                    ("~0.03 tok/s", "Q8 swap-thrash", "measured")],
        "files": ["ep011_quant.json"],
        "search": "llm quantization q4 q8 fp16 8gb",
    },
    {
        "id": "ep012", "slug": "gemma-qat-vs-ptq-4bit",
        "title": "Gemma 3 12B: training-aware QAT vs naive PTQ, graded",
        "question": "Does the 'smarter' 4-bit beat the one you're running?",
        "verdict": "A flat 80% / 80% tie on accuracy. QAT buys ~9% speed (32 vs 29 tok/s) for ~0.8GB more — not accuracy. Grab it where it's shipped.",
        "numbers": [("80% = 80%", "PTQ-Q4 vs QAT-Q4 accuracy", "measured"),
                    ("+9%", "QAT speed advantage", "measured"),
                    ("8.1 vs 8.9 GB", "size on disk", "measured")],
        "files": ["ep012_qat.json"],
        "search": "gemma qat vs ptq quantization benchmark",
        "chart": "ep012",
    },
    {
        "id": "ep013", "slug": "local-vs-cloud-llm-routing",
        "title": "Route only your measured weakness to the cloud: −73% bill, same score",
        "question": "Keep it local, or pay the cloud?",
        "verdict": "Local 3B is only weak on math. Escalating just that bucket to a frontier model: 100% accuracy at 27% cloud calls ≈ 73% off the modeled bill.",
        "numbers": [("100%", "routed accuracy (3B + frontier)", "measured"),
                    ("27%", "of calls that need the cloud", "measured"),
                    ("−73%", "modeled cloud bill", "modeled")],
        "files": ["ep013_routing.json", "ep013_frontier.json"],
        "search": "llm routing local cloud cost optimization",
    },
    {
        "id": "ep014", "slug": "rag-reranker-benchmark",
        "title": "RAG re-rankers fix order, not recall — measured",
        "question": "Does a re-ranker actually help your RAG?",
        "verdict": "The bi-encoder already nailed rank-1 (easy 92→100; hard 100→100 — re-ranker added 0) at ~38ms/query. Fix recall first; order later.",
        "numbers": [("92→100", "recall@1, easy corpus", "measured"),
                    ("100→100", "recall@1, hard corpus (+0)", "measured"),
                    ("~38ms", "per query", "measured")],
        "files": ["ep014_rerank.json"],
        "search": "rag reranker worth it benchmark",
    },
]

# Long-tail Q&A per episode — every answer is a published measured/modeled claim.
# Rendered as an FAQ section + schema.org FAQPage (rich results + LLM citation).
FAQS = {
    "ep001": [
        ("How much does one always-on AI agent cost on a managed cloud API?",
         "≈ $7,200/yr, modeled from provider price pages for a steady agent workload (inputs labelled in the data file)."),
        ("Is the cloud faster than local for the same model?",
         "Yes — ~4.3× faster in our measured run. Speed and cost are separate questions; the break-even math is what decides."),
        ("When does buying hardware beat renting?",
         "Modeled break-even ≈ month 5 for the measured always-on workload."),
    ],
    "ep002": [
        ("What speed gap did the same model show local vs cloud?",
         "16.5 vs 70.9 tok/s, measured on both sides with the same model."),
        ("How much do you save in year one by self-hosting?",
         "≈ $4,500 modeled, after the ~month-5 break-even."),
        ("Does this hold for every workload?",
         "No — scope: steady always-on agents. Bursty workloads favour renting; see the self-host-vs-API page."),
    ],
    "ep003": [
        ("How many AI agents can an 8GB laptop run at once?",
         "2 usable agents, measured — Ollama serialises requests, so tail latency climbs from ~6s toward 60s+ beyond that."),
        ("What does an owned agent cost vs a rented one?",
         "≈ $1,326/agent/yr owned vs ≈ $7,200/yr rented (modeled from labelled inputs)."),
        ("Can an 8GB laptop serve agents on an 8B model?",
         "The 8B wouldn't load at all under 8GB in our run."),
    ],
    "ep004": [
        ("Is a 3B model good enough for real tasks?",
         "80% on our 15-task graded exam at ~26 tok/s on an 8GB laptop — and every miss was multi-step arithmetic."),
        ("How much better is an 8B on the same exam?",
         "87% — one extra correct answer — at ~4× the wait (~6 tok/s measured)."),
        ("What happened with a 14B?",
         "qwen2.5:14b never finished a run on 8GB (swap-thrash timeout). That's a stated outcome, not a score."),
        ("What's the cheapest fix for the 3B's weakness?",
         "Its misses were all arithmetic — a calculator tool patches that for free, versus paying 4× the wait for +7 points."),
    ],
    "ep005": [
        ("What does Claude Fable 5 cost?",
         "$10 in / $50 out per 1M tokens — exactly 2× Opus 4.8 (public launch prices)."),
        ("Does price per token decide which model is worth it?",
         "No. Cost per CORRECT answer is the decision metric — see the frontier-exam page for the measured version."),
    ],
    "ep006": [
        ("Did the frontier model beat the local one?",
         "15/15 vs 80% on the same graded exam — at ≈657× the modeled cost per correct answer."),
        ("How much did the whole exam cost via the API?",
         "≈ $0.02 measured for all 15 tasks."),
        ("Where did the local model actually lose points?",
         "Entirely on multi-step arithmetic — the frontier premium bought math, nothing else on this exam."),
    ],
    "ep007": [
        ("Is self-hosting an 8B cheaper than a hosted API?",
         "Not at any volume for this workload — hosted was ~56× faster AND cheaper per token ($0.065 vs $0.34 per 1M, modeled)."),
        ("When does owning hardware still win?",
         "Privacy, workloads a hosted API won't take, and steady always-on agents — the regime measured on the local-vs-cloud pages."),
    ],
    "ep008": [
        ("Do I need a vector database for RAG?",
         "Below ~200k vectors, brute-force NumPy held 100% recall at ~23ms/query in our run — the database added operations, not recall."),
        ("What happens to recall at scale on default settings?",
         "Measured slide: ~97% → 76.6% → 49.5% recall@10 at 10k / 50k / 200k vectors (Chroma defaults)."),
        ("Does the database warn you when recall degrades?",
         "No — no error, no slowdown. Ten confident results come back with half the right answers silently missing."),
        ("Was the corpus real?",
         "Synthetic seeded clusters (generator in the repo — best case for brute force, stated openly). Tuned HNSW parameters recover recall; that run is in the data too."),
    ],
    "ep009": [
        ("Is MLX faster than Ollama on Apple Silicon?",
         "A measured dead heat in our run: 23.95 vs 23.8 tok/s — same 3B Q4 model, same base M3 8GB."),
        ("Does runtime choice ever matter?",
         "At small dense-model sizes both are memory-bandwidth-bound, so no. Community reports suggest large MoE models diverge — that follow-up is on the bench."),
        ("What's the cost lever that actually matters?",
         "Local vs cloud: ~$0.12 per 1M tokens on laptop electricity vs ~$8 per 1M on a rented H100 (both modeled from labelled inputs)."),
    ],
    "ep010": [
        ("How vulnerable is an undefended local agent to prompt injection?",
         "80% of textbook OWASP LLM01 payloads were obeyed in our measured run."),
        ("Does one defense fix prompt injection?",
         "Context segregation took our set to 0% — but 0% on textbook payloads ≠ solved. Cap the agent's privileges and assume some attacks get through."),
    ],
    "ep011": [
        ("Which quantization fits an 8GB laptop?",
         "Only Q4 (~4.8GB). FP16 (~16GB) won't load; Q8 (~8.5GB) swap-thrashed to ~0.03 tok/s."),
        ("How much accuracy does Q4 keep?",
         "87% on the 15-task graded exam in our run."),
    ],
    "ep012": [
        ("Is QAT more accurate than naive PTQ?",
         "Not in our run: a flat 80% vs 80% tie — Gemma 3 12B, both builds at 4-bit, same box, same exam."),
        ("What does QAT actually buy?",
         "~9% more speed (32 vs 29 tok/s) for ~0.8GB more disk — a free speed bump, not an accuracy upgrade."),
        ("Should you switch to a QAT build?",
         "When the maker ships one, yes. Most models don't have one — naive PTQ-Q4 remains the everyday tool; don't wait."),
        ("What about Gemma 4's QAT?",
         "Its checkpoints shipped 2026-06-05. The same exam on Gemma 4 PTQ-vs-QAT is on the bench."),
    ],
    "ep013": [
        ("What's the cheapest way to get frontier accuracy?",
         "Route only your measured-weak task types to the cloud: 100% accuracy at 27% cloud calls ≈ 73% off the modeled bill in our run."),
        ("What's the catch with routing?",
         "The router is only as good as your benchmark of local weaknesses — measure before you route."),
    ],
    "ep014": [
        ("Do RAG re-rankers improve recall?",
         "No — a re-ranker reorders the pool you retrieved. Measured: recall@1 92→100 on an easy corpus (fixed 1 of 12) and 100→100 on a hard one (added 0), ~38ms/query."),
        ("What should you fix first in a RAG pipeline?",
         "Retrieval recall (see the vector-database page). Ordering comes after there's something worth ordering."),
    ],
}

# The exam leaderboard (the homepage hero). Cost multiples are MODELED and
# expressed vs the free local 3B baseline; accuracy is MEASURED (temp 0,
# deterministic graders). "pending" rows render as on-the-bench.
LEADERBOARD = [
    {"model": "llama3.2:3b (local, 8GB laptop)", "score": "80%", "speed": "~26 tok/s", "cost": "1× (baseline)", "ep": "ep004"},
    {"model": "llama3.1:8b (local, 8GB laptop)", "score": "87%", "speed": "~6 tok/s", "cost": "—", "ep": "ep004"},
    {"model": "Gemma 3 12B PTQ-Q4 (rented L4)", "score": "80%", "speed": "29 tok/s", "cost": "—", "ep": "ep012"},
    {"model": "Gemma 3 12B QAT-Q4 (rented L4)", "score": "80%", "speed": "32 tok/s", "cost": "—", "ep": "ep012"},
    {"model": "Gemini 3 Pro (cloud)", "score": "100%", "speed": "n/a", "cost": "~108×", "ep": "ep013"},
    {"model": "Claude Fable 5 (cloud API)", "score": "100%", "speed": "n/a", "cost": "~657×", "ep": "ep006"},
    {"model": "Claude Sonnet 5 (cloud)", "score": "on the bench", "speed": "—", "cost": "—", "ep": None},
    {"model": "Gemma 4 12B PTQ vs QAT", "score": "on the bench", "speed": "—", "cost": "—", "ep": None},
]

# ------------------------------------------------------------------ guides --
# Cross-benchmark answer pages. Root-level (like methodology.html); every
# number is interpolated from data/*.json at build time — nothing hand-typed.
GUIDES = [
    {"slug": "is-8gb-mac-enough-for-local-llm",
     "title": "Is an 8GB Mac enough to run a local LLM? (measured)",
     "question": "Is 8GB of RAM enough for local AI?",
     "blurb": "Yes — for the right model class. What fits, what swaps, and exactly "
              "where the wall is, from four measured runs on one 8GB Apple-silicon Mac."},
    {"slug": "cost-per-correct-answer",
     "title": "Cost per correct answer: the number per-token pricing hides",
     "question": "What does a correct answer cost?",
     "blurb": "The metric behind the leaderboard: what a run costs divided by the answers "
              "a deterministic grader accepted — and the metric's honest limits."},
]

# Episode pages that should point at a guide (rendered as one line under the numbers).
RELATED_GUIDES = {
    "ep003": "is-8gb-mac-enough-for-local-llm",
    "ep004": "is-8gb-mac-enough-for-local-llm",
    "ep009": "is-8gb-mac-enough-for-local-llm",
    "ep011": "is-8gb-mac-enough-for-local-llm",
    "ep005": "cost-per-correct-answer",
    "ep006": "cost-per-correct-answer",
    "ep013": "cost-per-correct-answer",
}


def _slug(ep_id: str) -> str:
    return next(e["slug"] for e in REGISTRY if e["id"] == ep_id)


def _guide_title(slug: str) -> str:
    return next(g["title"] for g in GUIDES if g["slug"] == slug)

CSS = """
:root{--bg:#0B0F19;--bg2:#05070D;--panel:#12182A;--border:#1E2A45;--text:#EDF1FA;
--muted:#8A94AD;--accent:#2DD4BF;--accent2:#7C6CFF;--danger:#FB7185;--amber:#F5B546;
--mono:ui-monospace,SFMono-Regular,Menlo,monospace;
--sans:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
*{box-sizing:border-box}body{margin:0;background:linear-gradient(160deg,var(--bg),var(--bg2));
color:var(--text);font-family:var(--sans);line-height:1.6;-webkit-font-smoothing:antialiased}
a{color:var(--accent);text-decoration:none}a:hover{text-decoration:underline}
.wrap{max-width:980px;margin:0 auto;padding:0 20px}
header.site{padding:18px 0;border-bottom:1px solid var(--border)}
header.site .wrap{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.logo{font-weight:800;font-size:1.05rem;letter-spacing:.02em;color:var(--text)}
.logo .tick{color:var(--accent)}
nav a{color:var(--muted);margin-left:18px;font-size:.92rem}nav a:hover{color:var(--text)}
.hero{padding:56px 0 28px}
.hero h1{font-size:clamp(1.7rem,4.5vw,2.6rem);line-height:1.15;margin:0 0 12px;font-weight:800}
.hero p.lead{color:var(--muted);font-size:1.08rem;max-width:640px;margin:0 0 8px}
.badges{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0 0}
.badge{font-family:var(--mono);font-size:.72rem;letter-spacing:.08em;text-transform:uppercase;
padding:4px 10px;border-radius:20px;border:1px solid var(--border);color:var(--muted)}
.badge.m{color:var(--accent);border-color:rgba(45,212,191,.35)}
.badge.mo{color:var(--amber);border-color:rgba(245,181,70,.35)}
section{padding:34px 0}h2{font-size:1.35rem;margin:0 0 6px}
.sub{color:var(--muted);margin:0 0 20px;font-size:.95rem}
table.lb{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--border);
border-radius:12px;overflow:hidden;font-size:.94rem}
table.lb th,table.lb td{padding:12px 14px;text-align:left;border-bottom:1px solid var(--border)}
table.lb th{font-family:var(--mono);font-size:.7rem;letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
table.lb tr:last-child td{border-bottom:none}
table.lb td.score{font-weight:700;color:var(--accent)}
table.lb td.cost{font-family:var(--mono)}
tr.pending td{color:var(--muted);font-style:italic}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px}
.card{background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:18px 18px 14px;
display:flex;flex-direction:column;gap:8px}
.card .q{font-family:var(--mono);font-size:.72rem;letter-spacing:.06em;text-transform:uppercase;color:var(--accent)}
.card h3{margin:0;font-size:1.02rem;line-height:1.35}.card h3 a{color:var(--text)}
.card p{margin:0;color:var(--muted);font-size:.88rem}
.verdict{border-left:3px solid var(--accent);background:rgba(45,212,191,.06);
padding:14px 16px;border-radius:0 10px 10px 0;margin:18px 0;font-size:1.02rem}
.nums{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin:22px 0}
.num{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:14px}
.num .v{font-size:1.5rem;font-weight:800;color:var(--text)}
.num .l{color:var(--muted);font-size:.82rem;margin-top:2px}
.num .tag{font-family:var(--mono);font-size:.62rem;letter-spacing:.1em;text-transform:uppercase;margin-top:8px;display:inline-block}
.num .tag.m{color:var(--accent)}.num .tag.mo{color:var(--amber)}.num .tag.p{color:var(--muted)}
.chart{margin:26px 0;background:var(--panel);border:1px solid var(--border);border-radius:12px;padding:18px}
.filelist{font-family:var(--mono);font-size:.85rem;line-height:2}
pre{background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:14px;overflow-x:auto;
font-family:var(--mono);font-size:.82rem;color:var(--text)}
.cta{display:flex;gap:10px;flex-wrap:wrap;margin:26px 0}
.btn{display:inline-block;padding:10px 18px;border-radius:10px;font-weight:600;font-size:.92rem}
.btn.primary{background:var(--accent);color:#04211C}.btn.primary:hover{text-decoration:none;filter:brightness(1.08)}
.btn.ghost{border:1px solid var(--border);color:var(--text)}.btn.ghost:hover{text-decoration:none;border-color:var(--accent)}
.faq{background:var(--panel);border:1px solid var(--border);border-radius:10px;padding:6px 18px 12px;margin:10px 0}
.faq h3{margin:10px 0 4px;font-size:.98rem}.faq p{margin:0;color:var(--muted);font-size:.9rem}
.cite{border:1px dashed var(--border);border-radius:10px;padding:12px 16px;margin:26px 0;background:rgba(124,108,255,.05)}
.cite .cite-label{font-family:var(--mono);font-size:.62rem;letter-spacing:.12em;color:var(--accent2)}
.cite p{margin:6px 0 0;font-size:.9rem;color:var(--muted)}
.next{display:flex;justify-content:space-between;gap:10px;margin-top:34px;font-size:.9rem}
footer{border-top:1px solid var(--border);margin-top:40px;padding:26px 0;color:var(--muted);font-size:.85rem}
footer .wrap{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap}
.note{color:var(--muted);font-size:.82rem}
"""


def esc(s: str) -> str:
    return html.escape(s, quote=True)


def faq_section(faqs) -> str:
    if not faqs:
        return ""
    items = "".join(f'<div class="faq"><h3>{esc(q)}</h3><p>{esc(a)}</p></div>' for q, a in faqs)
    return f'<h2>Questions this answers</h2>{items}'


def faq_jsonld(faqs) -> str:
    if not faqs:
        return ""
    entities = ",".join(
        json.dumps({"@type": "Question", "name": q,
                    "acceptedAnswer": {"@type": "Answer", "text": a}})
        for q, a in faqs)
    return (f'<script type="application/ld+json">'
            f'{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{entities}]}}'
            f'</script>')


def page(title: str, desc: str, body: str, canonical: str, depth: int = 0, jsonld: str = "") -> str:
    p = "../" * depth
    nl = (
        f'<a href="{NEWSLETTER_URL}">Email drops</a>' if NEWSLETTER_URL else ""
    )
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{canonical}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:type" content="website">
<meta property="og:url" content="{canonical}">
<link rel="stylesheet" href="{p}style.css">
{jsonld}
</head>
<body>
<header class="site"><div class="wrap">
<a class="logo" href="{p}index.html">THE VALIDATION<span class="tick"> SET ▸</span></a>
<nav>
<a href="{p}index.html#benchmarks">Benchmarks</a>
<a href="{p}methodology.html">Methodology</a>
<a href="{REPO_URL}">Data &amp; code</a>
<a href="{CHANNEL_URL}">YouTube</a>
{nl}
</nav>
</div></header>
{body}
<footer><div class="wrap">
<div>© {date.today().year} {SITE_NAME} — {TAGLINE}</div>
<div><a href="{REPO_URL}">GitHub</a> · <a href="{CHANNEL_URL}">YouTube</a></div>
</div></footer>
</body></html>"""


# ------------------------------------------------------------- SVG charts --
def svg_bars(pairs, unit, color_a="#7C6CFF", color_b="#2DD4BF", width=760, height=300):
    """pairs: [(label, a_label, a_val, b_label, b_val)] grouped bars."""
    n = len(pairs)
    if not n:
        return ""
    maxv = max(max(p[2], p[4]) for p in pairs) * 1.25
    gw = width / n
    bars, labels = [], []
    for i, (label, la, va, lb, vb) in enumerate(pairs):
        cx = i * gw + gw / 2
        for k, (v, c, off) in enumerate([(va, color_a, -46), (vb, color_b, 6)]):
            h = max(4, v / maxv * (height - 90))
            x = cx + off
            y = height - 50 - h
            bars.append(f'<rect x="{x:.0f}" y="{y:.0f}" width="40" height="{h:.0f}" rx="6" fill="{c}" opacity="0.9"/>')
            bars.append(f'<text x="{x+20:.0f}" y="{y-8:.0f}" text-anchor="middle" font-size="15" font-weight="700" fill="{c}">{v:g}{unit}</text>')
        labels.append(f'<text x="{cx:.0f}" y="{height-24:.0f}" text-anchor="middle" font-size="13" fill="#8A94AD" font-family="monospace">{esc(label)}</text>')
    legend = (f'<circle cx="14" cy="14" r="6" fill="{color_a}"/><text x="26" y="19" font-size="13" fill="#8A94AD">{esc(pairs[0][1])}</text>'
              f'<circle cx="150" cy="14" r="6" fill="{color_b}"/><text x="162" y="19" font-size="13" fill="#8A94AD">{esc(pairs[0][3])}</text>')
    return (f'<svg viewBox="0 0 {width} {height}" role="img" xmlns="http://www.w3.org/2000/svg">'
            f'{legend}{"".join(bars)}{"".join(labels)}</svg>')


def svg_line(points, y_label, width=760, height=320, color="#FB7185", floor_line=None):
    """points: [(x_label, y_value 0-100)] simple line with dots."""
    if not points:
        return ""
    n = len(points)
    L, R, T, B = 60, width - 30, 30, height - 56
    xs = [L + i * (R - L) / max(1, n - 1) for i in range(n)]
    ys = [B - (v / 100) * (B - T) for _, v in points]
    path = " ".join(f"{'M' if i == 0 else 'L'}{xs[i]:.0f},{ys[i]:.0f}" for i in range(n))
    def _dot_label(i: int) -> str:
        # Points near the plot top get their label beside the dot, not above it,
        # so they never collide with the axis title.
        if ys[i] < T + 22:
            return f'<text x="{xs[i]+14:.0f}" y="{ys[i]+5:.0f}" text-anchor="start" font-size="14" font-weight="700" fill="{color}">{points[i][1]:g}%</text>'
        return f'<text x="{xs[i]:.0f}" y="{ys[i]-14:.0f}" text-anchor="middle" font-size="14" font-weight="700" fill="{color}">{points[i][1]:g}%</text>'
    dots = "".join(
        f'<circle cx="{xs[i]:.0f}" cy="{ys[i]:.0f}" r="6" fill="{color}"/>' + _dot_label(i)
        for i in range(n))
    xlabels = "".join(
        f'<text x="{xs[i]:.0f}" y="{height-26:.0f}" text-anchor="middle" font-size="13" fill="#8A94AD" font-family="monospace">{esc(points[i][0])}</text>'
        for i in range(n))
    grid = "".join(
        f'<line x1="{L}" x2="{R}" y1="{B-(g/100)*(B-T):.0f}" y2="{B-(g/100)*(B-T):.0f}" stroke="#1E2A45" stroke-width="1"/>'
        f'<text x="{L-10}" y="{B-(g/100)*(B-T)+5:.0f}" text-anchor="end" font-size="12" fill="#8A94AD">{g}</text>'
        for g in (0, 25, 50, 75, 100))
    return (f'<svg viewBox="0 0 {width} {height}" role="img" xmlns="http://www.w3.org/2000/svg">{grid}'
            f'<path d="{path}" fill="none" stroke="{color}" stroke-width="3"/>{dots}{xlabels}'
            f'<text x="{L-40}" y="{T-8}" font-size="12" fill="#2DD4BF" font-family="monospace">{esc(y_label)}</text></svg>')


def chart_for(ep_id: str) -> str:
    """Build-time charts straight from the public data files (best effort)."""
    try:
        if ep_id == "ep004":
            d = _j("ep004_quality.json")
            rows = [(m["model"], m["accuracy_pct"], round(m.get("tok_s_mean") or 0, 1)) for m in d["per_model"]]
            pairs = [(m, "accuracy %", a, "tok/s", t) for m, a, t in rows]
            return svg_bars(pairs, "", color_a="#2DD4BF", color_b="#7C6CFF")
        if ep_id == "ep008":
            d = _j("ep008_vectordb.json")
            pts = []
            for r in d["runs"]:
                rec = r["lanes"]["chroma"].get("recall_at_k")
                if rec is not None:
                    pts.append((f"{r['n']//1000}k", round(rec * 100, 1)))
            return svg_line(pts, "recall@10 % (chroma defaults)")
        if ep_id == "ep012":
            d = _j("ep012_qat.json")
            rows = d.get("builds") or d.get("per_model") or []
            if len(rows) >= 2:
                a, b = rows[0], rows[1]
                pairs = [("accuracy %", a.get("name", "PTQ-Q4"), a["accuracy_pct"], b.get("name", "QAT-Q4"), b["accuracy_pct"]),
                         ("tok/s", a.get("name", "PTQ-Q4"), a["tok_s"], b.get("name", "QAT-Q4"), b["tok_s"]),
                         ("GB on disk", a.get("name", "PTQ-Q4"), a.get("size_gb", 0), b.get("name", "QAT-Q4"), b.get("size_gb", 0))]
                return svg_bars(pairs, "")
    except Exception:
        return ""
    return ""


# ----------------------------------------------------------------- builds --
def email_box() -> str:
    if not NEWSLETTER_URL:
        return ""
    return (f'<section><div class="wrap"><div class="card"><h3>One short email per benchmark drop</h3>'
            f'<p>The number, the method, the raw data. No essays, no sponsors.</p>'
            f'<div class="cta"><a class="btn primary" href="{NEWSLETTER_URL}">Get the drops</a></div></div></div></section>')


def build_index() -> str:
    lb_rows = []
    for r in LEADERBOARD:
        pending = r["ep"] is None
        link = f'<a href="benchmarks/{next((e["slug"] for e in REGISTRY if e["id"]==r["ep"]), "")}.html">details</a>' if r["ep"] else "coming"
        cls = ' class="pending"' if pending else ""
        lb_rows.append(f'<tr{cls}><td>{esc(r["model"])}</td><td class="score">{esc(r["score"])}</td>'
                       f'<td>{esc(r["speed"])}</td><td class="cost">{esc(r["cost"])}</td><td>{link}</td></tr>')
    cards = []
    for e in REGISTRY:
        cards.append(
            f'<div class="card"><div class="q">{esc(e["question"])}</div>'
            f'<h3><a href="benchmarks/{e["slug"]}.html">{esc(e["title"])}</a></h3>'
            f'<p>{esc(e["verdict"])}</p></div>')
    guide_cards = [
        f'<div class="card"><div class="q">{esc(g["question"])}</div>'
        f'<h3><a href="{g["slug"]}.html">{esc(g["title"])}</a></h3>'
        f'<p>{esc(g["blurb"])}</p></div>'
        for g in GUIDES]
    body = f"""
<div class="hero"><div class="wrap">
<h1>AI benchmarks you can re-run and argue with.</h1>
<p class="lead">Same graded exams, temperature 0, deterministic code-based graders — no LLM-as-judge, no sponsors.
Accuracy is <strong>measured</strong>; every dollar figure is <strong>modeled from labelled inputs</strong> and marked as such.</p>
<div class="badges"><span class="badge m">measured</span><span class="badge mo">modeled &amp; labelled</span>
<span class="badge">open data</span><span class="badge">reproducible</span></div>
<div class="cta"><a class="btn primary" href="{REPO_URL}">Raw data + code</a>
<a class="btn ghost" href="{CHANNEL_URL}">The video teardowns</a></div>
</div></div>
<section><div class="wrap">
<h2>The exam leaderboard — <a href="cost-per-correct-answer.html">cost per correct answer</a></h2>
<p class="sub">One 15-task graded exam, run everywhere: a free local 3B on an 8GB laptop up to frontier APIs.
Cost multiples are modeled vs the free local baseline.
<a href="cost-per-correct-answer.html">What "cost per correct answer" means →</a>
<a href="methodology.html">How it's graded →</a></p>
<table class="lb"><tr><th>Model</th><th>Exam score</th><th>Speed</th><th>Cost / correct answer</th><th></th></tr>
{''.join(lb_rows)}</table>
<p class="note">"On the bench" = currently being measured. Results publish here, on
<a href="{CHANNEL_URL}">YouTube</a>, and in the <a href="{REPO_URL}">repo</a> simultaneously.</p>
</div></section>
<section id="benchmarks"><div class="wrap">
<h2>All benchmarks</h2>
<p class="sub">Every teardown, one page each: the question, the verdict, the numbers, the raw JSON.</p>
<div class="grid">{''.join(cards)}</div>
</div></section>
<section id="guides"><div class="wrap">
<h2>Field guides</h2>
<p class="sub">Cross-benchmark answers, assembled from the same measured data files.</p>
<div class="grid">{''.join(guide_cards)}</div>
</div></section>
{email_box()}
<section><div class="wrap"><div class="card">
<h3>Reproduce anything — or break it</h3>
<p>Every harness runs from the repo. Corroborations (and contradictions) get credited in
<a href="{REPO_URL}/blob/main/CONTRIBUTORS.md">CONTRIBUTORS.md</a> — contradictions are the most valuable entries.</p>
</div></div></section>"""
    jsonld = f"""<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"WebSite","name":"{SITE_NAME}","url":"{BASE_URL}/",
"description":"{TAGLINE} Open-data LLM benchmarks: local vs cloud cost, quantization, runtimes, RAG, prompt injection."}}
</script>"""
    return page(f"{SITE_NAME} — reproducible AI benchmarks (open data)",
                "Reproducible LLM benchmarks with open data: local vs cloud cost per correct answer, quantization (QAT vs PTQ), Ollama vs MLX, vector DB recall, RAG re-rankers, prompt injection.",
                body, f"{BASE_URL}/", 0, jsonld)


def build_episode(e: dict, prev_e: dict, next_e: dict) -> str:
    nums = "".join(
        f'<div class="num"><div class="v">{esc(v)}</div><div class="l">{esc(l)}</div>'
        f'<span class="tag {"m" if t=="measured" else ("mo" if t=="modeled" else "p")}">{esc(t)}</span></div>'
        for v, l, t in e["numbers"])
    files = "".join(f'<div><a href="{REPO_URL}/blob/main/data/{f}">data/{f}</a></div>' for f in e["files"])
    chart = chart_for(e.get("chart", "")) if e.get("chart") else ""
    chart_html = f'<div class="chart">{chart}</div>' if chart else ""
    video = VIDEO_URLS.get(e["id"], CHANNEL_URL)
    prev_link = ('← <a href="%s.html">%s</a>' % (prev_e["slug"], esc(prev_e["question"]))) if prev_e else ""
    next_link = ('<a href="%s.html">%s</a> →' % (next_e["slug"], esc(next_e["question"]))) if next_e else ""
    nav = f'<div class="next"><span>{prev_link}</span><span>{next_link}</span></div>'
    faqs = FAQS.get(e["id"], [])
    faq_html = faq_section(faqs)
    caveat_html = f'<p class="note">{esc(e["caveat"])}</p>' if e.get("caveat") else ""
    guide_slug = RELATED_GUIDES.get(e["id"])
    guide_html = (f'<p class="sub">Field guide: <a href="../{guide_slug}.html">'
                  f'{esc(_guide_title(guide_slug))}</a></p>') if guide_slug else ""
    cite_html = (
        f'<div class="cite"><span class="cite-label">CITE THIS RESULT</span>'
        f'<p>&ldquo;{esc(e["verdict"])}&rdquo; &mdash; {SITE_NAME}, open data at '
        f'<a href="{BASE_URL}/benchmarks/{e["slug"]}.html">{BASE_URL.replace("https://","")}/benchmarks/{e["slug"]}</a></p></div>')
    body = f"""
<div class="hero"><div class="wrap">
<div class="badges"><span class="badge">{esc(e["id"].upper())}</span><span class="badge m">measured</span></div>
<h1>{esc(e["title"])}</h1>
<p class="lead">{esc(e["question"])}</p>
</div></div>
<section><div class="wrap">
<div class="verdict"><strong>Verdict:</strong> {esc(e["verdict"])}</div>
{caveat_html}
<div class="nums">{nums}</div>
{guide_html}
{chart_html}
<h2>How it was measured</h2>
<p class="sub">Fixed prompts, temperature 0, answers graded by deterministic code (a number, a letter, JSON asserts) — never an LLM judge.
Hardware and exact model tags are recorded inside each data file. Full protocol: <a href="../methodology.html">methodology</a>.</p>
{faq_html}
{cite_html}
<h2>Raw data</h2>
<div class="filelist">{files}</div>
<h2>Reproduce it</h2>
<pre>git clone {REPO_URL}.git
# each benchmark's runner + inputs are documented in data/README.md</pre>
<div class="cta">
<a class="btn primary" href="{video}">Watch the teardown</a>
<a class="btn ghost" href="{REPO_URL}">Get the data</a>
</div>
{nav}
</div></section>"""
    jsonld = f"""<script type="application/ld+json">
{{"@context":"https://schema.org","@type":"Dataset","name":"{esc(e["title"])}",
"description":"{esc(e["verdict"])}","url":"{BASE_URL}/benchmarks/{e["slug"]}.html",
"license":"{REPO_URL}/blob/main/LICENSE",
"distribution":[{",".join(f'{{"@type":"DataDownload","contentUrl":"{REPO_URL}/blob/main/data/{f}"}}' for f in e["files"])}],
"creator":{{"@type":"Organization","name":"{SITE_NAME}","url":"{BASE_URL}/"}}}}
</script>"""
    if faqs:
        faq_entities = ",".join(
            json.dumps({"@type": "Question", "name": q,
                        "acceptedAnswer": {"@type": "Answer", "text": a}})
            for q, a in faqs)
        jsonld += (f'\n<script type="application/ld+json">'
                   f'{{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{faq_entities}]}}'
                   f'</script>')
    return page(f'{e["title"]} — {SITE_NAME}', e["verdict"], body,
                f'{BASE_URL}/benchmarks/{e["slug"]}.html', 1, jsonld)


def build_methodology() -> str:
    body = f"""
<div class="hero"><div class="wrap"><h1>Methodology</h1>
<p class="lead">The rules every number on this site obeys — and the labels that keep measured and modeled honest.</p>
</div></div>
<section><div class="wrap">
<h2>Measured means measured</h2>
<p>Accuracy and throughput come from real runs on named hardware with exact model tags, recorded inside each data file.
Runs use fixed prompts and temperature 0 so anyone can reproduce them bit-for-bit where the backend allows it.</p>
<h2>Graded by code, never by vibes</h2>
<p>The 15-task exam covers arithmetic, logic, code, format-following, and extraction. Every answer is checked by a
deterministic grader — an exact number, a letter, JSON asserts. No LLM-as-judge anywhere in the pipeline, because a
judge model smuggles its own biases into the score.</p>
<h2>Modeled means labelled</h2>
<p>Dollar figures (electricity, cloud pricing, cost per correct answer) are <em>models</em> built from labelled public
inputs — utility tariffs, provider price pages — cited inside the data files. They are marked
<span class="badge mo">modeled</span> wherever they appear, so you always know which kind of number you're reading.</p>
<h2>Scope is part of the result</h2>
<p>A result on a 3B dense model on an 8GB laptop is claimed for that regime, not for the frontier. Where a finding
stopped generalising in our own testing, the page says so.</p>
<h2>Zero sponsorship</h2>
<p>No vendor pays for placement or verdicts. When that ever changes for a specific piece of content, it will be
disclosed on the content itself.</p>
<h2>Break it, get credited</h2>
<p>Every harness is public. Run it on your hardware; if your numbers corroborate or contradict ours, open an issue —
you get a row in <a href="{REPO_URL}/blob/main/CONTRIBUTORS.md">CONTRIBUTORS.md</a>. Contradictions are the most
valuable thing you can send.</p>
</div></section>"""
    return page(f"Methodology — {SITE_NAME}",
                "How The Validation Set measures LLM benchmarks: deterministic graders, temperature 0, labelled cost models, open data, no LLM-as-judge, no sponsors.",
                body, f"{BASE_URL}/methodology.html", 0)


def build_guide_8gb() -> str:
    faqs = [
        ("Is 8GB of RAM enough to run a local LLM?",
         "Yes — for 3–4B models at 4-bit quantization. On a base 8GB Apple-silicon Mac, a 3B ran at ~21 tok/s and "
         "scored 80% on a 15-task graded exam. The wall sits just above it: an 8B at FP16 (16 GB) cannot load at all, "
         "and at Q8 (8.5 GB) it swapped to 0.03 tok/s and timed out."),
        ("Which quantization fits an 8B model into 8GB?",
         "Q4: the measured Q4_K_M build (4.8 GB) loaded and ran at 11 tok/s, scoring 87% on the same graded exam. "
         "Anything above 4-bit for an 8B is past this machine's memory wall."),
        ("How many concurrent agents can an 8GB Mac run?",
         "Two. Measured on a 3B via ollama: at two concurrent agents each still gets ~8 tok/s (above a 6 tok/s usable "
         "floor); at three or more, every agent drops below usable speed."),
        ("Is the small model much worse than the 8B?",
         "Seven points on a graded exam: the 3B scored 80% vs the 8B's 87% — and in that run the 8B generated at "
         "roughly a quarter of the 3B's speed. Every 3B miss was multi-step arithmetic, which a calculator tool patches for free."),
    ]
    body = f"""
<div class="hero"><div class="wrap"><h1>Is an 8GB Mac enough to run a local LLM? (measured)</h1>
<p class="lead">Yes — for the right model class. Four measured runs on one base-model 8GB Apple-silicon Mac show
exactly what fits, what swaps, and what breaks.</p>
</div></div>
<section><div class="wrap">
<div class="verdict"><strong>Verdict:</strong> 8GB runs a 3–4B model at 4-bit comfortably (~21 tok/s, 80% on a graded
exam) and even an 8B if — and only if — you take the Q4 build. The wall is real and abrupt: the same 8B at Q8 swapped
to 0.03 tok/s and timed out, and at FP16 it cannot load at all.</div>
<h2>Where the wall is (same 8B, three precisions, one 8GB machine)</h2>
<p>From <a href="benchmarks/{_slug("ep011")}.html">the quantization teardown</a>: FP16 needs ~16 GB — twice the
machine — and never loads. Q8_0 (8.5 GB) technically loads, then spills to swap and crawls at 0.03 tokens/sec until it
times out. Q4_K_M (4.8 GB) loads clean and generates at 11 tok/s while scoring 87% on the 15-task graded exam.
Precision is the dial that decides whether the model exists at all on this hardware.</p>
<h2>What you actually get at 8GB</h2>
<p>From <a href="benchmarks/{_slug("ep004")}.html">the graded small-vs-big exam</a>: the 3B scored 80% — with every
miss in one bucket, multi-step arithmetic — while the 8B scored 87% at roughly 4× the wait (~6 tok/s in that run).
From <a href="benchmarks/{_slug("ep003")}.html">the load test</a>: the 3B answered a 64-token request in 6.5 s
(~21 tok/s); the standard 8B tag on the same box swap-thrashed and did not return within a 600-second timeout.</p>
<h2>Concurrency: the knee is at 2</h2>
<p>Measured at 1→8 concurrent agents on the 3B: throughput holds through two agents (~8 tok/s each, above the 6 tok/s
usable floor), then every agent drops below usable at three or more. Latency doubles from one agent to two even while
throughput holds — parallelism on 8GB is a trade, not a freebie.</p>
<h2>Why the 8B numbers differ between runs — on purpose</h2>
<p class="note">You will see the 8B at "timed out", "~6 tok/s", and "11 tok/s" across these pages. All three are real:
they come from different builds (standard tag vs Q4_K_M), different swap states, and different workloads — each data
file records its own conditions. Averaging them into one number would be tidier and wrong. That is rather the point of
measuring.</p>
{faq_section(faqs)}
<p class="sub">Raw data behind every number: <code>ep003_sizewall</code>, <code>ep003_scaling</code>,
<code>ep004_quality</code>, <code>ep011_quant</code> in <a href="{REPO_URL}">the repo</a> ·
<a href="methodology.html">methodology</a></p>
</div></section>"""
    g = GUIDES[0]
    return page(f'{g["title"]} — {SITE_NAME}',
                "Measured on a base 8GB Apple-silicon Mac: which local LLMs fit (3-4B at Q4, ~21 tok/s, 80% graded), "
                "where the wall is (8B Q8 swaps to 0.03 tok/s; FP16 won't load), and the 2-agent concurrency knee.",
                body, f'{BASE_URL}/{g["slug"]}.html', 0, faq_jsonld(faqs))


def build_guide_cpca() -> str:
    faqs = [
        ("What is cost per correct answer?",
         "The total price of running a model through a graded exam, divided by the number of answers a deterministic "
         "grader accepted. It prices the outcome you actually want — a correct answer — instead of the token, which is "
         "just the raw material."),
        ("Why not just compare price per token?",
         "Because tokens aren't the product. A model with cheap tokens that gets more answers wrong can cost more per "
         "correct answer than a pricier model — and against a $0 local baseline, per-token prices understate the real "
         "multiple. Measured on the same 15-task exam, frontier models landed at roughly 657× and 108× the cost per "
         "correct answer of a free local 3B that scores 80%."),
        ("Is cost per correct answer measured or modeled?",
         "Both, and the labels matter: exam accuracy is MEASURED (temperature 0, deterministic graders, no LLM judge); "
         "the dollar side is MODELED from labelled public inputs — provider price pages, electricity tariffs — cited "
         "inside each data file."),
        ("What are the metric's limits?",
         "It inherits the exam's task mix — 15 verifiable tasks skewed to arithmetic, logic, code, formatting, and "
         "extraction. It says nothing about long-context or creative work, and the dollar side drifts whenever "
         "providers reprice. That's why multiples are quoted against a stable $0-hardware baseline and re-run when "
         "prices move."),
    ]
    body = f"""
<div class="hero"><div class="wrap"><h1>Cost per correct answer</h1>
<p class="lead">The number per-token pricing hides — and the metric behind
<a href="index.html">this site's leaderboard</a>.</p>
</div></div>
<section><div class="wrap">
<div class="verdict"><strong>Definition:</strong> what a model run costs, divided by the answers a deterministic
grader accepted. Accuracy is measured; dollars are modeled from labelled public inputs. It prices the outcome, not
the token.</div>
<h2>Why per-token pricing misleads</h2>
<p>Price pages sell tokens; you are buying correct answers. The same 15-task graded exam, run everywhere from a free
3B on an 8GB laptop to frontier APIs, produces multiples that per-token pages never show: one frontier model priced
out at ~657× the cost per correct answer of the free local baseline, another at ~108× — for exams the local model
already passes at 80%. When the denominator is "answers you can keep," cheap tokens and cheap results turn out to be
different claims.</p>
<h2>How it's computed</h2>
<p>1) Run the fixed 15-task exam at temperature 0. 2) Grade every answer with deterministic code — an exact number, a
letter, JSON asserts; never an LLM judge. 3) Price the run from labelled inputs (provider price pages for APIs;
measured wattage × utility tariff for local hardware). 4) Divide. The accuracy half is
<span class="badge m">measured</span>; the dollar half is <span class="badge mo">modeled</span> — the
<a href="methodology.html">methodology</a> keeps the two labels honest.</p>
<h2>Read the numbers yourself</h2>
<p>The multiples above come from <a href="benchmarks/{_slug("ep006")}.html">the frontier exam</a> and
<a href="benchmarks/{_slug("ep013")}.html">the routing teardown</a>; every input sits in the raw JSON in
<a href="{REPO_URL}">the repo</a>, so you can re-price the whole leaderboard when a provider changes its rates.</p>
{faq_section(faqs)}
</div></section>"""
    g = GUIDES[1]
    return page(f'{g["title"]} — {SITE_NAME}',
                "Cost per correct answer: run cost divided by grader-accepted answers. Why per-token pricing misleads "
                "(measured multiples: ~657x and ~108x vs a free local 3B), how it's computed, and its honest limits.",
                body, f'{BASE_URL}/{g["slug"]}.html', 0, faq_jsonld(faqs))


GUIDE_BUILDERS = {
    "is-8gb-mac-enough-for-local-llm": build_guide_8gb,
    "cost-per-correct-answer": build_guide_cpca,
}


def main() -> None:
    OUT.mkdir(exist_ok=True)
    (OUT / "benchmarks").mkdir(exist_ok=True)
    (OUT / ".nojekyll").write_text("")
    (OUT / "style.css").write_text(CSS)
    (OUT / "index.html").write_text(build_index())
    (OUT / "methodology.html").write_text(build_methodology())
    for g in GUIDES:
        (OUT / f'{g["slug"]}.html').write_text(GUIDE_BUILDERS[g["slug"]]())
    for i, e in enumerate(REGISTRY):
        prev_e = REGISTRY[i - 1] if i > 0 else None
        next_e = REGISTRY[i + 1] if i < len(REGISTRY) - 1 else None
        (OUT / "benchmarks" / f'{e["slug"]}.html').write_text(build_episode(e, prev_e, next_e))
    urls = [f"{BASE_URL}/", f"{BASE_URL}/methodology.html"] + [
        f'{BASE_URL}/{g["slug"]}.html' for g in GUIDES] + [
        f'{BASE_URL}/benchmarks/{e["slug"]}.html' for e in REGISTRY]
    (OUT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(f"  <url><loc>{u}</loc></url>" for u in urls) + "\n</urlset>\n")
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nSitemap: {BASE_URL}/sitemap.xml\n")
    print(f"built {2 + len(GUIDES) + len(REGISTRY)} pages -> {OUT}")


if __name__ == "__main__":
    main()
