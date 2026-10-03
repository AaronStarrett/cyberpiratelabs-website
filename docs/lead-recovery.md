# Inquiry recovery and deletion

Operator calls require `Authorization: Bearer <OPERATOR_TOKEN>`. Keep that Worker secret private. These routes have no unauthenticated admin page.

## Inspect and retry

`GET /api/operator/inquiries` lists up to 200 rows whose notification or enabled archive is unfinished. `GET /api/operator/inquiries?pending=0` lists the latest 200 saved rows. The operator view contains state, attempts, next due time, symbolic errors and confirmation time. A saved record is separate from send or inbox arrival.

`POST /api/operator/inquiries/<id-or-reference>/retry` still enforces the cutoff, recovery allowlist, QA exclusion, claims, durable ledger and attempt cap. Sent ledgers return the prior outcome without another email. Missing configuration cannot send.

The existing 15-minute cron selects eligible due rows with increasing backoff and at most eight transient attempts. Lost responses trigger status-only reconciliation before another send. An ambiguous outcome without a due time requires owner review; repeatedly clicking retry does not authorize resending.

For approved recovery, verify `CPL-347301C3` remains pending and has no prior owner email. After a real synthetic request reaches the inbox, temporarily allow exactly `CPL-347301C3` in script and Worker `NOTIFICATION_RECOVERY_REFERENCES`. Let the existing 15-minute cron process that eligible reference, verify arrival, and clear both allowlists. If operator access is already configured, single-record retry is an alternative. When it is unconfigured, do not create a new operator credential solely for this recovery. `CPL-2AA16BBF` is always excluded. Report other historical backlog without automatically sending it.

## Reconcile

Inspect the inbox and script ledger privately. `sending`/`ambiguous` means a send may have occurred. Do not delete that marker or resend as a workaround. If the owner verifies arrival, record the evidence in D1:

`POST /api/operator/inquiries/<id-or-reference>/confirm` with `{ "notification": true }`.

Include `"archive": true` only after verifying an actual archive copy. The response labels `confirmedBy: "operator"`; this is not a provider callback. D1 confirmation does not alter the script ledger or authorize resending. Preserve ambiguity when the outcome remains inconclusive.

## Export and delete

`GET /api/operator/export` returns private formula-safe CSV.

`DELETE /api/operator/inquiries/<id-or-reference>` removes the inquiry and local claim. The deletion log keeps only identifiers/time. It does not remove email, optional Sheet/Drive copies or the minimal script ledger. Handle separately authorized copies through the owner workflow. Preserve sent/ambiguous identity ledgers while duplicate prevention is required; never clear them merely to retry.

See `google-setup.md` for deployment, mail-only authorization and the signed contract.