import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import '../css/register.css'

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('student')
  const [error, setError] = useState('')
  const [showPasswordRules, setShowPasswordRules] = useState(false)
  const [googleRole, setGoogleRole] = useState('student')
  const [googleReady, setGoogleReady] = useState(false)
  const [googleButtonRendered, setGoogleButtonRendered] = useState(false)
  const googleRoleRef = useRef('student')

  useEffect(() => {
    googleRoleRef.current = googleRole
  }, [googleRole])

  useEffect(() => {
    // Load Google script dynamically
    const id = 'google-oauth-script'
    if (document.getElementById(id)) {
      setGoogleReady(true)
      return
    }
    
    // Show a placeholder immediately
    setGoogleButtonRendered(true)
    
    const script = document.createElement('script')
    script.id = id
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      setGoogleReady(true)
      initializeGoogleButton()
    }
    document.body.appendChild(script)
    
    // Set a timeout to show the button even if script fails to load
    const timeoutId = setTimeout(() => {
      if (!googleReady) {
        setGoogleReady(true)
        initializeGoogleButton()
      }
    }, 3000)
    
    return () => clearTimeout(timeoutId)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await axios.post('/api/auth/register', { name, email, password, role })
      navigate('/login')
    } catch (err) {
      setError('Registration failed')
    }
  }

  const initializeGoogleButton = () => {
    if (!window.google || !window.google.accounts?.id) {
      // Retry after a short delay if Google SDK isn't available yet
      setTimeout(initializeGoogleButton, 100)
      return
    }
    
    try {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: async (resp) => {
          try {
            const idToken = resp.credential
            const res = await axios.post('/api/auth/google', { idToken, role: googleRoleRef.current })
            const payload = res.data.data
            localStorage.setItem('ecolearn_user', JSON.stringify(payload))
            navigate('/app')
          } catch (e) {
            setError('Google registration failed')
          }
        },
      })
      
      const container = document.getElementById('google-register-btn')
      if (container) {
        container.innerHTML = ''
        window.google.accounts.id.renderButton(container, { 
          theme: 'outline', 
          size: 'large', 
          width: 320,
          text: 'continue_with' // This ensures consistent text
        })
        setGoogleButtonRendered(true)
      }
    } catch (e) {
      setError('Google SDK init failed')
    }
  }

  useEffect(() => {
    if (googleReady) {
      initializeGoogleButton()
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
      <h2>Create your EcoLearn account</h2>
      <form onSubmit={handleSubmit} className="auth-form">
        <label>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
        <label>Email</label>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onMouseEnter={() => setShowPasswordRules(true)}
          onMouseLeave={() => setShowPasswordRules(false)}
          required
        />
        {showPasswordRules && (
          <div className="hint">
            Password must be at least 6 characters. Use upper, lower, number, symbol.
          </div>
        )}
        <label>Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
        </select>
        {error && <div className="error">{error}</div>}
        <button type="submit">Register</button>
      </form>
      <div className="divider"><span>OR</span></div>
      <div className="google-section">
        <div className="google-role">
          <label>Register as</label>
          <select value={googleRole} onChange={(e) => setGoogleRole(e.target.value)}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        <div id="google-register-btn" style={{ width: '100%' }} />
      </div>
      <p>Already have an account? <Link to="/login">Login</Link></p>
    </div>
  )
}


