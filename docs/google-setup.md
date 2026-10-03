# Owner notification bridge

The website saves inquiries in D1 and separately sends an owner notification through Apps Script. Email works without a Sheet or Drive archive. Runtime configuration, provider acceptance and actual inbox receipt need separate evidence; mock tests do not establish them.

## Preserve the existing project

Add `google/apps-script/Notification.gs` beside the existing cloud code. Preserve that project's `Code.gs`, `doGet`, legacy functions, properties, pinned versions and deployment URLs. Rename only the existing cloud `doPost` to `legacyWebsitePost_`. The new router delegates legacy `secret`/`action` requests to that function and HMAC envelopes to namespaced notification helpers.

**Do not bulk-push this repository's Apps Script directory.** Local `Code.gs` is a historical archive example, differs from the preserved cloud connector, and defines another `doPost`. Deploy only the additive `Notification.gs` with the preserved cloud code; retain exactly one global `doPost`.

## Authorization and deployment

Add only `https://www.googleapis.com/auth/script.send_mail` for the notification. Preserve the existing approved `drive`, `gmail.send` and `script.external_request` scopes. Compare `existing-project-manifest.example.json` with the actual manifest before changing it. No new inbox-read scope is required. [MailApp documentation](https://developers.google.com/apps-script/reference/mail/mail-app) covers the send-only service and Reply-To.

Run `cplAuthorizeNotification` from the owner editor for consent. It calls only `MailApp.getRemainingDailyQuota()` and sends nothing. Create a new web-app deployment executed as the owner and reachable by the Worker, keeping old deployments pinned. Unsigned/stale requests remain rejected.

Set these script properties privately:

| Property | Value |
| --- | --- |
| `HMAC_SECRET` | Private shared secret, matching Worker `GOOGLE_HMAC_SECRET` |
| `OWNER_EMAIL` | `astarrett@cyberpiratelabs.com` |
| `NOTIFICATION_ENABLED_AFTER` | Explicit UTC activation cutoff; this release uses `2026-10-02T23:34:41.000Z` |
| `NOTIFICATION_RECOVERY_REFERENCES` | Empty initially |
| `ARCHIVE_ENABLED` | `false` for notification-only setup |

Leave legacy `CPL_*` properties untouched. No Sheet, folder or inbox password is required.

Worker keys: `GOOGLE_APPS_SCRIPT_URL` (new `/exec` URL), `GOOGLE_HMAC_SECRET`, `NOTIFICATION_ENABLED_AFTER` (same cutoff), `NOTIFICATION_RECOVERY_REFERENCES` (initially empty), and `GOOGLE_ARCHIVE_ENABLED=false`. Keep credentials server-side. Apply additive `0002_delivery_claims.sql` to the existing database before deploying the updated Worker; it creates only a separate claim table.

## Acceptance and backlog

Record the cutoff and inspect pending inquiries privately before enabling. Automatic delivery includes rows created at or after that cutoff. Earlier rows remain held. `CPL-2AA16BBF` is always excluded, even if mistakenly allowlisted.

After deployment/consent, submit one clearly synthetic request through the real form. Verify its saved reference and actual owner inbox message, fixed recipient, Reply-To, optional details, readable HTML/plain text and unchanged retry. Keep evidence private. MailApp returning establishes its reported send outcome; inbox readback establishes arrival. Neither books a meeting.

Only after that QA passes, recover `CPL-347301C3` if pending and no prior owner message exists. Temporarily allow exactly that reference in `NOTIFICATION_RECOVERY_REFERENCES` on both sides, let the existing 15-minute cron recover that eligible record, verify arrival, then clear both allowlists. If operator access is already configured, its authenticated single-record retry is an alternative; do not create an operator credential solely for this recovery. Report other backlog without draining it.

## Retry and uncertain outcomes

The Worker uses a 90-second per-inquiry D1 claim, token-fenced status writes and at most eight transient attempts with backoff. The existing 15-minute cron respects eligibility and due times. Zero-quota preflight is known not to have sent and may retry.

Apps Script uses [LockService](https://developers.google.com/apps-script/reference/lock/lock-service) and a durable PropertiesService ledger keyed by stable submission id. It checks content hash, reference, creation time and supported state; writes `sending` before MailApp; records `sent` only after the call returns and the ledger write succeeds. Identical retries return that result. Mutated identities, malformed ledgers and uncertain sends never trigger a blind resend.

After a lost response, the Worker sends a signed `notify:false` ledger query. `not_started` permits a later attempt; ledger-confirmed `sent` completes the notification. `sending`/`ambiguous` requires owner reconciliation. Mail and ledger writes do not share a transaction; exactly-once delivery is not claimed.

Preserve sent/ambiguous ledger entries. They contain hashes, references, timestamps and states, not inquiry text. Monitor [Apps Script quotas](https://developers.google.com/apps-script/guides/services/quotas), including PropertiesService capacity. Ledger persistence failure stops sending safely.

## Optional archive and contract

A separately authorized existing archive requires `ARCHIVE_ENABLED=true` in the script, `GOOGLE_ARCHIVE_ENABLED=true` in the Worker, existing `SHEET_ID` and/or `FOLDER_ID`, and their approved scopes. Email runs first; archive failure preserves successful mail status. Sheet rows/Drive files upsert by submission id. Spreadsheet escaping occurs in the Sheet adapter, preserving raw phone/email in mail. Archive retries reuse the send ledger.

Requests retain the timestamp/id/payload/HMAC envelope: HMAC-SHA256 binds `timestamp + "." + submissionId + "." + sha256(payload)` with five-minute clock tolerance. Version-2 responses are also signed using `"response:" + timestamp` and bind id, reference, payload hash and fixed recipient. Only validated signed responses are accepted.

Archive states: `pending`, `pending_unconfigured`, `disabled`, `synced`, `failed`. Notification states: `pending`, `pending_unconfigured`, `held`, `failed`, `ambiguous`, `sent`. Internal codes remain in the operator view. Public confirmations say received, provide the reference, explain a delay when needed and offer direct contact.