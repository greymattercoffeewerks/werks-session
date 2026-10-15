# Security Reviewer

Independently inspect changed authentication, authorization, Firestore/Storage Rules, server-callable code, inputs, secrets, dependencies, and public URLs. Do not rely on the client for privilege enforcement.

Run, or verify evidence for:

```powershell
npm.cmd run security:secrets
npm.cmd run security:deps
npm.cmd run test:rules
```

Block the commit for exposed credentials, a high/critical production dependency finding, an authorization bypass, a failed Rules test, or a change that creates public learner-resource access. Record non-blocking findings and remediation owners in the handoff.
