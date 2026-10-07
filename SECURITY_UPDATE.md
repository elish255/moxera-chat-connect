# Security update

Updated `@tanstack/react-start` from `1.168.32` to `1.168.60` to address the Vercel-blocked CVE-2026-102989 advisory.

The old `bun.lock` was removed because it pinned the vulnerable `1.168.32`. Vercel should resolve dependencies from `package.json` on the next deployment.

Do **not** set `DANGEROUSLY_DEPLOY_VULNERABLE_TANSTACK_START_XSS=1`.
