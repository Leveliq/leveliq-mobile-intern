// src/components/chat/ChatHistory.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { X, Plus, Clock, MessageSquare, ChevronDown } from 'lucide-react-native';
import { ChatSession } from './types';

interface Props {
  sessions: ChatSession[];
  loading: boolean;
  activeSessionId: string | null;
  onClose: () => void;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
}

export default function ChatHistory({ sessions, loading, activeSessionId, onClose, onSelectSession, onNewChat }: Props) {
  const [visibleCount, setVisibleCount] = useState(2);
  const visibleSessions = sessions.slice(0, visibleCount);

  return (
    <View className="flex-1 bg-[#050816]">
      <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-800">
        <Text className="text-slate-50 text-[15px] font-bold">Chat History</Text>
        <TouchableOpacity onPress={onClose} hitSlop={10}><X size={20} color="#94A3B8" /></TouchableOpacity>
      </View>

      <View className="px-4 py-3">
        <TouchableOpacity onPress={onNewChat} className="flex-row items-center justify-center bg-blue-600 py-3 rounded-xl">
          <Plus size={16} color="#fff" />
          <Text className="text-white text-[14px] font-bold ml-2">New Chat</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center"><ActivityIndicator color="#38BDF8" /></View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12 }}>
          {visibleSessions.map((session) => (
            <TouchableOpacity
              key={session.session_id}
              onPress={() => onSelectSession(session.session_id)}
              className={`rounded-xl mb-2 p-4 border ${
                activeSessionId === session.session_id ? 'bg-slate-800 border-slate-600' : 'bg-transparent border-slate-800'
              }`}
            >
              <Text className="text-slate-50 text-[14px] font-semibold mb-1" numberOfLines={1}>
                {session.first_message}
              </Text>
              <View className="flex-row items-center">
                <Clock size={12} color="#64748B" />
                <Text className="text-slate-500 text-[11px] ml-1.5">{new Date(session.created_at).toLocaleDateString()} · {session.count} msgs</Text>
              </View>
            </TouchableOpacity>
          ))}

          {sessions.length > visibleCount && (
            <TouchableOpacity 
              onPress={() => setVisibleCount((prev) => prev + 5)}
              className="flex-row items-center justify-center py-4 mt-2 border border-slate-800 rounded-xl"
            >
              <Text className="text-slate-400 text-[13px] font-bold mr-2">Load More</Text>
              <ChevronDown size={14} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}