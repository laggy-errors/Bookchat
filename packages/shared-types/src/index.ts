// Shared TypeScript definitions for BookChat

export interface UserDTO {
  id: string;
  email: string;
  displayName: string;
  themePreference: string;
  defaultBookId: string | null;
}

export interface BookDTO {
  id: string;
  name: string;
  joinCode: string;
  creatorId: string;
}

export interface ConversationDTO {
  id: string;
  bookId: string;
  isGroup: boolean;
}

export interface MessageDTO {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  status: string;
  createdAt: string;
}
