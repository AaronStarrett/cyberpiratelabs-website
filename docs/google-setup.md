# Google archive setup

This path is optional. The site stores inquiries in D1 without it. Do not claim the Sheet, Drive copy, or owner email works until a synthetic end-to-end test succeeds.

Smallest next step: in the owner Google account, create one private Sheet and one private Drive folder, paste `google/apps-script/Code.gs`, set the script properties, deploy the web app, then set the Worker secrets `GOOGLE_HMAC_SECRET` and `GOOGLE_APPS_SCRIPT_URL`.

## Apps Script

1. Create a private Google Sheet and a private Drive folder in the owner account.
2. Open Extensions, Apps Script, and paste `google/apps-script/Code.gs`.
3. Set script properties: `HMAC_SECRET`, `SHEET_ID`, `FOLDER_ID`, `OWNER_EMAIL`. `OWNER_EMAIL` is the verified business inbox. The script does not trust an address inside the request.
4. Deploy as a web app, execute as the owner, access limited as far as Google allows while still accepting the Worker POST. Anyone-with-the-link is a last resort because the HMAC is what rejects strangers.
5. Put the same `HMAC_SECRET` in the Worker as `GOOGLE_HMAC_SECRET`, and the web app URL in `GOOGLE_APPS_SCRIPT_URL`.

The Worker posts JSON:

```json
{ "timestamp": "epoch-ms", "submissionId": "uuid", "signature": "hex", "payload": "{...inquiry json...}" }
```

`signature` is HMAC-SHA256 of `timestamp + "." + submissionId + "." + sha256(payload)`. The script rejects a skew over 5 minutes and upserts by `submissionId`.

Sheet and CSV values that start with `=`, `+`, `-`, `@`, or a tab are prefixed with a quote before they leave the Worker.

## Separate statuses

The script returns `archive` and `notification` separately. A mail failure does not erase a successful Sheet write. The Worker stores those statuses independently.

## Not done

No Google account was connected from this environment. Live sync and live notification are not tested.
