# Notes for AI agents

- Do not install dependencies or run/build/typecheck this repo locally. Wix blocks access to the general npm artifactory, so `yarn install` fails.
- Validate changes only through Vercel / GitHub CI (`gh pr checks <n>`, `gh run list`, `npx vercel inspect <deployment> --logs`).
- Don't open a PR per change. The maintainer is the only contributor and production is not critical: commit and push directly to `main`. (Dependabot PRs are handled by `.github/workflows/dependabot-auto-merge.yml`.)
