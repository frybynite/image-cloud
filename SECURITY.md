# Security Policy

## Supported Versions

Only the latest release of `@frybynite/image-cloud` receives security fixes. We follow semantic versioning — patch releases are issued for security issues in the current minor version.

| Version | Supported |
| ------- | --------- |
| Latest  | ✅        |
| Older   | ❌        |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Report vulnerabilities privately via [GitHub Security Advisories](https://github.com/frybynite/image-cloud/security/advisories/new). This keeps the disclosure confidential until a fix is available.

**What to include:**

- A description of the vulnerability and its potential impact
- Steps to reproduce or a minimal proof-of-concept
- Any suggested mitigations (optional but appreciated)

We aim to acknowledge reports within **72 hours** and provide a resolution timeline within **7 days**.

## Scope

`@frybynite/image-cloud` is a client-side JavaScript library with **zero runtime dependencies**. The attack surface is limited, but relevant concerns include:

- **XSS via image URLs or alt text** — user-supplied strings rendered into the DOM
- **Prototype pollution** — via configuration object merging
- **Supply chain** — compromised transitive dev/build dependencies (Dependabot is enabled)

Issues in example files or the configurator that do not affect the published npm package are lower severity but still welcome.
