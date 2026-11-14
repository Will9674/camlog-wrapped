import { useState, useEffect, useRef } from 'react'
import UploadScreen from './components/UploadScreen'
import Dashboard from './components/Dashboard'
import { parseCSVString, processData } from './utils/parseCSV'
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

export default function App() {
  const [rows, setRows] = useState(null)
  const [projectTitle, setProjectTitle] = useState('')
  // Start in the loading state when a saved show is about to be restored, so the
  // upload screen doesn't flash first.
  const [loading, setLoading] = useState(() => !!readSaved())
  // True only while that saved show is being restored on open. Until it lands we
  // draw a blank page rather than the (dimmed) upload screen, which otherwise
  // flashes before the dashboard appears.
  const [restoring, setRestoring] = useState(() => !!readSaved())
  const [error, setError] = useState(null)
  // Bumped on every successful load so Dashboard remounts fresh for new data,
  // giving it a correct initial date range without syncing state in an effect.
  const [loadId, setLoadId] = useState(0)
  // Only the newest load may land: a saved show restoring on open must not
  // overwrite a CSV CamLog pushed in a moment later.
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
      if (ticket === latestLoad.current) { setLoading(false); setRestoring(false) }
    }
  }

  // Deep-link handshake with the main CamLog app: when Wrapped is opened from
  // app.camlog.app, accept a CSV pushed via postMessage (so the user skips the
  // manual export/upload) and announce readiness. The listener is attached before
  // the ready ping so a fast reply from the opener can't race ahead of it.
  useEffect(() => {
    function onMessage(evt) {
      if (evt.origin !== 'https://app.camlog.app') return
      if (evt.data?.type !== 'camlog-import') return
      ingestCsvString(evt.data.csv, toProjectTitle(evt.data.name), { save: true })
    }
    window.addEventListener('message', onMessage)
    const saved = readSaved()
    if (saved) ingestCsvString(saved.csv, saved.title)
    if (window.opener) {
      try { window.opener.postMessage({ type: 'wrapped-ready' }, 'https://app.camlog.app') } catch { /* opener gone or cross-origin — ignore */ }
    }
    return () => window.removeEventListener('message', onMessage)
  }, [])

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

  if (restoring) return <div className="min-h-screen bg-(--c-bg)" />

  return <UploadScreen onFile={handleFile} onDemo={loadDemo} loading={loading} error={error} />
}
