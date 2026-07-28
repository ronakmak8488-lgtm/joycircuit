# Copy-ready website build prompt

```text
Design and build a production-quality responsive browser-games platform called “JoyCircuit.” Use the supplied `joycircuit-homepage-reference.png` as the visual source of truth. The product may use general patterns such as instant browser play, search, categories, recent play, favorites, and curated game rails, but it must not copy Poki or CrazyGames layouts, text, artwork, logos, game names, or visual identity.

WORKING BRAND
Promise: “Find your next favorite game.”
Personality: energetic, friendly, fast, and trustworthy.
Logo: an original looped J/circuit-path symbol.
Colors: #08111F background, #13223A surface, #172B48 raised surface, #59F0B2 mint action, #8B7CFF violet, #FF6B6B coral, #F7FAFF primary text, #AAB8CC muted text.
Typography: Space Grotesk or Sora for display; Inter for UI.
Use cinematic original game art, clean spacing, 14–24 px media radii, subtle circuit-line details, and restrained 160–220 ms motion. Avoid excessive glow, decorative pills, nested panels, or a repetitive uniform card wall.

DESIGN REFERENCES FIRST
Before implementation, create three coordinated readable references:
1. Full homepage at 1440 px desktop width, consistent with the supplied reference.
2. Homepage at 390 × 844 mobile.
3. Desktop game-player page.
Treat approved references as the implementation specification. Keep UI text and controls code-native.

DESKTOP HOMEPAGE
Create a sticky 72 px header containing the JoyCircuit logo, Discover, Browse, Multiplayer, New, a prominent search field, Favorites, and profile.
Conditionally show a compact Continue Playing rail for returning players.
Prioritize games in the first viewport: one large featured-game stage with title, short description, category/input metadata, and Play Now action; place four Quick Play thumbnails beside it.
Continue with:
- Trending Now horizontal rail
- Action, Racing, Puzzle, Sports, Strategy, Cozy, and Multiplayer shortcuts
- Fresh Drops editorial mosaic with varied widths and heights
- Full-width Better With Your Crew multiplayer feature
- Two or three personalized category rails
- Compact footer with About, Developers, Support, Privacy, Terms, and Cookies
Cards show artwork, title, category, and only meaningful New or Multiplayer states. Do not invent live counts, testimonials, awards, ratings, or urgency.

MOBILE
At 390 px use 16 px gutters, a compact brand/search/menu header, full-width featured game, horizontal snap rails, a two-column catalog grid, and sticky bottom navigation for Home, Browse, Recent, and Favorites. Maintain 44 px minimum targets and no horizontal page overflow.

ROUTES
- /
- /games
- /category/[slug]
- /search?q=
- /play/[slug]
- /library
- /about
- /developers
- /support
- /privacy
- /terms
- /cookies

SEARCH, LIBRARY, AND DISCOVERY
Start search suggestions after two characters. Support keyboard selection with arrow keys, Enter, and Escape. Catalog filters include category, input method, multiplayer type, and sort. Guest favorites and recent history must use localStorage and be structured for later account sync. Rails must work by mouse, touch, arrow buttons, and keyboard.

PLAYER PAGE
Include a responsive sandboxed game stage, loading and recoverable error states, Play/Restart, fullscreen, mute, favorite, report, controls/instructions, developer attribution, description, age guidance, and related-games rail. Respect each game’s aspect ratio and portrait/landscape orientation. Never autoplay sound. Provide a clear keyboard path into and out of the game frame.

CONTENT AND RIGHTS
Seed the catalog with these fictional names: Neon Kestrel Drift, Moonbug Rally, Tumbletower Trials, Astro Alley Strikers, Pebble Pop Lab, Hex Garden, Skyhook Sprint, Tiny Titan Tactics, Marshmallow Mech, Vault of Vines, Comet Kitchen, and Shadowboard.
Create distinct original thumbnail art. Do not use recognizable characters, existing game logos, copyrighted screenshots, or assets from Poki/CrazyGames.
For the prototype, include at least three simple, original, locally hosted playable HTML5 games. Do not iframe third-party game portals. Design the production player around a separate allowlisted game origin, restrictive iframe sandbox permissions, strict CSP, and verified license metadata.

IMPLEMENTATION
Use Next.js App Router, TypeScript, and Tailwind CSS. Build focused reusable components such as AppHeader, SearchBox, FeaturedGame, GameCard, GameRail, CategoryShortcut, FreshDropsMosaic, MultiplayerFeature, GamePlayer, PlayerControls, FilterPanel, MobileTabBar, and SiteFooter. Keep seed data and state helpers separate from components. Keep App/page files as composition glue rather than monoliths.

Model each game with slug, title, tagline, description, instructions, artwork, embed URL, categories, tags, aspect ratio, orientation, input modes, multiplayer mode, age rating, developer, license type, license proof, rights expiry, status, featured rank, and publish date.

ACCESSIBILITY AND QUALITY
Meet WCAG 2.2 AA for platform controls: semantic landmarks, skip link, logical headings, complete keyboard operation, visible 3 px focus indicators, accessible icon labels, useful alt text, polite live messages, at least 4.5:1 text contrast, reduced-motion support, and no color-only status.
Verify at 360, 768, and 1440 px. Test search, filters, favorites, recent history, player controls, fullscreen fallback, reporting, and error states. Ensure no broken routes, missing art, overflow, clipped controls, severe console errors, or inert buttons. Optimize images and lazy-load below-the-fold media. Add page metadata and VideoGame structured data to game pages.

MVP DONE WHEN
- 12 seeded catalog items are present.
- At least 3 original local HTML5 demo games launch and can restart.
- Home, browse, category, search, player, recent, and favorites flows work.
- Guest library state survives reload.
- Responsive and keyboard checks pass at the target widths.
- Automated accessibility checks have no serious violations.
- Production Lighthouse targets are accessibility/SEO >= 90 and mobile performance >= 85, with LCP < 2.5 s and CLS < 0.1.
```

