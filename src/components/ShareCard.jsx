import { useMemo, useRef, useState, useLayoutEffect } from 'react'
import {
  lensUsage, supportUsage, cameraUsage, filterUsage,
  takesPerDay, deduplicateShots, getCameraColorByIndex,
} from '../utils/stats'
import { fmtDate } from '../utils/format'
import { CARD_SIZE, CARD_HEIGHT_STORY } from './shareCardSize'

const GRADIENT = 'linear-gradient(135deg, #3b82f6 0%, #e63946 50%, #fbbf24 100%)'
// Extra top padding in portrait to clear the Instagram story handle/avatar overlay
const STORY_TOP_PAD = 140

const c = {
  bg: '#111111',
  surface2: '#2a2a2c',
  accent: '#e63946',
  ink: '#f2f2f7',
  ink2: '#8e8e93',
  ink3: '#3a3a3c',
  mono: 'DM Mono, monospace',
}

const gradientText = {
  background: GRADIENT,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}

const viewLabel = {
  fontSize: 13,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: '#e63946',
  fontFamily: 'DM Mono, monospace',
}

function ProjectTitle({ projectTitle, portrait }) {
  return (
    <div style={{ fontSize: portrait ? 42 : 36, fontWeight: 700, color: c.ink, fontFamily: c.mono, letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.15, flexShrink: 0 }}>
      {projectTitle || 'CamLog Wrapped'}
    </div>
  )
}

function CardFooter() {
  return (
    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: c.mono, letterSpacing: '-0.01em' }}>
          <span style={{ color: '#ffffff' }}>Cam</span>
          <span style={{ color: c.accent }}>Log</span>
          {' '}
          <span style={{ ...gradientText, display: 'inline-block' }}>Wrapped</span>
        </div>
        <div style={{ fontSize: 13, color: c.ink2, fontFamily: c.mono, letterSpacing: '0.06em' }}>
          camlog.app
        </div>
      </div>
      <div style={{ height: 8, background: GRADIENT, borderRadius: 0 }} />
    </div>
  )
}

// ── Dynamic font sizing ───────────────────────────────────────────────────────
// Name is the BIG hero figure; pct is the supporting figure.
//
// The hero name is sized by canvas.measureText() (see FitText), not a fixed ratio.
// A hard-coded advance like 0.60em is slightly off on iOS, which leaves short names
// like "Handheld" or "ND 0.3" 1–2px over the box and CSS-clips them. Canvas reads
// whatever font the device actually loaded, so it's exact on every platform.

const NAME_FLOOR = 32   // shrink to here before resorting to an ellipsis

// Trailing lens focal length, e.g. "24-290mm", "32mm", "18-35mm".
const FOCAL_RE = /\s*(\d+(?:[.\-x×]\d+)?\s*mm)$/i

// Builds the shortest acceptable label for a name that won't fit even at the font
// floor. `fits(str)` measures the candidate at the floor size. Lens names keep their
// focal length and trim the prefix ("Angenieux… 24-290mm"); everything else uses a
// plain trailing ellipsis. (Leading-focal names like "35mm Cooke S4" keep the focal
// naturally, since the ellipsis falls at the end.)
function shortenToFit(name, fits) {
  if (fits(name)) return name
  const m = name.match(FOCAL_RE)
  if (m) {
    const focal = m[1].replace(/\s+/g, '')
    const prefix = name.slice(0, m.index).trimEnd()
    for (let len = prefix.length - 1; len >= 1; len--) {
      let p = prefix.slice(0, len)
      const sp = p.lastIndexOf(' ')              // prefer a clean word boundary
      if (sp >= len * 0.5) p = p.slice(0, sp)
      const candidate = p.trimEnd() + '… ' + focal
      if (fits(candidate)) return candidate
    }
    if (fits(focal)) return focal
  }
  for (let len = name.length - 1; len >= 1; len--) {
    if (fits(name.slice(0, len).trimEnd() + '…')) return name.slice(0, len).trimEnd() + '…'
  }
  return '…'
}

// Renders text that auto-fits its container's width. Uses canvas.measureText() for
// glyph width — this is immune to the iOS Safari bug where an off-screen DOM span
// inside an overflow:hidden ancestor gets clipped to zero (making offsetWidth
// useless and leaving the text permanently at maxSize, where CSS clips it).
// Shrinks font from `maxSize` down to `NAME_FLOOR`; only ellipsizes below the floor.
function FitText({ text, maxSize, weight = 700, style }) {
  const boxRef = useRef(null)
  const [{ size, display }, setFit] = useState({ size: maxSize, display: text })

  useLayoutEffect(() => {
    let cancelled = false

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const measureWidth = (str, px) => {
      ctx.font = `${weight} ${px}px "DM Mono", monospace`
      return ctx.measureText(str).width
    }

    const compute = () => {
      if (cancelled) return
      const box = boxRef.current
      if (!box) return
      const avail = box.clientWidth
      if (!avail) return   // not yet laid out — ResizeObserver will retry

      const wFull = measureWidth(text, maxSize)
      let nextSize, nextDisplay
      if (wFull <= avail) {
        nextSize = maxSize
        nextDisplay = text
      } else {
        const scaled = Math.floor(maxSize * (avail / wFull))
        if (scaled >= NAME_FLOOR) {
          nextSize = scaled
          nextDisplay = text
        } else {
          nextSize = NAME_FLOOR
          nextDisplay = shortenToFit(text, (s) => measureWidth(s, NAME_FLOOR) <= avail)
        }
      }
      setFit((prev) =>
        prev.size === nextSize && prev.display === nextDisplay ? prev : { size: nextSize, display: nextDisplay }
      )
    }

    compute()
    const raf = requestAnimationFrame(compute)
    // Re-measure once DM Mono bold is confirmed available; canvas then uses the real font.
    document.fonts?.load?.(`${weight} 1px "DM Mono"`)?.then?.(compute)?.catch?.(() => {})

    // Retry when the container gets its layout width (iOS can have avail=0 initially).
    const box = boxRef.current
    const obs = box ? new ResizeObserver(compute) : null
    obs?.observe(box)

    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      obs?.disconnect()
    }
  }, [text, maxSize, weight])

  return (
    <div ref={boxRef} style={{ minWidth: 0 }}>
      <div style={{ ...style, fontSize: size, fontWeight: weight, fontFamily: c.mono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {display}
      </div>
    </div>
  )
}

function pctFontSize(pctStr, portrait) {
  const len = pctStr.length
  if (portrait) {
    if (len <= 4) return 88
    if (len <= 5) return 76
    return 64
  }
  // Square — pct is the supporting figure
  if (len <= 4) return 62
  if (len <= 5) return 54
  return 46
}

// ── Shared hero for Lens / Support / Filters ─────────────────────────────────

function HeroContent({ label, name, pct, count, portrait = false }) {
  const pctStr  = pct.toFixed(1) + '%'
  const pctSz   = pctFontSize(pctStr, portrait)

  if (portrait) {
    return (
      <div style={{ flexShrink: 0 }}>
        <div style={{ ...viewLabel, fontSize: 30, letterSpacing: '0.08em', marginBottom: 20 }}>{label}</div>
        <FitText
          text={name}
          maxSize={130}
          style={{ color: c.ink, lineHeight: 1, marginBottom: 20 }}
        />
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 18, marginBottom: 14 }}>
          <div style={{ fontSize: pctSz, fontWeight: 700, fontFamily: c.mono, lineHeight: 1, ...gradientText, display: 'block' }}>
            {pctStr}
          </div>
          <div style={{ fontSize: 22, color: c.ink2, fontFamily: c.mono, lineHeight: 1, paddingBottom: 6 }}>
            {count} {count === 1 ? 'Shot' : 'Shots'}
          </div>
        </div>
      </div>
    )
  }

  // Square: big name left (wraps if needed), pct + shot count stacked right
  return (
    <div style={{ flexShrink: 0 }}>
      <div style={{ ...viewLabel, fontSize: 24, letterSpacing: '0.10em', marginBottom: 14 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <FitText
            text={name}
            maxSize={100}
            style={{ color: c.ink, lineHeight: 1.1 }}
          />
        </div>
        <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingTop: 4 }}>
          <div style={{ fontSize: pctSz, fontWeight: 700, fontFamily: c.mono, lineHeight: 1.1, ...gradientText, display: 'block' }}>
            {pctStr}
          </div>
          <div style={{ fontSize: 18, color: c.ink2, fontFamily: c.mono, marginTop: 6 }}>
            {count} {count === 1 ? 'Shot' : 'Shots'}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Bar list ──────────────────────────────────────────────────────────────────

function BarList({ data, topN = 5, portrait = false }) {
  const shown   = data.slice(0, topN)
  const maxPct  = shown[0]?.pct || 1
  const barH    = portrait ? 14 : 9
  const labelSz = portrait ? 17 : 14

  const outerStyle = portrait
    ? { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }
    : { display: 'flex', flexDirection: 'column', gap: 12 }

  return (
    <div style={outerStyle}>
      {shown.map((d) => (
        <div key={d.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 5 }}>
            {/* Name flexes and truncates with … ; the value column never shrinks or wraps */}
            <span style={{ fontSize: labelSz, color: c.ink2, fontFamily: c.mono, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0 }}>{d.name}</span>
            <span style={{ fontSize: labelSz, color: c.ink2, fontFamily: c.mono, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {d.pct.toFixed(1)}%  ·  {d.count} {d.count === 1 ? 'Shot' : 'Shots'}
            </span>
          </div>
          <div style={{ height: barH, background: c.surface2, borderRadius: 4 }}>
            <div style={{ height: '100%', width: `${Math.max(0.5, (d.pct / maxPct) * 100)}%`, background: c.accent, borderRadius: 4 }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function HeroStat({ label, value, sub, subSize = 11, gradient = false, valueSz = 36, labelSz = 13 }) {
  return (
    <div>
      <div style={{ ...viewLabel, fontSize: labelSz, marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: valueSz, fontWeight: 700, fontFamily: c.mono, lineHeight: 1, whiteSpace: 'nowrap', ...(gradient ? { ...gradientText, display: 'block' } : { color: c.ink }) }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: subSize, fontWeight: subSize > 16 ? 600 : 400, color: c.ink2, fontFamily: c.mono, marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

// ── View-specific layouts ─────────────────────────────────────────────────────

function LensView({ lensData, portrait }) {
  if (!lensData.data.length) return <EmptyCard label="No lens data recorded" />
  const top = lensData.data[0]
  return (
    <>
      <HeroContent label="Your #1 Lens" name={top.name} pct={top.pct} count={top.count} portrait={portrait} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, ...(portrait ? {} : { justifyContent: 'flex-end' }) }}>
        <BarList data={lensData.data} topN={portrait ? 9 : 5} portrait={portrait} />
      </div>
    </>
  )
}

function SupportView({ suppData, portrait }) {
  if (!suppData.length) return <EmptyCard label="No support data recorded" />
  const top = suppData[0]
  return (
    <>
      <HeroContent label="Mostly Shot" name={top.name} pct={top.pct} count={top.count} portrait={portrait} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, ...(portrait ? {} : { justifyContent: 'flex-end' }) }}>
        <BarList data={suppData} topN={portrait ? 9 : 5} portrait={portrait} />
      </div>
    </>
  )
}

function cameraRowSizing(n, portrait) {
  // Design-confirmed baselines: full-size values that fit at threshold n
  const BASE_PCT_SZ = portrait ? 44 : 28
  const BASE_GAP    = portrait ? 28 : 14
  const BASE_N      = portrait ? 6  : 5
  const MIN_GAP     = portrait ? 4  : 2
  const MIN_PCT_SZ  = portrait ? 14 : 10

  if (n <= BASE_N) return { pctSz: BASE_PCT_SZ, rowGap: BASE_GAP }

  // Available height back-computed from the confirmed-fit baseline
  const availH = BASE_N * BASE_PCT_SZ + (BASE_N - 1) * BASE_GAP

  // Phase 1: keep pctSz, reduce gap
  const idealGap = (availH - n * BASE_PCT_SZ) / Math.max(n - 1, 1)
  if (idealGap >= MIN_GAP) {
    return { pctSz: BASE_PCT_SZ, rowGap: Math.floor(idealGap) }
  }

  // Phase 2: gap at minimum, reduce pctSz
  const pctSz = Math.max(MIN_PCT_SZ, Math.floor((availH - (n - 1) * MIN_GAP) / n))
  return { pctSz, rowGap: MIN_GAP }
}

function CameraView({ camData, portrait }) {
  if (!camData.length) return <EmptyCard label="No camera data recorded" />

  const MAX_N    = portrait ? 12 : 8
  const overflow = Math.max(0, camData.length - MAX_N)
  const shown    = camData.slice(0, MAX_N)

  const effectiveN = overflow > 0 ? MAX_N : camData.length
  const { pctSz, rowGap } = cameraRowSizing(effectiveN, portrait)

  const BASE_PCT_SZ = portrait ? 44 : 28
  const r = pctSz / BASE_PCT_SZ

  const swatchSz   = Math.max(portrait ? 10 : 8,  Math.round((portrait ? 26 : 16) * r))
  const nameSz     = Math.max(portrait ? 10 : 10, Math.round((portrait ? 26 : 18) * r))
  const countSz    = Math.max(portrait ? 8  : 8,  Math.round((portrait ? 22 : 16) * r))
  const countW     = Math.max(portrait ? 60 : 40, Math.round((portrait ? 130 : 96) * r))
  const rowItemGap = portrait ? 18 : 14

  const barH         = portrait ? 56 : 44
  const labelSz      = portrait ? 30 : 24
  const labelSpacing = portrait ? '0.08em' : '0.10em'

  return (
    <>
      <div style={{ ...viewLabel, fontSize: labelSz, letterSpacing: labelSpacing, flexShrink: 0 }}>Camera Breakdown</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: portrait ? 14 : 10, minHeight: 0 }}>
        <div style={{ display: 'flex', height: barH, borderRadius: 5, overflow: 'hidden', flexShrink: 0 }}>
          {camData.map((cam, i) => (
            <div key={cam.name} style={{ width: `${cam.pct}%`, background: getCameraColorByIndex(cam.name, i), minWidth: cam.pct > 0 ? 3 : 0 }} />
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: rowGap }}>
          {shown.map((cam, i) => (
            <div key={cam.name} style={{ display: 'flex', alignItems: 'center', gap: rowItemGap }}>
              <div style={{ width: swatchSz, height: swatchSz, borderRadius: 4, background: getCameraColorByIndex(cam.name, i), flexShrink: 0 }} />
              <span style={{ fontFamily: c.mono, fontSize: nameSz, color: c.ink, flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cam.name} CAMERA</span>
              <span style={{ fontFamily: c.mono, fontSize: pctSz, fontWeight: 600, color: c.ink }}>{cam.pct.toFixed(1)}%</span>
              <span style={{ fontFamily: c.mono, fontSize: countSz, color: c.ink2, width: countW, textAlign: 'right' }}>{cam.count} {cam.count === 1 ? 'Shot' : 'Shots'}</span>
            </div>
          ))}
        </div>
      </div>
      {overflow > 0 && (
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: rowItemGap }}>
          <div style={{ width: swatchSz, flexShrink: 0 }} />
          <span style={{ fontFamily: c.mono, fontSize: nameSz, color: c.ink, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            + {camData.slice(MAX_N).map(cam => cam.name).join(', ')} {overflow > 1 ? 'Cameras' : 'Camera'}
          </span>
        </div>
      )}
    </>
  )
}

function DaysView({ perDayData, stats, portrait }) {
  const maxCount = Math.max(...perDayData.map((d) => d.count), 1)
  const bd = stats.busiestDay
  const n = perDayData.length

  // Portrait: tight gap so bars are wide enough for labels; square: original formula
  const gapSize = portrait
    ? Math.max(1, n <= 30 ? 3 : n <= 60 ? 2 : 1)
    : Math.max(2, Math.floor(460 / Math.max(n, 1)) - 4)

  // Effective bar width at 504px inner portrait width — drives label visibility
  const effectiveBarW = portrait ? Math.max(1, (504 - (n - 1) * gapSize) / Math.max(n, 1)) : 0
  const showCountLabels = portrait && effectiveBarW >= 12
  const showDateLabels  = portrait && effectiveBarW >= 8
  const countLabelSz    = effectiveBarW >= 18 ? 11 : 9

  const formatDate = (d) => {
    if (!d) return ''
    const [, m, day] = d.split('-')
    return `${parseInt(m)}/${parseInt(day)}`
  }

  const valueSz = portrait ? 40 : 36
  const labelSz = 15

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
      <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
        <HeroStat label="Total Shots"    value={stats.totalShots}      valueSz={valueSz} labelSz={labelSz} />
        <HeroStat label="Shooting Days"  value={stats.shootingDays}    valueSz={valueSz} labelSz={labelSz} />
        <HeroStat label="AVG SHOTS/DAY"  value={stats.avgShotsPerDay}  valueSz={valueSz} labelSz={labelSz} />
        {bd && (
          <HeroStat
            label="Busiest Day"
            value={fmtDate(bd.date).label}
            sub={`${bd.count} Shots`}
            subSize={portrait ? 24 : 26}
            valueSz={valueSz}
            labelSz={labelSz}
          />
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: gapSize, minHeight: 0, overflow: portrait ? 'hidden' : 'visible' }}>
          {perDayData.map((d) => {
            const pct = Math.max(2, (d.count / maxCount) * 100)
            if (showCountLabels) {
              return (
                <div key={d.name} style={{ flex: 1, minWidth: 0, height: `${pct}%`, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: countLabelSz, color: c.ink2, fontFamily: c.mono, lineHeight: 1, overflow: 'hidden', width: '100%', textAlign: 'center', flexShrink: 0 }}>
                    {d.count}
                  </div>
                  <div style={{ flex: 1, width: '100%', background: c.accent, borderRadius: '2px 2px 0 0' }} />
                </div>
              )
            }
            return (
              <div key={d.name} style={{ flex: 1, height: `${pct}%`, background: c.accent, borderRadius: '2px 2px 0 0', minWidth: 0 }} />
            )
          })}
        </div>
        {showDateLabels && (
          <div style={{ display: 'flex', gap: gapSize, flexShrink: 0, marginTop: 5 }}>
            {perDayData.map((d) => (
              <div key={d.name} style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 9, color: c.ink2, fontFamily: c.mono, overflow: 'hidden', whiteSpace: 'nowrap', lineHeight: 1.4 }}>
                {formatDate(d.name)}
              </div>
            ))}
          </div>
        )}
        {portrait && !showDateLabels && (
          <div style={{ textAlign: 'center', fontSize: 16, color: c.ink, fontFamily: c.mono, letterSpacing: '0.10em', textTransform: 'uppercase', marginTop: 10, flexShrink: 0 }}>
            Shots Per Day
          </div>
        )}
        {!portrait && (
          <div style={{ textAlign: 'center', fontSize: 13, color: c.ink, fontFamily: c.mono, letterSpacing: '0.10em', textTransform: 'uppercase', marginTop: 10, flexShrink: 0 }}>
            Shots Per Day
          </div>
        )}
      </div>
    </div>
  )
}

function FiltersView({ filtrData, portrait }) {
  if (!filtrData.length) return <EmptyCard label="No filter data recorded" />
  const top = filtrData[0]
  return (
    <>
      <HeroContent label="Top Filter" name={top.name} pct={top.pct} count={top.count} portrait={portrait} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, ...(portrait ? {} : { justifyContent: 'flex-end' }) }}>
        <BarList data={filtrData} topN={portrait ? 9 : 5} portrait={portrait} />
      </div>
    </>
  )
}

function EmptyCard({ label }) {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: c.ink3, fontFamily: c.mono, fontSize: 13 }}>
      {label}
    </div>
  )
}

// ── Public API ────────────────────────────────────────────────────────────────

export function ShareCardContent({ viewId, rows, stats, projectTitle, portrait = false }) {
  const shotsRows  = useMemo(() => deduplicateShots(rows), [rows])
  const lensData   = useMemo(() => lensUsage(shotsRows), [shotsRows])
  const suppData   = useMemo(() => supportUsage(shotsRows), [shotsRows])
  const camData    = useMemo(() => cameraUsage(rows), [rows])
  const filtrData  = useMemo(() => filterUsage(shotsRows), [shotsRows])
  const perDayData = useMemo(() => takesPerDay(shotsRows), [shotsRows])

  const views = {
    lens:    <LensView lensData={lensData} portrait={portrait} />,
    support: <SupportView suppData={suppData} portrait={portrait} />,
    camera:  <CameraView camData={camData} portrait={portrait} />,
    days:    <DaysView perDayData={perDayData} stats={stats} portrait={portrait} />,
    filters: <FiltersView filtrData={filtrData} portrait={portrait} />,
  }

  return (
    <div style={{
      width: CARD_SIZE,
      height: portrait ? CARD_HEIGHT_STORY : CARD_SIZE,
      background: c.bg,
      paddingTop: portrait ? STORY_TOP_PAD : 40,
      paddingRight: portrait ? 48 : 20,
      paddingBottom: portrait ? 20 : 40,
      paddingLeft: portrait ? 48 : 20,
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: portrait ? 28 : 22,
      fontFamily: c.mono,
      overflow: 'hidden',
    }}>
      <ProjectTitle projectTitle={projectTitle} portrait={portrait} />
      {views[viewId] ?? views.lens}
      <CardFooter />
    </div>
  )
}
