import { useEffect, useState } from 'react'
import api from '../../api'
import '../css/admin.css'

export default function AdminDashboard() {
  // Add authentication check at the beginning
  useEffect(() => {
    // Check if user is authenticated as admin
    const userData = localStorage.getItem('ecolearn_user');
    
    if (!userData) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }
    
    try {
      const user = JSON.parse(userData);
      if (user.role !== 'admin') {
        // Redirect to login if not an admin
        window.location.href = '/login';
        return;
      }
    } catch (error) {
      // Redirect to login if error parsing user data
      window.location.href = '/login';
      return;
    }
  }, []);

  const [showList, setShowList] = useState(false)
  const [loading, setLoading] = useState(false)
  const [teachers, setTeachers] = useState([])
  const [broadcast, setBroadcast] = useState({ audience: 'teachers', title: '', body: '' })
  const [sentInfo, setSentInfo] = useState('')
  const [approvedTeachers, setApprovedTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [content, setContent] = useState([])
  const [view, setView] = useState('home')
  const [activeCard, setActiveCard] = useState(null)
  const [stats, setStats] = useState({ teachers: 0, students: 0, courses: 0, pending: 0 })

  // Load initial stats
  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    try {
      const [teachersRes, studentsRes, contentRes, pendingRes] = await Promise.all([
        api.get('/admin/teachers/approved'),
        api.get('/admin/students/detailed'),
        api.get('/admin/content'),
        api.get('/admin/teachers/detailed')
      ])
      
      setStats({
        teachers: teachersRes.data.data?.length || 0,
        students: studentsRes.data.data?.length || 0,
        courses: contentRes.data.data?.length || 0,
        pending: (pendingRes.data.data || []).filter(t => !t.teacher.isApproved).length
      })
    } catch (error) {
      console.error("Failed to load stats:", error)
    }
  }

  async function openList() {
    setShowList(true)
    setLoading(true)
    try {
      const r = await api.get('/admin/teachers/detailed')
      setTeachers(r.data.data || [])
    } finally {
      setLoading(false)
    }
  }

  async function setApproval(teacherId, isApproved) {
    await api.post('/admin/approve-teacher', { teacherId, isApproved })
    await openList()
    await loadStats() // Refresh stats after approval
  }
  
  const setCourseApproval = async (courseId, isApproved) => {
    await api.post('/admin/approve-course', { courseId, isApproved });
    await loadAllContent();
    await loadStats();
  };

  async function viewResume(teacherId) {
    try {
      const res = await api.get(`/teachers/resume/${teacherId}`, { responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (e) {
      alert('Failed to load resume')
    }
  }

  async function loadApprovedTeachers() {
    const r = await api.get('/admin/teachers/approved')
    setApprovedTeachers(r.data.data || [])
  }

  async function loadStudents() {
    const r = await api.get('/admin/students/detailed')
    setStudents(r.data.data || [])
  }

   const loadAllContent = async () => {
    setLoading(true);
    try {
        const r = await api.get('/admin/content');
        setContent(r.data.data || []);
    } catch (error) {
        console.error("Failed to load content:", error);
    } finally {
        setLoading(false);
    }
  };

  // Function to open card in new window
  const openCardInNewWindow = (cardId, loadFunction) => {
    setActiveCard(cardId)
    setView(cardId)
    if (loadFunction) loadFunction()
  }

  const openView = (viewName, loadFunction) => {
    setView(viewName);
    if (loadFunction) {
      loadFunction();
    }
  };
  
  // Enhanced Logout function
  const confirmLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      // Clear all authentication data
      localStorage.removeItem('ecolearn_user');
      sessionStorage.clear();
      
      // Redirect to login page with timestamp to prevent caching
      const timestamp = new Date().getTime();
      window.location.href = `/login?t=${timestamp}`;
      
      // Prevent back button from working
      window.history.pushState(null, null, window.location.href);
      window.addEventListener('popstate', function() {
        window.history.pushState(null, null, window.location.href);
      });
    }
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-welcome">
          <div className="welcome-header">
            <h1>Welcome to EcoLearn Admin Portal</h1>
            <button className="btn btn-outline logout-btn" onClick={confirmLogout}>
              Logout
            </button>
          </div>
          <p>Manage teachers, students, courses, and platform content from this centralized dashboard. 
            Monitor platform activity, send notifications, and ensure the best learning experience for our community.</p>
          
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-icon">👨‍🏫</div>
              <div className="stat-content">
                <div className="stat-number">{stats.teachers}</div>
                <div className="stat-label">Approved Teachers</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👨‍🎓</div>
              <div className="stat-content">
                <div className="stat-number">{stats.students}</div>
                <div className="stat-label">Active Students</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <div className="stat-number">{stats.courses}</div>
                <div className="stat-label">Published Courses</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <div className="stat-number">{stats.pending}</div>
                <div className="stat-label">Pending Approvals</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <div className="card-header">
          <h3>Broadcast Notification</h3>
        </div>
        <div className="card-body">
          <div className="form-grid">
            <select value={broadcast.audience} onChange={(e)=>setBroadcast({...broadcast, audience:e.target.value})}>
              <option value="teachers">Teachers</option>
              <option value="students">Students</option>
              <option value="all">All Users</option>
            </select>
            <input placeholder="Notification Title" value={broadcast.title} onChange={(e)=>setBroadcast({...broadcast, title:e.target.value})} />
            <input placeholder="Message Content" value={broadcast.body} onChange={(e)=>setBroadcast({...broadcast, body:e.target.value})} />
            <button className="btn btn-primary" onClick={async()=>{
              try {
                const r = await api.post('/admin/broadcast', broadcast)
                setSentInfo(`Notification sent to ${r.data?.data?.sent || 0} users`)
                setTimeout(()=>setSentInfo(''), 3000)
              } catch (error) {
                console.error("Failed to send notification:", error)
                setSentInfo("Failed to send notification")
                setTimeout(()=>setSentInfo(''), 3000)
              }
            }} disabled={!broadcast.title || !broadcast.body}>Send Notification</button>
            <br /> 
          </div>
          {sentInfo && <div className="success-message">{sentInfo}</div>}
        </div>
      </div>
      <br />
      <br />

      <div className="admin-cards-grid">
        <AdminCard 
          id="resume" 
          icon="📄" 
          title="Teacher Resume Reviews" 
          description="Review and approve teacher applications. Check qualifications and experience."
          stats={stats.pending}
          statLabel="Pending Reviews"
          onOpen={() => openCardInNewWindow('resume', openList)}
        />
        
        <AdminCard 
          id="approved" 
          icon="✅" 
          title="Approved Teachers" 
          description="Manage verified teachers. View their profiles and course offerings."
          stats={stats.teachers}
          statLabel="Approved Teachers"
          onOpen={() => openCardInNewWindow('approved', loadApprovedTeachers)}
        />
        
        <AdminCard 
          id="students" 
          icon="👨‍🎓" 
          title="Student Management" 
          description="Monitor student activity, ecoPoints, enrollments, and progress tracking."
          stats={stats.students}
          statLabel="Active Students"
          onOpen={() => openCardInNewWindow('students', loadStudents)}
        />
        
        <AdminCard 
          id="content" 
          icon="📚" 
          title="Content Review" 
          description="Review courses, quizzes, assignments, and learning materials for quality."
          stats={stats.courses}
          statLabel="Published Courses"
          onOpen={() => openCardInNewWindow('content', loadAllContent)}
        />
        
        <AdminCard 
          id="notifications" 
          icon="🔔" 
          title="Notifications Center" 
          description="Send targeted messages, announcements, and platform updates."
          onOpen={() => openCardInNewWindow('notifications')}
        />
        
        <AdminCard 
          id="community" 
          icon="💬" 
          title="Community Management" 
          description="Monitor and participate in community discussions and forums."
          onOpen={() => window.open('/community', '_blank')}
        />
        
        <AdminCard 
          id="leaderboard" 
          icon="🏆" 
          title="Leaderboard Configuration" 
          description="Set up and manage ecoPoint leaderboards, select winners, and publish results."
          onOpen={() => openCardInNewWindow('leaderboard')}
        />
        
        
      </div>

      {view === 'resume' && (
        <ResumeReviewView 
          loading={loading}
          teachers={teachers}
          onClose={() => { setView('home'); setActiveCard(null) }}
          viewResume={viewResume}
          setApproval={setApproval}
        />
      )}

      {view === 'approved' && (
        <ApprovedTeachersView 
          teachers={approvedTeachers}
          onClose={() => { setView('home'); setActiveCard(null) }}
        />
      )}

      {view === 'students' && (
        <StudentsView 
          students={students}
          onClose={() => { setView('home'); setActiveCard(null) }}
        />
      )}

      {view === 'content' && (
        <ContentView 
          content={content}
          onClose={() => { setView('home'); setActiveCard(null) }}
          setCourseApproval={setCourseApproval}
        />
      )}

      {view === 'notifications' && (
        <NotificationsView 
          broadcast={broadcast}
          setBroadcast={setBroadcast}
          sentInfo={sentInfo}
          setSentInfo={setSentInfo}
          onClose={() => { setView('home'); setActiveCard(null) }}
        />
      )}

      {view === 'leaderboard' && (
        <LeaderboardConfigView 
          onClose={() => { setView('home'); setActiveCard(null) }}
        />
      )}
    </div>
  )
}

function AdminCard({ id, icon, title, description, stats, statLabel, onOpen }) {
  return (
    <div className="admin-card card-hover">
      <div className="card-header">
        <div className="card-icon">{icon}</div>
        <h3>{title}</h3>
      </div>
      <div className="card-body">
        <p>{description}</p>
        {stats !== undefined && (
          <div className="card-stats">
            <span className="stat-figure">{stats}</span>
            <span className="stat-label">{statLabel}</span>
          </div>
        )}
      </div>
      <div className="card-footer">
        <button className="btn btn-primary" onClick={onOpen}>Manage</button>
      </div>
    </div>
  )
}

function ResumeReviewView({ loading, teachers, onClose, viewResume, setApproval }) {
  return (
    <div className="flyout-panel show">
      <div className="panel-header">
        <h3>Teacher Resume Reviews</h3>
        <button className="btn btn-outline" onClick={onClose}>Close</button>
      </div>
      {loading ? <div className="loading">Loading teacher applications...</div> : (
        <div className="teacher-cards">
          {teachers.length === 0 && <div className="empty-state">No teacher submissions yet.</div>}
          {teachers.map(row => (
            <div key={row.teacher.id} className="teacher-card">
              <div className="teacher-card-header">
                <h4>{row.teacher.user.name}</h4>
                <span className={`status-badge ${row.teacher.isApproved ? 'approved' : 'pending'}`}>
                  {row.teacher.isApproved ? 'Approved' : 'Pending Review'}
                </span>
              </div>
              <div className="teacher-card-body">
                <div className="teacher-details">
                  <div><strong>Email:</strong> {row.teacher.user.email}</div>
                  <div><strong>Qualification:</strong> {row.teacher.qualification || 'Not provided'}</div>
                  <div><strong>Contact:</strong> {row.teacher.contact || 'Not provided'}</div>
                  <div><strong>Details:</strong> {row.teacher.details || 'Not provided'}</div>
                </div>
                <div className="teacher-actions">
                  <button onClick={() => viewResume(row.teacher.id)} className="btn btn-outline">View Resume</button>
                  <div className="approval-buttons">
                    <button 
                      onClick={() => setApproval(row.teacher.id, true)} 
                      className="btn btn-success"
                      disabled={row.teacher.isApproved}
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => setApproval(row.teacher.id, false)} 
                      className="btn btn-danger"
                      disabled={!row.teacher.isApproved}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ApprovedTeachersView({ teachers, onClose }) {
  return (
    <div className="flyout-panel show">
      <div className="panel-header">
        <h3>Approved Teachers</h3>
        <button className="btn btn-outline" onClick={onClose}>Close</button>
      </div>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Courses</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {teachers.map(t => (
              <tr key={t.id}>
                <td>{t.name}</td>
                <td>{t.email}</td>
                <td>{t.courseCount}</td>
                <td><span className="status-badge approved">Approved</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {teachers.length === 0 && <div className="empty-state">No approved teachers yet.</div>}
      </div>
    </div>
  )
}

function StudentsView({ students, onClose }) {
  return (
    <div className="flyout-panel show">
      <div className="panel-header">
        <h3>Student Management</h3>
        <button className="btn btn-outline" onClick={onClose}>Close</button>
      </div>
      <div className="table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>ecoPoints</th>
              <th>Badges</th>
              <th>Courses</th>
              <th>Progress</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s, i) => (
              <tr key={i}>
                <td>{s.student.name}</td>
                <td>{s.student.email}</td>
                <td className="ecopoints">{s.student.ecoPoints}</td>
                <td>{s.badgesCount}</td>
                <td>{(s.enrolledCourses||[]).length}</td>
                <td className="progress">{(s.progress||[]).map(p => 
                  `${p.course?.title}: ${p.progressPercent||0}%`).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {students.length === 0 && <div className="empty-state">No students registered yet.</div>}
      </div>
    </div>
  )
}

function ContentView({ content, onClose, setCourseApproval }) {
    return (
      <div className="flyout-panel show">
        <div className="panel-header">
          <h3>Content Review</h3>
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
        <div className="table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Course Title</th>
                <th>Teacher</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {content.length === 0 ? (
                <tr><td colSpan="4" className="empty-state">No courses found.</td></tr>
              ) : (
                content.map(c => (
                  <tr key={c.id}>
                    <td>{c.title}</td>
                    <td>{c.teacher?.name || 'N/A'}</td>
                    <td>
                      <span className={`status-badge ${c.isApproved ? 'approved' : 'pending'}`}>
                        {c.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="actions-cell">
                      <button onClick={() => setCourseApproval(c.id, true)} className="btn btn-success" disabled={c.isApproved}>Approve</button>
                      <button onClick={() => setCourseApproval(c.id, false)} className="btn btn-danger" disabled={!c.isApproved}>Reject</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

function NotificationsView({ broadcast, setBroadcast, sentInfo, setSentInfo, onClose }) {
  const [studentMessage, setStudentMessage] = useState({ email: '', title: '', body: '' })
  const [teacherMessage, setTeacherMessage] = useState({ email: '', title: '', body: '' })
  const [studentOk, setStudentOk] = useState('')
  const [teacherOk, setTeacherOk] = useState('')

  const sendBroadcast = async () => {
    try {
      const r = await api.post('/admin/broadcast', broadcast)
      setSentInfo(`Sent to ${r.data?.data?.sent || 0} users`)
      setTimeout(() => setSentInfo(''), 3000)
    } catch (error) {
      console.error("Failed to send broadcast:", error)
      setSentInfo("Failed to send broadcast")
      setTimeout(() => setSentInfo(''), 3000)
    }
  }

  const sendStudentMessage = async () => {
    try {
      await api.post('/notifications/by-email', { 
        recipientEmail: studentMessage.email, 
        type: 'system', 
        title: studentMessage.title, 
        body: studentMessage.body 
      })
      setStudentOk('Message sent successfully!')
      setTimeout(() => setStudentOk(''), 2000)
    } catch (error) {
      console.error("Failed to send student message:", error)
      setStudentOk('Failed to send message')
      setTimeout(() => setStudentOk(''), 2000)
    }
  }

  const sendTeacherMessage = async () => {
    try {
      await api.post('/notifications/by-email', { 
        recipientEmail: teacherMessage.email, 
        type: 'system', 
        title: teacherMessage.title, 
        body: teacherMessage.body 
      })
      setTeacherOk('Message sent successfully!')
      setTimeout(() => setTeacherOk(''), 2000)
    } catch (error) {
      console.error("Failed to send teacher message:", error)
      setTeacherOk('Failed to send message')
      setTimeout(() => setTeacherOk(''), 2000)
    }
  }

  return (
    <div className="flyout-panel show">
      <div className="panel-header">
        <h3>Notifications Center</h3>
        <button className="btn btn-outline" onClick={onClose}>Close</button>
      </div>
      <div className="notifications-grid">
        <div className="notification-card">
          <h4>Broadcast Announcement</h4>
          <div className="auth-form">
            <select value={broadcast.audience} onChange={(e) => setBroadcast({...broadcast, audience: e.target.value})}>
              <option value="teachers">Teachers</option>
              <option value="students">Students</option>
              <option value="all">All Users</option>
            </select>
            <input placeholder="Title" value={broadcast.title} onChange={(e) => setBroadcast({...broadcast, title: e.target.value})} />
            <textarea placeholder="Message" value={broadcast.body} onChange={(e) => setBroadcast({...broadcast, body: e.target.value})} rows="3" />
            <button className="btn btn-primary" onClick={sendBroadcast} disabled={!broadcast.title || !broadcast.body}>
              Send Announcement
            </button>
            {sentInfo && <div className="success-message">{sentInfo}</div>}
          </div>
        </div>

        <div className="notification-card">
          <h4>Message Student</h4>
          <div className="auth-form">
            <input placeholder="Student email" value={studentMessage.email} onChange={(e) => setStudentMessage({...studentMessage, email: e.target.value})} />
            <input placeholder="Title" value={studentMessage.title} onChange={(e) => setStudentMessage({...studentMessage, title: e.target.value})} />
            <textarea placeholder="Message" value={studentMessage.body} onChange={(e) => setStudentMessage({...studentMessage, body: e.target.value})} rows="3" />
            <button className="btn btn-primary" onClick={sendStudentMessage} disabled={!studentMessage.email || !studentMessage.title || !studentMessage.body}>
              Send to Student
            </button>
            {studentOk && <div className="success-message">{studentOk}</div>}
          </div>
        </div>

        <div className="notification-card">
          <h4>Message Teacher</h4>
          <div className="auth-form">
            <input placeholder="Teacher email" value={teacherMessage.email} onChange={(e) => setTeacherMessage({...teacherMessage, email: e.target.value})} />
            <input placeholder="Title" value={teacherMessage.title} onChange={(e) => setTeacherMessage({...teacherMessage, title: e.target.value})} />
            <textarea placeholder="Message" value={teacherMessage.body} onChange={(e) => setTeacherMessage({...teacherMessage, body: e.target.value})} rows="3" />
            <button className="btn btn-primary" onClick={sendTeacherMessage} disabled={!teacherMessage.email || !teacherMessage.title || !teacherMessage.body}>
              Send to Teacher
            </button>
            {teacherOk && <div className="success-message">{teacherOk}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

function LeaderboardConfigView({ onClose }) {
  const [form, setForm] = useState({ winners: 3, minPoints: 0, period: 'weekly' })
  const [saved, setSaved] = useState('')

  const saveSettings = async () => {
    try {
      await api.post('/admin/leaderboard', form)
      setSaved('Settings saved and published!')
      setTimeout(() => setSaved(''), 2000)
    } catch (error) {
      console.error("Failed to save leaderboard settings:", error)
      setSaved('Failed to save settings')
      setTimeout(() => setSaved(''), 2000)
    }
  }

  return (
    <div className="flyout-panel show">
      <div className="panel-header">
        <h3>Leaderboard Configuration</h3>
        <button className="btn btn-outline" onClick={onClose}>Close</button>
      </div>
      <div className="config-form">
        <div className="form-group">
          <label>Number of winners to display</label>
          <input type="number" value={form.winners} onChange={(e) => setForm({...form, winners: Number(e.target.value) || 0})} min="1" max="10" />
        </div>
        <div className="form-group">
          <label>Minimum ecoPoints required</label>
          <input type="number" value={form.minPoints} onChange={(e) => setForm({...form, minPoints: Number(e.target.value) || 0})} min="0" />
        </div>
        <div className="form-group">
          <label>Leaderboard period</label>
          <select value={form.period} onChange={(e) => setForm({...form, period: e.target.value})}>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="all-time">All Time</option>
          </select>
        </div>
        <button className="btn btn-primary" onClick={saveSettings}>
          Save and Publish
        </button>
        {saved && <div className="success-message">{saved}</div>}
    </div>
  </div>
  )
}