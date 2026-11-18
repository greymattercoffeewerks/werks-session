# Security policy

## Supported versions

Werks Sessions is a single deployment. The supported surface is the live site at
<https://werks-session.web.app> and the `main` branch of this repository. Older builds and
branches are not maintained and do not receive fixes.

## Reporting a vulnerability

Please report privately through GitHub: open the repository's **Security** tab and choose
**Report a vulnerability**
(<https://github.com/greymattercoffeewerks/werks-session/security/advisories/new>). That
starts a private advisory that only you and the maintainer can see.

Please do not open a public issue with details, and do not send security reports to the
booking enquiry address. If private reporting is not available to you, open a minimal
public issue asking for a private channel, without any details, and a maintainer will
follow up.

A useful report includes:

- what you found and where (a URL, or a file and line in this repository);
- how to reproduce it, or a minimal proof;
- the impact you believe it has;
- anything you already tried.

Please do not include learner personal data or course content in a report. Use your own
test account, or run the app against the local emulators (`npm.cmd run test:e2e` shows how).

## Scope

**In scope:** the web application at the live site; the Firestore and Storage Rules in this
repository; the retained Cloud Functions code in `functions/` (which is not deployed while
the project is on Spark); and the build and CI configuration.

**Out of scope:** Firebase and Google platform services; the gated course content, which is
deliberately not in this repository; social engineering; denial-of-service or brute-force
testing; automated scanner output without a demonstrated impact; and dependency advisories
that Dependabot already tracks.

Dependency alerts and automated security updates are enabled. The remaining high and
critical findings are in development tooling (`vite`, `vitest`, `tinypool`) and wait on a
coordinated toolchain upgrade; no high or critical production dependency finding is open.

## What to expect

- We aim to acknowledge a report within **3 business days**.
- We will confirm the issue, keep you updated on the fix, and agree a disclosure date with
  you before anything is published.
- There is **no bug bounty**; please do not expect payment.
- Reports are private by default. We will not name you unless you ask us to.

## Safe harbour

If you act in good faith — staying within the scope above, using your own account or the
local emulator, not accessing, changing, or deleting other people's data, and stopping as
soon as you have proof — we will not pursue legal action over your research. This is not a
waiver of any other rights.

## Non-security contact

Booking, access, and general questions: `greymatter.cw@outlook.com`.
