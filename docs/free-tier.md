# Free-tier notes

Checked 2026-09-21 against Cloudflare’s Workers pricing documentation: https://developers.cloudflare.com/workers/platform/pricing/

The Cloudflare account plan was not visible from this environment. Do not assume the account is on Workers Free. If it is already Workers Paid, the paid minimum is $5 USD per month and this deploy does not change that. No billing setting was modified. R2 was not enabled. Nothing was purchased.

Workers Free, as documented that day:

- 100,000 requests per day.
- 10 milliseconds of CPU time per invocation. Waiting on D1 or Google does not, by itself, spend CPU the way a busy loop would, but the 10 ms cap is real.
- Cron invocations count as requests. Every 15 minutes is about 96 invocations per day.
- D1 on Workers Free: 5 million rows read per day, 100,000 rows written per day, 5 GB total. Limits reset 00:00 UTC. Exceeding them makes queries fail until the reset. The docs say the Free plan includes D1 for prototyping.
- Workers Logs on Free, if later enabled: 200,000 per day, 3 days retention. Observability is off in `wrangler.jsonc` so inquiry bodies are not logged by that feature.

Static asset requests are described in the paid examples as not adding request charges in the same way as Worker invocations. This site sends only `/api/*` and the cron to the Worker. A marketing page should stay inside the free request budget at modest traffic. Confirm the account dashboard before calling the deploy free.

Turnstile’s standard widget is the intended bot check. No paid Turnstile feature was enabled.

This inquiry volume is one row per submission plus a few status updates. That is far under the published D1 write cap unless the form is abused. Rate limits are 8 saves per network hash per hour and 4 per email hash per hour.

Do not raise `cpu_ms` above the free cap unless the account is already paid and Aaron accepts that.
