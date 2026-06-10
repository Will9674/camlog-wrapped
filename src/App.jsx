import { useState, useEffect } from 'react'
import UploadScreen from './components/UploadScreen'
import Dashboard from './components/Dashboard'
import { parseCSV, processData } from './utils/parseCSV'

export default function App() {
  const [rows, setRows] = useState(null)
  const [projectTitle, setProjectTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
    return <Dashboard rows={rows} projectTitle={projectTitle} onReset={handleReset} />
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
