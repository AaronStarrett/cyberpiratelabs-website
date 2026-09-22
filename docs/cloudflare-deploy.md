# Deploy the existing Cloudflare preview

This repository updates the existing `cyberpiratelabs-website` Worker at [the preview origin](https://cyberpiratelabs-website.astarrett.workers.dev/). It uses Workers Static Assets, D1, Turnstile, and the existing fifteen-minute retry trigger. Deployments are manual from reviewed, committed source. Keep GitHub Actions disabled; do not add automatic Git builds or paid services.

This is a release procedure, not evidence that the current redesign has been deployed. Record the actual released commit, Worker version, browser checks, and inquiry readback in the release handoff.

## Existing target: verify and reuse

Read-only preflight on 2026-09-21 America/New_York confirmed:

| Setting | Existing preview |
| --- | --- |
| Cloudflare account ID | `35c95f42dca80a711e480e086d77d410` |
| Worker name | `cyberpiratelabs-website` |
| Environment variable | `ENVIRONMENT=preview` |
| Assets binding | `ASSETS`, from `dist/` |
| D1 binding | `DB` |
| D1 database name | `cpl-website-inquiries-preview` |
| D1 database ID | `5bf0d631-d3ee-452c-9ed7-bf516229080b` |
| Build-time public Turnstile key | `0x4AAAAAAE_TJqIfvVWrwNw4` |

The top-level `wrangler.jsonc` configuration is this preview. Recheck the current account, deployed version, and bindings before release. The database already exists and contains saved inquiries. A frontend update does not require database creation, migration, reset, or replacement.

Existing Wrangler authorization worked during preflight. Use `whoami` to check the current session; do not run login or refresh credentials merely because Wrangler lists unrelated missing scopes. The existing session successfully read deployments, Worker bindings, secret names, and D1 metadata. A successful read does not itself prove a later upload succeeded.

## Windows workspace and build environment

Use the verified external-SSD checkout. The owner's current workspace is `D:\CPL Website`. Verify the SSD before writing, preserve any unrelated files, and keep dependencies, caches, output, logs, screenshots, recordings, and temporary files on that drive.

The following PowerShell setup uses the Node installation verified for this workspace. If that installation changes, resolve and verify the replacement on the SSD before substituting its path.

```powershell
Set-Location -LiteralPath 'D:\CPL Website'
$nodeDir = 'D:\Cyber Pirate Labs\93_TOOLS_AND_CACHE\gods-eye-view\node-v24.14.0-win-x64'
$node = Join-Path $nodeDir 'node.exe'
$npmCli = Join-Path $nodeDir 'node_modules\npm\bin\npm-cli.js'
$env:PATH = $nodeDir + ';' + $env:PATH
$env:TEMP = 'D:\Cyber Pirate Labs\93_TOOLS_AND_CACHE\cpl-website\temp'
$env:TMP = $env:TEMP
$env:npm_config_cache = 'D:\Cyber Pirate Labs\93_TOOLS_AND_CACHE\cpl-website\npm-cache'
$env:WRANGLER_LOG_PATH = 'D:\Cyber Pirate Labs\93_TOOLS_AND_CACHE\cpl-website\evidence\wrangler-release.log'
$env:WRANGLER_SEND_METRICS = 'false'
$env:CI = 'true'
$env:CLOUDFLARE_ACCOUNT_ID = '35c95f42dca80a711e480e086d77d410'
$env:PUBLIC_TURNSTILE_SITE_KEY = '0x4AAAAAAE_TJqIfvVWrwNw4'
$env:PUBLIC_INDEXABLE = 'false'
& $node --version
```

The Turnstile **site key is public** and is embedded in the form HTML. It must be present when Astro builds; preserving the Worker secret alone does not preserve a working form after a rebuild. Public build settings may be kept in an ignored local `.env`, but never put secret values in a committed example. Keep preview indexing disabled. The existing site's canonical-domain metadata is not authorization to attach a domain.

Use command-local Git trust where exFAT requires it, for example `git -c safe.directory='D:/CPL Website' status --short`. Do not change global Git trust settings.

## Read-only release preflight

```powershell
& $node node_modules/wrangler/bin/wrangler.js whoami
& $node node_modules/wrangler/bin/wrangler.js deployments list --name cyberpiratelabs-website
& $node node_modules/wrangler/bin/wrangler.js d1 info cpl-website-inquiries-preview
& $node node_modules/wrangler/bin/wrangler.js secret list --name cyberpiratelabs-website
```

Inspect the active version with `wrangler versions view <version-id> --name cyberpiratelabs-website`. Confirm `DB`, `ASSETS`, `ENVIRONMENT`, the account, and the preview Worker. `secret list` returns names, not values; keep credentials out of terminal output, source, screenshots, and release notes.

During the recorded preflight, only `RATE_LIMIT_SALT` and `TURNSTILE_SECRET` were configured. `OPERATOR_TOKEN`, `GOOGLE_HMAC_SECRET`, and `GOOGLE_APPS_SCRIPT_URL` were absent. Preserve existing deployed secrets. Do not replace, rotate, or invent them for a visual update, and do not pass a secrets file to deploy. Google archive and owner notification remain separate from D1 persistence; follow [Google setup](google-setup.md) only under its own authorized setup scope.

## Verify and deploy a known commit

1. Fetch the latest intended remote branch, reconcile concurrent source changes, and review the final diff. Run the repository tests, typecheck, lint, production build, and secret scan. Complete the browser checks and preserve private evidence on the SSD.
2. Commit and publish the reviewed source to this same repository. Integrate into the default branch only when permitted by its protection rules. Record the published branch and full commit SHA; do not reset or force-push.
3. Build the exact clean committed revision using the preview environment above. Check that generated tracked assets did not make the checkout dirty. A build of different or uncommitted source is not evidence for the recorded release.
4. Run the dry run, inspect the target and bindings, then deploy that same build. Use a commit tag and message so the Worker version can be matched to source.

```powershell
$releaseCommit = (git -c safe.directory='D:/CPL Website' rev-parse HEAD).Trim()
if (git -c safe.directory='D:/CPL Website' status --porcelain) {
  throw 'Commit and review source changes before release.'
}
& $node $npmCli run build
if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
if (git -c safe.directory='D:/CPL Website' status --porcelain) {
  throw 'Build changed tracked source; review and commit before release.'
}
& $node node_modules/wrangler/bin/wrangler.js deploy --dry-run --name cyberpiratelabs-website
if ($LASTEXITCODE -ne 0) { throw 'Deployment dry run failed.' }
& $node node_modules/wrangler/bin/wrangler.js deploy --name cyberpiratelabs-website --keep-vars --tag $releaseCommit --message "Website preview from commit $releaseCommit"
if ($LASTEXITCODE -ne 0) { throw 'Preview deployment failed.' }
```

The tag and message document provenance; they do not independently enforce it. Confirm the SHA is the reviewed published revision before upload. This procedure selects the existing preview and preserves existing runtime variables. Do not add `--env production`, routes, domains, database operations, or secret changes.

After deployment, read the active deployment and version back, confirm its tag/message and bindings, and inspect the actual preview in a browser. Check the real CSP, asset requests, desktop/mobile layouts, reduced-motion/fallback states, and inquiry form. A local build or GitHub push is not a successful deployment.

## Bounded inquiry verification

Submit one clearly fictional inquiry through the actual preview form and normal Turnstile control. Record the submission UUID, returned public reference, and separate storage/Google/notification statuses in private evidence. Read only that test record through authenticated Wrangler D1 access or a configured operator route. Avoid exporting or displaying unrelated inquiries.

For duplicate verification, replay the same submission UUID and identical normalized fields with a fresh Turnstile verification. The backend checks Turnstile before duplicate lookup; a consumed token is not a valid duplicate test. Expect HTTP 200, `duplicate=true`, the same reference, and a D1 count of one row for that UUID. Preserve the test row and existing inquiries. Do not reset the database, delete rows, or use operator confirmation to manufacture delivery success.

D1 readback can succeed even when `OPERATOR_TOKEN` is unset. Use a narrowly scoped SELECT for the fictional UUID and its count. Report any unavailable readback as a specific gap. `pending_unconfigured` means Google archive/notification setup is unfinished; it does not negate D1 persistence and must not be described as successful downstream delivery.

## Production and domain work remain separate

`env.production` names `cyberpiratelabs-website-production`, disables `workers.dev`, and currently contains a placeholder database ID. It is not the preview target. Do not create a production database or Worker, enable indexing, attach `cyberpiratelabs.com` or `www`, change DNS/nameservers/mail records, connect an automatic build pipeline, or activate paid services as part of this preview release. Those changes require their own concrete scope and verification.
