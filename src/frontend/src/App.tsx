import { useCallback, useEffect, useRef, useState } from "react";

const WHITE_KEYS = [
  { note: "C4", freq: 261.63, label: "C", kbd: "A", octave: 4 },
  { note: "D4", freq: 293.66, label: "D", kbd: "S", octave: 4 },
  { note: "E4", freq: 329.63, label: "E", kbd: "D", octave: 4 },
  { note: "F4", freq: 349.23, label: "F", kbd: "F", octave: 4 },
  { note: "G4", freq: 392.0, label: "G", kbd: "G", octave: 4 },
  { note: "A4", freq: 440.0, label: "A", kbd: "H", octave: 4 },
  { note: "B4", freq: 493.88, label: "B", kbd: "J", octave: 4 },
  { note: "C5", freq: 523.25, label: "C", kbd: "K", octave: 5 },
  { note: "D5", freq: 587.33, label: "D", kbd: "L", octave: 5 },
  { note: "E5", freq: 659.25, label: "E", kbd: ";", octave: 5 },
];

const BLACK_KEYS = [
  { note: "C#4", freq: 277.18, label: "C#", kbd: "W", gapIndex: 0 },
  { note: "D#4", freq: 311.13, label: "D#", kbd: "E", gapIndex: 1 },
  { note: "F#4", freq: 369.99, label: "F#", kbd: "T", gapIndex: 3 },
  { note: "G#4", freq: 415.3, label: "G#", kbd: "Y", gapIndex: 4 },
  { note: "A#4", freq: 466.16, label: "A#", kbd: "U", gapIndex: 5 },
  { note: "C#5", freq: 554.37, label: "C#", kbd: "O", gapIndex: 7 },
  { note: "D#5", freq: 622.25, label: "D#", kbd: "P", gapIndex: 8 },
];

const WHITE_KEY_WIDTH = 54;
const BLACK_KEY_WIDTH = 34;
const WHITE_KEY_HEIGHT = 220;
const BLACK_KEY_HEIGHT = 138;

type ActiveNote = {
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  gain: GainNode;
};

export default function App() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const activeNotesRef = useRef<Map<string, ActiveNote>>(new Map());
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playNote = useCallback(
    (note: string, freq: number) => {
      if (activeNotesRef.current.has(note)) return;
      const ctx = getAudioCtx();
      if (ctx.state === "suspended") ctx.resume();

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.01);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.11);
      gain.connect(ctx.destination);

      const osc1 = ctx.createOscillator();
      osc1.type = "triangle";
      osc1.frequency.value = freq;
      osc1.connect(gain);
      osc1.start();

      const gain2 = ctx.createGain();
      gain2.gain.value = 0.15;
      gain2.connect(ctx.destination);
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.value = freq;
      osc2.connect(gain2);
      osc2.start();

      activeNotesRef.current.set(note, { osc1, osc2, gain });
      setPressedKeys((prev) => new Set([...prev, note]));
    },
    [getAudioCtx],
  );

  const stopNote = useCallback((note: string) => {
    const active = activeNotesRef.current.get(note);
    if (!active) return;
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    const { osc1, osc2, gain } = active;
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
    setTimeout(() => {
      try {
        osc1.stop();
      } catch {}
      try {
        osc2.stop();
      } catch {}
    }, 250);
    activeNotesRef.current.delete(note);
    setPressedKeys((prev) => {
      const next = new Set(prev);
      next.delete(note);
      return next;
    });
  }, []);

  useEffect(() => {
    const kbdMap: Record<string, string> = {};
    const freqMap: Record<string, number> = {};
    for (const k of WHITE_KEYS) {
      kbdMap[k.kbd.toLowerCase()] = k.note;
      freqMap[k.note] = k.freq;
    }
    for (const k of BLACK_KEYS) {
      kbdMap[k.kbd.toLowerCase()] = k.note;
      freqMap[k.note] = k.freq;
    }
    const held = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const note = kbdMap[e.key === ";" ? ";" : e.key.toLowerCase()];
      if (note && !held.has(note)) {
        held.add(note);
        playNote(note, freqMap[note]);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const note = kbdMap[e.key === ";" ? ";" : e.key.toLowerCase()];
      if (note) {
        held.delete(note);
        stopNote(note);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [playNote, stopNote]);

  const totalWidth = WHITE_KEYS.length * WHITE_KEY_WIDTH;

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at 50% 40%, #1c1c1c 0%, #0e0e0e 70%, #080808 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Cabinet Grotesk', sans-serif",
      }}
    >
      {/* Outer piano body — thick multi-layer bezel */}
      <div
        style={{
          background:
            "linear-gradient(170deg, #323232 0%, #242424 25%, #1a1a1a 60%, #121212 100%)",
          borderRadius: "18px",
          padding: "0",
          boxShadow:
            "0 60px 120px rgba(0,0,0,0.9), 0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.07), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.5)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top panel — name plate area */}
        <div
          style={{
            padding: "20px 36px 0",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <span
            style={{
              letterSpacing: "0.4em",
              fontSize: "10px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.18)",
              textTransform: "uppercase",
            }}
          >
            Grand Piano
          </span>
        </div>

        {/* Key bed — recessed cavity holding the keys */}
        <div
          data-ocid="piano.canvas_target"
          style={{
            margin: "14px 20px 20px",
            borderRadius: "10px",
            /* deep inset to simulate key cavity recessed into body */
            boxShadow:
              "inset 0 8px 20px rgba(0,0,0,0.9), inset 0 2px 6px rgba(0,0,0,0.7), inset 4px 0 8px rgba(0,0,0,0.4), inset -4px 0 8px rgba(0,0,0,0.4)",
            background: "#0a0a0a",
            padding: "14px 12px 10px",
            position: "relative",
          }}
        >
          {/* Key container */}
          <div
            style={{
              position: "relative",
              width: `${totalWidth}px`,
              height: `${WHITE_KEY_HEIGHT}px`,
            }}
          >
            {/* White keys */}
            {WHITE_KEYS.map((key, i) => {
              const isPressed = pressedKeys.has(key.note);
              return (
                <div
                  key={key.note}
                  data-ocid={`piano.key.${i + 1}`}
                  className={`piano-white-key${isPressed ? " pressed" : ""}`}
                  onMouseDown={() => playNote(key.note, key.freq)}
                  onMouseUp={() => stopNote(key.note)}
                  onMouseLeave={() => stopNote(key.note)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    playNote(key.note, key.freq);
                  }}
                  onTouchEnd={() => stopNote(key.note)}
                  style={{
                    position: "absolute",
                    left: `${i * WHITE_KEY_WIDTH}px`,
                    top: 0,
                    width: `${WHITE_KEY_WIDTH - 2}px`,
                    height: `${WHITE_KEY_HEIGHT}px`,
                    /* Fix 2: Realistic white key — ivory gradient + visible bottom-edge lip */
                    background: isPressed
                      ? "linear-gradient(180deg, #d8d8d8 0%, #c8c4bc 100%)"
                      : "linear-gradient(180deg, #f8f8f6 0%, #f2ede2 70%, #e8e0d0 92%, #d8cfc0 100%)",
                    borderRadius: "0 0 9px 9px",
                    /* deep bottom border simulates key thickness/lip */
                    borderLeft: "1px solid #9a9590",
                    borderRight: "1px solid #aaa49e",
                    borderBottom: isPressed
                      ? "3px solid #bbb5a8"
                      : "5px solid #c8bfb0",
                    borderTop: "none",
                    boxShadow: isPressed
                      ? "inset 0 3px 8px rgba(0,0,0,0.18), inset 2px 0 4px rgba(0,0,0,0.08)"
                      : [
                          /* right-side drop shadow from neighboring key */
                          "3px 0 5px rgba(0,0,0,0.18)",
                          /* inset left darkening from black-key overhang shadow */
                          "inset 3px 0 6px rgba(0,0,0,0.07)",
                          /* inset top gloss line */
                          "inset 0 1px 0 rgba(255,255,255,0.9)",
                          /* outer drop for depth */
                          "0 6px 12px rgba(0,0,0,0.5)",
                        ].join(", "),
                    cursor: "pointer",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingBottom: "10px",
                    gap: "2px",
                    transformOrigin: "top center",
                    perspective: "400px",
                  }}
                >
                  {/* Fix 2: top-of-key gloss sheen strip */}
                  {!isPressed && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: "15%",
                        width: "40%",
                        height: "30%",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.1) 60%, transparent 100%)",
                        borderRadius: "0 0 50% 50%",
                        pointerEvents: "none",
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: "9px",
                      color: "rgba(0,0,0,0.28)",
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      lineHeight: 1,
                    }}
                  >
                    {key.kbd}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "rgba(0,0,0,0.4)",
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {key.label}
                    {key.octave === 5 ? (
                      <sup style={{ fontSize: "8px" }}>5</sup>
                    ) : null}
                  </span>
                </div>
              );
            })}

            {/* Black keys */}
            {BLACK_KEYS.map((key, i) => {
              const isPressed = pressedKeys.has(key.note);
              const leftPos =
                (key.gapIndex + 1) * WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2 - 1;
              return (
                <div
                  key={key.note}
                  data-ocid={`piano.black_key.${i + 1}`}
                  className={`piano-black-key${isPressed ? " pressed" : ""}`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    playNote(key.note, key.freq);
                  }}
                  onMouseUp={() => stopNote(key.note)}
                  onMouseLeave={() => stopNote(key.note)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    playNote(key.note, key.freq);
                  }}
                  onTouchEnd={() => stopNote(key.note)}
                  style={{
                    position: "absolute",
                    left: `${leftPos}px`,
                    top: 0,
                    width: `${BLACK_KEY_WIDTH}px`,
                    height: `${BLACK_KEY_HEIGHT}px`,
                    /* Fix 1: Rich lacquer black — multi-stop with bright specular top */
                    background: isPressed
                      ? "linear-gradient(180deg, #222 0%, #111 40%, #030303 100%)"
                      : "linear-gradient(180deg, #484848 0%, #282828 8%, #141414 35%, #060606 80%, #020202 100%)",
                    borderRadius: "0 0 7px 7px",
                    border: "1px solid #000",
                    borderTop: isPressed
                      ? "2px solid #333"
                      : "2px solid #686868",
                    boxShadow: isPressed
                      ? [
                          "inset 0 3px 8px rgba(0,0,0,0.9)",
                          "0 3px 6px rgba(0,0,0,0.7)",
                        ].join(", ")
                      : [
                          /* outer depth shadow */
                          "4px 8px 16px rgba(0,0,0,0.85)",
                          "2px 4px 6px rgba(0,0,0,0.6)",
                          /* left-edge specular */
                          "inset 1px 0 0 rgba(255,255,255,0.05)",
                          /* bottom edge highlight — shows lacquer depth */
                          "inset 0 -2px 0 rgba(255,255,255,0.04)",
                        ].join(", "),
                    cursor: "pointer",
                    zIndex: 2,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingBottom: "10px",
                    gap: "2px",
                    overflow: "hidden",
                  }}
                >
                  {/* Fix 1: Lacquer gloss highlight streak — the signature piano black key look */}
                  {!isPressed && (
                    <>
                      {/* Main vertical gloss streak */}
                      <div
                        style={{
                          position: "absolute",
                          top: "3px",
                          left: "22%",
                          width: "28%",
                          height: "52%",
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.1) 40%, rgba(255,255,255,0.02) 80%, transparent 100%)",
                          borderRadius: "0 0 50% 50%",
                          pointerEvents: "none",
                        }}
                      />
                      {/* Thin bright top-edge reflection line */}
                      <div
                        style={{
                          position: "absolute",
                          top: "2px",
                          left: "8%",
                          right: "8%",
                          height: "2px",
                          background:
                            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 30%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.25) 70%, transparent 100%)",
                          borderRadius: "1px",
                          pointerEvents: "none",
                        }}
                      />
                    </>
                  )}
                  <span
                    style={{
                      fontSize: "8px",
                      color: "rgba(255,255,255,0.3)",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      lineHeight: 1,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {key.kbd}
                  </span>
                  <span
                    style={{
                      fontSize: "9px",
                      color: "rgba(255,255,255,0.5)",
                      fontWeight: 700,
                      lineHeight: 1,
                      position: "relative",
                      zIndex: 1,
                    }}
                  >
                    {key.label}
                  </span>
                </div>
              );
            })}

            {/* Fix 3: Recession shadow overlay — piano body overhang casting shadow onto key tops */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "28px",
                background:
                  "linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.05) 85%, transparent 100%)",
                pointerEvents: "none",
                zIndex: 10,
              }}
            />
          </div>
        </div>

        {/* Bottom info strip */}
        <div
          style={{
            padding: "0 20px 16px",
            textAlign: "center",
            fontSize: "9px",
            color: "rgba(255,255,255,0.1)",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          C4 – E5 · 16 Keys
        </div>
      </div>

      {/* Keyboard hint */}
      <p
        style={{
          marginTop: "28px",
          fontSize: "11px",
          color: "rgba(255,255,255,0.18)",
          letterSpacing: "0.12em",
        }}
      >
        Use keyboard keys to play · Click or tap keys
      </p>

      {/* Footer */}
      <footer
        style={{
          position: "fixed",
          bottom: "16px",
          fontSize: "11px",
          color: "rgba(255,255,255,0.1)",
        }}
      >
        © {new Date().getFullYear()}. Built with ♥ using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
          style={{ color: "rgba(255,255,255,0.18)", textDecoration: "none" }}
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
