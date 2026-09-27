// src/components/chat/InvestIQChat.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Menu, Sparkles, MessageSquare, Plus } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { saveMessage, sendChatMessage, loadSessions, loadSessionMessages, getTime } from './chatApi';
import { ChatMessage, ChatSession } from './types';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import ChatHistory from './ChatHistory';

interface Props {
  visible: boolean;
  onClose: () => void;
  portfolioContext?: any;
  openWithHistory?: boolean;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  text: "Hi! I'm InvestIQ™ 👋\n\nHow can I help you with your portfolio today?",
};

export default function InvestIQChat({ visible, onClose, portfolioContext, openWithHistory = false }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState<string>('free');
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}`);

  const [showHistory, setShowHistory] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible && openWithHistory && user) openHistory();
  }, [visible, openWithHistory, user]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading || !user) return;
    const userText = input.trim();
    setInput('');
    
    const newMsg: ChatMessage = { role: 'user', text: userText, time: getTime() };
    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setLoading(true);

    await saveMessage(user.id, sessionId, 'user', userText);

    // Format full history for the backend
    const apiMessages = updatedMessages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role, content: m.text }));

    try {
      const reply = await sendChatMessage(apiMessages, plan, portfolioContext);
      setMessages((prev) => [...prev, { role: 'assistant', text: reply, time: getTime() }]);
      await saveMessage(user.id, sessionId, 'assistant', reply);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: 'assistant', text: `⚠️ Error: ${err.message}`, time: getTime() }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, user, sessionId, messages, plan, portfolioContext]);

  const startNewChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setSessionId(`session_${Date.now()}`);
    setViewingSessionId(null);
    setShowHistory(false);
  };

  const openHistory = async () => {
    if (!user) return;
    setShowHistory(true);
    setHistoryLoading(true);
    const data = await loadSessions(user.id);
    setSessions(data);
    setHistoryLoading(false);
  };

  const handleSelectSession = async (id: string) => {
    setHistoryLoading(true);
    const msgs = await loadSessionMessages(id);
    setMessages(msgs);
    setViewingSessionId(id);
    setShowHistory(false);
    setHistoryLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-[#050816]">
        {showHistory ? (
          <ChatHistory
            sessions={sessions}
            loading={historyLoading}
            activeSessionId={viewingSessionId}
            onClose={() => setShowHistory(false)}
            onSelectSession={handleSelectSession}
            onNewChat={startNewChat}
          />
        ) : (
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            
            {/* Header: ChatGPT Style (Hamburger menu on left, no X) */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-800">
              <View className="flex-row items-center">
                <TouchableOpacity onPress={onClose} className="p-2 -ml-2 mr-2">
                  <Menu size={22} color="#94A3B8" />
                </TouchableOpacity>
                <Text className="text-slate-50 text-[15px] font-bold">InvestIQ Chat</Text>
              </View>
              <View className="flex-row items-center">
                <TouchableOpacity onPress={startNewChat} className="p-2">
                  <Plus size={20} color="#94A3B8" />
                </TouchableOpacity>
                <TouchableOpacity onPress={openHistory} className="p-2 ml-2">
                  <MessageSquare size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Chat Body */}
            <ScrollView ref={scrollRef} contentContainerStyle={{ padding: 14, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
              {messages.map((msg, i) => (
                <ChatBubble key={i} message={msg} />
              ))}
              {loading && <TypingIndicator />}
            </ScrollView>

            {/* Clean Input Area */}
            {viewingSessionId ? (
              <TouchableOpacity onPress={startNewChat} className="bg-slate-800 m-4 rounded-xl py-3 items-center">
                <Text className="text-white text-[13px] font-bold">Start New Conversation</Text>
              </TouchableOpacity>
            ) : (
              <ChatInput value={input} onChangeText={setInput} onSend={handleSend} disabled={loading} />
            )}
          </KeyboardAvoidingView>
        )}
      </SafeAreaView>
    </Modal>
  );
}