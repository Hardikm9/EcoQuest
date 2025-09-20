import { useEffect, useState, useRef } from 'react'
import api from '../../api'
import '../css/community.css'

export default function Community() {
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [replyContent, setReplyContent] = useState('')
  const [replyingTo, setReplyingTo] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => { 
    // Get current user from localStorage
    const userData = localStorage.getItem('ecolearn_user')
    if (userData) {
      const user = JSON.parse(userData)
      setCurrentUser(user)
      console.log("Current user:", user)
    }
    
    // Fetch community messages
    fetchCommunity()
  }, [])

  const fetchCommunity = async () => {
    try {
      console.log("Fetching community messages...")
      const response = await api.get('/community')
      console.log("Community response:", response.data)
      setMessages(response.data.data.messages || [])
      setError('')
    } catch (error) {
      console.error('Error fetching community:', error)
      if (error.response) {
        console.error('Error response:', error.response.data)
        setError(error.response.data.error?.message || 'Failed to load messages')
      } else {
        setError('Failed to load messages')
      }
    }
  }

  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function sendMessage(e) {
    e.preventDefault()
    if (!newMessage.trim() || loading) return
    
    setLoading(true)
    setError('')
    try {
      console.log("Sending message:", newMessage)
      const response = await api.post('/community/messages', { content: newMessage })
      console.log("Message sent successfully:", response.data)
      setMessages(response.data.data.messages || [])
      setNewMessage('')
      setError('')
    } catch (error) {
      console.error('Error sending message:', error)
      if (error.response) {
        console.error('Error response:', error.response.data)
        setError(error.response.data.error?.message || 'Failed to send message')
      } else {
        setError('Failed to send message')
      }
    } finally {
      setLoading(false)
    }
  }

  async function sendReply(e, messageId) {
    e.preventDefault()
    if (!replyContent.trim() || loading) return
    
    setLoading(true)
    setError('')
    try {
      const response = await api.post(`/community/messages/${messageId}/replies`, { 
        content: replyContent 
      })
      setMessages(response.data.data.messages || [])
      setReplyContent('')
      setReplyingTo(null)
      setError('')
    } catch (error) {
      console.error('Error sending reply:', error)
      if (error.response && error.response.data && error.response.data.error) {
        setError(error.response.data.error.message || 'Failed to send reply')
      } else {
        setError('Failed to send reply')
      }
    } finally {
      setLoading(false)
    }
  }

  // Function to get display name based on user role
  const getDisplayName = (author) => {
    if (!author) return 'Unknown User'
    
    if (typeof author === 'object') {
      if (author.role === 'student') {
        return `Student: ${author.name || 'Student'}`
      } else if (author.role === 'teacher') {
        return `Teacher: ${author.name || 'Instructor'}`
      } else if (author.role === 'admin') {
        return `Admin: ${author.name || 'Administrator'}`
      }
      return author.name || author.email || 'User'
    }
    
    return 'User'
  }

  const isCurrentUser = (author) => {
    if (!currentUser || !author) return false
    
    if (typeof author === 'object') {
      return (
        (currentUser.id && author._id === currentUser.id) || 
        (currentUser._id && author._id === currentUser._id) ||
        (currentUser.email && author.email === currentUser.email)
      )
    }
    
    return false
  }

  return (
    <div className="community-container">
      <div className="community-sidebar">
        <div className="sidebar-header">
          <h3>EcoLearn Community</h3>
        </div>
        
        <div className="community-rules">
          <h4>Community Rules</h4>
          <ul>
            <li>Be respectful to all members</li>
            <li>Keep conversations relevant to learning</li>
            <li>No spam or promotional content</li>
            <li>Help each other learn and grow</li>
            <li>Report any inappropriate behavior</li>
          </ul>
        </div>
        
        <div className="online-users">
          <h4>User Roles</h4>
          <div className="role-info">
            <span className="role-badge student">Student</span>
            <span className="role-badge teacher">Teacher</span>
            <span className="role-badge admin">Admin</span>
          </div>
        </div>
      </div>
      
      <div className="community-chat">
        <div className="chat-header">
          <div className="chat-title">EcoLearn Community Chat</div>
          <div className="chat-subtitle">
            Connect with students and teachers
          </div>
        </div>
        
        <div className="welcome-banner">
          <h3>Welcome to EcoLearn Community! 🌱</h3>
          <p>This is a space for students, teachers, and administrators to connect, share knowledge, and support each other's learning journey.</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="messages-container">
          {(messages || []).map((message) => (
            <div key={message._id} className="message-item">
              <div className="message-content">
                <div className="message-sender">
                  {getDisplayName(message.author)}
                  {isCurrentUser(message.author) && <span className="you-badge">You</span>}
                </div>
                <div className="message-text">{message.content}</div>
                <div className="message-time">
                  {new Date(message.createdAt).toLocaleString()}
                </div>
                
                {/* Reply button */}
                <button 
                  className="reply-btn"
                  onClick={() => setReplyingTo(replyingTo === message._id ? null : message._id)}
                >
                  Reply
                </button>
                
                {/* Reply form */}
                {replyingTo === message._id && (
                  <form onSubmit={(e) => sendReply(e, message._id)} className="reply-form">
                    <input
                      type="text"
                      placeholder="Type your reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      disabled={loading}
                    />
                    <button type="submit" disabled={!replyContent.trim() || loading}>
                      {loading ? 'Sending...' : 'Send Reply'}
                    </button>
                    <button type="button" onClick={() => setReplyingTo(null)}>
                      Cancel
                    </button>
                  </form>
                )}
                
                {/* Display replies */}
                {message.replies && message.replies.length > 0 && (
                  <div className="replies-container">
                    {message.replies.map((reply) => (
                      <div key={reply._id || reply.createdAt} className="reply-item">
                        <div className="reply-sender">
                          {getDisplayName(reply.author)}
                          {isCurrentUser(reply.author) && <span className="you-badge">You</span>}
                        </div>
                        <div className="reply-text">{reply.content}</div>
                        <div className="reply-time">
                          {new Date(reply.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        
        <form onSubmit={sendMessage} className="message-input-form">
          <div className="input-container">
            <input 
              placeholder="Type your message here..." 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)} 
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim() || loading}
              className="send-button"
            >
              {loading ? (
                <div className="loading-spinner"></div>
              ) : (
                <svg viewBox="0 0 24 24" width="24" height="24">
                  <path fill="currentColor" d="M2,21L23,12L2,3V10L17,12L2,14V21Z" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}