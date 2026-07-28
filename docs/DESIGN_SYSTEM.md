# JoyCircuit implementation design system

The accepted source of truth is `project-details/joycircuit-homepage-reference.png`.

## Color lock

- Page background: true ink navy `#08111F`.
- Raised background: `#0D192A`.
- Surface: `#13223A`.
- Raised surface: `#172B48`.
- Primary text: `#F7FAFF`.
- Muted text: `#AAB8CC`.
- Primary action/focus: mint `#59F0B2`.
- Secondary accents: violet `#8B7CFF`, coral `#FF6B6B`, yellow `#FFD166`.
- Border: white at 8–12% opacity.

## Typography

- Display and section titles: Space Grotesk-style geometric sans, using the bundled system fallback when offline.
- UI chrome and body: Inter-style neutral sans, using Segoe UI as the local fallback.
- Hero: 42–66 px, 0.96 line-height, heavy weight.
- Section title: 24–28 px, heavy weight.
- Control text: deliberately set between 12–15 px; never browser-default typography.

## Container and spacing

- Desktop maximum content width: 1320 px.
- Desktop gutters: 32 px. Mobile gutters: 16 px.
- Header: 72–74 px.
- Standard section interval: 52–56 px.
- Media radii: 15–24 px.
- Controls: minimum 44 px target; 10–14 px radius.

## Component families

- Brand mark: mint rounded-square looped J.
- Header: brand, four primary links, centered search, library action, avatar.
- Featured game: large open media stage, text lower-left, artwork right, primary play action.
- Quick Play: one purposeful surface containing four compact game tiles.
- Game rail: open layout, five 16:9 cards on desktop, no outer panel.
- Category shortcuts: seven equal compact controls.
- Fresh Drops: asymmetric editorial mosaic.
- Multiplayer feature: full-width color band with original player tiles.
- Footer: open four-column layout with a thin top divider.

## Allowed above-the-fold copy

- JoyCircuit
- Discover
- Browse
- Multiplayer
- New
- Search games, genres or creators
- Racing
- Keyboard
- Neon Kestrel Drift
- Thread impossible corners, charge your boost, and chase the cleanest line through a city that never slows down.
- Play now
- Quick play
- Four great picks. Zero setup.
- Trending now
- Games people keep coming back to.

## Icon treatment

Icons use rounded 1.8–2 px strokes, `currentColor`, 18–24 px optical size, and square 40–44 px controls. Filled play triangles are the only filled transport symbol.

## Motion

- Hover lift: 4 px.
- Media zoom: no more than 1.035.
- Timing: 160–220 ms.
- Reduced-motion mode removes transforms and smooth scrolling.

## Responsive continuation

- Tablet: hero becomes one column; Quick Play becomes four columns; standard rails show three cards.
- Mobile: header uses two rows, hero is full width, Quick Play is two columns, rails become horizontal snap lists or two-column grids, catalog is two columns, and mobile bottom navigation appears.

## Known intentional asset deviation

The accepted reference uses original code-rendered abstract game artwork. The built-in image generator was unavailable during concept creation, so implementation preserves those original vector/CSS motifs rather than introducing unrelated stock assets or copyrighted screenshots.
