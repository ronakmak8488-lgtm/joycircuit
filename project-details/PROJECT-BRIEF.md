# JoyCircuit — project brief

## Product vision

JoyCircuit is a fast, friendly browser-games destination where visitors can discover a game and start playing in seconds. It borrows only broad product patterns such as search, categories, curated game rails, recent play, and instant launch. It must not reproduce Poki or CrazyGames layouts, artwork, copy, game names, logos, or brand identity.

**Working promise:** Find your next favorite game.

**Audience:** casual players on desktop, tablet, and mobile; friend groups looking for no-download multiplayer; repeat visitors who want to resume a recent game quickly.

## Original visual direction

- Ink-navy canvas with raised navy surfaces.
- Mint is the primary action color; violet and coral provide secondary energy.
- Large cinematic art, varied editorial mosaics, and focused horizontal rails instead of one endless uniform wall of cards.
- A looped circuit-path “J” symbol and subtle route/circuit line motifs.
- Crisp, friendly typography: Space Grotesk or Sora for display; Inter for UI.
- Motion is restrained: 160–220 ms thumbnail lift, crop zoom, and information reveal. Respect `prefers-reduced-motion`.

### Color tokens

| Token | Value | Use |
|---|---:|---|
| Ink | `#08111F` | Main background |
| Surface | `#13223A` | Panels and controls |
| Surface raised | `#172B48` | Hovered or featured surfaces |
| Mint | `#59F0B2` | Primary CTA and focus |
| Violet | `#8B7CFF` | Secondary accent |
| Coral | `#FF6B6B` | Warm accent and alerts |
| White | `#F7FAFF` | Primary text |
| Muted | `#AAB8CC` | Secondary text |

## Information architecture

- `/` — discovery homepage
- `/games` — full catalog and filters
- `/category/[slug]` — category landing page
- `/search?q=` — results and suggestions
- `/play/[slug]` — game player and details
- `/library` — recently played and favorites
- `/about`, `/developers`, `/support`
- `/privacy`, `/terms`, `/cookies`

## Homepage

1. Sticky 72 px header: brand, Discover, Browse, Multiplayer, New, centered search, favorites, and profile.
2. Optional compact Continue Playing rail for returning visitors; hide it for first-time visitors.
3. Game-first opening screen: one large featured title and a four-item Quick Play panel.
4. Trending Now rail.
5. Category shortcuts: Action, Racing, Puzzle, Sports, Strategy, Cozy, Multiplayer.
6. Fresh Drops editorial mosaic with varied tile sizes.
7. Full-width multiplayer feature with room-link messaging.
8. Two or three curated or personalized genre rails.
9. Compact footer with discovery, creator, support, and legal links.

Game cards show artwork, title, category, and only meaningful states such as New or Multiplayer. Do not invent live player counts, ratings, testimonials, awards, or urgency.

## Core user experience

- Clicking a card opens the player/details page. A clearly labeled play shortcut may appear on hover and keyboard focus.
- Search suggestions begin after two characters and support arrow keys, Enter, and Escape.
- Guest recent history and favorites persist in `localStorage`; the model should allow later account sync.
- Horizontal rails work with pointer, touch, arrow buttons, and keyboard.
- No autoplaying sound.
- Loading, empty, offline, unavailable-game, and player-error states are designed—not blank.

## Game player page

- Responsive iframe or canvas stage that respects each title’s aspect ratio and orientation.
- Loading progress or skeleton and a clear recoverable error state.
- Play/restart, fullscreen, mute, favorite, and report controls.
- Controls/instructions, description, developer credit, age guidance, and related games.
- Portrait and landscape handling; offer fullscreen or rotate guidance when useful.
- A clear keyboard route into and back out of the game frame.

## Responsive behavior

- Desktop: maximum content width 1320 px, 32 px gutters, five game cards visible in a standard rail.
- Tablet: compact navigation and a three-column browse grid.
- Mobile: 16 px gutters, full-width featured tile, horizontal snap rails, two-column catalog grid, search on its own row, and sticky bottom tabs for Home, Browse, Recent, and Favorites.
- Minimum touch target: 44 × 44 px.
- No horizontal page overflow at 360 px.

## Accessibility

Target WCAG 2.2 AA for the platform UI:

- Semantic landmarks, heading order, and skip link.
- Complete keyboard operation.
- Visible 3 px focus treatment.
- Informative alt text and accessible icon-button labels.
- Polite live messages for changing search results, loading, and errors.
- At least 4.5:1 contrast for normal text.
- Do not communicate state only through color.
- Reduced-motion support.

## Fictional seed games

1. Neon Kestrel Drift — racing
2. Moonbug Rally — low-gravity racing
3. Tumbletower Trials — physics arcade
4. Astro Alley Strikers — multiplayer sports
5. Pebble Pop Lab — puzzle
6. Hex Garden — cozy puzzle
7. Skyhook Sprint — platformer
8. Tiny Titan Tactics — strategy
9. Marshmallow Mech — action
10. Vault of Vines — adventure
11. Comet Kitchen — co-op cooking
12. Shadowboard — adventure

All game names and artwork above are fictional concept material. Use original artwork and avoid recognizable characters, game logos, or copyrighted screenshots.

## Recommended implementation

- Next.js App Router + TypeScript.
- Tailwind CSS or CSS modules backed by reusable design tokens.
- PostgreSQL/Supabase with Prisma or Drizzle.
- Supabase Auth or Auth.js for optional accounts.
- Object storage and CDN for licensed artwork and owned game bundles.
- Privacy-conscious analytics such as Plausible or PostHog; Sentry for errors.
- A separate game-content origin, strict CSP, sandboxed iframe permissions, and an embed-origin allowlist.

## Minimum data model

### Game

`id`, `slug`, `title`, `tagline`, `description`, `instructions`, `developerId`, `embedUrl`, `thumbnailUrl`, `coverUrl`, `aspectRatio`, `orientation`, `inputModes`, `multiplayerMode`, `ageRating`, `status`, `featuredRank`, `licenseType`, `licenseProofUrl`, `rightsExpiresAt`, `publishedAt`.

### Supporting entities

- `Category`, `Tag`, `GameCategory`, `GameTag`
- `Developer`: name, website, verification status
- `User`
- `Favorite`: user/account or anonymous ID, game ID, created time
- `PlaySession`: user/account or anonymous ID, game ID, started time, duration
- `Rating`: unique per user and game
- `Report`: game, reporter, reason, status
- `GameStat`: play count, favorite count, rating average, rating count

## MVP acceptance criteria

- Twelve seeded catalog entries and at least three original or explicitly licensed playable HTML5 games.
- Working home, catalog, category, search, player, recent, and favorites flows.
- Search and filters return correct results with loading, empty, and error states.
- Guest history and favorites survive reloads.
- Fullscreen, mute, restart, and report controls work where supported.
- Responsive at 360, 768, and 1440 px without clipping or overflow.
- Keyboard and screen-reader smoke tests pass; automated accessibility checks have no serious violations.
- Production targets: Lighthouse accessibility/SEO at least 90, performance at least 85 on mobile, LCP under 2.5 seconds, CLS under 0.1.
- No broken routes, missing art, severe console errors, third-party portal embedding, or unverified licenses.

