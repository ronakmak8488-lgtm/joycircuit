import { apiError, cleanSlug } from "@/app/api/_shared";
import { getGameBySlug } from "@/lib/games";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GameArtRouteContext {
  params: Promise<{ slug: string }>;
}

function escapeXml(value: string): string {
  return value.replace(/[<>&"']/g, (character) => {
    const entities: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&apos;",
    };
    return entities[character];
  });
}

function createArtwork(
  title: string,
  category: string,
  accent: string,
  width: number,
  height: number,
): string {
  const safeTitle = escapeXml(title);
  const safeCategory = escapeXml(category.toLocaleUpperCase());
  const initials = escapeXml(
    title
      .split(/\s+/)
      .slice(0, 3)
      .map((word) => word[0])
      .join("")
      .toLocaleUpperCase(),
  );

  return `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc">
      <title id="title">${safeTitle} artwork</title>
      <desc id="desc">Original generated JoyCircuit artwork for ${safeTitle}</desc>
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#08111F"/>
          <stop offset="0.55" stop-color="#13223A"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0.7"/>
        </linearGradient>
        <radialGradient id="glow">
          <stop offset="0" stop-color="${accent}" stop-opacity="0.9"/>
          <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#background)"/>
      <circle cx="${Math.round(width * 0.78)}" cy="${Math.round(height * 0.23)}" r="${Math.round(height * 0.48)}" fill="url(#glow)"/>
      <path d="M-${width * 0.04} ${height * 0.78} C ${width * 0.24} ${height * 0.48}, ${width * 0.48} ${height * 1.08}, ${width * 1.05} ${height * 0.47}" fill="none" stroke="${accent}" stroke-width="${Math.max(5, Math.round(height * 0.018))}" stroke-linecap="round" opacity="0.78"/>
      <circle cx="${Math.round(width * 0.66)}" cy="${Math.round(height * 0.55)}" r="${Math.round(height * 0.23)}" fill="#08111F" stroke="${accent}" stroke-width="${Math.max(4, Math.round(height * 0.012))}"/>
      <text x="${Math.round(width * 0.66)}" y="${Math.round(height * 0.59)}" fill="#F7FAFF" text-anchor="middle" font-family="Arial, sans-serif" font-size="${Math.round(height * 0.19)}" font-weight="800">${initials}</text>
      <text x="${Math.round(width * 0.07)}" y="${Math.round(height * 0.15)}" fill="${accent}" font-family="Arial, sans-serif" font-size="${Math.round(height * 0.045)}" font-weight="700" letter-spacing="3">${safeCategory}</text>
      <text x="${Math.round(width * 0.07)}" y="${Math.round(height * 0.88)}" fill="#F7FAFF" font-family="Arial, sans-serif" font-size="${Math.round(height * 0.075)}" font-weight="700">${safeTitle}</text>
    </svg>
  `.trim();
}

export async function GET(request: Request, context: GameArtRouteContext) {
  const { slug: routeSlug } = await context.params;
  const slug = cleanSlug(routeSlug);
  if (!slug) return apiError(400, "INVALID_SLUG", "The game artwork address is invalid.");

  const game = getGameBySlug(slug);
  if (!game) return apiError(404, "GAME_NOT_FOUND", "That game could not be found.");

  const variant = new URL(request.url).searchParams.get("variant");
  if (variant && variant !== "thumbnail" && variant !== "cover") {
    return apiError(400, "INVALID_VARIANT", "Artwork variant must be thumbnail or cover.");
  }
  const [width, height] = variant === "cover" ? [1280, 720] : [640, 360];
  const safeAccent = /^#[0-9A-F]{6}$/i.test(game.accent) ? game.accent : "#59F0B2";
  const artwork = createArtwork(
    game.title,
    game.categories[0] ?? "arcade",
    safeAccent,
    width,
    height,
  );

  return new Response(artwork, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
