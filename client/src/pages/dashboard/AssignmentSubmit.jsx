import { useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../../api'

export default function AssignmentSubmit() {
  const { assignmentId } = useParams()
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState(false)

  async function handleFileSelect(e) {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return
    setFile(selectedFile)
    setStatus('File selected. Click Submit to upload and submit.')
  }

  async function submit(e) {
    e.preventDefault()
    if (!file) {
      setStatus('Please select a file to upload')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'assignment-submissions')
      const res = await api.post('/teachers/upload', fd)
      await api.post(`/assignments/${assignmentId}/submit`, { contentUrl: res.data.data.url })
      setStatus('Submitted!')
    } catch {
      setStatus('Failed to submit')
    } finally { setUploading(false) }
  }
  return (
    <div>
      <h3>Submit Assignment</h3>
      <form onSubmit={submit} className="auth-form" style={{maxWidth:520}}>
        <label>Upload PDF (Required)</label>
        <input type="file" accept="application/pdf" onChange={handleFileSelect} />
        {file && <div style={{color:'green', fontSize:'14px', marginTop:8}}>✓ {file.name} selected</div>}
        <button type="submit" disabled={!file || uploading}>
          {uploading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
      {status && <div style={{marginTop:8}}>{status}</div>}
    </div>
  )
}


