// src/components/chat/chatApi.ts
import { supabase } from '../../lib/supabase';
import { ChatMessage, ChatSession } from './types';

const API = process.env.EXPO_PUBLIC_API_URL;

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
    console.warn('[Chat Exception] Failed to save message:', e);
  }
}

export async function sendChatMessage(
  messages: { role: string; content: string }[],
  userPlan: string,
  portfolioContext?: any
): Promise<string> {
  const targetUrl = `${API}/api/chat`;
  const payload = {
    messages, // Sending full conversation history
    portfolio_context: portfolioContext,
    user_plan: userPlan,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45-second timeout

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Server returned status ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    return data.reply || 'No response received from the assistant.';
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. The server took too long to respond.');
    }
    throw err;
  }
}

export async function loadSessions(userId: string): Promise<ChatSession[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('session_id, message, created_at, role')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

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

    return Array.from(sessionMap.values());
  } catch (e) {
    return [];
  }
}

export async function loadSessionMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('role, message, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error || !data) return [];

    return data.map((m) => ({
      role: m.role as 'user' | 'assistant',
      text: m.message,
      time: new Date(m.created_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  } catch (e) {
    return [];
  }
}

export function getTime(): string {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}