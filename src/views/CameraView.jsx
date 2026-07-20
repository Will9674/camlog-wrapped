import { useMemo } from 'react'
import SummaryBar from '../components/SummaryBar'
import { cameraUsage, getCameraColorByIndex } from '../utils/stats'

export default function CameraView({ rows, stats }) {
  const data = useMemo(() => cameraUsage(rows), [rows])
  // Uniform column widths across all legend rows, sized to the longest value.
  const pctCh   = Math.max(...data.map((c) => `${c.pct.toFixed(1)}%`.length), 1)
  const countCh = Math.max(...data.map((c) => `${c.count} ${c.count === 1 ? 'Shot' : 'Shots'}`.length), 1)
  const top = data[0]
  const highlight = top && {
    label: 'Top Camera',
    value: `${top.name}${top.model ? ` ${top.model}` : ''} · ${top.pct.toFixed(1)}%`,
  }

  if (data.length === 0) {
    return (
      <div>
        <SummaryBar stats={stats} />
        <div className="bg-(--c-surface) border border-(--c-border) rounded-xl p-6">
          <div className="text-(--c-ink2) font-['DM_Mono'] text-sm py-8 text-center">
            No camera data found
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <SummaryBar stats={stats} highlight={highlight} />
      <div className="bg-(--c-surface) border border-(--c-border) rounded-xl p-6">
        <h2 className="text-xs uppercase tracking-widest text-(--c-label) font-['DM_Mono'] mb-5">
          Camera Breakdown
        </h2>

        {/* Stacked bar */}
        <div className="flex rounded overflow-hidden mb-6" style={{ height: 40 }}>
          {data.map((cam, i) => (
            <div
              key={cam.name}
              style={{
                width: `${cam.pct}%`,
                background: getCameraColorByIndex(cam.name, i),
                minWidth: cam.pct > 0 ? 2 : 0,
              }}
              title={`${cam.name}: ${cam.pct.toFixed(1)}%`}
            />
          ))}
        </div>

        {/* Legend rows. The pct and count columns are sized uniformly to the
            longest value in the data (ch units are exact in a monospace font):
            per-row auto widths made "521 Shots" widen one row's columns and
            wrap its name while shorter-count rows stayed on one line. */}
        <div className="flex flex-col gap-3">
          {data.map((cam, i) => (
            // items-start so the chip, letter, pct, and count all sit on the first
            // line when a long model wraps; the chip gets a 3px nudge to optically
            // center against the 20px first text line.
            <div key={cam.name} className="flex items-start gap-1.5 sm:gap-3">
              <div
                className="flex-shrink-0 rounded-sm mt-[3px]"
                style={{ width: 14, height: 14, background: getCameraColorByIndex(cam.name, i) }}
              />
              {/* Wraps rather than truncates: on phone widths the pct + count columns
                  leave too little room, and a clipped camera name is worse than a
                  second line in a scrollable dashboard. The letter + separator is a
                  fixed column so a wrapped model line aligns under the model text,
                  not under the camera letter (hanging indent). Legend text runs 13px
                  on phones (14px at sm+) so realistic names fit on one line. */}
              <div className="flex-1 min-w-0 flex font-['DM_Mono'] text-[13px] sm:text-sm">
                {cam.model ? (
                  <>
                    <span className="text-(--c-ink) flex-shrink-0 whitespace-pre">{cam.name}<span className="text-(--c-ink3)"> · </span></span>
                    <span className="text-(--c-ink2) break-words min-w-0">{cam.model}</span>
                  </>
                ) : (
                  <span className="text-(--c-ink) break-words min-w-0">{cam.name}</span>
                )}
              </div>
              <span className="font-['DM_Mono'] text-[13px] sm:text-sm text-(--c-ink2) text-right flex-shrink-0 whitespace-nowrap" style={{ width: `${pctCh}ch` }}>
                {cam.pct.toFixed(1)}%
              </span>
              <span className="font-['DM_Mono'] text-[13px] sm:text-sm text-(--c-ink3) text-right flex-shrink-0 whitespace-nowrap" style={{ width: `${countCh}ch` }}>
                {cam.count} {cam.count === 1 ? 'Shot' : 'Shots'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
