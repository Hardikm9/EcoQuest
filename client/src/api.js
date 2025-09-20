import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem('ecolearn_user')
  if (raw) {
    const { token } = JSON.parse(raw)
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api


