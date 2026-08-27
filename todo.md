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
- [x] Use the approved four-password server-side sign-in flow instead of email verification; credentials are not exposed in client code.
- [x] No verified admin email or mail-delivery secret is required for the approved four-password flow.
- [x] Add S3-backed image/video upload with MIME, size, and extension validation.
- [x] Add admin media library with preview, metadata, and publish/remove controls.
- [x] Add a public website Admin entry point without exposing the panel to unauthenticated users.
- [x] Add bilingual admin labels and clear success/error/loading states.
- [x] Write Vitest coverage, verify responsive behavior, and run production build.
- [x] Save and deliver the updated checkpoint.

### Security note

- [x] Do not implement fake credentials, hardcoded passwords, or client-side secrets.
- [x] No email verification codes are implemented without a supported provider and verified sender.

## Four-Password Admin Media Panel

- [x] Add Admin option inside the three-dot menu and open the login popup.
- [x] Add four labeled password fields: Password, PPF Password, Admin Password, and Private Password.
- [x] Verify all four credentials server-side with hashed secret values, rate limiting, and secure admin session handling.
- [x] Add protected admin panel route available only after successful authorization.
- [x] Add English Image and Arabic Image upload slots with previews and metadata.
- [x] Add bilingual video upload/publish controls with type and size validation.
- [x] Add media library actions for preview, publish/unpublish, and safe removal metadata.
- [x] Add bilingual labels, validation errors, loading states, and responsive admin styling.
- [x] Configure four admin secrets through secure environment configuration; never hardcode them.
- [x] Write Vitest coverage, verify UI flows, run production build, and save a checkpoint.

## Source ZIP Delivery

- [x] Prepare a complete source archive without secrets, node_modules, build caches, or private runtime data.
- [x] Add IONOS/Node.js hosting compatibility notes and startup instructions.
- [x] Verify ZIP integrity and attach the archive for download.

## Footer Admin Entry Point

- [x] Add an English Admin icon/link below TikTok in the footer social stack.
- [x] Link the Admin entry to the existing secure four-password `/admin` panel.
- [x] Verify accessibility, desktop/mobile layout, and production build.
- [x] Save and deliver the updated checkpoint.

## Admin Login Failure Investigation

- [x] Confirm the four admin secret values are configured and non-empty without exposing them.
- [x] Reproduce the login failure and inspect server/browser logs for the exact error.
- [x] Fix the authentication or configuration issue without hardcoding credentials.
- [x] Add regression coverage for successful and failed admin gate login.
- [x] Rebuild, verify the login screen/request contract, and save a corrective checkpoint.

## Admin Login Failure Fix

- [x] Trace the submitted login request and identify whether the failure is client, router, secret, or cookie related.
- [x] Verify the four configured secret keys by presence only, without exposing values.
- [x] Fix the authentication/session issue and improve the user-facing error message.
- [x] Add regression coverage for the corrected login flow.
- [x] Rebuild, run tests, validate the browser flow, and save a corrective checkpoint.

## Bilingual Media Upload Reliability Update

- [x] Audit current media schema, upload procedure, admin picker, storage URL handling, and public gallery mapping.
- [x] Define a durable bilingual media pairing model for English and Arabic image/video assets.
- [x] Update backend procedures and database migration for paired media uploads and retrieval.
- [x] Rebuild the admin media selector with distinct English and Arabic drop zones, visible selected-file previews, remove/replace controls, and upload progress/status feedback.
- [x] Ensure video selection shows filename, type, size, thumbnail/poster or playable preview, and clear validation errors.
- [x] Make save/upload flow sequential per language to avoid oversized dual-video requests and surface server/storage failures.
- [x] Render uploaded paired media from the database on the public site according to the active English/Arabic language.
- [x] Add Vitest coverage for upload validation and related admin flows.
- [x] Validate the implementation contract in desktop/mobile browser shells; owner credentialed upload and language-switch smoke test remains recommended because private passwords are never handled here.

## Admin Media UX History

- [x] Replace the basic single media picker with clear English/Arabic paired upload boxes as requested.
- [x] Make selected image/video state visually obvious before upload.
- [x] Diagnose why uploaded media is not appearing publicly and fix the rendering path.
- [x] Verify the final upload-to-public-language-switch implementation path; owner credentialed smoke test remains recommended without exposing private credentials.

## Existing Media Edit and Replace

- [x] Audit existing admin media fields, pairKey relationships, update procedures, and library action patterns.
- [x] Add secure backend procedures to edit media metadata/status and replace stored media bytes while preserving language and pair relationships.
- [x] Add admin Edit controls for title/status and Replace controls for image/video files with visible previews and validation.
- [x] Support replacing English or Arabic assets independently without breaking the paired asset mapping.
- [x] Ensure edited/replaced published media refreshes on the public site for the active language.
- [x] Add regression tests for replacement validation, pair preservation, and public retrieval selection.
- [x] Run type-check, tests, production build, responsive verification, and save a final checkpoint.

## Upload Failure Investigation

- [x] Reproduce the reported inability to select or upload image/video files and inspect browser/server/network logs.
- [x] Trace file input state, form validation, tRPC payload size, storagePut response, database insert, and public media query.
- [x] Fix the upload transport or storage/database failure without weakening admin protection.
- [x] Add clear inline error and progress states for selection, validation, upload, save, and public refresh.
- [x] Add regression coverage for the corrected upload flow and large-file safeguards.
- [x] Verify the corrected implementation with admin/public route checks, type-check/tests/build, and save a checkpoint; owner credentialed upload smoke test remains recommended.

## Upload Progress Feedback

- [x] Add a visible upload progress bar and loading animation for the English/Arabic upload steps.
- [x] Show per-file progress state, completion state, error state, and retry-friendly messaging.
- [x] Keep progress accessible with aria-live/status semantics and reduced-motion support.
- [x] Validate the progress UI with type-check, tests, production build, and responsive browser checks; save a checkpoint.
