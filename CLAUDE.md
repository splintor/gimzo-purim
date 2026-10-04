# Notes for Claude

- Do not install dependencies or run/build/typecheck this repo locally. Wix blocks access to the general npm artifactory, so `yarn install` fails.
- Validate PRs only through Vercel / GitHub CI (`gh pr checks <n>`, `npx vercel inspect <deployment> --logs`).
