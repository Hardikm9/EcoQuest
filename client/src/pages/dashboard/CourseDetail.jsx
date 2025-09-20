import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api'

export default function CourseDetail() {
  const { id } = useParams()
  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get(`/courses/${id}`).then(r => setCourse(r.data.data)).catch(() => setError('Failed to load')).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div>Loading...</div>
  if (error) return <div className="error">{error}</div>
  if (!course) return null

  return (
    <div>
      <h2>{course.title}</h2>
      <p>{course.description}</p>
      <button onClick={()=>api.post(`/courses/${course._id}/enroll`).then(()=>alert('Enrolled'))}>Enroll</button>
      <h4>Materials</h4>
      <ul>
        {(course.materials || []).map((m, i) => (
          <li key={i}>
            <a href={m.url} target="_blank">[{m.type}] {m.title}</a>
            <button style={{marginLeft:8}} onClick={()=>api.post(`/progress/course/${course._id}/material`).then(()=>alert('Marked complete'))}>Mark Completed</button>
          </li>
        ))}
      </ul>
      <h4>Quizzes</h4>
      <ul>
        {(course.quizzes || []).map(q => (
          <li key={q._id}>
            {q.title}
            <Link style={{marginLeft:8}} to={`/app/quiz/${q._id}`} onClick={()=>sessionStorage.setItem('current_quiz', JSON.stringify(q))}>Start</Link>
          </li>
        ))}
      </ul>
      <h4>Assignments</h4>
      <ul>
        {(course.assignments || []).map(a => (
          <li key={a._id}>{a.title} <Link to={`/app/assignments/${a._id}/submit`} style={{marginLeft:8}}>Submit</Link></li>
        ))}
      </ul>
    </div>
  )
}


