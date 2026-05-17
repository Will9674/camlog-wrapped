import { useState } from 'react'
import UploadScreen from './components/UploadScreen'
import Dashboard from './components/Dashboard'
import { parseCSV, processData } from './utils/parseCSV'

export default function App() {
  const [rows, setRows] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleFile(file) {
    setLoading(true)
    setError(null)
    try {
      const raw = await parseCSV(file)
      const processed = processData(raw)
      setRows(processed)
    } catch (e) {
      setError('Failed to parse CSV. Please check the file format.')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (rows) {
    return <Dashboard rows={rows} onReset={() => setRows(null)} />
  }

  return (
    <div>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white border border-[#e2dfd8] text-[#1a1916] text-sm font-['DM_Mono'] px-4 py-2 rounded shadow-sm z-50">
          {error}
        </div>
      )}
      <UploadScreen onFile={handleFile} loading={loading} />
    </div>
  )
}
