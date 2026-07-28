# Copy-ready design-reference prompt

Use this prompt to generate coordinated UI reference images. The existing `joycircuit-homepage-reference.png` is the desktop baseline.

```text
Use case: ui-mockup
Asset type: complete high-fidelity browser-games website reference
Primary request: Create an original, shippable product UI for a browser-games portal named “JoyCircuit.” It should feel fast, energetic, friendly, and trustworthy. It may reflect general instant-play and game-discovery conventions, but must not copy Poki or CrazyGames branding, layout, artwork, wording, or recognizable game covers.

Style/medium: realistic production web UI, not concept art; polished senior product-design quality; all navigation, controls, labels, and cards must look practical to implement in HTML/CSS/React.

Canvas and composition: 1440 px desktop homepage, full-page vertical composition, 1320 px maximum content width, 32 px side gutters. Show the complete surface: header, featured game and Quick Play panel, Trending Now rail, category shortcuts, Fresh Drops editorial mosaic, multiplayer feature, curated game rail, and footer.

Visual system: dark ink-navy #08111F background; #13223A and #172B48 surfaces; mint #59F0B2 primary action; violet #8B7CFF and coral #FF6B6B secondary accents; #F7FAFF main text; #AAB8CC muted text. Space Grotesk or Sora character for display type and Inter-like UI typography. Use clean spacing, 14–24 px media radii, subtle circuit-route line motifs, varied editorial card sizes, and cinematic original abstract game art.

Header text (verbatim): “JoyCircuit”, “Discover”, “Browse”, “Multiplayer”, “New”, “Search games, genres or creators”.
Featured game text (verbatim): “Neon Kestrel Drift”, “Racing”, “Keyboard”, “Thread impossible corners, charge your boost, and chase the cleanest line through a city that never slows down.”, “Play now”.
Section text (verbatim): “Quick play”, “Trending now”, “Find your kind of fun”, “Fresh drops”, “Better with your crew.”, “Cozy & clever”.

Use these fictional titles only: “Neon Kestrel Drift”, “Moonbug Rally”, “Tumbletower Trials”, “Astro Alley Strikers”, “Pebble Pop Lab”, “Hex Garden”, “Skyhook Sprint”, “Tiny Titan Tactics”, “Marshmallow Mech”, “Vault of Vines”, “Comet Kitchen”, “Shadowboard”.

Constraints: games dominate the first viewport; one large featured card and one four-item Quick Play panel; readable text; consistent card anatomy; meaningful New and Multiplayer states only; no fake player counts or ratings; no real game screenshots; no copyrighted characters; no existing game logos; no third-party trademarks; no watermark. Keep UI controls code-native in the eventual implementation.

Avoid: cloning Poki or CrazyGames; endless uniform grid above the fold; a fixed left sidebar; bright mint page background; purple-only identity; excessive glow; excessive pills or badges; nested cards; illegible micro-text; marketing statistics; testimonials; unrelated sections.
```

## Mobile variant adjustment

Change the canvas to 390 × 844 and ask for: 16 px gutters, compact brand/search header, full-width featured game, horizontal snap rails, two-column browse grid, and sticky bottom tabs for Home, Browse, Recent, and Favorites. Preserve the exact palette, typography character, card anatomy, and fictional titles.

## Player-page variant adjustment

Ask for a 1440 px desktop game-player page with the same header and visual system, a large responsive game stage, Play/Restart, fullscreen, mute, favorite and report controls, keyboard instructions, description and developer credit, plus one related-games rail. Do not render a real copyrighted game inside the stage; use an original abstract fictional game frame.

