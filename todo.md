# Genuine Review System

The review feature will use only visitor-submitted content. No fabricated, seeded, or placeholder reviews will be added.

## Implementation checklist

- [x] Upgrade the static project with database, backend API, and user management capability.
- [x] Define review table fields for name, rating, text, status, timestamps, and moderation metadata.
- [x] Add migration, query helpers, and typed public/admin procedures.
- [x] Show the approved review count without exposing the list by default.
- [x] Open approved reviews in a modal or drawer when the count is selected.
- [x] Add a public review submission form with validation and pending status.
- [x] Add moderation controls and basic spam/duplicate safeguards.
- [x] Verify success/error states, responsive layout, tests, and production build.
- [x] Save and deliver the updated checkpoint.

## Admin Panel and Media Management

- [x] Add a protected `/admin` route with owner/admin role enforcement.
- [ ] Add secure sign-in and email verification-code flow; do not expose credentials in client code.
- [ ] Configure the verified admin email and any required mail-delivery secrets.
- [x] Add S3-backed image/video upload with MIME, size, and extension validation.
- [x] Add admin media library with preview, metadata, and publish/remove controls.
- [x] Add a public website Admin entry point without exposing the panel to unauthenticated users.
- [x] Add bilingual admin labels and clear success/error/loading states.
- [x] Write Vitest coverage, verify responsive behavior, and run production build.
- [x] Save and deliver the updated checkpoint.

### Security note

- [ ] Do not implement fake credentials, hardcoded passwords, or client-side secrets.
- [ ] Do not email verification codes until a supported mail-delivery provider and verified sender are configured.

## Four-Password Admin Media Panel

- [x] Add Admin option inside the three-dot menu and open the login popup.
- [x] Add four labeled password fields: Password, PPF Password, Admin Password, and Private Password.
- [x] Verify all four credentials server-side with hashed secret values, rate limiting, and secure admin session handling.
- [x] Add protected admin panel route available only after successful authorization.
- [x] Add English Image and Arabic Image upload slots with previews and metadata.
- [x] Add bilingual video upload/publish controls with type and size validation.
- [x] Add media library actions for preview, publish/unpublish, and safe removal metadata.
- [x] Add bilingual labels, validation errors, loading states, and responsive admin styling.
- [ ] Configure four admin secrets through secure environment configuration; never hardcode them.
- [x] Write Vitest coverage, verify UI flows, run production build, and save a checkpoint.

## Source ZIP Delivery

- [ ] Prepare a complete source archive without secrets, node_modules, build caches, or private runtime data.
- [ ] Add IONOS/Node.js hosting compatibility notes and startup instructions.
- [ ] Verify ZIP integrity and attach the archive for download.

## Footer Admin Entry Point

- [x] Add an English Admin icon/link below TikTok in the footer social stack.
- [x] Link the Admin entry to the existing secure four-password `/admin` panel.
- [x] Verify accessibility, desktop/mobile layout, and production build.
- [x] Save and deliver the updated checkpoint.
