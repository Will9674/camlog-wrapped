import { useState, useEffect, useRef } from 'react'
import UploadScreen from './components/UploadScreen'
import Dashboard from './components/Dashboard'
import { parseCSVString, parseCSVStringSync, processData } from './utils/parseCSV'
import { sampleCsv, SAMPLE_TITLE } from './utils/sampleData'
import { toProjectTitle, titleFromFilename } from './utils/format'

// The last show loaded, kept on this device so a reload brings it straight back.
// iOS unloads a background Safari page to free memory — typically while the user
// is in Messages sharing a card Wrapped just rendered — and on return the page
// reloads. With the show held only in memory, that dropped them on the upload
// screen. Stored as the raw CSV plus the title, so a restore re-parses exactly
// what was loaded. Every access is guarded: no storage (private mode, quota
// for a very large show) just means no restore, as before.
const SAVED_KEY = 'wrapped:last-show'

function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_KEY) || 'null')
    return saved && typeof saved.csv === 'string' ? saved : null
  } catch { return null }
}

function writeSaved(saved) {
  try {
    if (saved) localStorage.setItem(SAVED_KEY, JSON.stringify(saved))
    else localStorage.removeItem(SAVED_KEY)
  } catch {
    // Too big to keep: drop any older show rather than restore the wrong one.
    try { localStorage.removeItem(SAVED_KEY) } catch { /* storage unavailable */ }
  }
}

// Parse the saved show synchronously, before the first render, so reopening
// Wrapped draws the dashboard straight away: no upload screen and no blank frame
// in between. Parsing in memory takes milliseconds even for a long feature.
function restoreSaved() {
  const saved = readSaved()
  if (!saved) return null
  try {
    const rows = processData(parseCSVStringSync(saved.csv))
    return rows.some((r) => r._scene) ? { rows, title: saved.title || '' } : null
  } catch {
    return null
  }
}

// Set in this tab once CamLog has handed over a show. sessionStorage survives the
// reload iOS forces after a share, so that reload restores at once instead of
// waiting for a hand-off CamLog has already finished sending.
const IMPORTED_KEY = 'wrapped:camlog-imported'
// How long to wait for CamLog's CSV before falling back to the saved show. In
// Shadow Mode, and on a big show, CamLog builds the CSV from the server, which
// can take well over 6s (it was 6s, and Copperhead in Shadow Mode missed it).
const CAMLOG_WAIT_MS = 20000
// Keep asking for the CSV this long even after falling back, so a late one
// still replaces the saved show instead of being lost.
const CAMLOG_PING_MS = 60000

// Opened by CamLog's Export button (a popup, so window.opener is set) and no show
// received yet: the saved show may be a different project, so don't draw it.
function openedForCamLogImport() {
  try { return !!window.opener && !sessionStorage.getItem(IMPORTED_KEY) } catch { return false }
}

function OpeningFromCamLog() {
  // The note fades in only if the hand-off is slow; usually the show lands first.
  return (
    <div className="min-h-screen bg-(--c-bg) flex items-center justify-center">
      <span className="font-['DM_Mono'] text-xs text-(--c-ink3) opacity-0 animate-[fadeIn_300ms_ease-out_700ms_forwards]">
        Opening from CamLog…
      </span>
    </div>
  )
}

export default function App() {
  const [boot] = useState(() => {
    const awaiting = openedForCamLogImport()
    return { awaiting, restored: awaiting ? null : restoreSaved() }
  })
  const restored = boot.restored
  // While true, CamLog's CSV is on its way: show a quiet blank page, never the
  // previously saved show (which flashed before the new one replaced it).
  const [awaitingCamLog, setAwaitingCamLog] = useState(boot.awaiting)
  const [rows, setRows] = useState(() => restored?.rows ?? null)
  const [projectTitle, setProjectTitle] = useState(() => restored?.title ?? '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Bumped on every successful load so Dashboard remounts fresh for new data,
  // giving it a correct initial date range without syncing state in an effect.
  const [loadId, setLoadId] = useState(0)
  // Only the newest load may land: if an upload and a CSV pushed from CamLog
  // overlap, the later one wins.
  const latestLoad = useRef(0)

  async function handleFile(file) {
    if (!file) return
    // Only CSV exports from CamLog / ZoeLog are supported — reject anything else
    // up front with a friendly, specific message instead of a silent no-op.
    if (!/\.csv$/i.test(file.name)) {
      setError('CamLog Wrapped reads .csv logs exported from CamLog or ZoeLog. That file isn’t a CSV.')
      return
    }
    let csv
    try {
      csv = await file.text()
    } catch (e) {
      setError('That file couldn’t be read as a CSV. Export a fresh log from CamLog or ZoeLog and try again.')
      console.error(e)
      return
    }
    ingestCsvString(csv, titleFromFilename(file.name), { save: true })
  }

  function loadDemo() {
    // The demo isn't saved: a reload shouldn't reopen sample data over a real show.
    ingestCsvString(sampleCsv(), toProjectTitle(SAMPLE_TITLE))
  }

  // `title` is final (already derived from a filename or project name).
  async function ingestCsvString(csvStr, title, { save = false } = {}) {
    const ticket = ++latestLoad.current
    setLoading(true)
    setError(null)
    window.location.hash = ''
    try {
      const raw = await parseCSVString(csvStr)
      if (ticket !== latestLoad.current) return
      const processed = processData(raw)
      if (!processed.some((r) => r._scene)) {
        setError('That CSV isn’t from CamLog or ZoeLog. Export your project from either app and try again.')
        return
      }
      setRows(processed)
      setProjectTitle(title)
      setLoadId((n) => n + 1)
      if (save) writeSaved({ csv: csvStr, title })
    } catch (e) {
      setError('That file couldn’t be read as a CSV. Export a fresh log from CamLog or ZoeLog and try again.')
      console.error(e)
    } finally {
      if (ticket === latestLoad.current) { setLoading(false); setAwaitingCamLog(false) }
    }
  }

  // Deep-link handshake with the main CamLog app: when Wrapped is opened from
  // app.camlog.app, accept a CSV pushed via postMessage (so the user skips the
  // manual export/upload) and announce readiness. The listener is attached before
  // the ready ping so a fast reply from the opener can't race ahead of it.
  //
  // The ping repeats until the CSV arrives (or the wait runs out): CamLog only
  // starts listening once it has built the CSV, so on a big show a single ping
  // sent as this page loads can land before anyone is listening. CamLog answers
  // the first ping it hears and stops listening, so repeats can't double-import.
  useEffect(() => {
    let pinger = null
    const stopPinging = () => { clearInterval(pinger); pinger = null }
    function ping() {
      try { window.opener.postMessage({ type: 'wrapped-ready' }, 'https://app.camlog.app') } catch { /* opener gone or cross-origin — ignore */ }
    }
    function onMessage(evt) {
      if (evt.origin !== 'https://app.camlog.app') return
      if (evt.data?.type !== 'camlog-import') return
      stopPinging()
      try { sessionStorage.setItem(IMPORTED_KEY, '1') } catch { /* storage unavailable */ }
      ingestCsvString(evt.data.csv, toProjectTitle(evt.data.name), { save: true })
    }
    window.addEventListener('message', onMessage)
    let giveUp = null
    if (window.opener) {
      ping()
      if (boot.awaiting) {
        pinger = setInterval(ping, 250)
        giveUp = setTimeout(stopPinging, CAMLOG_PING_MS)
      }
    }
    return () => {
      window.removeEventListener('message', onMessage)
      stopPinging()
      clearTimeout(giveUp)
    }
  }, [boot.awaiting])

  // CamLog never sent the CSV (closed, or something else opened this tab):
  // fall back to the saved show, or the upload screen.
  useEffect(() => {
    if (!awaitingCamLog) return
    const timer = setTimeout(() => {
      const saved = restoreSaved()
      if (saved) {
        setRows(saved.rows)
        setProjectTitle(saved.title)
        setLoadId((n) => n + 1)
      }
      setAwaitingCamLog(false)
    }, CAMLOG_WAIT_MS)
    return () => clearTimeout(timer)
  }, [awaitingCamLog])

  function handleReset() {
    setRows(null)
    setProjectTitle('')
    writeSaved(null)
    window.location.hash = ''
  }

  // A renamed title is kept with the saved show, so a restore keeps the rename.
  function handleTitleChange(title) {
    setProjectTitle(title)
    const saved = readSaved()
    if (saved) writeSaved({ ...saved, title })
  }

  if (rows) {
    return <Dashboard key={loadId} rows={rows} projectTitle={projectTitle} onTitleChange={handleTitleChange} onReset={handleReset} />
  }

  if (awaitingCamLog) return <OpeningFromCamLog />

  return <UploadScreen onFile={handleFile} onDemo={loadDemo} loading={loading} error={error} />
}
