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
import { createReport } from "@/lib/games";
import { REPORT_REASONS, type ReportReason } from "@/lib/types";

export const runtime = "nodejs";

const reportReasonAliases: Record<string, ReportReason> = {
  "game does not load": "broken-game",
  "controls are broken": "broken-game",
  "inappropriate content": "inappropriate-content",
  "license or ownership concern": "copyright",
  other: "other",
};

function normalizeReportReason(value: unknown): ReportReason | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLocaleLowerCase();
  if (REPORT_REASONS.includes(normalized as ReportReason)) return normalized as ReportReason;
  return reportReasonAliases[normalized] ?? null;
}

export async function POST(request: Request) {
  try {
    enforceSameOrigin(request);
    enforceRateLimit(request, "report", 5, 10 * 60_000);
    const body = await readJsonObject(request);
    const gameSlug = cleanSlug(body.gameSlug ?? body.slug);
    const reporterId = cleanOptionalIdentifier(body.reporterId ?? body.anonymousId);
    const reason = normalizeReportReason(body.reason);
    const errors: Record<string, string> = {};

    if (!gameSlug) errors.gameSlug = "Provide a valid game slug.";
    if (!reason) {
      errors.reason = `Reason must be one of: ${REPORT_REASONS.join(", ")}.`;
    }
    if (reporterId === null) {
      errors.reporterId = "Reporter ID contains unsupported characters or is too long.";
    }

    let details: string | undefined;
    if (body.details !== undefined && body.details !== null && body.details !== "") {
      if (typeof body.details !== "string") {
        errors.details = "Details must be text.";
      } else {
        details = body.details.trim();
        if (details.length > 1_000) errors.details = "Details must be 1000 characters or fewer.";
      }
    }
    if (Object.keys(errors).length) {
      return apiError(400, "INVALID_REPORT", "The report is invalid.", errors);
    }

    const report = createReport({
      gameSlug: gameSlug!,
      reason: reason!,
      ...(details ? { details } : {}),
      ...(reporterId ? { reporterId } : {}),
    });

    if (!report) return apiError(404, "GAME_NOT_FOUND", "That game could not be found.");

    return NextResponse.json(
      {
        report: { id: report.id, status: report.status, createdAt: report.createdAt },
        message: "Thanks. Your report has been sent for review.",
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof RequestBodyError) {
      return apiError(error.status, requestErrorCode(error), error.message);
    }
    return apiError(500, "REPORT_NOT_RECORDED", "The report could not be submitted.");
  }
}
