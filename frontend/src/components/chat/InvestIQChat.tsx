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
  Keyboard,
} from 'react-native';
import { X, Sparkles, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { saveMessage, sendChatMessage, loadSessionMessages, getTime } from './chatApi';
import { ChatMessage } from './types';
import ChatBubble from './ChatBubble';
import TypingIndicator from './TypingIndicator';
import ChatInput from './ChatInput';

interface Props {
  visible: boolean;
  onClose: () => void;
  portfolioContext?: any;
  targetSessionId?: string;
}

const WELCOME_MESSAGE: ChatMessage = {
  role: 'assistant',
  text: "Hi! I'm InvestIQ™ 👋\n\nAsk me anything about:\n- Portfolio health score\n- Mutual fund overlap\n- Investment strategies",
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

  const scrollRef = useRef<ScrollView>(null);
  const userAvatar = user?.user_metadata?.avatar_url;
  const userInitial = (userName || user?.email || 'U').charAt(0).toUpperCase();

  useEffect(() => {
    if (visible) {
      if (targetSessionId) {
        handleSelectSession(targetSessionId);
      } else {
        startNewChat();
      }
    }
  }, [visible, targetSessionId]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, loading]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return; // Removed strict !user check so send always fires
    
    const userText = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: userText, time: getTime() }]);
    setLoading(true);

    const activeUserId = user?.id || 'anonymous';
    await saveMessage(activeUserId, sessionId, 'user', userText);

    try {
      const reply = await sendChatMessage(userText, 'free', portfolioContext);
      setMessages((prev) => [...prev, { role: 'assistant', text: reply, time: getTime() }]);
      await saveMessage(activeUserId, sessionId, 'assistant', reply);
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
    setMessages(msgs.length > 0 ? msgs : [WELCOME_MESSAGE]);
    setSessionId(id);
    setLoading(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={{ flex: 1, backgroundColor: '#050816' }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <SafeAreaView style={{ flex: 1 }}>
          
          <View className="flex-row items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-[#050816]">
            <View className="flex-row items-center gap-3">
              <View className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-500/30 items-center justify-center">
                <Sparkles size={16} color="#38BDF8" />
              </View>
              <View>
                <Text className="text-slate-50 text-[15px] font-bold">InvestIQ™</Text>
                <View className="flex-row items-center mt-0.5">
                  <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                  <Text className="text-green-500 text-[10px] font-medium">Online</Text>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-2">
              <TouchableOpacity activeOpacity={0.7} onPress={startNewChat} className="p-2 rounded-full bg-slate-800/60">
                <RefreshCw size={16} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.7} onPress={onClose} className="p-2 rounded-full bg-slate-800/60">
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            ref={scrollRef}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}
            keyboardDismissMode="interactive"
            onScrollBeginDrag={Keyboard.dismiss}
            style={{ flex: 1 }}
          >
            {messages.map((msg, i) => (
              <ChatBubble key={i} message={msg} userAvatar={userAvatar} userInitial={userInitial} />
            ))}
            {loading && <TypingIndicator />}
          </ScrollView>

          <View className="bg-[#050816] pb-2">
            <ChatInput value={input} onChangeText={setInput} onSend={handleSend} disabled={loading} />
          </View>

        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}