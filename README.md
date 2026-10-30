# Strategium

Browser-based tabletop scorekeeping and FAB match creation, built with Angular 22,
Angular Material, TypeScript 6, and signal-based state. The existing dark neon
theme is retained across desktop, tablet, and phone layouts.

## Requirements

- Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0`.
- npm 11; the declared package manager is `npm@11.6.2`.

## Development

```sh
npm ci
npm start
```

Open `http://localhost:4200/`. For a different port, use
`npm start -- --port=4320`.

## Build And Tests

```sh
npm run build
npm run test:ci
node node_modules/typescript/bin/tsc --noEmit -p tsconfig.app.json
```

`npm test` starts the watch-mode test runner. Production output is written to
`dist/strategium/`, never an absolute directory outside this repository.

Deploy that output directory as static files. Hash-based routes support static
hosting without server-side route rewrites. This is a client-rendered app; it
does not require an SSR server or hydration. Orbitron and Material Icons are
bundled locally, with no Google Fonts request at build time or runtime.

## Match Behavior

- Tabletop matches support two or more players, command/victory points, optional
	doctrine selection, and rounds cycling from zero through five.
- Reset restores starting scores and round zero. Every score, round, and doctrine
	change is saved with updated timestamps.
- FAB supports four-player teams, brawls with two to ten players, and tournaments
	with 2, 4, 8, or 16 players. Hero assignments are unique within a match.
- Tournament results advance winners and consolation entrants. Revoking a result
	clears dependent results. In 16-player events, first-round eliminations share
	ninth place because no matches distinguish ninth through sixteenth.

Matches are stored in the browser's local storage, not on a server. Reloading a
match preserves scores, rosters, and results even when browser history restores
the original navigation state. Older numeric-string tabletop scores are migrated
on load. Invalid saves are rejected safely; blocked or full storage produces a
visible warning. Clearing browser storage removes saved matches.

## Implementation

- Standalone, OnPush components with typed reactive forms and signals.
- Lazy-loaded routes, native router links, page titles, and route focus handling.
- CSS grids and viewport-constrained dialogs rather than JavaScript breakpoint
	subscriptions and fixed-position match controls.
- Keyboard-operable score/round controls, visible focus, focus-trapped dialogs,
	reduced-motion support, and keyboard-scrollable tournament brackets.

## Dependency Compatibility

Angular core is 22.2.4; CLI, build, Material, and CDK are 22.2.5. TypeScript is
6.0.3, the supported compiler line for this Angular version.

Vitest remains on compatible 4.x (installed: 4.1.12). The attempted Vitest 5 update
could not load its Vite peer in this dependency graph. jsdom remains on 27.x
(installed: 27.4.0); the attempted latest release required an unavailable
`tr46@^7.0.0` package. Recheck these constraints before a future major update.

## Validation

Validated on 2026-10-30 with the production build, TypeScript checks, and 33 unit
tests covering storage errors, form validation, score updates, refresh behavior,
tournament sizes, rankings, and cascading result revocation.

Interactive browser checks covered home, both creators, tabletop scoring, teams,
ten-player brawls, tournament completion, rankings, and reload persistence.
Layouts were checked at 1920x1080, 1366x768, 1024x768, 768x1024, 390x844,
844x390, and 320x568. Wide brackets scroll internally; document-level horizontal
overflow is avoided.

AXE browser audits reported no violations on the tested views. Some scrolled
content and Angular CDK focus-trap anchors require manual review; automated
results are not a complete WCAG certification. `axe-core` is included as
development-only audit tooling. No persistent automated browser test runner is
configured; the browser checks were performed interactively.

The checked-in `docs/` site is generated deployment output and was not regenerated
as part of the source modernization.
