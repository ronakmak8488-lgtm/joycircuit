import { NextResponse } from "next/server";

import {
  apiError,
  cleanOptionalIdentifier,
  cleanSlug,
  enforceRateLimit,
  enforceSameOrigin,
  readJsonObject,
  requestErrorCode,
  RequestBodyError,
} from "@/app/api/_shared";
import { createPlaySession, updatePlaySessionDuration } from "@/lib/games";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    enforceRateLimit(request, "play-session", 40, 60_000);
    const body = await readJsonObject(request);
    const gameSlug = cleanSlug(body.gameSlug ?? body.slug);
    const sessionId = cleanOptionalIdentifier(body.sessionId);
    const visitorId = cleanOptionalIdentifier(body.visitorId ?? body.anonymousId);
    const errors: Record<string, string> = {};

    if (!gameSlug) errors.gameSlug = "Provide a valid game slug.";
    if (!sessionId) errors.sessionId = "Provide a valid session ID.";
    if (visitorId === null) {
      errors.visitorId = "Visitor ID contains unsupported characters or is too long.";
    }

    let durationSeconds = 0;
    if (body.durationSeconds !== undefined) {
      if (typeof body.durationSeconds !== "number" || !Number.isInteger(body.durationSeconds) || body.durationSeconds < 0 || body.durationSeconds > 86_400) {
        errors.durationSeconds = "Duration must be a whole number from 0 to 86400 seconds.";
      } else {
        durationSeconds = body.durationSeconds;
      }
    }

    let startedAt: string | undefined;
    if (body.startedAt !== undefined) {
      if (typeof body.startedAt !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(body.startedAt) || Number.isNaN(Date.parse(body.startedAt))) {
        errors.startedAt = "Started time must be a valid UTC ISO date.";
      } else {
        const parsedStartedAt = new Date(body.startedAt);
        if (parsedStartedAt.getTime() > Date.now() + 5 * 60_000) {
          errors.startedAt = "Started time cannot be in the future.";
        } else if (parsedStartedAt.getTime() < Date.now() - 7 * 24 * 60 * 60_000) {
          errors.startedAt = "Started time cannot be more than seven days old.";
        } else {
          startedAt = parsedStartedAt.toISOString();
        }
      }
    }

    if (Object.keys(errors).length) {
      return apiError(400, "INVALID_PLAY_SESSION", "The play session is invalid.", errors);
    }

    const session = createPlaySession({
      gameSlug: gameSlug!,
      sessionId: sessionId!,
      ...(visitorId ? { visitorId } : {}),
      ...(startedAt ? { startedAt } : {}),
      durationSeconds,
    });

    if (!session) return apiError(404, "GAME_NOT_FOUND", "That game could not be found.");

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return apiError(error.status, requestErrorCode(error), error.message);
    }
    return apiError(500, "SESSION_NOT_RECORDED", "The play session could not be recorded.");
  }
}

export async function PATCH(request: Request) {
  try {
    enforceSameOrigin(request);
    enforceRateLimit(request, "play-session-update", 80, 60_000);
    const body = await readJsonObject(request);
    const gameSlug = cleanSlug(body.gameSlug ?? body.slug);
    const sessionId = cleanOptionalIdentifier(body.sessionId);
    const durationSeconds = body.durationSeconds;
    const errors: Record<string, string> = {};

    if (!gameSlug) errors.gameSlug = "Provide a valid game slug.";
    if (!sessionId) errors.sessionId = "Provide a valid session ID.";
    if (typeof durationSeconds !== "number" || !Number.isInteger(durationSeconds) || durationSeconds < 0 || durationSeconds > 86_400) {
      errors.durationSeconds = "Duration must be a whole number from 0 to 86400 seconds.";
    }
    if (Object.keys(errors).length) {
      return apiError(400, "INVALID_PLAY_SESSION", "The play session update is invalid.", errors);
    }

    const updated = updatePlaySessionDuration(sessionId!, gameSlug!, durationSeconds as number);
    if (!updated) return apiError(404, "SESSION_NOT_FOUND", "That play session could not be found.");
    return NextResponse.json({ updated: true });
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return apiError(error.status, requestErrorCode(error), error.message);
    }
    return apiError(500, "SESSION_NOT_UPDATED", "The play session could not be updated.");
  }
}
