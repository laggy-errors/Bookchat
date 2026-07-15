import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from 'react'
import AuthPage from './routes/AuthPage'
import DisplayNameModal from './components/onboarding/DisplayNameModal'
import PreamblePage from './components/onboarding/PreamblePage'
import BookSelection from './components/book/BookSelection'
import { API_BASE_URL } from './lib/apiClient'
import { socket } from './lib/socket'
import { LeftHardcoverNav } from './components/book/LeftHardcoverNav'
import { SpineCrease } from './components/book/SpineCrease'
import { NotebookSidebar } from './components/book/NotebookSidebar'
import { WritingPage } from './components/book/WritingPage'
import { ThemePullTab } from './components/theme/ThemePullTab'
import { ErrorPage } from './components/common/ErrorPage'

const GuidedTour = lazy(() => import('./components/onboarding/GuidedTour'))
const SettingsModal = lazy(() => import('./components/settings/SettingsModal').then(module => ({ default: module.SettingsModal })))

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isNewRegistration, setIsNewRegistration] = useState(false)

  // Book Selection & Switching States
  const [activeBookId, setActiveBookId] = useState<string | null>(null)
  const [showSwitcher, setShowSwitcher] = useState(false)
  const [isPageTurning, setIsPageTurning] = useState(false)
  const [updatingDefault, setUpdatingDefault] = useState(false)

  // Settings Panel States
  const [showSettings, setShowSettings] = useState(false)
  const [joinedBooks, setJoinedBooks] = useState<any[]>([])

  // Custom Error Page States
  const [errorState, setErrorState] = useState<{ code: 401 | 403 | 404 | 500; message?: string } | null>(null)

  // Mobile page navigation state
  const [mobileActivePage, setMobileActivePage] = useState<'sidebar' | 'writing'>('sidebar')

  // Desk & Book theme setting
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem('bookchat_theme') || 'paper')

  useEffect(() => {
    if (currentTheme === 'paper') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', currentTheme)
    }
  }, [currentTheme])

  const handleThemeChange = (theme: string) => {
    setCurrentTheme(theme)
    localStorage.setItem('bookchat_theme', theme)
  }

  // Real-time Messaging States
  const [bookDetails, setBookDetails] = useState<any | null>(null)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[] | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [fetchingMore, setFetchingMore] = useState(false)
  const messageContainerRef = useRef<HTMLDivElement>(null)

  // Real-time Typing States & Refs
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({})
  const isTypingRef = useRef(false)
  const typingTimeoutRef = useRef<any | null>(null)

  // Real-time Presence States
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [lastActiveTimes, setLastActiveTimes] = useState<Record<string, string>>({})

  // Conversation Search States
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchPage, setSearchPage] = useState(1)
  const [searchTotalPages, setSearchTotalPages] = useState(1)
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null)
  
  // Draft Message Preservation State (Keyed by book ID)
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [composerText, setComposerText] = useState('')

  const currentBook = useMemo(() => {
    return joinedBooks.find(b => b.id === activeBookId) || { id: activeBookId || '', name: bookDetails?.name || 'Ledger Journal' }
  }, [joinedBooks, activeBookId, bookDetails])

  const renderTypingText = useCallback(() => {
    const names = Object.values(typingUsers)
    if (names.length === 0) return null
    if (names.length === 1) return `${names[0]} is writing...`
    if (names.length === 2) return `${names[0]} and ${names[1]} are writing...`
    return 'Several scribes are writing...'
  }, [typingUsers])

  const highlightText = useCallback((text: string, search: string) => {
    if (!search.trim()) return text
    const regex = new RegExp(`(${search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    return parts.map((part, i) => 
      regex.test(part) 
        ? <mark key={i} className="bg-[#B08D57]/45 text-[#1F1B16] font-serif rounded px-0.5">{part}</mark>
        : part
    )
  }, [])

  const handleCopyInviteCode = useCallback(() => {
    if (bookDetails?.joinCode) {
      navigator.clipboard.writeText(bookDetails.joinCode)
      alert(`Join code copied to ledger clipboard: ${bookDetails.joinCode}`)
    } else {
      alert("No invite code found for this journal.")
    }
  }, [bookDetails])

  const handleToggleDefault = useCallback(async () => {
    if (!user || !activeBookId || updatingDefault) return
    setUpdatingDefault(true)

    const isCurrentDefault = user.defaultBookId === activeBookId
    const newDefaultId = isCurrentDefault ? null : activeBookId

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ defaultBookId: newDefaultId }),
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUser(updatedUser)
      }
    } catch (err) {
      console.error('Failed to toggle default book:', err)
    } finally {
      setUpdatingDefault(false)
    }
  }, [user, activeBookId, updatingDefault])

  const fetchJoinedBooks = useCallback(async () => {
    try {
      const cached = localStorage.getItem('bookchat_joined_books')
      if (cached) {
        setJoinedBooks(JSON.parse(cached))
      }
      const response = await fetch(`${API_BASE_URL}/api/books`, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        setJoinedBooks(data)
        localStorage.setItem('bookchat_joined_books', JSON.stringify(data))
      }
    } catch (err) {
      console.error('Failed to load user books:', err)
    }
  }, [])

  const handleReplayTour = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hasSeenTour: false }),
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data)
      }
    } catch (err) {
      console.error('Failed to replay tour:', err)
    }
  }, [])

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        })
        if (response.ok) {
          const authenticatedUser = await response.json()
          setUser(authenticatedUser)
          // Load real joined books list
          fetchJoinedBooks()
          // Set initial session active book from defaultBookId
          if (authenticatedUser.defaultBookId) {
            setActiveBookId(authenticatedUser.defaultBookId)
          }
        }
      } catch (err) {
        console.error('Session restore check failed:', err)
      } finally {
        setLoading(false)
      }
    }
    checkSession()
  }, [])

  // Socket connection lifecycle effect
  useEffect(() => {
    if (user) {
      socket.connect()

      socket.on('connect', () => {
        console.log('Socket connected successfully:', socket.id)
        processOfflineQueue()
      })

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message)
      })

      socket.on('user_presence', (data: { userId: string; status: 'online' | 'offline'; lastActive?: string }) => {
        setOnlineUsers((prev) => {
          const next = new Set(prev)
          if (data.status === 'online') {
            next.add(data.userId)
          } else {
            next.delete(data.userId)
          }
          return next
        })
        if (data.lastActive) {
          setLastActiveTimes((prev) => ({
            ...prev,
            [data.userId]: data.lastActive!
          }))
        }
      })

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason)
        // Reset online state on disconnect
        setOnlineUsers(new Set())
      })

      return () => {
        socket.off('connect')
        socket.off('connect_error')
        socket.off('user_presence')
        socket.off('disconnect')
        socket.disconnect()
      }
    }
  }, [user])

  // Book Room Real-time Join/Leave lifecycle effect
  useEffect(() => {
    if (user && activeBookId) {
      socket.emit('join_book', { bookId: activeBookId }, (response: any) => {
        if (response && response.status === 'error') {
          console.error('Failed to join real-time book room:', response.message)
        } else {
          console.log('Successfully joined real-time book room:', activeBookId)
          if (response && response.onlineUsers) {
            setOnlineUsers(new Set(response.onlineUsers))
          }
        }
      })

      return () => {
        socket.emit('leave_book', { bookId: activeBookId })
        setOnlineUsers(new Set())
      }
    }
  }, [user, activeBookId])

  const markAsRead = async (convId: string) => {
    try {
      await fetch(`${API_BASE_URL}/api/conversations/${convId}/read`, {
        method: 'POST',
        credentials: 'include'
      })
      setBookDetails((prev: any) => {
        if (!prev) return prev
        return {
          ...prev,
          conversations: prev.conversations.map((c: any) => 
            c.id === convId ? { ...c, unreadCount: 0 } : c
          )
        }
      })
    } catch (err) {
      console.error('Failed to mark conversation as read:', err)
    }
  }

  const processOfflineQueue = () => {
    if (!user || !socket.connected) return

    const queueKey = `bookchat_offline_queue_${user.id}`
    const queue = JSON.parse(localStorage.getItem(queueKey) || '[]')
    if (queue.length === 0) return

    console.log(`Processing offline queue containing ${queue.length} items...`)

    queue.forEach((msg: any) => {
      socket.emit(
        'send_message',
        {
          bookId: msg.bookId,
          conversationId: msg.conversationId,
          content: msg.content
        },
        (response: any) => {
          if (response && response.status === 'ok') {
            // Acknowledged: replace optimistic item
            setMessages((prev) =>
              (prev || []).map((m) =>
                m.id === msg.id ? { ...response.message, status: 'sent' } : m
              )
            )
            // Remove from queue
            const currentQueue = JSON.parse(localStorage.getItem(queueKey) || '[]')
            const updatedQueue = currentQueue.filter((q: any) => q.id !== msg.id)
            localStorage.setItem(queueKey, JSON.stringify(updatedQueue))
          } else {
            console.warn('Failed to dispatch queued offline message:', msg.id)
          }
        }
      )
    })
  }

  // Fetch book details and message history when activeBookId changes
  useEffect(() => {
    const fetchBookAndMessages = async () => {
      if (!user || !activeBookId) {
        setBookDetails(null)
        setActiveConversationId(null)
        setMessages(null)
        setNextCursor(null)
        return
      }

      // 1. Instantly load from client cache (Stale-While-Revalidate)
      const cacheKeyDetails = `bookchat_cache_details_${user.id}_${activeBookId}`
      const cacheKeyMsgs = `bookchat_cache_msgs_${user.id}_${activeBookId}`
      const cachedDetails = localStorage.getItem(cacheKeyDetails)
      const cachedMsgs = localStorage.getItem(cacheKeyMsgs)

      if (cachedDetails) {
        try {
          const details = JSON.parse(cachedDetails)
          setBookDetails(details)
          const groupConv = details.conversations?.find((c: any) => c.isGroup === true)
          if (groupConv) {
            setActiveConversationId(groupConv.id)
          }
        } catch (e) {
          console.error('Failed to parse cached details:', e)
        }
      }
      if (cachedMsgs) {
        try {
          setMessages(JSON.parse(cachedMsgs))
        } catch (e) {
          console.error('Failed to parse cached messages:', e)
        }
      }

      // Show loader spinner only if there's no cache available to present
      setLoadingMessages(!cachedDetails)

      try {
        const bookResponse = await fetch(`${API_BASE_URL}/api/books/${activeBookId}`, {
          credentials: 'include'
        })
        if (!bookResponse.ok) {
          if (bookResponse.status === 401) {
            setErrorState({ code: 401 })
          } else if (bookResponse.status === 403) {
            setErrorState({ code: 403, message: 'You are not a verified scribe in this ledger archive directory.' })
          } else if (bookResponse.status === 404) {
            setErrorState({ code: 404, message: 'The active book cannot be found in the library database catalog.' })
          } else {
            setErrorState({ code: 500 })
          }
          throw new Error('Failed to retrieve book details')
        }
        const bookData = await bookResponse.json()
        setBookDetails(bookData)
        localStorage.setItem(cacheKeyDetails, JSON.stringify(bookData))

        // Locate default group conversation
        const groupConv = bookData.conversations?.find((c: any) => c.isGroup === true)
        if (groupConv) {
          setActiveConversationId(groupConv.id)

          // Fetch initial message batch
          const msgResponse = await fetch(`${API_BASE_URL}/api/conversations/${groupConv.id}/messages?limit=20`, {
            credentials: 'include'
          })
          if (msgResponse.ok) {
            const msgData = await msgResponse.json()
            
            // Append any offline queued messages in this conversation
            const queueKey = `bookchat_offline_queue_${user.id}`
            const offlineQueue = JSON.parse(localStorage.getItem(queueKey) || '[]')
            const bookQueuedMessages = offlineQueue
              .filter((q: any) => q.conversationId === groupConv.id)
              .map((q: any) => ({
                id: q.id,
                conversationId: q.conversationId,
                content: q.content,
                senderId: user.id,
                sender: { id: user.id, displayName: user.displayName },
                createdAt: q.createdAt,
                status: 'failed_pending_retry'
              }))

            const finalMessages = [...(msgData.messages || []), ...bookQueuedMessages]
            setMessages(finalMessages)
            setNextCursor(msgData.nextCursor)
            localStorage.setItem(cacheKeyMsgs, JSON.stringify(msgData.messages || []))
            
            // Reset unread status on initial load
            markAsRead(groupConv.id)
          } else {
            setMessages([])
            setNextCursor(null)
          }
        } else {
          setActiveConversationId(null)
          setMessages([])
          setNextCursor(null)
        }
      } catch (err) {
        console.error('Error loading journal messages:', err)
        // Keep cached messages in case of server fetch errors to remain visible offline
        if (!cachedMsgs) {
          setMessages([])
          setNextCursor(null)
        }
      } finally {
        setLoadingMessages(false)
      }
    }

    fetchBookAndMessages()
  }, [user, activeBookId])

  // Real-time socket message synchronization effect
  useEffect(() => {
    if (activeConversationId) {
      const handleNewMessage = (msg: any) => {
        if (msg.conversationId === activeConversationId) {
          setMessages((prev) => {
            if (!prev) return [msg]
            // Prevent duplicate message renders if already added optimistically
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, msg]
          })
          // Open conversation: mark as read automatically
          markAsRead(activeConversationId)
        } else {
          // Background conversation: increment unreadCount locally
          setBookDetails((prev: any) => {
            if (!prev) return prev
            return {
              ...prev,
              conversations: prev.conversations.map((c: any) => 
                c.id === msg.conversationId 
                  ? { ...c, unreadCount: (c.unreadCount || 0) + 1 }
                  : c
              )
            }
          })
        }
      }

      const handleUserTyping = (data: { conversationId: string; userId: string; displayName: string; isTyping: boolean }) => {
        if (data.conversationId === activeConversationId) {
          setTypingUsers((prev) => {
            const next = { ...prev }
            if (data.isTyping) {
              next[data.userId] = data.displayName
            } else {
              delete next[data.userId]
            }
            return next
          })
        }
      }

      socket.on('new_message', handleNewMessage)
      socket.on('user_typing', handleUserTyping)

      return () => {
        socket.off('new_message', handleNewMessage)
        socket.off('user_typing', handleUserTyping)
        setTypingUsers({})
      }
    }
  }, [activeConversationId])

  // Scroll to bottom on initial message load
  useEffect(() => {
    if (messages && messages.length > 0 && !fetchingMore) {
      const container = messageContainerRef.current
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    }
  }, [messages, fetchingMore])

  const handleScroll = async () => {
    const container = messageContainerRef.current
    if (!container || !activeConversationId || !nextCursor || fetchingMore) return

    if (container.scrollTop === 0) {
      setFetchingMore(true)
      const oldScrollHeight = container.scrollHeight

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/conversations/${activeConversationId}/messages?cursor=${nextCursor}&limit=20`,
          { credentials: 'include' }
        )
        if (response.ok) {
          const data = await response.json()
          
          setMessages((prev) => [...(data.messages || []), ...(prev || [])])
          setNextCursor(data.nextCursor)

          // Adjust scroll position to preserve view anchoring (oldScrollHeight subtraction)
          requestAnimationFrame(() => {
            if (messageContainerRef.current) {
              const newScrollHeight = messageContainerRef.current.scrollHeight
              messageContainerRef.current.scrollTop = newScrollHeight - oldScrollHeight
            }
          })
        }
      } catch (err) {
        console.error('Failed to paginate older records:', err)
      } finally {
        setFetchingMore(false)
      }
    }
  }

  const handleAuthSuccess = useCallback((authenticatedUser: any, isSignup = false) => {
    setUser(authenticatedUser)
    fetchJoinedBooks()
    if (authenticatedUser.defaultBookId) {
      setActiveBookId(authenticatedUser.defaultBookId)
    }
    if (isSignup) {
      setIsNewRegistration(true)
    }
  }, [fetchJoinedBooks])

  const handleNameSave = useCallback((updatedUser: any) => {
    setUser(updatedUser)
    setIsNewRegistration(false)
    fetchJoinedBooks()
  }, [fetchJoinedBooks])

  const handlePreambleComplete = useCallback((updatedUser: any) => {
    setUser(updatedUser)
    fetchJoinedBooks()
  }, [fetchJoinedBooks])

  const handleTourComplete = useCallback((updatedUser: any) => {
    setUser(updatedUser)
  }, [])

  const handleBookSelect = useCallback((updatedUser: any) => {
    setUser(updatedUser)
    fetchJoinedBooks()
    if (updatedUser.defaultBookId) {
      setActiveBookId(updatedUser.defaultBookId)
    }
  }, [fetchJoinedBooks])

  // Switch between Books preserving drafts and triggering page curl
  const handleSwitchBook = useCallback((bookId: string) => {
    if (bookId === activeBookId) {
      setShowSwitcher(false)
      return
    }

    // 1. Cache current composer text
    if (activeBookId) {
      setDrafts((prev) => ({ ...prev, [activeBookId]: composerText }))
    }

    // 2. Trigger physical page-turn transition
    setIsPageTurning(true)
    
    setTimeout(() => {
      // 3. Switch active book and load its cached draft
      setActiveBookId(bookId)
      const savedDraft = localStorage.getItem(`bookchat_draft_${user.id}_${bookId}`) || drafts[bookId] || ''
      setComposerText(savedDraft)
      setSearchQuery('')
      setSearchResults(null)
      setIsPageTurning(false)
      setShowSwitcher(false)
    }, 450) // Synced with CSS transition curves
  }, [activeBookId, composerText, user, drafts])

  const handleCloseBook = useCallback(() => {
    // Cache draft on return to shelf
    if (activeBookId) {
      setDrafts((prev) => ({ ...prev, [activeBookId]: composerText }))
    }
    setActiveBookId(null)
    setComposerText('')
    setBookDetails(null)
    setActiveConversationId(null)
    setMessages(null)
    setSearchQuery('')
    setSearchResults(null)
  }, [activeBookId, composerText])

  const handleSendMessage = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()

    const text = composerText.trim()
    if (!text || !activeBookId || !activeConversationId || !user) return

    // 1. Prepare optimistic temporary message
    const tempId = 'temp_' + Date.now() + Math.random().toString(36).substr(2, 5)
    
    // Check if offline to adjust status indicators
    const isOffline = !socket.connected
    const status = isOffline ? 'failed_pending_retry' : 'pending'

    const optimisticMsg = {
      id: tempId,
      conversationId: activeConversationId,
      content: text,
      senderId: user.id,
      sender: {
        id: user.id,
        displayName: user.displayName,
      },
      createdAt: new Date().toISOString(),
      status, // pending_retry if offline
    }

    // 2. Add message to state immediately (Optimistic UI)
    setMessages((prev) => [...(prev || []), optimisticMsg])

    // 3. Clear composer input and persistent draft cache
    setComposerText('')
    if (user && activeBookId) {
      localStorage.removeItem(`bookchat_draft_${user.id}_${activeBookId}`)
    }

    // Clear typing timeout and emit isTyping: false
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    isTypingRef.current = false
    socket.emit('typing', { bookId: activeBookId, conversationId: activeConversationId, isTyping: false })

    // 4. Handle Offline Queue fallback
    if (isOffline) {
      const queueKey = `bookchat_offline_queue_${user.id}`
      const queue = JSON.parse(localStorage.getItem(queueKey) || '[]')
      queue.push({
        id: tempId,
        bookId: activeBookId,
        conversationId: activeConversationId,
        content: text,
        createdAt: optimisticMsg.createdAt
      })
      localStorage.setItem(queueKey, JSON.stringify(queue))
      return
    }

    // 5. Emit send_message over socket for persistence and broadcast
    socket.emit(
      'send_message',
      {
        bookId: activeBookId,
        conversationId: activeConversationId,
        content: text,
      },
      (response: any) => {
        // 6. Server acknowledgement callback handler
        if (response && response.status === 'ok') {
          // Replace optimistic item with server verified message
          setMessages((prev) =>
            (prev || []).map((m) =>
              m.id === tempId ? { ...response.message, status: 'sent' } : m
            )
          )
        } else {
          // Fallback: Queue for automatic retry
          setMessages((prev) =>
            (prev || []).map((m) =>
              m.id === tempId ? { ...m, status: 'failed_pending_retry' } : m
            )
          )
          const queueKey = `bookchat_offline_queue_${user.id}`
          const queue = JSON.parse(localStorage.getItem(queueKey) || '[]')
          queue.push({
            id: tempId,
            bookId: activeBookId,
            conversationId: activeConversationId,
            content: text,
            createdAt: optimisticMsg.createdAt
          })
          localStorage.setItem(queueKey, JSON.stringify(queue))
        }
      }
    )
  }, [composerText, activeBookId, activeConversationId, user])

  const handleSearch = useCallback(async (pageNum = 1) => {
    if (!searchQuery.trim() || !activeConversationId) return
    setSearching(true)
    setSearchPage(pageNum)
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations/${activeConversationId}/search?query=${encodeURIComponent(searchQuery)}&page=${pageNum}&limit=5`,
        { credentials: 'include' }
      )
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.messages)
        setSearchTotalPages(data.totalPages)
      }
    } catch (err) {
      console.error('Failed to search messages:', err)
    } finally {
      setSearching(false)
    }
  }, [searchQuery, activeConversationId])

  const handleJumpToMessage = useCallback(async (msg: any) => {
    setLoadingMessages(true)
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/conversations/${activeConversationId}/messages?cursor=${msg.id}&limit=20`,
        { credentials: 'include' }
      )
      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages)
        setNextCursor(data.nextCursor)
        
        setHighlightedMessageId(msg.id)
        setTimeout(() => {
          setHighlightedMessageId(null)
        }, 3000)
      }
    } catch (err) {
      console.error('Jump message error:', err)
    } finally {
      setLoadingMessages(false)
    }
  }, [activeConversationId])

  const handleComposerChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    if (val.length <= 500) {
      setComposerText(val)

      // Auto-grow height calculation based on text content
      e.target.style.height = 'auto'
      e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px` // max height limit around 5 lines

      // Persist draft in localStorage and handle debounced typing emits
      if (user && activeBookId && activeConversationId) {
        localStorage.setItem(`bookchat_draft_${user.id}_${activeBookId}`, val)

        // Emit typing: true if we just started typing
        if (!isTypingRef.current && val.trim().length > 0) {
          isTypingRef.current = true
          socket.emit('typing', { bookId: activeBookId, conversationId: activeConversationId, isTyping: true })
        }

        // Emit typing: false 2 seconds after user stops typing
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = setTimeout(() => {
          isTypingRef.current = false
          socket.emit('typing', { bookId: activeBookId, conversationId: activeConversationId, isTyping: false })
        }, 2000)
      }
    }
  }, [user, activeBookId, activeConversationId])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, insert newline on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const handleLogout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      setUser(null)
      setActiveBookId(null)
      setComposerText('')
      setDrafts({})
      setIsNewRegistration(false)
    } catch (err) {
      console.error(err)
      setUser(null)
      setActiveBookId(null)
      setComposerText('')
      setDrafts({})
      setIsNewRegistration(false)
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#1E130C] text-[#B08D57] font-serif text-sm italic">
        📖 Consulting the archives...
      </div>
    )
  }

  if (errorState) {
    return (
      <ErrorPage 
        code={errorState.code} 
        message={errorState.message} 
        onReset={() => {
          setErrorState(null)
          handleCloseBook()
        }} 
      />
    )
  }

  if (user) {
    // 1. First Step: Name Capture Modal
    const needsNameSetup = isNewRegistration || (!user.hasSeenPreamble && user.displayName === user.email.split('@')[0])
    if (needsNameSetup) {
      return <DisplayNameModal user={user} onSave={handleNameSave} />
    }

    // 2. Second Step: Preamble Novel Page Modal (shows once)
    const needsPreamble = !user.hasSeenPreamble
    if (needsPreamble) {
      return <PreamblePage user={user} onComplete={handlePreambleComplete} />
    }

    // 3. Third Step: Book Selection Bookshelf (if no default/active book is open)
    if (activeBookId === null) {
      return <BookSelection user={user} onSelectBook={handleBookSelect} />
    }

    // 4. Final Step: Main Open Book Workspace
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#1E130C] p-6 overflow-hidden select-none w-full relative">
        
        {/* Core Book Outer Frame with Book Shadow and 3D Open */}
        <div 
          className="relative w-full max-w-[1060px] h-[92vh] md:h-[640px] rounded-[16px] p-1.5 md:p-3 book-shadow book-open-animation"
          style={{ perspective: '1600px', backgroundColor: 'var(--cover-bg)', transition: 'background-color 0.4s ease' }}
        >
          {/* Symmetrical Page Stack Borders */}
          <div className="absolute inset-1.5 md:inset-3 pages-stack-effect"></div>

          {/* Left Hardcover Icon Rail */}
          <LeftHardcoverNav 
            onShowSwitcher={() => setShowSwitcher(true)}
            onGoToShelf={handleCloseBook}
            onLogout={handleLogout}
            onShowSettings={() => setShowSettings(true)}
          />

          {/* SPREAD SKEUOMORPHIC WRAPPER */}
          <div 
            className={`absolute inset-2 md:inset-4 rounded-[6px] flex overflow-hidden shadow-inner transition-all duration-500 origin-center ${isPageTurning ? 'page-turn-active' : ''}`}
            style={{ transformStyle: 'preserve-3d', backgroundColor: 'var(--paper-bg)', transition: 'background-color 0.4s ease' }}
          >
            {/* Center Spine shadow crease */}
            <SpineCrease />

            {/* LEFT PAGE (Sidebar target) */}
            <NotebookSidebar 
              user={user}
              bookDetails={bookDetails}
              activeConversationId={activeConversationId}
              onSelectConversation={(convId) => {
                setActiveConversationId(convId)
                markAsRead(convId)
                setMobileActivePage('writing')
              }}
              onlineUsers={onlineUsers}
              lastActiveTimes={lastActiveTimes}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searching={searching}
              searchResults={searchResults}
              searchPage={searchPage}
              searchTotalPages={searchTotalPages}
              handleSearch={handleSearch}
              handleJumpToMessage={async (msg) => {
                await handleJumpToMessage(msg)
                setMobileActivePage('writing')
              }}
              highlightText={highlightText}
              setShowSwitcher={setShowSwitcher}
              handleLogout={handleLogout}
              onShowSettings={() => setShowSettings(true)}
              mobileActivePage={mobileActivePage}
            />

            {/* RIGHT PAGE (Writing area target) */}
            <WritingPage 
              user={user}
              currentBook={currentBook}
              bookDetails={bookDetails}
              messages={messages}
              loadingMessages={loadingMessages}
              fetchingMore={fetchingMore}
              highlightedMessageId={highlightedMessageId}
              searchQuery={searchQuery}
              highlightText={highlightText}
              typingUsers={typingUsers}
              renderTypingText={renderTypingText}
              composerText={composerText}
              handleComposerChange={handleComposerChange}
              handleKeyDown={handleKeyDown}
              handleSendMessage={() => handleSendMessage()}
              handleToggleDefault={handleToggleDefault}
              updatingDefault={updatingDefault}
              handleScroll={handleScroll}
              messageContainerRef={messageContainerRef}
              handleCopyInviteCode={handleCopyInviteCode}
              mobileActivePage={mobileActivePage}
              onMobileBack={() => setMobileActivePage('sidebar')}
            />

          </div>

          {/* 5. SLIDING BOOK SWITCHER OVERLAY (Left binder tab style) */}
          {showSwitcher && (
            <div className="absolute inset-y-3 left-3 w-80 bg-[#EDE3D0] rounded-l-[6px] shadow-[15px_0_35px_rgba(0,0,0,0.5)] border-r border-[#E3D5B8] z-30 font-serif flex flex-col justify-between p-6 animate-slide-in">
              <div>
                <div className="flex justify-between items-center mb-6 border-b border-dashed border-[#B08D57]/30 pb-2">
                  <h3 className="font-display font-bold text-base text-[#4A3223] m-0">📖 Archive Switcher</h3>
                  <button 
                    onClick={() => setShowSwitcher(false)}
                    className="text-sm font-bold text-[#7A3B2E] hover:opacity-80 cursor-pointer bg-none border-none"
                  >
                    Close
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  {joinedBooks.length === 0 ? (
                    <div className="text-xs text-[#8c7f67] italic text-center py-4">No other journals in archives.</div>
                  ) : (
                    joinedBooks.map((book) => {
                      const isActive = book.id === activeBookId
                      return (
                        <button
                          key={book.id}
                          onClick={() => handleSwitchBook(book.id)}
                          className={`w-full text-left rounded p-3 flex justify-between items-center transition cursor-pointer ${isActive ? 'bg-[#F4ECDD] border-l-4 border-[#6B7A4F] shadow-sm' : 'hover:bg-black/5 bg-transparent'}`}
                        >
                          <span className={`text-xs font-bold ${isActive ? 'text-[#1F1B16]' : 'text-[#8c7f67]'}`}>
                            {book.name}
                          </span>
                          {isActive && (
                            <span className="text-[10px] text-[#6B7A4F] font-bold">🎗️ Active</span>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Shelf Go Back option */}
              <button
                onClick={handleCloseBook}
                className="w-full bg-[#B08D57] hover:bg-[#9B7744] text-[#1F1B16] font-sans uppercase tracking-wider text-[10px] font-bold py-2 rounded text-center transition cursor-pointer"
              >
                Go to Bookshelf
              </button>
            </div>
          )}
        </div>

        {/* BOTTOM THEME PULL-TAB TARGET */}
        <ThemePullTab currentTheme={currentTheme} onThemeChange={handleThemeChange} />

        {/* Mount Guided Tour overlay if not seen yet */}
        {!user.hasSeenTour && (
          <Suspense fallback={null}>
            <GuidedTour user={user} onComplete={handleTourComplete} />
          </Suspense>
        )}

        {/* Mount Settings Overlay if triggered */}
        {showSettings && (
          <Suspense fallback={null}>
            <SettingsModal 
              user={user}
              bookDetails={bookDetails}
              joinedBooks={joinedBooks}
              onClose={() => setShowSettings(false)}
              onUserUpdate={(updatedUser) => {
                setUser(updatedUser)
              }}
              onBookRename={(newName) => {
                setBookDetails((prev: any) => prev ? { ...prev, name: newName } : null)
                fetchJoinedBooks()
              }}
              onReplayTour={handleReplayTour}
              onLogout={handleLogout}
            />
          </Suspense>
        )}
      </div>
    )
  }

  return (
    <AuthPage 
      onSuccess={(authUser) => {
        handleAuthSuccess(authUser, authUser.hasSeenPreamble === false)
      }} 
    />
  )
}

export default App
