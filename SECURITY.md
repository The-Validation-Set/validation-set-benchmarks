# Security policy

This project is a static benchmark site (GitHub Pages, no server, no forms, no cookies), open data files, and local benchmark harnesses. There is no backend to attack — but if you find something anyway, we want to know.

## Reporting

Use GitHub's **private vulnerability reporting** on this repository ("Security" tab → "Report a vulnerability"). Please don't open a public issue for anything sensitive.

In scope:
- Anything in this repo that could execute unexpectedly for someone who clones it and runs the documented commands (harness scripts, `site/build_site.py`, the Remotion code).
- Content injection into the generated site (`docs/`) via crafted data files.
- Leaked credentials or personal data anywhere in the repo or its history.

Out of scope: the YouTube channel, third-party platforms, volumetric/DoS reports against GitHub Pages.

## What you get

No bounty program (this is a zero-budget project) — but verified reports get credited in [CONTRIBUTORS.md](CONTRIBUTORS.md), and security findings are treated as the most valuable kind of contradiction.

## For users of this repo

- The harnesses never require credentials except where explicitly documented (e.g. `GEMINI_API_KEY` as an environment variable — never hardcode keys into files).
- Review any pull request's diff before running its code locally. Maintainers do the same before merging.
