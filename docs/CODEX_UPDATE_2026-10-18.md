# Codex update: repository move and everything since Phase 3.4.4b

Written 2026-10-18 for Codex (and any other assistant). Read this once, then follow the checklist. It does not replace `docs/SESSION_HANDOFF.md`, which stays the source of truth.

## 1. The repository moved. Re-clone; do not pull

- **New repository:** `https://github.com/greymattercoffeewerks/werks-session` (public).
- **Old repository:** `greymattercoffeewerks/gm-education-portal` was deleted on 2026-10-18. Its URL no longer works.
- **Why:** gated planning and course material had been committed in early history. History was rewritten to remove it, but GitHub kept the old commits reachable through hidden pull-request refs, so the repository was recreated with the clean history. Every commit hash is different from before.
- **Product, Firebase project, and hosting did not change.** The Firebase project is still `werks-session` and the site is still `https://werks-session.web.app`. Only the GitHub repository changed.

### Local checklist (Windows PowerShell)

1. **Stop stray dev servers first.** Orphaned `vite preview` or `vite` processes lock `node_modules\@esbuild\win32-x64\esbuild.exe` and make `npm ci` fail with `EPERM`.
2. **Do not `git pull` an old clone.** The histories no longer share commits.
3. **If the old clone has no unpushed or uncommitted work you need,** delete it and clone fresh:

   ```powershell
   git clone https://github.com/greymattercoffeewerks/werks-session.git
   cd werks-session
   npm.cmd ci
   npm.cmd ci --prefix functions
   ```

4. **If the old clone has local work to keep,** export it before discarding anything: `git diff > my-work.patch` (and `git stash` or copy untracked files). Then clone fresh and re-apply with `git apply my-work.patch` on a new feature branch.
5. **If you must keep the folder,** repoint it and reset to the new `main` only after exporting any work:

   ```powershell
   git remote set-url origin https://github.com/greymattercoffeewerks/werks-session.git
   git fetch origin
   git checkout main
   git reset --hard origin/main
   git reflog expire --expire=now --all
   git gc --prune=now
   ```

   Delete every old local branch; they point at commits that no longer exist upstream.
6. **Run the hook setup once per clone:** `npm.cmd run setup:hooks` (it also runs from `npm install` through the `prepare` script).
7. **Re-trust `.codex/hooks.json`** in Codex's hook review UI on the first session in the new clone.
8. **Run `npm.cmd run verify`** and confirm it passes before starting work.

## 2. Local dependencies that changed

- **New runtime dependencies:** `@fontsource/figtree` and `@fontsource/archivo` (OFL-1.1). They are imported in `src/main.tsx`. `npm.cmd ci` installs them.
- **No other dependency changes.** Functions dependencies are unchanged.
- **Fonts:** Figtree (display) and Archivo (body and UI) are self-hosted through those packages. `components/bundle.css` no longer imports Google Fonts, and the three Gotham OTF files and their `@font-face` rules are gone. Do not reintroduce Google Fonts or Gotham.
- **Node:** keep Node 20-compatible tooling (`engines.node >= 20`).
- **New script:** `npm.cmd run security:gated` (`scripts/check-gated-content.mjs`). It is part of `npm.cmd run verify`, so the pre-commit hook and CI both run it.

## 3. This repository is public: gated material never goes in it

Anything behind the learner gate (guides, run sheets, curriculum, cost models, flavour vocabulary, Firestore seed JSON, PDFs) must stay out of Git.

- Keep it in the gitignored `content-drafts/` folder or outside the repository.
- Do not quote its words in docs, tests, commit messages, or pull request text. Public tests use structural markers only.
- `npm.cmd run security:gated` fails if a gated-looking file is tracked or the ignore rules weaken. If `content-drafts/gated-markers.txt` exists locally it also scans tracked files and `dist/` for the private markers it lists, and never prints them. **That marker file is not in Git.** The owner holds it; do not recreate it from memory of gated content, and do not commit it.
- Gitignoring does not erase history. Never commit gated material "temporarily".

## 4. Working rules that are now in force

- **Feature branch and pull request for every change.** `main` has no branch protection, so never commit to `main` directly. Merge through a pull request after the GitHub `verify` check passes.
- **The commit hook is the gate.** `npm.cmd run verify:staged` runs on every commit: handoff staged, lint, strict types, frontend and Functions tests, Rules emulator tests, build, secret scan, gated-content check, and production dependency audits. Do not use `--no-verify`.
- **Refresh `docs/SESSION_HANDOFF.md` on every commit**, and `CHANGELOG.md` for user-visible, operational, or security-impacting work.
- **Deploy Hosting only** with `npx.cmd firebase deploy --only hosting --project werks-session`, and Rules only with `--only firestore:rules`. Do not deploy Functions or Storage (the project is on Spark).
- **Do not delete or force-push** anything without the owner's explicit instruction.

## 5. What changed since your last work (after Phase 3.4.4b)

| Phase | Change |
| --- | --- |
| 3.5.1 | Public "How the evening runs" teaser on the Public Cupping card only. A test proves the guide-only structure is absent from the public page. |
| 3.5.2 | Self-hosted Figtree and Archivo; Google Fonts and Gotham removed. |
| 3.5.3 | **Fix:** instructor reviews now send `reviewedAt: serverTimestamp()`. The Rules have required `after.reviewedAt == request.time` since the review feature shipped, but the client never wrote it. New Rules and unit tests cover it. Added `security:gated`. |
| 3.5.4 | Instructor review page now uses the standard application width. Instructor feedback appears in its own labelled "Instructor feedback" block on returned and approved weeks, and stays visible while a learner revises a returned week. |
| Guide | **Learner-only Public Cupping guide.** Rules path `sessions/{sessionId}/guide/main` (read for a confirmed enrolee or teaching staff, never writable). `src/lib/session-guide.ts` parses and renders it as text only. The learner page is offering-aware: sessions can carry `offeringId` (`cupping` or `brew101`); Public Cupping guests do not get the Brew 101 practice record; sessions without `offeringId` keep the Brew 101 experience. Print styles included. |
| Repo | History rewrite to remove gated material, then the move to `werks-session`. |

**Released to production:** Firestore Rules (including the guide path) and Hosting, both on 2026-10-18. **Not released and not built:** Functions, Storage, indexes. **Not yet done:** the guide document has not been seeded in production, so no guest sees it. Staff seed it in Firebase Console after editorial sign-off, using local-only notes.

## 6. Files and docs to read, in order

1. `AGENTS.md`, `CONVENTIONS.md`
2. `docs/PROJECT_MEMORY.md`, `docs/DECISIONS.md` (newest entries first at the top of the 2026-10-18 block)
3. `docs/SESSION_HANDOFF.md` (current state, validation record, open items, next action)
4. `docs/GATED_SESSION_GUIDE_PLAN.md` (the guide design, work plan, and risks)
5. `docs/SPARK_ACCESS_GRANTS.md` (staff seeding procedure, including the guide document shape)

## 7. Update your own memory

Replace anything stale in Codex local memory with these facts:

- The repository is `greymattercoffeewerks/werks-session`; `gm-education-portal` no longer exists.
- The repository is public; gated material is gitignored and checked by `security:gated`.
- Work on feature branches and open pull requests; never commit to `main`.
- Fonts are Figtree and Archivo, self-hosted; no Google Fonts and no Gotham.
- Public Cupping has a public teaser and a gated, Firestore-delivered guide; sessions without `offeringId` behave as Brew 101.
- Instructor reviews must write `reviewedAt` as a server timestamp.
- Use `npm.cmd` commands on Windows, and stop stray preview servers before `npm.cmd ci`.

## 8. Open items for the owner (not for you to act on alone)

- Seed and smoke-test the guide in Firebase Console.
- Confirm the venue contact, arrival time, and cancellation wording before real guests are enrolled.
- Decide whether any further history or exposure clean-up is needed. The recreated repository has no pull-request refs and no old commits.
