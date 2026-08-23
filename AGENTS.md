<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Database-First Module Creation
Whenever the user requests to build or add a new module, ALWAYS follow a database-first approach:
1. **Focus on the Database First**: Start by designing and implementing the table(s) in `schema.sql` and run any necessary D1 database migrations.
2. **Do Not Proceed to UI**: Do not start writing frontend UI components until the database schema has been created, approved, and migrated.
