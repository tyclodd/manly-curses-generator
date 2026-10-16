# Private usage analytics

The game sends allowlisted usage events to the existing Cloudflare-backed game service at `/api/analytics-collect`. Reports live in a separate owner-only Site; no report data, report key, or dashboard login credentials belong in this public repository.

Events measure successful casts, favorite additions/removals, local Duel votes, screen views, category choices, completed browser shares/clipboard fallbacks, successful copies, initiated downloads, supported install prompts, `appinstalled` and standalone app opens. Server-accepted worldwide Duel ballots remain authoritative for the global rankings and are reported separately from client vote events.

A visitor is a random browser ID, renewed after 90 days, not a person identified across devices. A visit is a random session active in the reporting period, renewed after 30 minutes without activity. Session IDs are shared between tabs via local storage. Counts can be affected by disabled storage, privacy signals, offline devices and blockers. A session across midnight can count on both daily reports; period unique counts use distinct IDs and are not sums of daily unique counts.

Engagement measures foreground time until 30 seconds after the last interaction, using nonoverlapping millisecond increments and deduplicated event IDs. Reports divide active milliseconds by distinct active sessions. There are no raw IP addresses, names, target names, emails, full user agents, referrers, free-text input, or URLs in the event schema. Country is coarse edge-provided information, when available. Raw browser request metadata is subject to the hosting provider's normal handling and is not stored in the analytics application.

Visitors can switch analytics off in the About panel. DNT and Global Privacy Control also disable collection. Opting out removes queued analytics and random analytics identifiers, without changing game saves. Offline analytics queue up to 200 events for at most seven days; retrying the same IDs cannot count them twice. The offline service worker caches analytics.js so an analytics outage cannot stop the game.

`?analytics_test=1` isolates QA events from normal reports. It does not erase or change game saves or global rankings. Avoid synthetic global ballots; an actual accepted Duel choice affects the public ranking normally.

Tracking starts on 2026-10-16. Earlier website traffic is unavailable. The preexisting analytics hook had no configured endpoint. Twelve historical anonymous global Duel ballots were verified before the installation; those are votes, not visitors. GitHub repository traffic must never be presented as website traffic.

No paid service or subscription was added. The collector reuses the existing game service and database. Dashboard source and access configuration are managed separately from GitHub Pages. The report API rejects requests without a server-side secret; the private dashboard's browser code never receives that secret.

Checks: `node qa/analytics-client.cjs`, `node qa/game-analytics.cjs <game-directory> <DOM-tree-json>`, and the existing offline/service-worker and daily-release checks. Backend schema, auth, aggregation and retry tests live in the game-service source repository.
