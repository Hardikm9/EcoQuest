import { useEffect, useState } from 'react'
import api from '../../api'

export default function Progress() {
  const [rows, setRows] = useState([])
  useEffect(() => { api.get('/progress/me').then(r => setRows(r.data.data || [])) }, [])
  return (
    <div>
      <h3>My Progress</h3>
      <ul>
        {rows.map(r => (
          <li key={r._id}>
            <strong>{r?.course?.title}</strong> — {r.progressPercent || 0}%
            <div style={{height:8, background:'#e0e0e0', borderRadius:6, maxWidth:400}}>
              <div style={{width:`${r.progressPercent||0}%`, height:8, background:'#1a7f37', borderRadius:6}} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}


