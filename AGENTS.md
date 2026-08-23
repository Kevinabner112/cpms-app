<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Local UI-First & Manual Deployment Workflow
Whenever the user requests to build or modify a module, follow this strict workflow:

1. **Local Server Testing First**: All development must be tested on the local server (`npm run dev`) before anything is published.
2. **Volatile Local State (UI-First)**: Start by building the UI and using client-side state (React state or Zustand) to hold drafted data. The data should be volatile (disappears on refresh) to simulate the flow without touching a real database.
3. **Delayed Database Implementation**: Only after the UI and local state flow are verified and approved, proceed to create the actual database schema (`schema.sql`) and backend API routes for cloud persistence.
4. **Explicit Deployment**: Do NOT push to GitHub or trigger cloud deployments unless the user explicitly asks for it.
