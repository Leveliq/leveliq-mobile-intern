// src/components/chat/InvestIQChat.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { X, Sparkles, History } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { saveMessage, sendChatMessage, loadSessionMessages, getTime } from './chatApi';
import { ChatMessage } from './types';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';
import ChatHistoryModal from './ChatHistoryModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  portfolioContext?: any;
  targetSessionId?: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  text: "Hey there! 👋\n\nMay the gains be with you today. Ask me anything about your investments, portfolios, or market strategies.",
};

export default function InvestIQChat({
  visible,
  onClose,
  portfolioContext,
  targetSessionId,
}: Props) {
  const { user, userName } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => `session_${Date.now()}`);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  const scrollRef = useRef<ScrollView>(null);

  const userAvatar = user?.user_metadata?.avatar_url;
  const userInitial = (userName || user?.email || 'U').charAt(0).toUpperCase();

  useEffect(() => {
    if (visible && user) {
      if (targetSessionId) {
        handleSelectSession(targetSessionId);
      } else {
        startNewChat();
      }
    }
  }, [visible, targetSessionId, user]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading || !user) return;
    const userText = input.trim();
    setInput('');

    setMessages((prev) => [...prev, { role: 'user', text: userText, time: getTime() }]);
    setLoading(true);

    await saveMessage(user.id, sessionId, 'user', userText);

    try {
      const reply = await sendChatMessage(userText, 'free', portfolioContext);
      setMessages((prev) => [...prev, { role: 'assistant', text: reply, time: getTime() }]);
      await saveMessage(user.id, sessionId, 'assistant', reply);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `⚠️ Connection Error: ${err.message}`, time: getTime() },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, user, sessionId, portfolioContext]);

  const startNewChat = () => {
    setMessages([WELCOME_MESSAGE]);
    setSessionId(`session_${Date.now()}_${Math.random().toString(36).substring(7)}`);
  };

  const handleSelectSession = async (id: string) => {
    setLoading(true);
    const msgs = await loadSessionMessages(id);
    if (msgs.length > 0) {
      setMessages(msgs);
    } else {
      setMessages([WELCOME_MESSAGE]);
    }
    setSessionId(id);
    setLoading(false);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: '#050816' }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-sky-400/15 bg-[#050816]">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-2xl bg-blue-600/25 border border-sky-400/30 items-center justify-center">
                <Sparkles size={20} color="#38BDF8" />
              </View>
              <View>
                <Text className="text-slate-50 text-base font-extrabold tracking-wide">
                  InvestIQ <Text className="text-[#38BDF8]">Chat</Text>
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <View className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5" />
                  <Text className="text-emerald-400 text-[11px] font-semibold">Active Assistant</Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-2.5">
              {/* History Trigger Icon Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => setHistoryModalOpen(true)}
                className="w-10 h-10 rounded-2xl bg-[#0F172A] border border-sky-400/20 items-center justify-center"
              >
                <History size={18} color="#38BDF8" />
              </TouchableOpacity>

              {/* Close Button */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onClose}
                className="w-10 h-10 rounded-2xl bg-[#0F172A] border border-sky-400/20 items-center justify-center"
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Messages Feed */}
          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            style={{ flex: 1, backgroundColor: '#050816' }}
          >
            {messages.map((msg, i) => (
              <ChatBubble
                key={i}
                message={msg}
                userAvatar={userAvatar}
                userInitial={userInitial}
              />
            ))}
            {loading && <TypingIndicator />}
          </ScrollView>

          {/* Bottom Floating Input */}
          <View className="bg-[#050816] pb-3">
            <ChatInput
              value={input}
              onChangeText={setInput}
              onSend={handleSend}
              disabled={loading}
              placeholder="Ask anything..."
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* History Selection Dropdown Modal */}
      <ChatHistoryModal
        visible={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        onSelectSession={handleSelectSession}
      />
    </Modal>
  );
}