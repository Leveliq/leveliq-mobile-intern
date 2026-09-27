// src/components/chat/chatApi.ts
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
    const { error } = await supabase.from('chat_messages').insert({
      user_id: userId,
      session_id: sessionId,
      role,
      message,
    });
    if (error) {
      console.warn('[Chat RLS/DB Error] Failed to save message:', error.message);
    }
  } catch (e) {
    console.warn('[Chat Exception] Failed to save message:', e);
  }
}

export async function sendChatMessage(
  message: string,
  userPlan: string,
  portfolioContext?: any
): Promise<string> {
  const targetUrl = `${API}/api/chat`;
  const payload = {
    message,
    portfolio_context: portfolioContext,
    user_plan: userPlan,
  };

  console.log('[ChatApi] 🚀 Sending message to:', targetUrl);
  console.log('[ChatApi] 📦 Payload:', JSON.stringify(payload, null, 2));

  try {
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('[ChatApi] 📥 Response Status:', res.status);

    if (!res.ok) {
      const errorText = await res.text();
      console.error('[ChatApi] ❌ Server returned error text:', errorText);
      throw new Error(`Server returned status ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    console.log('[ChatApi] ✅ Server returned JSON:', data);

    return data.reply || 'No response received from the assistant.';
  } catch (err: any) {
    console.error('[ChatApi] 🚨 Network/Fetch Exception details:', err);
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

    if (error) {
      console.error('[ChatApi] Failed to load sessions:', error.message);
      return [];
    }
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
  } catch (e) {
    console.error('[ChatApi] Exception inside loadSessions:', e);
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

    if (error) {
      console.error('[ChatApi] Failed to load session messages:', error.message);
      return [];
    }
    if (!data) return [];

    return data.map((m) => ({
      role: m.role as 'user' | 'assistant',
      text: m.message,
      time: new Date(m.created_at).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }));
  } catch (e) {
    console.error('[ChatApi] Exception inside loadSessionMessages:', e);
    return [];
  }
}

export function getTime(): string {
  return new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}