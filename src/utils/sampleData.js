// A realistic demo production so first-time visitors can experience a full
// Wrapped without their own export. Generated in-code from a fixed seed (so the
// demo is identical every time) and shaped exactly like a CamLog/ZoeLog CSV:
// one row per take, gear held consistent across a scene's takes, a "shot" being
// a unique scene+date.

export const SAMPLE_TITLE = 'GOLDEN HOUR'

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const CAMERAS = [
  { w: 60, camera: 'A', model: 'ARRI Alexa 35' },
  { w: 32, camera: 'B', model: 'ARRI Alexa Mini LF' },
  { w: 8,  camera: 'C', model: 'RED Komodo-X' },
]
const LENSES = [
  { w: 26, lens: '40mm Master Prime' },
  { w: 22, lens: '32mm Master Prime' },
  { w: 18, lens: '50mm Master Prime' },
  { w: 13, lens: '75mm Master Prime' },
  { w: 11, lens: '27mm Master Prime' },
  { w: 10, lens: 'Angenieux Optimo 28-76mm' },
]
const FILTERS = [
  { w: 30, filter: 'Internal ND 0.6' },
  { w: 22, filter: 'Internal ND 0.9' },
  { w: 16, filter: 'Internal ND 1.2' },
  { w: 12, filter: 'Black Pro-Mist 1/4' },
  { w: 10, filter: 'Pola' },
  { w: 10, filter: 'Clear' },
]
const SUPPORTS = [
  { w: 32, note: 'Sticks' },
  { w: 24, note: 'Dolly' },
  { w: 18, note: 'Handheld' },
  { w: 16, note: 'Steadicam' },
  { w: 10, note: 'Technocrane' },
]
const DATES = ['2026-06-01', '2026-06-02', '2026-06-03', '2026-06-04', '2026-06-05', '2026-06-06']

function csvCell(v) {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function sampleCsv() {
  const rng = mulberry32(20260601)   // fresh sequence each call → stable output
  const pick = (arr) => {
    const total = arr.reduce((s, o) => s + o.w, 0)
    let r = rng() * total
    for (const o of arr) { if ((r -= o.w) < 0) return o }
    return arr[arr.length - 1]
  }
  const int = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1))

  const header = ['Scene', 'Date', 'Camera', 'Camera Model', 'Roll', 'Take', 'Lens', 'Filters', 'Circled', 'Notes']
  const lines = [header.join(',')]

  DATES.forEach((date, di) => {
    const scenes = int(7, 11)
    for (let sc = 1; sc <= scenes; sc++) {
      // Gear is fixed for a scene; only the take changes.
      const cam  = pick(CAMERAS)
      const lens = pick(LENSES).lens
      const filt = pick(FILTERS).filter
      const supp = pick(SUPPORTS).note
      const scene = `${sc}${String.fromCharCode(65 + int(0, 2))}`   // 1A, 2B, 3C…
      const takes = pick([{ w: 20, v: 1 }, { w: 34, v: 2 }, { w: 28, v: 3 }, { w: 18, v: 4 }]).v
      const circledTake = int(1, takes)
      const roll = `${cam.camera}${String(di + 1).padStart(3, '0')}`
      for (let t = 1; t <= takes; t++) {
        lines.push([
          scene, date, cam.camera, cam.model, roll, t, lens, filt,
          t === circledTake ? 'true' : '', supp,
        ].map(csvCell).join(','))
      }
    }
  })

  return lines.join('\n')
}
