# Development Conventions

## Code and Firebase

- TypeScript is strict. Prefer small typed modules and preserve the existing React/Vite structure.
- Callable Functions validate authentication, role, and all untrusted input at the server boundary.
- The only Firestore document readable without signing in is `public_schedule/current` (the upcoming dates). Put nothing in it that is not meant for the public, and do not add another public path without an owner decision and a Rules test for every allow and denial.
- Firestore and Storage Rules default to deny. Add a rules test for every new allow path.
- Firebase client configuration may be public configuration, but credentials, service-account JSON, Resend keys, and `.env` contents are secrets.
- Do not create public Storage URLs for learner materials; use the server-authorised short-lived URL flow.
- Learner-only content (guides, run sheets, vocabulary lists) never lives in `src/` or `public/`, because it would ship in the public bundle. Read it from Firestore under Rules and render it as text, never as HTML.
- **This repository is public.** Anything behind the learner gate (guides, run sheets, curriculum, cost models, flavour vocabulary, seed JSON, PDFs) stays in the gitignored `content-drafts/` folder or outside the repo and is never committed, quoted in docs or tests, or pasted into pull requests. Gitignoring does not remove material already committed: history is public. `npm.cmd run security:gated` fails if a gated-looking file is tracked or the ignore rules weaken. If `content-drafts/gated-markers.txt` exists locally (gitignored, one lowercase word or phrase per line), it also fails when any marker appears in a tracked text file or in `dist/`; marker text is never printed, and CI skips the check because the file is absent there.
- Fonts are self-hosted through Fontsource packages imported in `src/main.tsx`. Do not add Google Fonts or other third-party font requests, and do not ship the legacy Gotham files.
- Work on a feature branch and merge through a pull request; `main` is not branch-protected.

## Tests and verification

- Use `npm.cmd run lint`, `npm.cmd run check`, `npm.cmd run test:unit`, `npm.cmd run test:rules`, and `npm.cmd run build` during development.
- `npm.cmd run verify` is the complete local quality and security gate, including the gated-content check.
- `npm.cmd run verify:staged` is the pre-commit gate and additionally requires a staged session-handoff update.
- Production dependency audits block on high or critical findings. Secret scans and Firebase Rules failures always block.

## Documentation and commits

- Every commit refreshes `docs/SESSION_HANDOFF.md` with the current state, verification results, risks, and next action.
- Update `CHANGELOG.md` only for user-visible, operational, or security-impacting work.
- Use concise imperative commit subjects, for example `Add Firebase rules verification`.
- Never bypass the hook with `--no-verify` except during an incident, and record the reason in the handoff before the next commit.
