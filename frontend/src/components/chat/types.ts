export interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  time?: string;
}

export interface ChatSession {
  session_id: string;
  first_message: string;
  created_at: string;
  count: number;
}

export interface ChatApiResponse {
  reply: string;
  error?: string;
}