# JoyCircuit

JoyCircuit is a full-stack browser-games portal built with Next.js, React, TypeScript, Node.js route handlers, and SQLite through Node's built-in `node:sqlite` module.

## Requirements

- Node.js 22.13 or newer
- pnpm 11 or newer

## Local development

```powershell
pnpm install
pnpm dev
```

If VS Code's terminal does not recognize `pnpm`, use the npm fallback:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`. The SQLite database and 73 seeded games are created automatically in `data/joycircuit.db` on first use. Every catalog entry has a local playable URL: three standalone demos, 60 Joy Arcade configurations, and 10 Joy 3D configurations.

## Quality checks

```powershell
pnpm lint
pnpm typecheck
pnpm build
```

## Structure

- `src/app` — pages and Node.js API route handlers
- `src/components` — reusable product UI
- `src/lib` — SQLite access, validated manifest mapping, game queries, types, and local-library helpers
- `public/games` — three standalone HTML5 games plus the shared Joy Arcade and Joy 3D engines
- `public/games/joy-arcade/manifest.json` — 51 additional original 2D catalog entries
- `public/games/joy-3d/manifest.json` — 10 additional 3D catalog entries
- `public/assets/3d/ATTRIBUTION.md` — license and attribution record for the CC0/open-source 3D assets
- `data` — local SQLite database files, ignored by Git
- `project-details` — reference image, project brief, and original build prompt

## Production note

The bundled game code and 2D presentation are original local work. Third-party 3D assets are limited to the open-source/CC0 packs documented in `public/assets/3d/ATTRIBUTION.md`. For a public deployment, serve game bundles from an isolated allowlisted origin, keep restrictive iframe permissions, and retain license proof and expiry metadata.
