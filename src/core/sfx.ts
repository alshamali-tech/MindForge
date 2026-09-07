// Tiny WebAudio synth for game feedback. No assets, no network.

export type SfxKind = "click" | "good" | "bad" | "tick" | "win" | "flip";

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, at: number, dur: number, type: OscillatorType, vol: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, c.currentTime + at);
  g.gain.exponentialRampToValueAtTime(vol, c.currentTime + at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
  o.connect(g).connect(c.destination);
  o.start(c.currentTime + at);
  o.stop(c.currentTime + at + dur + 0.05);
}

export function sfx(kind: SfxKind, enabled: boolean) {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  try {
    switch (kind) {
      case "click":
        tone(c, 660, 0, 0.06, "triangle", 0.08);
        break;
      case "flip":
        tone(c, 440, 0, 0.07, "sine", 0.09);
        tone(c, 587, 0.05, 0.07, "sine", 0.07);
        break;
      case "good":
        tone(c, 659, 0, 0.09, "sine", 0.1);
        tone(c, 880, 0.07, 0.12, "sine", 0.1);
        break;
      case "bad":
        tone(c, 196, 0, 0.16, "sawtooth", 0.07);
        tone(c, 147, 0.08, 0.18, "sawtooth", 0.06);
        break;
      case "tick":
        tone(c, 520, 0, 0.07, "square", 0.05);
        break;
      case "win":
        tone(c, 523, 0, 0.12, "sine", 0.1);
        tone(c, 659, 0.1, 0.12, "sine", 0.1);
        tone(c, 784, 0.2, 0.12, "sine", 0.1);
        tone(c, 1047, 0.3, 0.28, "sine", 0.12);
        break;
    }
  } catch {
    /* audio is decoration; never break the game */
  }
}
