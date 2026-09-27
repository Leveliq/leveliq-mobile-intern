import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Sparkles, MessageSquare, Zap } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import {
    saveMessage,
    sendChatMessage,
    loadSessions,
    loadSessionMessages,
    getTime,
} from './chatApi';
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

const SUGGESTED_QUESTIONS = [
    'What is MF overlap?',
    'How to diversify?',
    'Explain SIP',
    'What is expense ratio?',
];

const FREE_LIMIT = 5;
const WELCOME_MESSAGE: ChatMessage = {
    role: 'assistant',
    text: "Hi! I'm InvestIQ™ 👋\n\nAsk me anything about:\n- Your portfolio health score\n- Mutual fund overlap & diversification\n- Investment concepts & strategies\n- Asset allocation & risk\n\nWhat would you like to know?",
};

export default function InvestIQChat({ visible, onClose, portfolioContext, openWithHistory = false, }: Props) {
    const { user } = useAuth();

    const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [plan, setPlan] = useState<string>('free');
    const [dailyCount, setDailyCount] = useState(0);
    const [sessionId, setSessionId] = useState(
        () => `session_${Date.now()}_${Math.random().toString(36).slice(2)}`
    );

    // History state
    const [showHistory, setShowHistory] = useState(false);
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);

    const scrollRef = useRef<ScrollView>(null);

    const isPremium = plan === 'premium' || plan === 'founding';
    const canAsk = isPremium || dailyCount < FREE_LIMIT;

    // Load user plan
    useEffect(() => {
        if (!user) return;
        supabase
            .from('users')
            .select('plan')
            .eq('id', user.id)
            .single()
            .then(({ data }) => {
                if (data?.plan) setPlan(data.plan);
            });
    }, [user]);

    // Auto-open history view if requested from sidebar
    useEffect(() => {
        if (visible && openWithHistory && user) {
            openHistory();
        }
    }, [visible, openWithHistory, user]);
    
    // Auto scroll on new message
    useEffect(() => {
        setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages, loading]);

    const handleSend = useCallback(async () => {
        if (!input.trim() || loading || !canAsk || !user) return;

        const userText = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', text: userText, time: getTime() }]);
        setLoading(true);

        await saveMessage(user.id, sessionId, 'user', userText);

        try {
            const reply = await sendChatMessage(userText, plan, portfolioContext);
            setMessages((prev) => [...prev, { role: 'assistant', text: reply, time: getTime() }]);
            await saveMessage(user.id, sessionId, 'assistant', reply);
            if (!isPremium) setDailyCount((prev) => prev + 1);
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', text: 'Something went wrong. Please try again.', time: getTime() },
            ]);
        } finally {
            setLoading(false);
        }
    }, [input, loading, canAsk, user, sessionId, plan, portfolioContext, isPremium]);

    const startNewChat = () => {
        setMessages([WELCOME_MESSAGE]);
        setSessionId(`session_${Date.now()}_${Math.random().toString(36).slice(2)}`);
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
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView className="flex-1 bg-[#050816]" edges={['top']}>
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
                    <KeyboardAvoidingView
                        style={{ flex: 1 }}
                        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    >
                        {/* Header */}
                        <View className="flex-row items-center justify-between px-4 py-3 border-b border-sky-400/10">
                            <View className="flex-row items-center flex-1">
                                <View className="w-9 h-9 rounded-xl bg-blue-600 items-center justify-center">
                                    <Sparkles size={16} color="#fff" />
                                </View>
                                <View className="ml-3">
                                    <Text className="text-slate-50 text-[14px] font-extrabold">InvestIQ™</Text>
                                    <View className="flex-row items-center mt-0.5">
                                        <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
                                        <Text className="text-green-500 text-[10px] font-medium">Online</Text>
                                        {viewingSessionId && (
                                            <Text className="text-amber-500 text-[10px] font-semibold ml-2">
                                                📖 Viewing history
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            </View>

                            <View className="flex-row items-center gap-2">
                                {!isPremium && (
                                    <Text className="text-slate-500 text-[11px]">
                                        {FREE_LIMIT - dailyCount}/{FREE_LIMIT}
                                    </Text>
                                )}
                                {isPremium && (
                                    <View className="flex-row items-center bg-blue-600/20 px-2 py-1 rounded-full">
                                        <Zap size={10} color="#38BDF8" />
                                        <Text className="text-[#38BDF8] text-[9px] font-bold ml-1">PRO</Text>
                                    </View>
                                )}
                                <TouchableOpacity onPress={openHistory} hitSlop={8} className="p-1.5">
                                    <MessageSquare size={16} color="#94A3B8" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={onClose} hitSlop={8} className="p-1.5">
                                    <X size={18} color="#94A3B8" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Messages */}
                        <ScrollView
                            ref={scrollRef}
                            contentContainerStyle={{ padding: 14, paddingBottom: 20 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            {messages.map((msg, i) => (
                                <ChatBubble key={i} message={msg} />
                            ))}
                            {loading && <TypingIndicator />}

                            {/* Suggested questions on first load */}
                            {messages.length === 1 && !loading && (
                                <View className="mt-2">
                                    <Text className="text-slate-500 text-[11px] mb-2 px-1">Try asking:</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {SUGGESTED_QUESTIONS.map((q) => (
                                            <TouchableOpacity
                                                key={q}
                                                onPress={() => setInput(q)}
                                                className="bg-sky-500/10 border border-sky-500/25 px-3 py-2 rounded-full"
                                            >
                                                <Text className="text-[#38BDF8] text-[11.5px]">{q}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* "Continue new chat" prompt when viewing history */}
                            {viewingSessionId && (
                                <TouchableOpacity
                                    onPress={startNewChat}
                                    className="bg-blue-600/10 border border-blue-500/30 rounded-xl py-3 items-center mt-2"
                                >
                                    <Text className="text-[#38BDF8] text-[12px] font-bold">
                                        + Start New Chat
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </ScrollView>

                        {/* Input area or limit message */}
                        {!canAsk && !isPremium ? (
                            <View className="p-4 bg-blue-600/10 border-t border-blue-500/20">
                                <Text className="text-[#38BDF8] text-[13px] font-bold text-center">
                                    Daily limit reached ({FREE_LIMIT}/{FREE_LIMIT})
                                </Text>
                                <Text className="text-slate-500 text-[11px] text-center mt-1">
                                    Upgrade to Pro for unlimited questions
                                </Text>
                            </View>
                        ) : viewingSessionId ? null : (
                            <>
                                <ChatInput
                                    value={input}
                                    onChangeText={setInput}
                                    onSend={handleSend}
                                    disabled={loading}
                                />
                                <View className="pb-2 bg-[#050816]">
                                    <Text className="text-slate-600 text-[10px] text-center">
                                        ⚠️ Educational only — not investment advice
                                    </Text>
                                </View>
                            </>
                        )}
                    </KeyboardAvoidingView>
                )}
            </SafeAreaView>
        </Modal>
    );
}