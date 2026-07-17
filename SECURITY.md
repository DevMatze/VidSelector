# Security Policy

## Supported version

VidSelector is a personal hobby project. Security fixes are applied only to the current `main` branch; older commits and local modifications are not supported.

## Reporting a vulnerability

Please do not publish suspected vulnerabilities, exposed credentials or personal data in a public issue.

Use GitHub's private vulnerability reporting or open a private security advisory for this repository. Include:

- the affected route or component;
- clear reproduction steps;
- the expected and observed behavior;
- the practical impact for a local single-user installation.

Never include real TMDB tokens, `.env` contents or a copy of `prisma/dev.db` in a report.

## Scope

VidSelector is designed to bind to `127.0.0.1` for one local user. Public hosting, multi-user access and exposing the SQLite database over a network are outside the supported threat model.
