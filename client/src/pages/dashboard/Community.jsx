import { useEffect, useState } from 'react'
import api from '../../api'

export default function Community() {
  const [threads, setThreads] = useState([])
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [active, setActive] = useState(null)

  useEffect(() => { api.get('/community').then(r=>setThreads(r.data.data||[])) }, [])

  async function createThread(e) {
    e.preventDefault()
    const res = await api.post('/community', { title })
    setThreads(prev => [res.data.data, ...prev])
    setTitle('')
  }

  async function postMessage(e) {
    e.preventDefault()
    if (!active) return
    const res = await api.post(`/community/${active._id}/messages`, { content: message })
    setThreads(prev => prev.map(t => t._id === active._id ? { ...t, updatedAt: new Date().toISOString() } : t))
    // Fetch full thread to ensure order and author details
    const full = await api.get(`/community/${active._id}`)
    setActive(full.data.data)
    setMessage('')
  }

  return (
    <div style={{display:'grid', gridTemplateColumns: '1fr 2fr', gap: 16}}>
      <div>
        <h3>Threads</h3>
        <form onSubmit={createThread} className="auth-form">
          <input placeholder="Start a topic" value={title} onChange={(e)=>setTitle(e.target.value)} />
          <button type="submit">Create</button>
        </form>
        <ul>
          {threads.map(t => <li key={t._id}><button onClick={()=>setActive(t)}>{t.title}</button></li>)}
        </ul>
      </div>
      <div>
        {active ? (
          <div>
            <h3>{active.title}</h3>
            <ul>
              {(active.messages||[]).map((m,i) => (
                <li key={m._id||i}>
                  <div style={{fontWeight:600}}>{m.author?.name || m.author?.email || 'User'}</div>
                  <div>{m.content}</div>
                  <div style={{fontSize:12, color:'#6b7280'}}>{new Date(m.createdAt).toLocaleString()}</div>
                </li>
              ))}
            </ul>
            <form onSubmit={postMessage} className="auth-form">
              <input placeholder="Write a message" value={message} onChange={(e)=>setMessage(e.target.value)} />
              <button type="submit">Send</button>
            </form>
          </div>
        ) : <div>Select a thread</div>}
      </div>
    </div>
  )
}


