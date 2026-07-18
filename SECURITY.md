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

VidSelector is designed for one user on a trusted private network. The web server listens on all local interfaces so it
can be opened from another device on the same LAN, but it has no authentication: anyone who can reach port 3000 can use
the application and change its data. Public hosting, router port forwarding, untrusted or guest networks, multi-user
access and exposing the SQLite database itself over a network are outside the supported threat model.
