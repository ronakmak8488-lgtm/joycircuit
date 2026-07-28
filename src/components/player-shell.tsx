"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FavoriteButton } from "@/components/favorite-button";
import { ExpandIcon, FlagIcon, GamepadIcon, MutedIcon, RefreshIcon, VolumeIcon } from "@/components/icons";
import { addRecentGame, getAnonymousId, getCurrentLevel, advanceLevel, loadLevelProgress } from "@/lib/library-storage";
import type { Game } from "@/lib/types";

const REASONS = ["Game does not load", "Controls are broken", "Inappropriate content", "License or ownership concern", "Other"];

export function PlayerShell({ game }: { game: Game }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDialogElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef(0);
  const readyTimerRef = useRef<number | null>(null);
  const [frameKey, setFrameKey] = useState(0);
  const [muted, setMuted] = useState(true);
  const [status, setStatus] = useState(game.embedUrl ? "Loading game…" : "Preview coming soon");
  const [reportStatus, setReportStatus] = useState("");
  const [currentLevel, setCurrentLevel] = useState(() => getCurrentLevel(game.slug));
  const [levelMessage, setLevelMessage] = useState<string | null>(null);
  const levelMessageTimerRef = useRef<number | null>(null);

  const levels = useMemo(() => game.levels ?? [], [game.levels]);
  const level = levels[currentLevel - 1] ?? levels[0];
  const progress = loadLevelProgress();
  const highestLevel = progress[game.slug] ?? 1;

  const levelsRef = useMemo(() => levels, [levels]);

  useEffect(() => {
    addRecentGame(game.slug);
    const anonymousId = getAnonymousId();
    sessionIdRef.current ??= window.crypto.randomUUID();
    sessionStartedAtRef.current ||= Date.now();
    const sessionId = sessionIdRef.current;
    fetch("/api/play-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameSlug: game.slug, anonymousId, sessionId }),
      keepalive: true,
    }).catch(() => undefined);

    const recordDuration = () => {
      const durationSeconds = Math.min(86_400, Math.max(0, Math.round((Date.now() - sessionStartedAtRef.current) / 1_000)));
      void fetch("/api/play-sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameSlug: game.slug, sessionId, durationSeconds }),
        keepalive: true,
      }).catch(() => undefined);
    };
    window.addEventListener("pagehide", recordDuration);
    return () => {
      window.removeEventListener("pagehide", recordDuration);
      recordDuration();
    };
  }, [game.slug]);

  useEffect(() => {
    frameRef.current?.contentWindow?.postMessage({ type: "joycircuit:mute", muted }, "*");
  }, [frameKey, muted]);

  useEffect(() => {
    const sendLevel = () => {
      const lvl = levels[currentLevel - 1] ?? levels[0];
      frameRef.current?.contentWindow?.postMessage({ type: "joycircuit:level", level: { id: lvl.id, name: lvl.name, difficulty: lvl.difficulty } }, "*");
    };

    if (frameRef.current && game.embedUrl) {
      sendLevel();
    }
  }, [frameKey, currentLevel, game.embedUrl, levels]);

  useEffect(() => {
    const handleGameMessage = (event: MessageEvent) => {
      if (event.source !== frameRef.current?.contentWindow || !event.data || typeof event.data !== "object") return;
      const data = event.data as { type?: string; slug?: string; value?: unknown; message?: unknown; muted?: unknown };
      if (data.type === "joycircuit:ready") {
        if (readyTimerRef.current !== null) window.clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
        setStatus("Game ready.");
        frameRef.current?.contentWindow?.postMessage({ type: "joycircuit:mute", muted }, "*");
      } else if (data.type === "joycircuit:error") {
        setStatus(typeof data.message === "string" ? data.message : "The game could not finish loading.");
      } else if (data.type === "joycircuit:mute-change" && typeof data.muted === "boolean") {
        setMuted(data.muted);
      } else if (data.type === "joycircuit:score:get" && data.slug === game.slug) {
        let value = 0;
        try {
          value = Number(window.localStorage.getItem(`joycircuit:game-score:${game.slug}`)) || 0;
        } catch {
          // Scores remain optional when storage is unavailable.
        }
        frameRef.current?.contentWindow?.postMessage({ type: "joycircuit:score:value", slug: game.slug, value }, "*");
      } else if (data.type === "joycircuit:score:set" && data.slug === game.slug && typeof data.value === "number" && Number.isFinite(data.value)) {
        try {
          window.localStorage.setItem(`joycircuit:game-score:${game.slug}`, String(Math.max(0, Math.floor(data.value))));
        } catch {
          // Scores remain optional when storage is unavailable.
        }
      } else if (data.type === "joycircuit:level:complete" && data.slug === game.slug) {
        const next = advanceLevel(game.slug);
        setCurrentLevel(next);
        const nextLevel = levelsRef[next - 1] ?? levelsRef[0];
        setLevelMessage(`Level complete! Advancing to ${nextLevel.name}…`);
        if (levelMessageTimerRef.current !== null) window.clearTimeout(levelMessageTimerRef.current);
        levelMessageTimerRef.current = window.setTimeout(() => setLevelMessage(null), 3000);
        frameRef.current?.contentWindow?.postMessage({ type: "joycircuit:level", level: { id: nextLevel.id, name: nextLevel.name, difficulty: nextLevel.difficulty } }, "*");
      } else if (data.type === "joycircuit:level:reset" && data.slug === game.slug) {
        // intentionally left for external reset triggers
      }
    };
    window.addEventListener("message", handleGameMessage);
    return () => {
      window.removeEventListener("message", handleGameMessage);
      if (readyTimerRef.current !== null) window.clearTimeout(readyTimerRef.current);
      if (levelMessageTimerRef.current !== null) window.clearTimeout(levelMessageTimerRef.current);
    };
  }, [frameKey, game.slug, levelsRef, muted, levelMessageTimerRef]);

  function restart() {
    if (!game.embedUrl) return;
    setStatus("Restarting game…");
    setFrameKey((value) => value + 1);
  }

  async function enterFullscreen() {
    try {
      await stageRef.current?.requestFullscreen();
    } catch {
      setStatus("Fullscreen is unavailable in this browser.");
    }
  }

  function focusGame() {
    frameRef.current?.focus();
    setStatus("Game focused. Press Tab to return to player controls.");
  }

  async function submitReport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setReportStatus("Sending report…");
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameSlug: game.slug,
          slug: game.slug,
          anonymousId: getAnonymousId(),
          reason: String(form.get("reason") ?? "Other"),
          details: String(form.get("details") ?? ""),
        }),
      });
      if (!response.ok) throw new Error("Report failed");
      setReportStatus("Thanks. Your report has been recorded.");
      event.currentTarget.reset();
    } catch {
      setReportStatus("We could not send the report. Please try again.");
    }
  }

  return (
    <div className="player-shell">
      <div className={`player-stage is-${game.orientation}`} ref={stageRef} style={{ aspectRatio: game.aspectRatio }}>
        {game.embedUrl ? (
          <iframe
            key={frameKey}
            ref={frameRef}
            src={game.embedUrl}
            title={`${game.title} game`}
            sandbox="allow-scripts allow-pointer-lock"
            allow="fullscreen; gamepad"
            referrerPolicy="no-referrer"
            onLoad={() => {
              setStatus("Game frame loaded. Starting…");
              frameRef.current?.contentWindow?.postMessage({ type: "joycircuit:mute", muted }, "*");
              if (readyTimerRef.current !== null) window.clearTimeout(readyTimerRef.current);
              readyTimerRef.current = window.setTimeout(() => {
                setStatus("The game is taking longer than expected. Restart it if controls do not respond.");
              }, 8_000);
            }}
            onError={() => setStatus("The game could not load. Try restarting it.")}
          />
        ) : (
          <div className="unavailable-game"><span aria-hidden="true">⌁</span><h2>Playable preview coming soon</h2><p>This catalog concept is ready, but its original game build has not shipped yet.</p></div>
        )}
      </div>
      <div className="player-toolbar" aria-label="Game controls">
        <button type="button" onClick={focusGame} disabled={!game.embedUrl}><GamepadIcon size={18} /><span>Focus game</span></button>
        <button type="button" onClick={restart} disabled={!game.embedUrl}><RefreshIcon size={18} /><span>Restart</span></button>
        <button type="button" onClick={() => setMuted((value) => !value)} disabled={!game.embedUrl}>{muted ? <MutedIcon size={18} /> : <VolumeIcon size={18} />}<span>{muted ? "Unmute" : "Mute"}</span></button>
        <button type="button" onClick={enterFullscreen}><ExpandIcon size={18} /><span>Fullscreen</span></button>
        <FavoriteButton slug={game.slug} />
        <button type="button" onClick={() => reportRef.current?.showModal()}><FlagIcon size={18} /><span>Report</span></button>
      </div>
      <div className="player-level" aria-live="polite">
        <div className="player-level-info">
          <span className="player-level-badge">Level {level.id}</span>
          <span className="player-level-name">{level.name}</span>
          <span className="player-level-difficulty">Difficulty {level.difficulty}%</span>
        </div>
        <div className="player-level-bar" aria-hidden="true">
          <div className="player-level-fill" style={{ width: `${(currentLevel / 100) * 100}%` }} />
        </div>
        <div className="player-level-meta">
          <span>{currentLevel} / 100</span>
          <span>Best: {highestLevel}</span>
        </div>
      </div>
      {levelMessage && <p className="player-level-message" aria-live="polite">{levelMessage}</p>}
      <p className="player-status" aria-live="polite">{status}</p>

      <dialog className="report-dialog" ref={reportRef} aria-labelledby="report-title">
        <form method="dialog" className="dialog-close-form"><button type="submit" aria-label="Close report form">×</button></form>
        <form onSubmit={submitReport}>
          <h2 id="report-title">Report a problem</h2>
          <p>Tell us what went wrong with {game.title}.</p>
          <label>Reason<select name="reason" required>{REASONS.map((reason) => <option key={reason}>{reason}</option>)}</select></label>
          <label>Details<textarea name="details" rows={4} maxLength={800} placeholder="Optional details that help us reproduce the issue" /></label>
          <button className="primary-button" type="submit">Send report</button>
          <p aria-live="polite">{reportStatus}</p>
        </form>
      </dialog>
    </div>
  );
}
