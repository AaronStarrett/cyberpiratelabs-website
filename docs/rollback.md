# Website rollback

## Current authorized custom-offer release baseline

The prior ten-service release is source a7c52a92e9eb0bac60e717bcb521611da5d1dbce and Worker version c4d219f3-cd19-473e-be1c-73b201a414e0. Record it before releasing the outcome-led/custom-automation marketing update. Recovery must preserve the notification repair and all newer inquiries; never reset D1, rotate secrets, deploy the historical Apps Script example or select a pre-notification-fix website revision.


The ten-solution update is isolated on `codex/ten-business-solutions` at `D:\Cyber Pirate Labs\03_ENGINEERING\Repositories\cyberpiratelabs-website`. Its source baseline is `e5295f45d6146bf11c484d75d2718b6d774d923a`, including notification repair `bb2366d` and the approved pirate artwork. The original `D:\CPL Website` checkout remains preserved. This review has not deployed a new version, so no live rollback is currently needed.

For a later authorized release, record the active Worker version immediately before deployment. If recovery is needed, revert the solution-update commit through a normal new commit in this same repository, respecting branch protections. Build that exact clean revision with the existing public build settings, and use the existing Worker release procedure in [cloudflare-deploy.md](cloudflare-deploy.md), preserving variables with `--keep-vars` and recording the commit tag and version. Verify the active deployment and official website after release.

Do not reset or force-push, change domain routing, recreate Workers, reset databases, replace secrets, or deploy the local Apps Script example. A presentation rollback must retain the notification safeguards and all newer inquiries. Do not select the older `b8e0a3` website baseline for this update: it predates the current notification repair and approved artwork.
