import { useEffect, useState } from 'react'
import api from '../../api'

export default function Competitions() {
  const [rows, setRows] = useState([])
  useEffect(()=>{ api.get('/competitions').then(r=>setRows(r.data.data||[])) }, [])

  async function join(id) {
    await api.post(`/competitions/${id}/join`)
    alert('Joined!')
  }

  return (
    <div>
      <h3>Competitions</h3>
      <ul>
        {rows.map(c => (
          <li key={c._id}>
            <strong>{c.title}</strong> — {new Date(c.startDate).toLocaleDateString()} → {new Date(c.endDate).toLocaleDateString()}
            <button onClick={()=>join(c._id)} style={{marginLeft:8}}>Join</button>
          </li>
        ))}
      </ul>
    </div>
  )
}


