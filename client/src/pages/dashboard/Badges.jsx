import { useEffect, useState } from 'react'
import api from '../../api'

export default function Badges() {
  const [items, setItems] = useState([])
  const [ecoPoints, setEcoPoints] = useState(0)
  useEffect(() => {
    // Minimal: rely on admin leaderboard or expand with a /me endpoint later
    api.get('/admin/leaderboard').then(r => {
      const me = JSON.parse(localStorage.getItem('ecolearn_user')||'{}')
      const my = (r.data.data||[]).find(x => String(x?.student?._id) === String(me.id))
      setEcoPoints(my?.student?.ecoPoints || 0)
    })
  }, [])
  return (
    <div>
      <h3>Badges & ecoPoints</h3>
      <div>ecoPoints: <strong>{ecoPoints}</strong></div>
      <p>Earn points by completing quizzes, assignments, and games to unlock badges.</p>
    </div>
  )
}


