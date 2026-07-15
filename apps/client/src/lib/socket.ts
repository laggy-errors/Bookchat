import { io } from 'socket.io-client'
import { API_BASE_URL } from './apiClient'

// Derive base URL from apiClient base (e.g. http://localhost:5000)
const SOCKET_URL = API_BASE_URL.replace('/api', '')

export const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: false, // connect manually when user session is active
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
})

export default socket
