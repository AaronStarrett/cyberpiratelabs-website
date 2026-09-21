# Lead recovery and deletion

Operator calls need `Authorization: Bearer <OPERATOR_TOKEN>`. The token is a Worker secret. These routes are not linked from the website.

## Inspect

`GET /api/operator/inquiries` lists rows whose Google or notification step is not finished.

`GET /api/operator/inquiries?pending=0` lists the latest 200 saved rows.

The response includes delivery status, attempt counts, next retry time, and the last error string. It does not include the network hash.

## Retry

`POST /api/operator/inquiries/<id-or-reference>/retry`

Runs delivery immediately. If Google is still unconfigured, the row stays `pending_unconfigured` and the inquiry remains saved.

The cron trigger does the same for due rows every 15 minutes, up to 8 failed attempts.

## Confirm a Google arrival

`POST /api/operator/inquiries/<id-or-reference>/confirm`

Body: `{ "archive": true, "notification": true }`

This records that an operator saw the Sheet or the mail. The response says `confirmedBy: "operator"`. It is not a callback from Google.

## Export

`GET /api/operator/export` returns CSV. Formula-like cells are prefixed. Treat the file as private.

## Delete

`DELETE /api/operator/inquiries/<id-or-reference>`

Removes the inquiry. A `deletion_log` row keeps the reference id and time, not the message, name, or email. Deletion does not reach into Google. Remove the Sheet row and Drive file by hand if a copy was already made.

There is no unauthenticated admin page.
