import { NextResponse } from "next/server";

const MAX_BODY_BYTES = 16_384;

type RateLimitEntry = { count: number; resetAt: number };
type GlobalWithApiLimits = typeof globalThis & {
  __joyCircuitApiLimits?: Map<string, RateLimitEntry>;
};

const globalWithApiLimits = globalThis as GlobalWithApiLimits;
const apiLimits = globalWithApiLimits.__joyCircuitApiLimits ??= new Map<string, RateLimitEntry>();

export class RequestBodyError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "RequestBodyError";
    this.status = status;
  }
}

export function apiError(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>,
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(fields ? { fields } : {}),
      },
    },
    { status },
  );
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new RequestBodyError("Request body is too large.", 413);
  }

  const reader = request.body?.getReader();
  const decoder = new TextDecoder();
  let rawBody = "";
  let receivedBytes = 0;

  if (reader) {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        receivedBytes += value.byteLength;
        if (receivedBytes > MAX_BODY_BYTES) {
          await reader.cancel();
          throw new RequestBodyError("Request body is too large.", 413);
        }
        rawBody += decoder.decode(value, { stream: true });
      }
      rawBody += decoder.decode();
    } finally {
      reader.releaseLock();
    }
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new RequestBodyError("Request body must be valid JSON.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new RequestBodyError("Request body must be a JSON object.");
  }

  return parsed as Record<string, unknown>;
}

export function enforceSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;

  let originUrl: URL;
  let requestUrl: URL;
  try {
    originUrl = new URL(origin);
    requestUrl = new URL(request.url);
  } catch {
    throw new RequestBodyError("The request address is invalid.", 400);
  }

  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const requestHost = request.headers.get("host")?.trim() || forwardedHost || requestUrl.host;
  const forwardedProtocol = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const requestProtocol = forwardedProtocol || requestUrl.protocol.slice(0, -1);
  const expectedOrigin = `${requestProtocol}://${requestHost}`;

  if (originUrl.origin !== expectedOrigin) {
    throw new RequestBodyError("Cross-origin writes are not allowed.", 403);
  }
}

export function enforceRateLimit(
  request: Request,
  bucket: string,
  limit: number,
  windowMs: number,
): void {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientId = forwardedFor || request.headers.get("x-real-ip")?.trim() || "local";
  const key = `${bucket}:${clientId.slice(0, 96)}`;
  const now = Date.now();
  const current = apiLimits.get(key);

  if (!current || current.resetAt <= now) {
    apiLimits.set(key, { count: 1, resetAt: now + windowMs });
  } else {
    if (current.count >= limit) {
      throw new RequestBodyError("Too many requests. Please try again later.", 429);
    }
    current.count += 1;
  }

  if (apiLimits.size > 2_000) {
    for (const [entryKey, entry] of apiLimits) {
      if (entry.resetAt <= now) apiLimits.delete(entryKey);
    }
  }
}

export function requestErrorCode(error: RequestBodyError): string {
  if (error.status === 403) return "CROSS_ORIGIN_BLOCKED";
  if (error.status === 413) return "BODY_TOO_LARGE";
  if (error.status === 429) return "RATE_LIMITED";
  return "INVALID_BODY";
}

export function cleanOptionalIdentifier(value: unknown): string | undefined | null {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > 128 || !/^[a-zA-Z0-9._:-]+$/.test(cleaned)) return null;
  return cleaned;
}

export function cleanSlug(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const slug = value.trim().toLocaleLowerCase();
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 80 ? slug : null;
}
