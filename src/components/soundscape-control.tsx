"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SoundscapeIcon } from "@/components/icons";

type Cue = "button" | "navigate" | "enable" | "disable" | "supernova";

type SoundscapeEngine = {
  context: AudioContext;
  master: GainNode;
  music: GainNode;
  effects: GainNode;
  filter: BiquadFilterNode;
  pad: OscillatorNode[];
  active: boolean;
  intervalId: number | null;
  step: number;
};

const CHORDS = [
  [110, 164.81, 220],
  [98, 146.83, 220],
  [130.81, 196, 261.63],
  [110, 174.61, 261.63],
] as const;
const ORBIT_NOTES = [0, 7, 12, 19, 14, 7, 24, 19] as const;

function tone(
  engine: SoundscapeEngine,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = "sine",
  delay = 0,
) {
  if (!engine.active || engine.context.state !== "running") return;
  const now = engine.context.currentTime + delay;
  const oscillator = engine.context.createOscillator();
  const gain = engine.context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(engine.effects);
  oscillator.start(now);
  oscillator.stop(now + duration + 0.04);
}

function playCue(engine: SoundscapeEngine, cue: Cue) {
  if (!engine.active) return;
  if (cue === "button") {
    tone(engine, 392, 0.09, 0.035, "triangle");
    tone(engine, 587.33, 0.1, 0.022, "sine", 0.025);
  } else if (cue === "navigate") {
    tone(engine, 523.25, 0.16, 0.032, "sine");
    tone(engine, 783.99, 0.22, 0.024, "sine", 0.06);
  } else if (cue === "enable") {
    tone(engine, 261.63, 0.45, 0.04, "sine");
    tone(engine, 392, 0.52, 0.035, "sine", 0.07);
    tone(engine, 659.25, 0.7, 0.025, "sine", 0.14);
  } else if (cue === "disable") {
    tone(engine, 392, 0.24, 0.03, "sine");
    tone(engine, 261.63, 0.32, 0.025, "sine", 0.045);
  } else {
    tone(engine, 55, 1.8, 0.085, "sine");
    tone(engine, 110, 1.3, 0.055, "triangle", 0.04);
    [523.25, 659.25, 783.99, 1046.5].forEach((note, index) => {
      tone(engine, note, 0.9 + index * 0.12, 0.026, "sine", 0.1 + index * 0.075);
    });
  }
}

function scheduleOrbit(engine: SoundscapeEngine) {
  if (!engine.active || engine.context.state !== "running") return;
  const chordIndex = Math.floor(engine.step / 8) % CHORDS.length;
  if (engine.step % 8 === 0) {
    const now = engine.context.currentTime;
    engine.pad.forEach((oscillator, index) => {
      oscillator.frequency.setTargetAtTime(CHORDS[chordIndex][index], now, 1.8);
    });
  }

  const semitones = ORBIT_NOTES[engine.step % ORBIT_NOTES.length];
  const note = 220 * 2 ** (semitones / 12);
  tone(engine, note, 0.72, engine.step % 4 === 0 ? 0.032 : 0.018, "sine");
  if (engine.step % 8 === 3 || engine.step % 8 === 7) {
    tone(engine, note * 2, 0.38, 0.012, "triangle", 0.08);
  }
  engine.step += 1;
}

function createEngine(): SoundscapeEngine {
  const context = new AudioContext({ latencyHint: "interactive" });
  const master = context.createGain();
  const music = context.createGain();
  const effects = context.createGain();
  const filter = context.createBiquadFilter();
  const compressor = context.createDynamicsCompressor();

  master.gain.value = 0.0001;
  music.gain.value = 0.82;
  effects.gain.value = 0.68;
  filter.type = "lowpass";
  filter.frequency.value = 1_050;
  filter.Q.value = 0.7;
  compressor.threshold.value = -18;
  compressor.knee.value = 18;
  compressor.ratio.value = 3;
  master.connect(compressor).connect(context.destination);
  music.connect(master);
  effects.connect(master);
  filter.connect(music);

  const pad = CHORDS[0].map((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = index === 1 ? "triangle" : "sine";
    oscillator.frequency.value = frequency;
    oscillator.detune.value = index === 0 ? -5 : index === 2 ? 5 : 0;
    gain.gain.value = index === 1 ? 0.011 : 0.016;
    oscillator.connect(gain).connect(filter);
    oscillator.start();
    return oscillator;
  });

  const lfo = context.createOscillator();
  const lfoDepth = context.createGain();
  lfo.type = "sine";
  lfo.frequency.value = 0.075;
  lfoDepth.gain.value = 180;
  lfo.connect(lfoDepth).connect(filter.frequency);
  lfo.start();

  return { context, master, music, effects, filter, pad, active: false, intervalId: null, step: 0 };
}

async function startEngine(engine: SoundscapeEngine, onPlayerRoute: boolean) {
  await engine.context.resume();
  engine.active = true;
  const now = engine.context.currentTime;
  engine.music.gain.setTargetAtTime(onPlayerRoute ? 0.14 : 0.82, now, 0.3);
  engine.master.gain.cancelScheduledValues(now);
  engine.master.gain.setTargetAtTime(0.34, now, 0.45);
  if (engine.intervalId === null) {
    scheduleOrbit(engine);
    engine.intervalId = window.setInterval(() => scheduleOrbit(engine), 720);
  }
}

function stopEngine(engine: SoundscapeEngine) {
  playCue(engine, "disable");
  engine.active = false;
  if (engine.intervalId !== null) window.clearInterval(engine.intervalId);
  engine.intervalId = null;
  const now = engine.context.currentTime;
  engine.master.gain.cancelScheduledValues(now);
  engine.master.gain.setTargetAtTime(0.0001, now, 0.12);
  window.setTimeout(() => {
    if (!engine.active && engine.context.state === "running") void engine.context.suspend();
  }, 520);
}

export function SoundscapeControl() {
  const pathname = usePathname();
  const engineRef = useRef<SoundscapeEngine | null>(null);
  const enabledRef = useRef(false);
  const statusTimerRef = useRef<number | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [status, setStatus] = useState("");

  const announce = (message: string) => {
    setStatus(message);
    if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current);
    statusTimerRef.current = window.setTimeout(() => setStatus(""), 2_600);
  };

  const toggle = async () => {
    if (enabledRef.current) {
      const engine = engineRef.current;
      if (engine) stopEngine(engine);
      enabledRef.current = false;
      setEnabled(false);
      document.documentElement.dataset.soundscape = "off";
      announce("Galaxy soundscape muted");
      return;
    }

    try {
      const engine = engineRef.current ?? createEngine();
      engineRef.current = engine;
      await startEngine(engine, pathname.startsWith("/play/"));
      enabledRef.current = true;
      setEnabled(true);
      document.documentElement.dataset.soundscape = "on";
      playCue(engine, "enable");
      announce("Galaxy soundscape on · music and interface signals");
    } catch {
      announce("Sound is unavailable in this browser");
    }
  };

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine?.active) return;
    const now = engine.context.currentTime;
    engine.music.gain.setTargetAtTime(pathname.startsWith("/play/") ? 0.14 : 0.82, now, 0.35);
    playCue(engine, "navigate");
  }, [pathname]);

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      const engine = engineRef.current;
      if (!enabledRef.current || !engine?.active) return;
      const target = event.target instanceof Element ? event.target.closest("a, button, [role='button']") : null;
      if (!target || target.classList.contains("soundscape-button")) return;
      playCue(engine, target instanceof HTMLAnchorElement ? "navigate" : "button");
    };
    const handleSupernova = () => {
      const engine = engineRef.current;
      if (enabledRef.current && engine?.active) playCue(engine, "supernova");
    };
    document.addEventListener("pointerdown", handlePointer, true);
    window.addEventListener("joycircuit:ambient-explosion", handleSupernova);
    return () => {
      document.removeEventListener("pointerdown", handlePointer, true);
      window.removeEventListener("joycircuit:ambient-explosion", handleSupernova);
    };
  }, []);

  useEffect(() => () => {
    if (statusTimerRef.current !== null) window.clearTimeout(statusTimerRef.current);
    const engine = engineRef.current;
    if (engine?.intervalId != null) window.clearInterval(engine.intervalId);
    if (engine) void engine.context.close();
    delete document.documentElement.dataset.soundscape;
  }, []);

  return (
    <div className="soundscape-control">
      <button
        type="button"
        className={`icon-button soundscape-button ${enabled ? "is-active" : ""}`}
        aria-label={enabled ? "Mute galaxy soundscape" : "Play galaxy soundscape"}
        aria-pressed={enabled}
        title={enabled ? "Mute music and interface sounds" : "Play galaxy music and interface sounds"}
        onClick={() => void toggle()}
      >
        <SoundscapeIcon size={20} />
      </button>
      {status ? <span className="soundscape-status" role="status">{status}</span> : null}
    </div>
  );
}
