# Rollback

## Site deploy

Preview and production are different Workers. To undo a preview deploy, redeploy the previous git commit:

```bash
git checkout <previous-commit>
npm run build
npx wrangler deploy
```

Or use the Cloudflare dashboard deployment history for `cyberpiratelabs-website` and roll back there. Do not delete the D1 database as part of a site rollback. Inquiry rows are independent of the HTML.

## Domain, inspected 2026-09-21

No DNS record was changed.

| Record | Observed value |
| --- | --- |
| NS | ns-cloud-e1.googledomains.com through ns-cloud-e4.googledomains.com |
| Apex A | 198.185.159.144, 198.185.159.145, 198.49.23.144, 198.49.23.145 |
| www | CNAME ext-sq.squarespace.com, then the same Squarespace addresses |
| MX | 1 smtp.google.com |
| TXT | v=spf1 include:_spf.google.com ~all |

`https://cyberpiratelabs.com` returned a Squarespace 301 to `https://www.cyberpiratelabs.com/`. That host returned 404 with `server: Squarespace` and a “Website Expired” page. Mail DNS is still Google.

## Blocked cutover

Do not change nameservers, MX, SPF, DKIM, DMARC, or domain ownership. A safe later change, only after a verified Cloudflare URL exists and Aaron approves it, is to edit the apex and www records at the current DNS host so they point at the Worker, leaving MX and TXT as they are. That edit was not made. There is no production URL yet.

If a future apex or www change misroutes the site, restore the A and CNAME values in the table above. Leave MX and SPF untouched while doing that.
