# PPFStudio deployment notes

## Important compatibility note

This project is a full-stack React, Express, tRPC, and MySQL application. The public frontend can be built into static assets, but the genuine reviews, four-password Admin panel, media uploads, database access, and moderation procedures require the Node.js server runtime and environment variables. A standard IONOS Web Hosting Plus shared plan may host static/PHP files but may not run this Node.js server directly. Use Manus hosting or an IONOS VPS/Cloud Server with Node.js support for the complete application.

## Build and run

Install Node.js dependencies with `pnpm install`, run `pnpm check`, run `pnpm test`, and create the production bundle with `pnpm build`. The server is started with `pnpm start` and must receive the hosting provider's assigned port through the runtime environment; do not hardcode a port.

## Required runtime configuration

The full-stack deployment requires the platform-provided database, OAuth, JWT, Forge storage, and application environment variables. The complete variable-name template is `IONOS_ENV.example`; copy the names into the IONOS Node.js application's environment settings and replace only the placeholder values. The four Admin gate values are `ADMIN_GATE_PASSWORD`, `PPF_GATE_PASSWORD`, `ADMIN_PANEL_PASSWORD`, and `PRIVATE_ACCESS_PASSWORD`. Configure these through the hosting provider's secret manager. Never commit `.env` files or place passwords in client code.

For an IONOS Node.js application, use Node.js 20 or newer, set the project root to the uploaded source package, install dependencies with `npm install`, build with `npm run build`, and start with `npm start`. The application listens on the platform-provided `PORT`; do not hardcode a port. Set the public API/origin values to the actual IONOS domain when configuring OAuth and cookies.

## Static-only deployment

The GitHub copies under `public/assets/images` are repository-managed static copies for source control and archival deployment use. The active Manus full-stack runtime continues to use its S3/Manus storage URLs for managed Admin uploads; do not replace those `/manus-storage/...` references with raw GitHub URLs unless you intentionally want GitHub to become the runtime CDN.

For a static-only host, use the prepared `ppfstudio-ionos-static` package. Upload the **contents** of that package—not the outer folder—into the IONOS domain document root. The resulting structure is:

```text
/index.html
/.htaccess
/favicon.ico
/robots.txt
/sitemap.xml
/assets/css/index-*.css
/assets/js/index-*.js
/assets/images/*
/assets/fonts/README.txt
/pages/README.txt
```

The package includes the public frontend, local compiled image assets, favicon, and Apache SPA fallback. It is static-only: genuine reviews, Admin login, media upload/replace, moderation, database access, and S3-backed media require the Node.js full-stack runtime and a separately hosted API. Do not upload only `client/` or only the source `dist/` folder to the web root.

## Domain

Point the domain DNS records to the hosting platform selected for the full-stack server. For a Manus deployment, use the exact target records shown in Management UI → Settings → Domains; do not guess or reuse an unrelated IP address.
