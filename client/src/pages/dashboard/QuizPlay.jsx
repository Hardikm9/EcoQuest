import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api'

export default function QuizPlay() {
  const { quizId } = useParams()
  const navigate = useNavigate()
  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState([])
  const [score, setScore] = useState(null)

  useEffect(() => {
    // Fetch quiz by getting parent course from current location isn't ideal; create a minimal fetch route later if needed.
    // For now, rely on course detail pre-load or pass state. As fallback, we keep a no-op here.
  }, [quizId])

  useEffect(() => {
    // Quick fetch via approximate endpoint if added later
  }, [])

  useEffect(() => {
    const stored = sessionStorage.getItem('current_quiz')
    if (stored) {
      const q = JSON.parse(stored)
      if (q && String(q._id) === String(quizId)) {
        setQuiz(q)
        setAnswers(new Array((q.questions||[]).length).fill(null))
      }
    }
  }, [quizId])

  if (!quiz) return <div>Open a quiz from Course page.</div>

  async function submit() {
    const res = await api.post(`/quizzes/${quizId}/submit`, { answers })
    setScore(res.data.data.score)
    setTimeout(()=>navigate('/app/leaderboard'), 1200)
  }

  return (
    <div>
      <h3>{quiz.title}</h3>
      {(quiz.questions||[]).map((q, idx) => (
        <div key={idx} style={{marginBottom:16}}>
          <div><strong>Q{idx+1}.</strong> {q.prompt}</div>
          <div style={{display:'grid', gap:6, marginTop:6}}>
            {q.options.map((opt, i) => (
              <label key={i} style={{display:'flex', gap:8, alignItems:'center'}}>
                <input type="radio" name={`q_${idx}`} checked={answers[idx]===i} onChange={()=>{
                  const next=[...answers]; next[idx]=i; setAnswers(next)
                }} />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button onClick={submit}>Submit Quiz</button>
      {score!==null && <div>Your score: {score}</div>}
    </div>
  )
}


