# Fluxstore AI Security Specification

## 1. Data Invariants
1. **Owner Isolation**: Every `CompressionJob` (`/jobs/{jobId}`), `Transfer` (`/transfers/{transferId}`), `UsageLog` (`/logs/{logId}`), `AnalyticsEvent` (`/analytics/{eventId}`), and `User` (`/users/{userId}`) belongs strictly to the authenticated, email-verified user (`request.auth.uid`).
2. **No Blanket Reads or PII Exposure**: Unauthenticated users cannot read or list any Firestore collection (`match /{document=**} { allow read, write: if false; }`). Public sharing links are resolved via server-side transfer capability tokens without querying private Firestore collections from an unauthenticated SDK.
3. **Immutable Ownership & Timestamps**: `userId` and `timestamp` are immutable after document creation. `timestamp` must equal `request.time` on creation.
4. **Strict Field Allowlisting**: All creations enforce `hasAll` and `hasOnly` key checks; all updates enforce `isValid[Entity](incoming())` and `affectedKeys().hasOnly(...)`.
5. **Bounded Strings & Arrays**: Every string and array field enforces explicit `.size()` limits to prevent storage exhaustion.

## 2. Adversarial "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated read of `/jobs/{jobId}`**: `request.auth == null` -> Denied.
2. **Unauthenticated read of `/transfers/{transferId}`**: `request.auth == null` -> Denied.
3. **Cross-user job read**: User B attempts `get` or `list` on User A's `/jobs/{jobId}` -> Denied.
4. **Identity spoofing on job create**: User A creates `/jobs/{jobId}` with `userId: "user_B"` -> Denied.
5. **Shadow field injection on job create**: User A creates `/jobs/{jobId}` with extra `isAdmin: true` field -> Denied.
6. **Shadow field injection on job update**: User A updates `/jobs/{jobId}` adding `extraField: "hack"` -> Denied.
7. **Timestamp forgery on job create**: User A creates `/jobs/{jobId}` with client-chosen `timestamp` != `request.time` -> Denied.
8. **Immutable field mutation on job update**: User A updates `userId` or `originalSize` on `/jobs/{jobId}` -> Denied.
9. **Type poisoning on job update**: User A sets `downloadCount: "unlimited"` -> Denied.
10. **Download count jump/reset**: User A updates `downloadCount` from `3` to `0` instead of `4` -> Denied.
11. **Oversized ID poisoning**: User A creates `/jobs/<150-char-invalid-id>` -> Denied by `isValidId()`.
12. **Unverified email write**: User with `email_verified: false` attempts write -> Denied.
