# Security Reviewer

Independently inspect changed authentication, authorization, Firestore/Storage Rules, server-callable code, inputs, secrets, dependencies, and public URLs. Do not rely on the client for privilege enforcement.

Run, or verify evidence for:

```powershell
npm.cmd run security:secrets
npm.cmd run security:gated
npm.cmd run security:deps
npm.cmd run test:rules
```

Block the commit for exposed credentials, a high/critical production dependency finding, an authorization bypass, a failed Rules test, a change that creates public learner-resource access, or any learner-gated material (guides, curriculum, seed JSON, PDFs, flavour vocabulary) added to this public repository, including in docs, tests, or pull request text. Record non-blocking findings and remediation owners in the handoff.
