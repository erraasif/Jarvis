import React, { Suspense, useEffect, useRef, useState } from "react";
import { Track } from "livekit-client";
import { Mail, Calendar, CheckSquare, X, ChevronDown, Mic, MicOff, Volume2 } from "lucide-react";
const JarvisMascot = React.lazy(() => import("./JarvisMascot"));

/**
 * Full-screen voice presence. Mounted only while voiceConnected is true.
 *
 * The avatar's glow/pulse is driven by real audio (Web Audio AnalyserNode)
 * read from the actual mic input and the actual agent output track -- not a
 * decorative loop. The mic button actually mutes/unmutes the published
 * track. Quick actions publish a real data message the agent listens for
 * (see agent.py's data_received handler) so tapping "Mail" genuinely tells
 * Jarvis what you want, instead of only switching a tab.
 */
export default function VoiceMode({ voiceRoomRef, isSpeaking, voiceConnecting, onDisconnect, onMinimize, onQuickAction }) {
  const [level, setLevel] = useState(0);
  const [muted, setMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const audioLevelRef = useRef(0);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);
  const startRef = useRef(Date.now());
  const isSpeakingRef = useRef(isSpeaking);

  // Sync the mute button with the track's real state on mount, rather than
  // assuming unmuted -- the track can already be muted from a previous
  // Voice Mode session if the user minimized instead of ending the call.
  useEffect(() => {
    const micPublication = voiceRoomRef?.current?.localParticipant?.getTrackPublication?.(Track.Source.Microphone);
    if (micPublication?.track) {
      setMuted(!!micPublication.track.isMuted);
    }
  }, [voiceRoomRef]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let micAnalyser = null;
    let agentAnalyser = null;
    const freqData = new Uint8Array(64);

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
          const micSource = audioCtx.createMediaStreamSource(new MediaStream([micTrack]));
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
        const activeAnalyser = isSpeakingRef.current ? agentAnalyser || micAnalyser : micAnalyser || agentAnalyser;
        if (activeAnalyser) {
          activeAnalyser.getByteFrequencyData(freqData);
          let sum = 0;
          for (let i = 0; i < freqData.length; i++) sum += freqData[i] / 255;
          const avg = sum / freqData.length;
          audioLevelRef.current = avg;
          setLevel(avg);
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

  const toggleMute = async () => {
    const room = voiceRoomRef?.current;
    const micPublication = room?.localParticipant?.getTrackPublication?.(Track.Source.Microphone);
    const micTrack = micPublication?.track;
    if (!micTrack) return;
    try {
      if (muted) {
        await micTrack.unmute();
      } else {
        await micTrack.mute();
      }
      setMuted((m) => !m);
    } catch (e) {
      console.error("Voice Mode: failed to toggle mic", e);
    }
  };

  const sendQuickAction = (id, label) => {
    const room = voiceRoomRef?.current;
    if (room?.localParticipant) {
      try {
        const payload = new TextEncoder().encode(
          JSON.stringify({ type: "quick_action", action: id, label })
        );
        room.localParticipant.publishData(payload, { reliable: true, topic: "quick_action" });
      } catch (e) {
        console.warn("Voice Mode: could not send quick action to agent", e);
      }
    }
    onQuickAction(id);
  };

  const statusText = voiceConnecting ? "CONNECTING" : muted ? "MUTED" : isSpeaking ? "JARVIS SPEAKING" : "LISTENING";
  const statusColor = voiceConnecting ? "text-amber-400" : muted ? "text-ink-muted" : isSpeaking ? "text-accent" : "text-emerald-400";
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const quickActions = [
    { id: "emails", label: "Mail", icon: Mail },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "todos", label: "To-Do", icon: CheckSquare },
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-bg/98 backdrop-blur-2xl flex flex-col items-center justify-center gap-8 px-6 font-mono">
      <div className="console-grid absolute inset-0 pointer-events-none opacity-50" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5 border-b border-border/60">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-widest">
          <span className={`w-1.5 h-1.5 rounded-full ${statusColor.replace("text-", "bg-")}`} />
          <span className={statusColor}>{statusText}</span>
          <span className="text-ink-muted/60">· {mm}:{ss}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onMinimize}
            className="flex items-center gap-1.5 px-3 py-2 border border-border/70 bg-surface/70 hover:bg-surface-2 transition-colors text-[11px] uppercase tracking-wide text-ink-muted hover:text-ink"
          >
            <ChevronDown size={13} />
            Back to chat
          </button>
          <button
            onClick={onDisconnect}
            className="flex items-center gap-1.5 px-3 py-2 border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors text-[11px] uppercase tracking-wide text-red-400"
            aria-label="End voice session"
          >
            <X size={13} />
            End
          </button>
        </div>
      </div>

      {/* 3D avatar, driven by real audio level */}
      <div className="relative w-full max-w-[280px] aspect-square">
        <Suspense fallback={<div className="w-full h-full rounded-full bg-accent/10" />}>
          <JarvisMascot className="absolute inset-0 h-full w-full" audioLevelRef={audioLevelRef} variant="voice" />
        </Suspense>
      </div>

      {/* Tap-to-mute mic -- a real toggle on the actual published track */}
      <button
        onClick={toggleMute}
        className={`relative flex items-center justify-center w-16 h-16 rounded-full border transition-all duration-200 ${
          muted
            ? "border-red-500/40 bg-red-500/10 text-red-400"
            : "border-accent/50 bg-accent/10 text-accent mic-pulse"
        }`}
        style={{ "--mic-level": level }}
        aria-label={muted ? "Unmute microphone" : "Mute microphone"}
      >
        {muted ? <MicOff size={22} /> : <Mic size={22} />}
      </button>

      <div className="flex items-center gap-2 text-ink-muted text-xs">
        {isSpeaking ? <Volume2 size={13} /> : <Mic size={13} />}
        <span>{isSpeaking ? "output" : "input"} level {Math.round(level * 100)}%</span>
      </div>

      {/* Quick actions -- these publish a real message the agent listens for */}
      <div className="flex gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => sendQuickAction(action.id, action.label)}
              className="flex items-center gap-2 px-4 py-2.5 border border-border/70 bg-surface/70 hover:border-accent/50 hover:bg-surface-2 transition-colors text-xs uppercase tracking-wide text-ink"
            >
              <Icon size={14} />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}