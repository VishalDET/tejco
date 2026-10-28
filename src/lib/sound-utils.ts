/**
 * Zero-dependency Web Audio API sound synthesizer for warehouse scanning.
 * Provides instant, zero-latency physical barcode scanner feedback tones:
 * - Scan success beep (single crisp 880Hz tone)
 * - Item complete chime (ascending two-tone chime)
 * - Order complete fanfare (celebratory 4-note victory chord)
 * - Error buzzer (low-pitch rejection tone)
 */

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null
  try {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioCtxClass) return null
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new AudioCtxClass()
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {})
    }
    return audioCtx
  } catch {
    return null
  }
}

const STORAGE_KEY_MUTED = "tejco_scanner_sound_muted"

export function isSoundMuted(): boolean {
  if (typeof window === "undefined") return false
  return localStorage.getItem(STORAGE_KEY_MUTED) === "true"
}

export function setSoundMuted(muted: boolean): void {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY_MUTED, muted ? "true" : "false")
}

export function toggleSound(): boolean {
  const next = !isSoundMuted()
  setSoundMuted(next)
  if (!next) {
    playScanSuccess()
  }
  return next
}

/**
 * Standard scan success: Crisp 880Hz scanner beep (80ms)
 */
export function playScanSuccess(): void {
  if (isSoundMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = "sine"
    osc.frequency.setValueAtTime(880, now) // A5

    gain.gain.setValueAtTime(0.001, now)
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(now)
    osc.stop(now + 0.09)
  } catch (e) {
    console.debug("Audio play error:", e)
  }
}

/**
 * Line item fulfilled: Ascending 2-tone melodic chime (160ms)
 */
export function playItemComplete(): void {
  if (isSoundMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime

    // Note 1: 659Hz (E5)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = "sine"
    osc1.frequency.setValueAtTime(659.25, now)
    gain1.gain.setValueAtTime(0.001, now)
    gain1.gain.exponentialRampToValueAtTime(0.28, now + 0.01)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.1)

    // Note 2: 987.77Hz (B5)
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = "triangle"
    osc2.frequency.setValueAtTime(987.77, now + 0.08)
    gain2.gain.setValueAtTime(0.001, now + 0.08)
    gain2.gain.exponentialRampToValueAtTime(0.35, now + 0.09)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.08)
    osc2.stop(now + 0.24)
  } catch (e) {
    console.debug("Audio play error:", e)
  }
}

/**
 * Outward order 100% packed: Celebratory 4-note victory arpeggio (C5 -> E5 -> G5 -> C6)
 */
export function playOrderComplete(): void {
  if (isSoundMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const notes = [
      { freq: 523.25, time: 0.0, dur: 0.1 },  // C5
      { freq: 659.25, time: 0.09, dur: 0.1 }, // E5
      { freq: 783.99, time: 0.18, dur: 0.12 },// G5
      { freq: 1046.5, time: 0.28, dur: 0.28 } // C6 (sustained)
    ]

    const baseTime = ctx.currentTime

    notes.forEach(({ freq, time, dur }) => {
      const start = baseTime + time
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = "triangle"
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, start + dur)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + dur + 0.02)
    })
  } catch (e) {
    console.debug("Audio play error:", e)
  }
}

/**
 * Error / Barcode Not Found: Low double buzzer tone
 */
export function playScanError(): void {
  if (isSoundMuted()) return
  const ctx = getAudioContext()
  if (!ctx) return

  try {
    const now = ctx.currentTime

    // Buzz 1
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = "sawtooth"
    osc1.frequency.setValueAtTime(180, now)
    gain1.gain.setValueAtTime(0.001, now)
    gain1.gain.exponentialRampToValueAtTime(0.35, now + 0.01)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.1)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.11)

    // Buzz 2
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = "sawtooth"
    osc2.frequency.setValueAtTime(160, now + 0.13)
    gain2.gain.setValueAtTime(0.001, now + 0.13)
    gain2.gain.exponentialRampToValueAtTime(0.35, now + 0.14)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.26)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.13)
    osc2.stop(now + 0.28)
  } catch (e) {
    console.debug("Audio play error:", e)
  }
}
