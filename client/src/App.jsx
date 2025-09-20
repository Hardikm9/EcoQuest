import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './pages/auth/Login.jsx'
import Register from './pages/auth/Register.jsx'
import Dashboard from './pages/dashboard/Dashboard.jsx'
import AdminDashboard from './pages/dashboard/AdminDashboard.jsx'
import Home from './pages/Home.jsx'
import TeacherDashboard from './pages/dashboard/TeacherDashboard.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/app/student" element={<Dashboard />} />
        <Route path="/app/admin" element={<AdminDashboard />} />
        <Route path="/app/teacher" element={<TeacherDashboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
