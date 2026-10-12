# DropThatUni

A master's application workspace built with SvelteKit, TypeScript, Tailwind CSS, and Bun.

```sh
bun install
bun run dev:local
```

Open the URL printed by Vite. Use `bun run check`, `bun run build`, and `bun run test:ui` for validation. After building, `bun run test:ui --config playwright.production.config.ts` also verifies the production Bun server and larger imports. UI tests use an isolated real PostgreSQL database and a local S3 fixture; no real R2 files are touched. The test runner supplies explicit test-only storage credentials and starts its own server on port 5293.

## Workspace

Clean timeline view is the default. Programs support drag and keyboard ranking, inline table editing, editable detail fields, customizable columns and checklists. New workspaces start empty. The landing page is at / and the tracker is at /workspace. Legacy seeded sample rows and their associated fees are removed; real user-created programs are retained.

Profile supports email/password signup, login and logout. Passwords and sessions are managed by Better Auth. Workspace and Import require login, enforced in server hooks. Accounts, workspaces and document metadata live in PostgreSQL; new workspace changes are never written to localStorage. Older browser workspaces can be imported during signup. Theme preference remains device-local. Export produces a workspace JSON file, excluding documents and account credentials.

Fees support amounts, currencies, due dates, program association and paid/unpaid status. Totals are calculated per currency; currencies are never added together without conversion. Application details include their own fees and documents.

Documents support PDF, DOCX, TXT, PNG and JPEG up to 10 MB. Upload once in the library and attach to multiple applications. Detaching preserves the library copy; deleting removes it from R2 and all application links. Access and downloads require the owning account. Files are downloaded as attachments.

## R2

Set the variables in `.env.example` using your existing R2 endpoint and credentials. Create a **private** bucket and set `R2_BUCKET_NAME_DOCUMENTS`. Do not enable an r2.dev public URL or a public custom domain for that bucket. The token must have read/write permissions for it; an existing token limited to image buckets needs updated permissions. The app stores private object keys and streams authenticated downloads; there is no public URL setting.

## Coolify

Deploy the included Dockerfile, target port 3000, and assign the HTTPS domain. Set:

- `ORIGIN=https://your-domain`
- `BETTER_AUTH_URL=https://your-domain`
- `BETTER_AUTH_SECRET`: a persistent random secret (generate with `bun -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- R2 variables from `.env.example`
- `DATABASE_URL`: your PostgreSQL resource's Internal URL
- `BODY_SIZE_LIMIT=12M` (already set in the Dockerfile; allows document uploads and larger workspace imports)
- `ADDRESS_HEADER=x-forwarded-for` and `XFF_DEPTH=1` for one trusted Coolify proxy. Match the depth to your actual proxy chain if using a CDN or another reverse proxy. The app passes the adapter-resolved address to Better Auth, replacing any client-supplied internal IP header, so login rate limits are per client.

Keep the container reachable through the Coolify proxy only; leave host Port Mappings empty. Use `/health` on internal port 3000 for readiness. The Dockerfile includes a Bun-based health check; it verifies startup migrations and database connectivity without authentication or external storage/email calls.

PostgreSQL is required. Create a standalone PostgreSQL resource on the same Coolify destination, start it, and copy its **Internal URL** to the app's private runtime `DATABASE_URL`. Keep database networking private. The app requires no `/app/data` mount. PostgreSQL data persists in the database resource's volume; configure scheduled database backups separately. R2 objects need their own backup policy.

At startup, Better Auth creates/updates its PostgreSQL tables, followed by application tables (workspace JSONB, document metadata and links, reminder delivery history). Startup migrations are serialized with a PostgreSQL advisory lock. `/health` becomes ready after migrations finish. Builds do not connect to PostgreSQL or need credentials. Keep `BETTER_AUTH_SECRET` persistent across deployments and set credentials as runtime-only variables.

Use one app replica when the built-in reminder scheduler is enabled. Reminder claims are atomic across connections. Local development uses `bun run dev:local` to start a private persistent PostgreSQL server on port 55435, or set `DATABASE_URL` to your own local database and run `bun run dev`. The embedded PostgreSQL package is a development dependency and is not installed in the production image. Local credentials and database files stay in ignored `data/`.

Existing SQLite files are left untouched; they are not automatically migrated. A new PostgreSQL database starts empty. Workspace JSON export/import transfers application data, not accounts, document records or reminder history. Do not remove the old database until any required data has been transferred.

Light/dark themes share the app family styling. Figtree is self-hosted; its license is in `static/fonts/OFL.txt`.


## Upcoming tasks, offers and application links

Upcoming tasks combines unsubmitted applications, incomplete requirements, unpaid fees, offer response dates, unpaid deposits and funding deadlines. Requirement dates override the application deadline. Archived/withdrawn/declined/rejected programs are excluded; paid fees and completed requirements are excluded. Offer dates, tuition, scholarship, financial aid, deposit and funding status are editable in Decision & funding. Tuition after funding assumes awards share the same currency and tuition period and do not overlap; record award conditions in Funding notes.

Application link and official source are editable in program details, with a Last checked date. The application portal link appears under the program name in the table and opens in a new tab. Existing custom Application link URL fields also work.

## Import and restore

The header's Import page includes a copyable local-AI prompt describing the JSON format. No AI account or API key is needed. Upload a validated JSON file up to 2 MB, review its counts, then Merge or Replace / restore. Merge matches program IDs first, then university/program/intake while preserving existing program IDs and document links; incoming data updates matching programs. Restore preserves the file's IDs and preferences and downloads your current workspace as a backup before replacement. Documents remain in R2/the library and are not included in a JSON export. Links to programs depend on preserved application IDs.

Imports are validated before saving. Failed saves restore the previous in-memory workspace. AI facts must be checked against official sources; the prompt asks the AI to leave unknown facts blank and use source links. Reminder settings are disabled in the AI template.

## Email deadline reminders

Set these private server environment variables in Coolify:

- `RESEND_API_KEY`: a Resend API key with sending permission.
- `REMINDER_FROM_EMAIL`: e.g. `DropThatUni <reminders@aaryandehade.com>`, on a domain verified in Resend.
- `REMINDER_CRON_SECRET`: a separate persistent random secret of at least 32 characters.
- `REMINDER_AUTO_RUN=true`: enables the built-in scheduler in this persistent Coolify app process. It starts when SvelteKit loads its server hooks, checks every 5 minutes, and requires the application to remain running. Use one app replica with the built-in scheduler.
- Keep `BETTER_AUTH_URL` and `ORIGIN` set to the public HTTPS application URL.

Users opt in under Profile → Deadline reminders and choose their time zone, hour, and notice days. Default notices are 7, 3, 1 and 0 days before a dated task. At most one digest is delivered per account/local calendar day after the chosen hour. No reminders are generated for undated or already overdue tasks. Delivery history is persisted in the database and Resend idempotency keys protect retries.

Alternatively leave `REMINDER_AUTO_RUN=false` and use an hourly n8n Schedule Trigger connected to an HTTP Request:

- Method: POST
- URL: `https://your-domain/api/reminders/run`
- Header: `Authorization: Bearer YOUR_REMINDER_CRON_SECRET`
- No body required.

Use an n8n Header Auth credential to keep the secret out of workflow JSON. The endpoint processes up to 50 due accounts per invocation and returns sent/failed/skipped counts. Call it again to process further accounts; successful deliveries will be skipped. Failed deliveries may retry that same day using the persisted payload and idempotency key. It sends email to each account's own email address. Time zone scheduling does not determine the university's precise cutoff time; deadline fields are calendar dates.

The test suite overrides `RESEND_API_URL` to a local fake email provider. Leave that variable unset in production, where delivery uses `https://api.resend.com/emails`. No live Resend sending has been performed during development.

Authentication tests disable rate limiting only in development with DROPTHATUNI_TEST_MODE=true; production retains authentication rate limits.

The public `/demo` page uses fictional sample data in memory, with editing, rankings, fields, tasks, fees and decisions. Refresh or Reset demo restores samples. It never loads or writes account data; document uploads and email reminders require an account.
