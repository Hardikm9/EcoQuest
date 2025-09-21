import { useEffect, useRef, useState } from 'react';
import api from '../../api';
import io from 'socket.io-client';
import '../css/teacher.css';

export default function TeacherDashboard() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ qualification: '', contact: '', details: '' });
  const [resumeFile, setResumeFile] = useState(null);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef(null);
  const [courses, setCourses] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [notifyDraft, setNotifyDraft] = useState({ title: '', body: '' });
  const [threads, setThreads] = useState([]);
  const [newThread, setNewThread] = useState({ title: '' });
  const [chatByThread, setChatByThread] = useState({});

  // Modals visibility
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [showAddMaterials, setShowAddMaterials] = useState(false);
  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [showEvaluateAssignments, setShowEvaluateAssignments] = useState(false);
  const [showViewStudents, setShowViewStudents] = useState(false);

  // Fetch teacher's own courses to populate dropdowns etc.
  const fetchTeacherCourses = () => {
    api.get('/courses/me/teacher').then(r => {
      setCourses(r.data.data || []);
    });
  };

  useEffect(() => {
    let mounted = true;
    api.get('/teachers/me').then(r => {
      if (!mounted) return;
      const teacherData = r.data.data || null;
      setTeacher(teacherData);
      setForm({
        qualification: teacherData?.qualification || '',
        contact: teacherData?.contact || '',
        details: teacherData?.details || '',
      });
    }).finally(() => setLoading(false));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const socket = io((import.meta.env.VITE_API_BASE || '').replace(/\/$/, '') || '/', { path: '/socket.io', auth: { userId }, transports: ['websocket'] });
    
    socket.on('notification:new', (n) => {
      setNotifications(prev => [n, ...prev]);
    });

    const refreshCommunity = () => api.get('/community').then(r => setThreads(r.data.data || []));
    socket.on('community:thread', refreshCommunity);
    socket.on('community:message', refreshCommunity);

    return () => socket.close();
  }, []);

  useEffect(() => {
    if (teacher?.isApproved) {
      fetchTeacherCourses();
      api.get('/notifications').then(r => setNotifications(r.data.data || []));
      api.get('/community').then(r => setThreads(r.data.data || []));
    }
  }, [teacher?.isApproved]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function saveProfile(e) {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/teachers/profile', form);
      if (resumeFile) {
        const fd = new FormData();
        fd.append('resume', resumeFile);
        await api.post('/teachers/resume', fd);
      }
      const r = await api.get('/teachers/me');
      setTeacher(r.data.data || null);
      setMessage('Profile submitted. Admin will review your resume.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setResumeFile(null);
    } catch {
      setMessage('Failed to submit profile');
    }
  }

  if (loading) return <div>Loading...</div>;
  const isApproved = !!teacher?.isApproved;

  return (
    <div className="teacher-dashboard">
      {isApproved && (
        <div className="teacher-welcome">
          <h1>Welcome, {teacher.name}!</h1>
          <p>Manage your courses, engage with students, and contribute to our educational community.</p>
        </div>
      )}

      <h3>{isApproved ? 'Teacher Dashboard' : 'Teacher Onboarding'}</h3>

      {!isApproved && (
        <>
          <p>Please provide your details and upload your PDF resume for admin review.</p>
          <form onSubmit={saveProfile} className="auth-form" style={{ maxWidth: 520 }}>
            <label>Qualification</label>
            <input name="qualification" value={form.qualification} onChange={handleChange} required />
            <label>Contact</label>
            <input name="contact" value={form.contact} onChange={handleChange} required />
            <label>Details</label>
            <input name="details" value={form.details} onChange={handleChange} required />
            <label>Upload Resume (PDF)</label>
            <input type="file" accept="application/pdf" ref={fileInputRef} onChange={(e) => setResumeFile(e.target.files?.[0] || null)} />
            <button type="submit">Submit for Review</button>
          </form>
          {message && <div style={{ marginTop: 8 }}>{message}</div>}
        </>
      )}

      {isApproved && (
        <>
          <TeacherActionCards
            onCreateCourse={() => setShowCreateCourse(true)}
            onAddMaterials={() => setShowAddMaterials(true)}
            onCreateQuiz={() => setShowCreateQuiz(true)}
            onCreateAssignment={() => setShowCreateAssignment(true)}
            onEvaluateAssignments={() => setShowEvaluateAssignments(true)}
            onViewStudents={() => setShowViewStudents(true)}
          />
          <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, margin: '24px 0' }}>
             {/* Notification and Community Cards would go here */}
          </div>
          
          {showCreateCourse && <CreateCourseModal onClose={() => setShowCreateCourse(false)} onSaved={fetchTeacherCourses} />}
          {showAddMaterials && <AddMaterialsModal courses={courses} onClose={() => setShowAddMaterials(false)} />}
          {showCreateQuiz && <CreateQuizModal courses={courses} onClose={() => setShowCreateQuiz(false)} />}
          {showCreateAssignment && <CreateAssignmentModal courses={courses} onClose={() => setShowCreateAssignment(false)} />}
          {showEvaluateAssignments && <EvaluateAssignmentsModal courses={courses} onClose={() => setShowEvaluateAssignments(false)} />}
          {showViewStudents && <ViewStudentsModal courses={courses} onClose={() => setShowViewStudents(false)} />}

          <h4>Your Courses</h4>
          <ul>
            {courses.map(c => <li key={c._id}><strong>{c.title}</strong> ({c.isApproved ? 'Approved' : 'Pending Review'})</li>)}
          </ul>
        </>
      )}
    </div>
  );
}


function TeacherActionCards({ onCreateCourse, onAddMaterials, onCreateQuiz, onCreateAssignment, onEvaluateAssignments, onViewStudents }) {
  // This component remains the same
  return (
    <div className="action-cards">
      <div className="action-card" onClick={onCreateCourse}><h5>Create Course</h5><p>Write content and define your course.</p></div>
      <div className="action-card" onClick={onAddMaterials}><h5>Add Materials</h5><p>Upload PDFs or videos for your courses.</p></div>
      <div className="action-card" onClick={onCreateQuiz}><h5>Create Quiz</h5><p>Configure questions and answers.</p></div>
      <div className="action-card" onClick={onCreateAssignment}><h5>Create Assignment</h5><p>Set tasks and submission deadlines.</p></div>
      <div className="action-card" onClick={onEvaluateAssignments}><h5>Evaluate Assignments</h5><p>Review student submissions.</p></div>
      <div className="action-card" onClick={onViewStudents}><h5>View Students</h5><p>See enrolled students' details.</p></div>
    </div>
  );
}

function ModalShell({ title, onClose, children, actions }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header><h3>{title}</h3><button className="btn secondary" onClick={onClose}>Close</button></header>
        <div className="modal-body">{children}</div>
        <div className="modal-actions">{actions}</div>
      </div>
    </div>
  );
}

// CORRECTED: This modal now submits URLs directly, matching the backend controller.
function CreateCourseModal({ onClose, onSaved }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!title || !description) {
      alert('Please provide a title and description for the course.');
      return;
    }
    setSaving(true);
    try {
      // The backend controller expects a JSON object with these fields.
      await api.post('/courses', {
        title,
        description,
        imageUrl,
        videoUrl,
      });
      alert('Course created successfully! It is now pending admin approval.');
      onSaved?.(); // Calls the function to refresh the course list
      onClose();
    } catch (error) {
      console.error('Failed to create course:', error.response?.data || error);
      alert('There was an error creating the course.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Create Course" onClose={onClose} actions={
      <>
        <button className="btn secondary" onClick={onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save for Review'}</button>
      </>
    }>
      <div className="auth-form">
        <label>Course Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Sustainable Living 101" />
        
        <label>Course Description</label>
        <textarea style={{ width: '100%', height: 150, resize: 'vertical' }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what students will learn in this course." />
        
        <label>Cover Image URL (Optional)</label>
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://example.com/cover-image.png" />
        
        <label>Intro Video URL (Optional)</label>
        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://example.com/intro-video.mp4" />
      </div>
    </ModalShell>
  );
}

// CORRECTED: This modal handles FormData and file uploads for GridFS.
function AddMaterialsModal({ courses, onClose }) {
  const [courseId, setCourseId] = useState(courses[0]?._id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('pdf');
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!courseId || !file || !title) {
      alert('Please select a course, provide a title, and upload a file.');
      return;
    }
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('type', type);

      await api.post(`/courses/${courseId}/materials`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Material added successfully!');
      onClose();
    } catch (error) {
      alert('Failed to add material. Please try again.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Add Materials" onClose={onClose} actions={
      <>
        <button className="btn secondary" onClick={onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={!courseId || !title || !file || saving}>{saving ? 'Saving...' : 'Save Material'}</button>
      </>
    }>
      <div className="auth-form">
        <label>Select Course</label>
        <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          <option value="" disabled>-- Select a course --</option>
          {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
        </select>
        
        <label>Material Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
        
        <label>Description (Optional)</label>
        <input value={description} onChange={(e) => setDescription(e.target.value)} />
        
        <label>Type</label>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="pdf">PDF</option>
          <option value="video">Video</option>
          <option value="article">Article</option>
          <option value="book">Book</option>
        </select>

        <label>Upload File (Required)</label>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        {file && <div style={{ color: 'green', fontSize: '14px' }}>✓ {file.name} selected</div>}
      </div>
    </ModalShell>
  );
}


function CreateQuizModal({ courses, onClose }) {
  const [courseId, setCourseId] = useState(courses[0]?._id || '');
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState([{ prompt: '', options: ['', ''], correctIndex: 0 }]);
  const [saving, setSaving] = useState(false);

  const updateQuestion = (qIndex, field, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex][field] = value;
    setQuestions(newQuestions);
  };

  const updateOption = (qIndex, oIndex, value) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuestions(newQuestions);
  };

  const addOption = (qIndex) => {
    const newQuestions = [...questions];
    newQuestions[qIndex].options.push('');
    setQuestions(newQuestions);
  };
  
  const addQuestion = () => {
    setQuestions([...questions, { prompt: '', options: ['', ''], correctIndex: 0 }]);
  };

  async function save() {
    if (!courseId || !title) {
        alert('Please select a course and provide a quiz title.');
        return;
    }
    setSaving(true);
    try {
      await api.post(`/quizzes/course/${courseId}`, { title, questions });
      alert('Quiz created successfully!');
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Create Quiz" onClose={onClose} actions={
        <><button className="btn secondary" onClick={onClose}>Cancel</button>
        <button className="btn" onClick={save} disabled={!courseId || saving}>{saving ? 'Saving...' : 'Save Quiz'}</button></>
    }>
        <div className="auth-form">
            <label>Select Course</label>
            <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="" disabled>-- Select a course --</option>
                {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
            </select>
            <label>Quiz Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        {questions.map((q, qIndex) => (
            <div key={qIndex} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <div style={{ fontWeight: 600 }}>Question {qIndex + 1}</div>
                <input placeholder="Question prompt" value={q.prompt} onChange={(e) => updateQuestion(qIndex, 'prompt', e.target.value)} />
                {q.options.map((opt, oIndex) => (
                    <div key={oIndex} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input placeholder={`Option ${oIndex + 1}`} value={opt} onChange={(e) => updateOption(qIndex, oIndex, e.target.value)} />
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <input type="radio" name={`correct-${qIndex}`} checked={q.correctIndex === oIndex} onChange={() => updateQuestion(qIndex, 'correctIndex', oIndex)} /> Correct
                        </label>
                    </div>
                ))}
                <button className="btn secondary" onClick={() => addOption(qIndex)} type="button">Add Option</button>
            </div>
        ))}
        <button className="btn" onClick={addQuestion} type="button" style={{marginTop: '10px'}}>Add Another Question</button>
    </ModalShell>
  );
}

// CORRECTED: Fixed the CreateAssignmentModal component
function CreateAssignmentModal({ courses, onClose }) {
  const [courseId, setCourseId] = useState(courses[0]?._id || '');
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({ count: 1, dueDate: '' });
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);

  function initQuestions(e) {
    e.preventDefault();
    const newQuestions = Array(Number(config.count) || 1).fill(0).map(() => ({ prompt: '' }));
    setQuestions(newQuestions);
    setStep(2);
  }

  function updateQuestion(index, value) {
    const newQuestions = [...questions];
    newQuestions[index].prompt = value;
    setQuestions(newQuestions);
  }

  async function save() {
    if (!courseId) {
      alert('Please select a course');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/assignments/course/${courseId}`, {
        title: `Assignment for ${courses.find(c => c._id === courseId)?.title}`,
        questions,
        dueDate: config.dueDate
      });
      alert('Assignment created successfully!');
      onClose();
    } catch (error) {
      console.error('Failed to create assignment:', error);
      alert('There was an error creating the assignment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell title="Create Assignment" onClose={onClose} actions={<>
      {step === 2 ? <>
        <button className="btn secondary" onClick={() => setStep(1)}>Back</button>
        <button className="btn" onClick={save} disabled={!courseId || saving}>{saving ? 'Saving...' : 'Save'}</button>
      </> : <button className="btn secondary" onClick={onClose}>Close</button>}
    </>}>
      {step === 1 && (
        <form onSubmit={initQuestions} className="auth-form">
          <label>Select Course</label>
          <select value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            {courses.map(c => <option key={c._id} value={c._id}>{c.title}</option>)}
          </select>
          <label>No. of questions</label>
          <input type="number" value={config.count} onChange={(e) => setConfig({...config, count: e.target.value})} />
          <label>Due date (YYYY-MM-DD)</label>
          <input value={config.dueDate} onChange={(e) => setConfig({...config, dueDate: e.target.value})} />
          <button type="submit" className="btn">Next</button>
        </form>
      )}
      {step === 2 && (
        <div>
          {questions.map((q, i) => (
            <div key={i} style={{border: '1px solid #e5e7eb', borderRadius: 8, padding: 12, marginBottom: 8}}>
              <div style={{fontWeight: 600}}>Question {i+1}</div>
              <input placeholder="Question text" value={q.prompt} onChange={(e) => updateQuestion(i, e.target.value)} />
            </div>
          ))}
        </div>
      )}
    </ModalShell>
  );
}

function EvaluateAssignmentsModal({ courses, onClose }) {
  const [assignmentId, setAssignmentId] = useState('')
  const [data, setData] = useState(null)

  async function load() {
    if (!assignmentId) return
    const r = await api.get(`/assignments/${assignmentId}`)
    setData(r.data.data)
  }

  async function grade(submissionId, grade) {
    await api.post(`/assignments/${assignmentId}/submissions/${submissionId}/grade`, { grade: Number(grade)||0 })
    await load()
  }

  return (
    <ModalShell title="Evaluate Assignments" onClose={onClose} actions={<>
      <button className="btn secondary" onClick={onClose}>Close</button>
    </>}>
      <div className="auth-form">
        <label>Assignment ID</label>
        <input value={assignmentId} onChange={(e)=>setAssignmentId(e.target.value)} />
        <button className="btn" onClick={load}>Load</button>
      </div>
      {data && (
        <div style={{marginTop:12}}>
          <div style={{fontWeight:700}}>{data.title}</div>
          <ul>
            {(data.submissions||[]).map(s => (
              <li key={s._id} style={{display:'flex', gap:8, alignItems:'center', margin:'8px 0'}}>
                <span style={{minWidth:180}}>{s?.student?.name} ({s?.student?.email})</span>
                <a className="btn btn-outline" href={s.fileUrl} target="_blank" rel="noreferrer">View PDF</a>
                <input type="number" defaultValue={s.grade||0} style={{width:90}} onBlur={(e)=>grade(s._id, e.target.value)} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </ModalShell>
  )
}

function ViewStudentsModal({ courses, onClose }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        // Aggregate students from teacher's courses endpoint if available
        const res = await api.get('/courses/me/teacher')
        const list = []
        for (const c of res.data.data || []) {
          for (const s of (c.students||[])) list.push({ course: c.title, student: s })
        }
        setStudents(list)
      } finally { setLoading(false) }
    }
    load()
  }, [])

  return (
    <ModalShell title="Your Students" onClose={onClose} actions={<>
      <button className="btn secondary" onClick={onClose}>Close</button>
    </>}>
      {loading ? <div>Loading...</div> : (
        <table className="table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Course</th><th>ecoPoints</th></tr>
          </thead>
          <tbody>
            {students.map((row, i) => (
              <tr key={i}>
                <td>{row.student?.name}</td>
                <td>{row.student?.email}</td>
                <td>{row.course}</td>
                <td>{row.student?.ecoPoints ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </ModalShell>
  )
}

function CourseManage({ courseId }) {
  const [materials, setMaterials] = useState([])
  const [m, setM] = useState({ type: 'article', title: '', description: '', url: '' })
  const [quiz, setQuiz] = useState({ title: '', questions: [] })
  const [qPrompt, setQPrompt] = useState('')
  const [qOptions, setQOptions] = useState(['',''])
  const [qCorrect, setQCorrect] = useState(0)
  const [assignment, setAssignment] = useState({ title: '', description: '', dueDate: '', points: 20 })
  const [gradeAssignmentId, setGradeAssignmentId] = useState('')
  const [assignmentData, setAssignmentData] = useState(null)
  const [gradeForm, setGradeForm] = useState({ submissionId: '', grade: 0, feedback: '' })

  useEffect(()=>{ /* could fetch course details if needed */ },[])

  async function addMaterial(e) {
    e.preventDefault()
    const res = await api.post(`/courses/${courseId}/materials`, m)
    setMaterials(prev => [res.data.data, ...prev])
    setM({ type: 'article', title: '', description: '', url: '' })
  }
  function addQuestion() {
    setQuiz(prev => ({ ...prev, questions: [...prev.questions, { prompt: qPrompt, options: qOptions, correctIndex: qCorrect, points: 10 }] }))
    setQPrompt(''); setQOptions(['','']); setQCorrect(0)
  }
  async function createQuiz(e) {
    e.preventDefault()
    await api.post(`/quizzes/course/${courseId}`, quiz)
    setQuiz({ title: '', questions: [] })
  }
  async function createAssignment(e) {
    e.preventDefault()
    await api.post(`/assignments/course/${courseId}`, assignment)
    setAssignment({ title: '', description: '', dueDate: '', points: 20 })
  }

  async function fetchAssignment() {
    if (!gradeAssignmentId) return
    const res = await api.get(`/assignments/${gradeAssignmentId}`)
    setAssignmentData(res.data.data)
  }
  async function grade(e) {
    e.preventDefault()
    await api.post(`/assignments/${gradeAssignmentId}/submissions/${gradeForm.submissionId}/grade`, { grade: Number(gradeForm.grade)||0, feedback: gradeForm.feedback })
    await fetchAssignment()
  }

  return (
    <div style={{marginTop:8}}>
      <details>
        <summary>Add Material</summary>
        <form onSubmit={addMaterial} className="auth-form" style={{maxWidth:520}}>
          <select value={m.type} onChange={(e)=>setM({...m, type:e.target.value})}>
            <option value="article">Article</option>
            <option value="pdf">PDF</option>
            <option value="video">Video</option>
          </select>
          <input placeholder="Title" value={m.title} onChange={(e)=>setM({...m, title:e.target.value})} required />
          <input placeholder="Description" value={m.description} onChange={(e)=>setM({...m, description:e.target.value})} />
          <input placeholder="URL" value={m.url} onChange={(e)=>setM({...m, url:e.target.value})} required />
          <button type="submit">Add</button>
        </form>
      </details>
      <details>
        <summary>Create Quiz</summary>
        <form onSubmit={createQuiz} className="auth-form" style={{maxWidth:520}}>
          <input placeholder="Quiz title" value={quiz.title} onChange={(e)=>setQuiz({...quiz, title:e.target.value})} required />
          <div style={{border:'1px solid #d0d7de', padding:8, borderRadius:8}}>
            <div><strong>Add question</strong></div>
            <input placeholder="Prompt" value={qPrompt} onChange={(e)=>setQPrompt(e.target.value)} />
            {qOptions.map((o, i)=>(
              <input key={i} placeholder={`Option ${i+1}`} value={o} onChange={(e)=>{
                const next=[...qOptions]; next[i]=e.target.value; setQOptions(next)
              }} />
            ))}
            <button type="button" onClick={()=>setQOptions(prev=>[...prev,''])}>Add Option</button>
            <label>Correct index</label>
            <input type="number" min={0} max={qOptions.length-1} value={qCorrect} onChange={(e)=>setQCorrect(Number(e.target.value)||0)} />
            <button type="button" onClick={addQuestion}>Add Question</button>
          </div>
          <div>Questions: {quiz.questions.length}</div>
          <button type="submit">Create Quiz</button>
        </form>
      </details>
      <details>
        <summary>Create Assignment</summary>
        <form onSubmit={createAssignment} className="auth-form" style={{maxWidth:520}}>
          <input placeholder="Title" value={assignment.title} onChange={(e)=>setAssignment({...assignment, title:e.target.value})} required />
          <input placeholder="Description" value={assignment.description} onChange={(e)=>setAssignment({...assignment, description:e.target.value})} />
          <input placeholder="Due date (YYYY-MM-DD)" value={assignment.dueDate} onChange={(e)=>setAssignment({...assignment, dueDate:e.target.value})} />
          <input type="number" placeholder="Points" value={assignment.points} onChange={(e)=>setAssignment({...assignment, points:Number(e.target.value)||20})} />
          <button type="submit">Create Assignment</button>
        </form>
      </details>
      <details>
        <summary>Grade Submissions</summary>
        <div className="auth-form" style={{maxWidth:620}}>
          <input placeholder="Assignment ID" value={gradeAssignmentId} onChange={(e)=>setGradeAssignmentId(e.target.value)} />
          <button onClick={fetchAssignment}>Load</button>
          {assignmentData && (
            <div>
              <div><strong>{assignmentData.title}</strong></div>
              <ul>
                {(assignmentData.submissions||[]).map(s => (
                  <li key={s._id}>
                    {s?.student?.name} — grade: {s.grade ?? 'N/A'}
                    <button style={{marginLeft:8}} onClick={()=>setGradeForm({ submissionId: s._id, grade: s.grade||0, feedback: s.feedback||'' })}>Select</button>
                  </li>
                ))}
              </ul>
              <form onSubmit={grade} className="auth-form" style={{maxWidth:520}}>
                <input placeholder="Submission ID" value={gradeForm.submissionId} onChange={(e)=>setGradeForm({...gradeForm, submissionId:e.target.value})} />
                <input type="number" placeholder="Grade (0-100)" value={gradeForm.grade} onChange={(e)=>setGradeForm({...gradeForm, grade:Number(e.target.value)||0})} />
                <input placeholder="Feedback" value={gradeForm.feedback} onChange={(e)=>setGradeForm({...gradeForm, feedback:e.target.value})} />
                <button type="submit">Grade</button>
              </form>
            </div>
          )}
        </div>
      </details>
    </div>
  )
}