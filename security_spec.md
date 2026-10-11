# PPFStudio Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Default Deny**: Every unmatched path is strictly denied (`allow read, write: if false`).
2. **Verified Identity**: Every write requires `isSignedIn()` and `request.auth.token.email_verified == true`.
3. **Admin Verification**: Administrator privileges (`isAdmin()`) require either a verified document at `/admins/$(request.auth.uid)` or the bootstrapped owner email (`jabedjk112@gmail.com`) with `request.auth.token.email_verified == true`.
4. **Review Integrity**:
   - A `Review` can only be created with `authorId == request.auth.uid`, `status == 'pending'`, and `createdAt == request.time`.
   - Public list/get access on `/reviews/{reviewId}` is restricted to documents where `resource.data.status == 'approved'`, `resource.data.authorId == request.auth.uid`, or `isAdmin()`.
   - Once a review reaches terminal status (`approved` or `rejected`), non-admins cannot modify it. Only `isAdmin()` can update `status` and `updatedAt`.
5. **AdminMedia Integrity**:
   - Only `isAdmin()` can create, update, or delete `/adminMedia/{mediaId}`.
   - Public read/list is restricted to documents where `resource.data.status == 'published'` or `isAdmin()`.
6. **VisitorEvent & CallSession Integrity**:
   - `ownerId` / `callerId` must equal `request.auth.uid` on creation, and `createdAt == request.time`.
   - Terminal call states (`ended`, `rejected`, `failed`) lock further non-admin updates.

## 2. The "Dirty Dozen" Payloads
1. **Unauthenticated Write**: Create `/reviews/rev-1` with `auth == null` -> `PERMISSION_DENIED`
2. **Unverified Email Spoof**: Create `/reviews/rev-1` with `email: "jabedjk112@gmail.com"`, `email_verified: false` -> `PERMISSION_DENIED`
3. **Identity Spoofing**: Create `/reviews/rev-1` with `authorId: "victim-uid"` while signed in as `"attacker-uid"` -> `PERMISSION_DENIED`
4. **Self-Approved Review (State Shortcutting)**: Create `/reviews/rev-1` with `status: "approved"` -> `PERMISSION_DENIED`
5. **Shadow / Ghost Field Injection**: Update `/reviews/rev-1` adding `"isVerified": true` -> `PERMISSION_DENIED`
6. **Value Poisoning**: Create `/reviews/rev-1` with `rating: "five"` or `review` of 50,000 chars -> `PERMISSION_DENIED`
7. **ID Poisoning**: Create `/reviews/invalid$id!@#` -> `PERMISSION_DENIED`
8. **Timestamp Forgery**: Create `/reviews/rev-1` with a past/future `createdAt` != `request.time` -> `PERMISSION_DENIED`
9. **Immortal Field Mutation**: Update `/reviews/rev-1` changing `createdAt` or `authorId` -> `PERMISSION_DENIED`
10. **Terminal State Re-opening**: Non-admin updating a review after `status == 'approved'` -> `PERMISSION_DENIED`
11. **Unauthorized Pending Review Scraping**: Non-owner, non-admin listing `/reviews` where `status == 'pending'` -> `PERMISSION_DENIED`
12. **Privilege Escalation**: Non-admin writing to `/admins/attacker-uid` -> `PERMISSION_DENIED`

## 3. Red Team Audit & Conflict Report
- **Identity Spoofing**: Blocked by `data.authorId == request.auth.uid`, `data.ownerId == request.auth.uid`, and `data.callerId == request.auth.uid`.
- **State Shortcutting**: Blocked by `incoming().status == 'pending'` on review creation and `incoming().status == 'calling'` on call session creation.
- **Resource Poisoning**: Blocked by `isValidId()` regex + length <= 128 on all document IDs and `.size()` bounds on every string field.
- **Value Poisoning**: Blocked by wrapping every `allow update` with `isValid[Entity](incoming())` + `affectedKeys().hasOnly(...)`.
