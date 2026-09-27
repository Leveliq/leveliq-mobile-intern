import { supabase } from '../../lib/supabase';
import { ChatMessage, ChatSession } from './types';

const API = process.env.EXPO_PUBLIC_API_URL || 'https://leveliq-production.up.railway.app';

export async function saveMessage(
  userId: string,
  sessionId: string,
  role: 'user' | 'assistant',
  message: string
): Promise<void> {
  try {
    await supabase.from('chat_messages').insert({
      user_id: userId,
      session_id: sessionId,
      role,
      message,
    });
  } catch (e) {
    console.warn('[Chat] Failed to save message:', e);
  }
}

export async function sendChatMessage(
  message: string,
  userPlan: string,
  portfolioContext?: any
): Promise<string> {
  const res = await fetch(`${API}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      portfolio_context: portfolioContext,
      user_plan: userPlan,
    }),
  });

  if (!res.ok) throw new Error('Chat API failed');
  const data = await res.json();
  return data.reply || 'No response received.';
}

export async function loadSessions(userId: string): Promise<ChatSession[]> {
  try {
    const { data } = await supabase
      .from('chat_messages')
      .select('session_id, message, created_at, role')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!data) return [];

    const sessionMap = new Map<string, ChatSession>();
    data.forEach((msg) => {
      if (!sessionMap.has(msg.session_id)) {
        const firstUserMsg = data.find(
          (m) => m.session_id === msg.session_id && m.role === 'user'
        );
        sessionMap.set(msg.session_id, {
          session_id: msg.session_id,
          first_message: firstUserMsg?.message?.slice(0, 45) || 'New conversation',
          created_at: msg.created_at,
          count: 1,
        });
      } else {
        sessionMap.get(msg.session_id)!.count++;
      }
    });

    return Array.from(sessionMap.values()).slice(0, 30);
  } catch {
    return [];
  }
}

export async function loadSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const { data } = await supabase
      .from('chat_messages')
      .select('role, message, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (!data) return [];

    return data.map((m) => ({
      role: m.role as 'user' | 'assistant',
      text: m.message,
      time: new Date(m.created_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  } catch {
    return [];
  }
}

export function getTime(): string {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}