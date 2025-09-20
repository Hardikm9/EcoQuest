import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import '../css/login.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [role, setRole] = useState('student')
  const [googleReady, setGoogleReady] = useState(false)
  const roleRef = useRef('student')

  useEffect(() => {
    roleRef.current = role
  }, [role])

  useEffect(() => {
    const id = 'google-oauth-script'
    if (document.getElementById(id)) {
      setGoogleReady(true)
      return
    }
    const script = document.createElement('script')
    script.id = id
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => setGoogleReady(true)
    document.body.appendChild(script)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (role === 'admin') {
        if (email !== 'abhaymall9305@gmail.com' || password !== 'Abhay@9305') {
          setError('Only the configured admin can login as admin')
          return
        }
        const payload = { id: 'admin', name: 'Admin', role: 'admin', token: 'admin-local' }
        localStorage.setItem('ecolearn_user', JSON.stringify(payload))
        navigate('/app/admin')
        return
      }
      const res = await axios.post('/api/auth/login', { email, password })
      let payload = res.data.data
      localStorage.setItem('ecolearn_user', JSON.stringify(payload))
      
      // Redirect based on role
      if (payload.role === 'teacher') {
        navigate('/app/teacher')
      } else if (payload.role === 'student') {
        navigate('/app/student')
      } else {
        navigate('/app') // Fallback
      }
    } catch (err) {
      setError('Invalid credentials')
    }
  }

  useEffect(() => {
    if (!googleReady) return
    if (!window.google || !window.google.accounts?.id) return
    try {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (resp) => {
          if (roleRef.current === 'admin') {
            setError('Admin login via Google is not allowed')
            return
          }
          try {
            const idToken = resp.credential
            const res = await axios.post('/api/auth/google', { idToken, role: roleRef.current })
            const payload = res.data.data
            localStorage.setItem('ecolearn_user', JSON.stringify(payload))
            
            // Redirect based on role for Google login
            if (payload.role === 'teacher') {
              navigate('/app/teacher')
            } else if (payload.role === 'student') {
              navigate('/app/student')
            } else {
              navigate('/app') // Fallback
            }
          } catch (e) {
            setError('Google login failed')
          }
        },
      })
      const container = document.getElementById('google-login-btn')
      if (container) {
        container.innerHTML = ''
        window.google.accounts.id.renderButton(container, { theme: 'outline', size: 'large', width: 320 })
      }
    } catch (e) {
      setError('Google SDK init failed')
    }
  }, [googleReady])

  return (
    <div className="auth-container">
      <div className="floating-leaves">
        <span className="leaf-float" style={{ left: "8%", top: "20%" }}>
          🍃
        </span>
        <span
          className="leaf-float-delayed"
          style={{ left: "18%", top: "60%" }}
        >
          🍀
        </span>
        <span className="leaf-float-slow" style={{ left: "78%", top: "30%" }}>
          🌿
        </span>
        <span className="leaf-float-fast" style={{ left: "65%", top: "75%" }}>
          🍃
        </span>
        <span className="icon-float" style={{ left: "35%", top: "40%" }}>
          💧
        </span>
        <span
          className="icon-float-delayed"
          style={{ left: "85%", top: "15%" }}
        >
          ☀️
        </span>
        <span className="eco-float" style={{ left: "55%", top: "55%" }}>
          ♻️
        </span>
        <span className="eco-float-delayed" style={{ left: "25%", top: "75%" }}>
          🌎
        </span>
        <span className="star-float" style={{ left: "15%", top: "35%" }}>
          ⭐
        </span>
        <span
          className="star-float-delayed"
          style={{ left: "85%", top: "65%" }}
        >
          🌟
        </span>
        <span className="star-float-fast" style={{ left: "45%", top: "15%" }}>
          ✨
        </span>
        <span className="star-float-slow" style={{ left: "75%", top: "85%" }}>
          💫
        </span>
      </div>
      <h2>EcoLearn Login</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        {error && <div className="error">{error}</div>}
        <button type="submit">Login</button>
      </form>
      <div className="divider"><span>OR</span></div>
      <div id="google-login-btn" style={{ width: '100%' }} />
      <p>New here? <Link to="/register">Register</Link></p>
    </div>
  )
}