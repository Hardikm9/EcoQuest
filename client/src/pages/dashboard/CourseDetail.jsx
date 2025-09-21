import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api';

export default function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [watchedMaterials, setWatchedMaterials] = useState([]);

  useEffect(() => {
    setLoading(true);
    api.get(`/courses/${id}`).then(r => setCourse(r.data.data)).catch(() => setError('Failed to load')).finally(() => setLoading(false));
  }, [id]);

  const handleWatchMaterial = (materialId) => {
    if (watchedMaterials.includes(materialId)) return;
    api.post(`/progress/course/${course._id}/material`).then(() => {
        alert('Marked complete. +10 ecoPoints!');
        setWatchedMaterials([...watchedMaterials, materialId]);
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!course) return null;

  return (
    <div>
      <h2>{course.title}</h2>
      <p>{course.description}</p>
      {course.videoUrl && <video width="100%" controls src={course.videoUrl}></video>}
      <button onClick={()=>api.post(`/courses/${course._id}/enroll`).then(()=>alert('Enrolled'))}>Enroll</button>
      <h4>Materials</h4>
      <ul>
        {(course.materials || []).map((m, i) => (
          <li key={i}>
            {/* Update the href to point to the new files API endpoint */}
            <a href={`/api/files/${m.fileId}`} target="_blank" rel="noopener noreferrer">[{m.type}] {m.filename}</a>
            <label style={{ marginLeft: '10px' }}>
              <input
                type="checkbox"
                checked={watchedMaterials.includes(m._id)}
                onChange={() => handleWatchMaterial(m._id)}
              />{' '}
              Mark as Completed (+10 ecoPoints)
            </label>
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
  );
}