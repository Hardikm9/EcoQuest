import { useEffect, useState, useRef } from 'react'
import { Link, Routes, Route, useNavigate } from 'react-router-dom'
import CourseDetail from './CourseDetail.jsx'
import TeacherDashboard from './TeacherDashboard.jsx'
import AdminDashboard from './AdminDashboard.jsx'
import Community from './Community.jsx'
import Progress from './Progress.jsx'
import Badges from './Badges.jsx'
import Competitions from './Competitions.jsx'
import QuizPlay from './QuizPlay.jsx'
import AssignmentSubmit from './AssignmentSubmit.jsx'
import axios from 'axios'
import api from '../../api'
import '../css/student.css'

function Nav({ role }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">EcoLearn</div>
      <div className="sidebar-section">General</div>
      <Link className="sidebar-link" to="/app">Overview</Link>
      {role === 'student' && <>
        <div className="sidebar-section">Student</div>
        <Link className="sidebar-link" to="/app/courses">Courses</Link>
        <Link className="sidebar-link" to="/app/progress">Progress</Link>
        <Link className="sidebar-link" to="/app/badges">Badges</Link>
        <Link className="sidebar-link" to="/app/leaderboard">Leaderboard</Link>
        <Link className="sidebar-link" to="/app/competitions">Competitions</Link>
        <Link className="sidebar-link" to="/app/community">Community</Link>
      </>}
      {role === 'teacher' && <>
        <div className="sidebar-section">Teacher</div>
        <Link className="sidebar-link" to="/app/teacher">Dashboard</Link>
      </>}
      {role === 'admin' && <>
        <div className="sidebar-section">Admin</div>
        <Link className="sidebar-link" to="/app/admin">Overview</Link>
      </>}
      <div className="sidebar-section">Account</div>
      <Link className="sidebar-link" to="/app/notifications">Notifications</Link>
    </aside>
  )
}

function Home() {
  const user = JSON.parse(localStorage.getItem('ecolearn_user') || '{}')
  return <div>Welcome, {user.name || 'User'}!</div>
}

function Courses() {
  const [courses, setCourses] = useState([])
  useEffect(() => {
    api.get('/courses').then(r => setCourses(r.data.data || [])).
      catch(() => setCourses([]))
  }, [])
  return (
    <div>
      <h3>Courses</h3>
      <ul>
        {courses.map(c => <li key={c._id}><Link to={`/app/courses/${c._id}`}>{c.title} — {c?.teacher?.name}</Link></li>)}
      </ul>
    </div>
  )
}

function Leaderboard() {
  const [rows, setRows] = useState([])
  const [winners, setWinners] = useState(null)
  useEffect(() => { 
    axios.get('/api/admin/leaderboard').then(r => setRows(r.data.data || []))
    axios.get('/api/admin/leaderboard/latest').then(r => setWinners(r.data.data || null)).catch(()=>{})
  }, [])
  return (
    <div>
      <h3>Leaderboard</h3>
      <ol>
        {rows.map(row => <li key={row._id}>{row?.student?.name} — {row?.student?.ecoPoints} pts</li>)}
      </ol>
      {winners && (
        <div className="card" style={{marginTop:12, border:'1px solid #e5e7eb', borderRadius:12, padding:12}}>
          <div className="card-title">Top {winners.winnersCount} Winners ({winners.period})</div>
          <ul>
            {(winners.winners||[]).map(u => <li key={u._id}>{u.name} — {u.ecoPoints} pts</li>)}
          </ul>
        </div>
      )}
    </div>
  )
}

function Notifications() {
  const [items, setItems] = useState([])
  useEffect(() => { axios.get('/api/notifications').then(r => setItems(r.data.data || [])) }, [])
  return (
    <div>
      <h3>Notifications</h3>
      <ul>
        {items.map(n => <li key={n._id}>{n.title}: {n.body}</li>)}
      </ul>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [teacherStatus, setTeacherStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [approvedTeachers, setApprovedTeachers] = useState([])
  const [selectedTeacherIds, setSelectedTeacherIds] = useState([])
  const [selectedTeachers, setSelectedTeachers] = useState([])
  const [teacherCourses, setTeacherCourses] = useState([])
  const [progressList, setProgressList] = useState([])
  const [showTeacherSelect, setShowTeacherSelect] = useState(false)
  const [showTeacherCourses, setShowTeacherCourses] = useState(false)
  const [showProgress, setShowProgress] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('ecolearn_user')
    if (!raw) return navigate('/login')
    const userData = JSON.parse(raw)
    setUser(userData)
    if (userData.role === 'teacher') {
      api.get('/teachers/me').then(r => setTeacherStatus(r.data.data)).catch(()=>setTeacherStatus({ isApproved: false })).finally(()=>setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user || user.role !== 'student') return
    api.get('/teachers/approved').then(r => setApprovedTeachers(r.data.data||[])).catch(()=>setApprovedTeachers([]))
    api.get('/progress/me').then(r => setProgressList(r.data.data||[])).catch(()=>setProgressList([]))
    api.get('/auth/me/selected-teachers').then(r => {
        setSelectedTeacherIds(r.data.data.map(t => t.id))
        setSelectedTeachers(r.data.data)
    })
  }, [user?.id])

  if (!user || loading) return <div>Loading...</div>
  if (user.role === 'teacher' && teacherStatus && !teacherStatus.isApproved) {
    return <TeacherOnboarding />
  }

  async function saveSelectedTeachers() {
    await api.post('/auth/me/selected-teachers', { teacherIds: selectedTeacherIds })
    setSelectedTeachers(approvedTeachers.filter(t => selectedTeacherIds.includes(t.id)))
    setShowTeacherSelect(false);
  }

  async function openTeacherResources(teacherId) {
    const res = await api.get('/courses', { params: { teacher: teacherId } })
    setTeacherCourses(res.data.data || [])
  }

  return (
    <div className="layout grid">
      <Nav role={user.role} />
      <main className="content">
        <header className="page-header">
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Welcome, {user.name}</div>
        </header>
        {user.role === 'student' && (
          <div className="cards">
            <div className="card">
              <div className="card-title">Teacher Selection</div>
              <div className="card-body">Choose multiple approved teachers and save</div>
              <button className="btn" onClick={()=>setShowTeacherSelect(true)}>Open</button>
            </div>
            <div className="card">
              <div className="card-title">Selected Teachers & Courses</div>
              <div className="card-body">Open teachers you follow and view their courses/resources</div>
              <button className="btn" onClick={()=>setShowTeacherCourses(true)}>Open</button>
            </div>
            <div className="card">
              <div className="card-title">Notifications</div>
              <div className="card-body">View and reply to messages from teachers/admins</div>
              <Link className="btn" to="notifications">Open</Link>
            </div>
            <div className="card">
              <div className="card-title">Progress & Leaderboard</div>
              <div className="card-body">Track reading, quizzes, and ecoPoints</div>
              <button className="btn" onClick={()=>setShowProgress(true)}>Open</button>
            </div>
            <div className="card">
              <div className="card-title">Leaderboard</div>
              <div className="card-body">See the global ranking</div>
              <Link className="btn" to="leaderboard">Open</Link>
            </div>
            <div className="card">
              <div className="card-title">Community</div>
              <div className="card-body">Join the open community chat</div>
              <button className="btn" onClick={()=>window.open('/community', '_blank', 'noopener,noreferrer')}>Open</button>
            </div>
            <div className="card">
              <div className="card-title">Sort Game</div>
              <div className="card-body">Sort the thing og environment.</div>
              <button className="btn" onClick={()=>window.open('https://hardikm9.github.io/EcoSort/', '_blank', 'noopener,noreferrer')}>Open</button>
            </div>
            <div className="card">
              <div className="card-title">EcoQuest Game</div>
              <div className="card-body">An interactive Puzzle Game with Quiz.</div>
              <button className="btn" onClick={()=>window.open('http://localhost:3000/', '_blank', 'noopener,noreferrer')}>Open</button>
            </div>
          </div>
        )}

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="quiz/:quizId" element={<QuizPlay />} />
          <Route path="assignments/:assignmentId/submit" element={<AssignmentSubmit />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="app/teacher" element={<TeacherDashboard />} />
          <Route path="app/admin" element={<AdminDashboard />} />
          <Route path="community" element={<Community />} />
          <Route path="progress" element={<Progress />} />
          <Route path="badges" element={<Badges />} />
          <Route path="competitions" element={<Competitions />} />
        </Routes>

        {showTeacherSelect && (
          <div className="modal-overlay" onClick={()=>setShowTeacherSelect(false)}>
            <div className="modal" onClick={(e)=>e.stopPropagation()}>
              <header><h3>Select Teachers</h3><button className="btn secondary" onClick={()=>setShowTeacherSelect(false)}>Close</button></header>
              <div className="modal-body">
                {approvedTeachers.length === 0 && <div>No approved teachers yet.</div>}
                <div className="teacher-cards">
                  {approvedTeachers.map(t => (
                    <div key={t.id} className="teacher-card">
                      <div className="teacher-card-header">
                        <h5>{t.name}</h5>
                        <span className="status-badge approved">Approved</span>
                      </div>
                      <div className="teacher-card-body">
                        <div className="teacher-details">
                          <div><strong>Email:</strong> {t.email}</div>
                          <div><strong>Qualification:</strong> {t.qualification || '—'}</div>
                          <div><strong>Contact:</strong> {t.contact || '—'}</div>
                        </div>
                        <div className="teacher-actions">
                          <label style={{display:'flex', alignItems:'center', gap:8}}>
                            <input type="checkbox" checked={selectedTeacherIds.includes(t.id)} onChange={(e)=>{
                              setSelectedTeacherIds(prev => e.target.checked ? [...new Set([...prev, t.id])] : prev.filter(x => x !== t.id))
                            }} /> Select Teacher
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn" onClick={saveSelectedTeachers}>Save</button>
              </div>
            </div>
          </div>
        )}

        {showTeacherCourses && (
          <div className="modal-overlay" onClick={()=>setShowTeacherCourses(false)}>
            <div className="modal" onClick={(e)=>e.stopPropagation()} style={{maxWidth:960}}>
              <header><h3>Selected Teachers & Courses</h3><button className="btn secondary" onClick={()=>setShowTeacherCourses(false)}>Close</button></header>
              <div className="modal-body">
                <div className="teacher-cards">
                  {selectedTeachers.map(t => (
                    <div key={t.id} className="teacher-card">
                      <div className="teacher-card-header">
                        <h5>{t.name}</h5>
                        <button className="btn btn-outline" onClick={()=>openTeacherResources(t.id)}>Open Courses</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{marginTop:12}}>
                  <h4>Courses</h4>
                  <ul>
                    {teacherCourses.map(c => (
                      <li key={c._id}>
                        <div><strong>{c.title}</strong> — {c?.teacher?.name}</div>
                        <div style={{fontSize:13, color:'#6b7280'}}>{c.description}</div>
                        <div style={{display:'flex', gap:8, marginTop:6}}>
                          <Link className="btn" to={`/app/courses/${c._id}`}>Open Detail</Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {showProgress && (
          <div className="modal-overlay" onClick={()=>setShowProgress(false)}>
            <div className="modal" onClick={(e)=>e.stopPropagation()}>
              <header><h3>Your Progress</h3><button className="btn secondary" onClick={()=>setShowProgress(false)}>Close</button></header>
              <div className="modal-body">
                <table className="table">
                  <thead><tr><th>Course</th><th>Materials</th><th>Quizzes</th><th>Assignments</th><th>Games</th><th>%</th></tr></thead>
                  <tbody>
                    {progressList.map(p => (
                      <tr key={p._id}>
                        <td>{p.course?.title}</td>
                        <td>{p.materialsCompleted}</td>
                        <td>{p.quizzesCompleted}</td>
                        <td>{p.assignmentsSubmitted}</td>
                        <td>{p.gamesCompleted}</td>
                        <td>{p.progressPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}

function TeacherOnboarding() {
  const [teacher, setTeacher] = useState(null)
  const [form, setForm] = useState({ qualification: '', contact: '', details: '' })
  const [resumeFile, setResumeFile] = useState(null)
  const [message, setMessage] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    api.get('/teachers/me').then(r => {
      setTeacher(r.data.data || null)
      const d = r.data.data || {}
      setForm({ qualification: d.qualification || '', contact: d.contact || '', details: d.details || '' })
    })
  }, [])

  function handleChange(e) { setForm({ ...form, [e.target.name]: e.target.value }) }

  async function saveProfile(e) {
    e.preventDefault()
    setMessage('')
    try {
      await api.post('/teachers/profile', form)
      if (resumeFile) {
        const fd = new FormData()
        fd.append('resume', resumeFile)
        await api.post('/teachers/resume', fd)
      }
      const r = await api.get('/teachers/me')
      setTeacher(r.data.data || null)
      setMessage('Profile submitted. Admin will review your resume.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      setResumeFile(null)
    } catch {
      setMessage('Failed to submit profile')
    }
  }

  return (
    <div className="layout grid">
      <aside className="sidebar">
        <div className="sidebar-brand">EcoLearn</div>
        <div className="sidebar-section">Teacher Onboarding</div>
        <div className="sidebar-link" style={{color: '#6b7280'}}>Complete your profile to access teacher features</div>
      </aside>
      <main className="content">
        <header className="page-header">
          <div className="page-title">Teacher Onboarding</div>
          <div className="page-subtitle">Complete your profile for admin review</div>
        </header>
        <div style={{maxWidth: 600, margin: '0 auto'}}>
          <p>Please provide your details and upload your PDF resume for admin review.</p>
          <form onSubmit={saveProfile} className="auth-form">
            <label>Qualification</label>
            <input name="qualification" value={form.qualification} onChange={handleChange} required />
            <label>Contact</label>
            <input name="contact" value={form.contact} onChange={handleChange} required />
            <label>Details</label>
            <input name="details" value={form.details} onChange={handleChange} required />
            <label>Upload Resume (PDF)</label>
            <input type="file" accept="application/pdf" ref={fileInputRef} onChange={(e)=>setResumeFile(e.target.files?.[0]||null)} />
            <button type="submit">Submit for Review</button>
          </form>
          {message && <div style={{marginTop:8, padding:8, background:'#f0f9ff', border:'1px solid #0ea5e9', borderRadius:6}}>{message}</div>}
        </div>
      </main>
    </div>
  )
}
