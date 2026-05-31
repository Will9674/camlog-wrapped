import { useState, useEffect } from 'react'
import UploadScreen from './components/UploadScreen'
import Dashboard from './components/Dashboard'
import { parseCSV, processData } from './utils/parseCSV'

export default function App() {
  const [rows, setRows] = useState(null)
  const [projectTitle, setProjectTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Load shared data from URL hash on mount
  useEffect(() => {
    const hash = window.location.hash
    if (!hash.startsWith('#s=')) return
    const compressed = hash.slice(3)
    import('lz-string').then(({ decompressFromEncodedURIComponent }) => {
      try {
        const data = JSON.parse(decompressFromEncodedURIComponent(compressed))
        if (data?.rows && Array.isArray(data.rows)) {
          setRows(data.rows)
          setProjectTitle(data.projectTitle || '')
        }
      } catch {
        // Malformed hash — fall through to upload screen
      }
    })
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
