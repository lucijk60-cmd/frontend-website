# PPFStudio deployment notes

## Important compatibility note

This project is a full-stack React, Express, tRPC, and MySQL application. The public frontend can be built into static assets, but the genuine reviews, four-password Admin panel, media uploads, database access, and moderation procedures require the Node.js server runtime and environment variables. A standard IONOS Web Hosting Plus shared plan may host static/PHP files but may not run this Node.js server directly. Use Manus hosting or an IONOS VPS/Cloud Server with Node.js support for the complete application.

## Build and run

Install Node.js dependencies with `pnpm install`, run `pnpm check`, run `pnpm test`, and create the production bundle with `pnpm build`. The server is started with `pnpm start` and must receive the hosting provider's assigned port through the runtime environment; do not hardcode a port.

## Required runtime configuration

The full-stack deployment requires the platform-provided database, OAuth, JWT, Forge storage, and application environment variables. The four Admin gate values are `ADMIN_GATE_PASSWORD`, `PPF_GATE_PASSWORD`, `ADMIN_PANEL_PASSWORD`, and `PRIVATE_ACCESS_PASSWORD`. Configure these through the hosting provider's secret manager. Never commit `.env` files or place passwords in client code.

## Static-only deployment

For a static-only host, run `pnpm build` and upload the generated `dist/public` directory to the web root. This serves the public frontend only; reviews, Admin login, uploads, moderation, and database-backed features will not function unless the server API is hosted separately and the frontend is configured to reach it.

## Domain

Point the domain DNS records to the hosting platform selected for the full-stack server. For a Manus deployment, use the exact target records shown in Management UI → Settings → Domains; do not guess or reuse an unrelated IP address.
