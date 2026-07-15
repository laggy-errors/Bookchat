// ── BookChat Client Type Definitions ──────────────────────────────────────────
// Single source of truth for all shared types used across App.tsx and components.

export type User = {
  id: string
  email: string
  displayName: string
  hasSeenPreamble: boolean
  hasSeenTour: boolean
  themePreference: string
  defaultBookId?: string | null
}

export type ConversationMember = {
  userId: string
  lastReadAt: string | null
}

export type Conversation = {
  id: string
  bookId: string
  isGroup: boolean
  unreadCount?: number
  lastReadAt?: string | null
  members: ConversationMember[]
}

export type BookMember = {
  userId: string
  displayName: string
  role: string
  joinedAt: string
  user?: { id: string; displayName: string }
}

export type Book = {
  id: string
  name: string
  joinCode: string
  creatorId: string
  conversations: Conversation[]
  members: BookMember[]
}

export type Message = {
  id: string
  conversationId: string
  senderId: string
  content: string
  status: string
  createdAt: string
  editedAt?: string | null
  deletedAt?: string | null
  sender: { displayName: string }
}

export type PresenceStatus = 'online' | 'offline' | 'recent'

export type OnlineUser = {
  userId: string
  displayName: string
  status: PresenceStatus
  lastActive?: string
}

export type Toast = {
  message: string
  type: 'success' | 'error'
}
