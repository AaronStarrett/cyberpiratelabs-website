# Website rollback

The previous website revision is b8e0a3b1e9f7b6da7e23d3cd8f8b05c0dbaadd33. The revamp is isolated at D:\Cyber Pirate Labs\03_ENGINEERING\Repositories\cyberpiratelabs-website on codex/voice-chat-website; the original D:\CPL Website checkout is preserved.

To roll back an authorized release, revert the website revamp commit in the existing repository and publish the resulting normal commit to main, respecting current branch protections. Build that exact clean revision using the existing public build settings and release to the already established cyberpiratelabs-website Worker with the documented --keep-vars/commit tag procedure in cloudflare-deploy.md. Verify the active version and official website after release. Do not reset/force-push, change domain routing, recreate Workers, restore/reset databases, or replace secrets. A UI rollback does not require an inquiry-data rollback.

The existing preceding Worker version e4a4dd76-400c-4197-8aab-8791d1635ed8 is baseline deployment evidence; preserve newer stored inquiries and existing settings regardless of the source revision selected.
