import { useState, useEffect } from 'react'
import UploadScreen from './components/UploadScreen'
import Dashboard from './components/Dashboard'
import { parseCSV, parseCSVString, processData } from './utils/parseCSV'

export default function App() {
  const [rows, setRows] = useState(null)
  const [projectTitle, setProjectTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  // Bumped on every successful load so Dashboard remounts fresh for new data,
  // giving it a correct initial date range without syncing state in an effect.
  const [loadId, setLoadId] = useState(0)

  useEffect(() => {
    if (window.opener) {
      try { window.opener.postMessage({ type: 'wrapped-ready' }, 'https://app.camlog.app') } catch (_) {}
    }
    function onMessage(evt) {
      if (evt.origin !== 'https://app.camlog.app') return
      if (evt.data?.type !== 'camlog-import') return
      ingestCsvString(evt.data.csv, evt.data.name)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  function titleFromFilename(name) {
    return name
      .replace(/\.csv$/i, '')
      .replace(/[-_]+/g, ' ')
      .toUpperCase()
  }

  async function handleFile(file) {
    setLoading(true)
    setError(null)
    window.location.hash = ''
    try {
      const raw = await parseCSV(file)
      const processed = processData(raw)
      if (!processed.some((r) => r._scene)) {
        setError("This doesn't look like a camera log CSV file.")
        return
      }
      setRows(processed)
      setProjectTitle(titleFromFilename(file.name))
      setLoadId((n) => n + 1)
    } catch (e) {
      setError('Failed to parse CSV. Please check the file format.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function ingestCsvString(csvStr, name) {
    setLoading(true)
    setError(null)
    window.location.hash = ''
    try {
      const raw = await parseCSVString(csvStr)
      const processed = processData(raw)
      if (!processed.some((r) => r._scene)) {
        setError("This doesn't look like a camera log CSV file.")
        return
      }
      setRows(processed)
      setProjectTitle(name ? name.replace(/[-_]+/g, ' ').toUpperCase() : '')
      setLoadId((n) => n + 1)
    } catch (e) {
      setError('Failed to parse CSV. Please check the file format.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleReset() {
    setRows(null)
    setProjectTitle('')
    window.location.hash = ''
  }

  if (rows) {
    return <Dashboard key={loadId} rows={rows} projectTitle={projectTitle} onReset={handleReset} />
  }

  return (
    <div>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-(--c-surface) border border-(--c-border) text-(--c-ink) text-sm font-['DM_Mono'] px-4 py-2 rounded shadow-sm z-50">
          {error}
        </div>
      )}
      <UploadScreen onFile={handleFile} loading={loading} />
    </div>
  )
}
