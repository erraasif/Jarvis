import React, { useEffect, useRef, useState } from "react";
import { Track } from "livekit-client";
import { Mail, Calendar, CheckSquare, X, Mic, Volume2 } from "lucide-react";

/**
 * Full-screen voice presence. Mounted only while voiceConnected is true.
 *
 * The orb's motion is driven by real audio levels (Web Audio AnalyserNode)
 * read from the actual mic input and the actual agent output track --
 * not a decorative CSS loop. If audio isn't flowing, the orb sits still,
 * which is honest and also doubles as a visual diagnostic.
 */
export default function VoiceMode({ voiceRoomRef, isSpeaking, voiceConnecting, onDisconnect, onQuickAction }) {
  const [micLevel, setMicLevel] = useState(0);
  const [agentLevel, setAgentLevel] = useState(0);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let micAnalyser = null;
    let agentAnalyser = null;
    const micData = new Uint8Array(64);
    const agentData = new Uint8Array(64);

    const setup = (attemptsLeft) => {
      if (cancelled) return;
      const room = voiceRoomRef?.current;
      const agentAudioEl = document.querySelector("audio[data-livekit-audio]");

      if (!room && attemptsLeft > 0) {
        setTimeout(() => setup(attemptsLeft - 1), 150);
        return;
      }
      if (!room) return;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      try {
        const micPublication = room.localParticipant?.getTrackPublication?.(Track.Source.Microphone);
        const micTrack = micPublication?.track?.mediaStreamTrack;
        if (micTrack) {
          const micStream = new MediaStream([micTrack]);
          const micSource = audioCtx.createMediaStreamSource(micStream);
          micAnalyser = audioCtx.createAnalyser();
          micAnalyser.fftSize = 128;
          micSource.connect(micAnalyser);
        }
      } catch (e) {
        console.warn("Voice Mode: could not attach mic analyser", e);
      }

      try {
        if (agentAudioEl && agentAudioEl.srcObject) {
          const agentSource = audioCtx.createMediaStreamSource(agentAudioEl.srcObject);
          agentAnalyser = audioCtx.createAnalyser();
          agentAnalyser.fftSize = 128;
          agentSource.connect(agentAnalyser);
        }
      } catch (e) {
        console.warn("Voice Mode: could not attach agent analyser", e);
      }

      const tick = () => {
        if (cancelled) return;
        if (micAnalyser) {
          micAnalyser.getByteFrequencyData(micData);
          setMicLevel(micData.reduce((a, b) => a + b, 0) / micData.length / 255);
        }
        if (agentAnalyser) {
          agentAnalyser.getByteFrequencyData(agentData);
          setAgentLevel(agentData.reduce((a, b) => a + b, 0) / agentData.length / 255);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    };

    setup(10);

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, [voiceRoomRef]);

  const level = isSpeaking ? agentLevel : micLevel;
  const orbScale = 1 + Math.min(level, 1) * 0.35;
  const orbGlow = 20 + Math.min(level, 1) * 60;

  const statusText = voiceConnecting
    ? "Connecting..."
    : isSpeaking
    ? "Jarvis is speaking"
    : "Listening";

  const quickActions = [
    { id: "emails", label: "Mail", icon: Mail },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "todos", label: "To-Do", icon: CheckSquare },
  ];

  return (
    <div className="fixed inset-0 z-100 bg-bg/97 backdrop-blur-2xl flex flex-col items-center justify-center gap-10 px-6">
      <button
        onClick={onDisconnect}
        className="absolute top-6 right-6 p-3 rounded-full bg-surface/80 border border-border hover:bg-surface-2 transition-colors text-ink-muted hover:text-ink"
        aria-label="Exit voice mode"
      >
        <X size={20} />
      </button>

      <div className="console-grid absolute inset-0 pointer-events-none opacity-60" />

      {/* Reactive orb */}
      <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
        <div
          className="absolute rounded-full transition-transform duration-100 ease-out"
          style={{
            width: 220,
            height: 220,
            transform: `scale(${orbScale})`,
            background:
              "radial-gradient(circle at 35% 30%, var(--color-glow-2), var(--color-accent) 55%, transparent 78%)",
            boxShadow: `0 0 ${orbGlow}px color-mix(in srgb, var(--color-accent) 55%, transparent)`,
            opacity: 0.9,
          }}
        />
        <div
          className="absolute rounded-full border border-accent/40"
          style={{ width: 260, height: 260, transform: `scale(${1 + Math.min(level, 1) * 0.15})` }}
        />
        <div className="relative z-10 text-bg">
          {isSpeaking ? <Volume2 size={28} /> : <Mic size={28} />}
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 font-mono">
        <span className="text-sm tracking-widest uppercase text-ink-muted">{statusText}</span>
      </div>

      <div className="flex gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => onQuickAction(action.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface/80 border border-border hover:border-accent/50 hover:bg-surface-2 transition-colors text-sm text-ink"
            >
              <Icon size={15} />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}