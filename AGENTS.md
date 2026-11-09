## Git & deploy workflow
- Integration: push directly to `main`; no PRs.
- Commits: short Swedish messages (see `git log`).
- Before committing: run `node test.js` (must print `ok`).
- Deploy: GitHub Pages builds from `main` automatically after each push; no manual step. Check with `gh run list -L 1`.
- Live page: https://nicklasandersson.github.io/behringer-dsp-1124p/
- GUI text (`index.html`) describes how to use the panel and what fields mean. Uncertainty, test results and hypotheses go in `docs/`.
