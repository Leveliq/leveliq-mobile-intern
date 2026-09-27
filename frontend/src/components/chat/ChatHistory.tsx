import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { X, Plus, Clock, MessageSquare } from 'lucide-react-native';
import { ChatSession } from './types';

interface Props {
  sessions: ChatSession[];
  loading: boolean;
  activeSessionId: string | null;
  onClose: () => void;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function ChatHistory({
  sessions,
  loading,
  activeSessionId,
  onClose,
  onSelectSession,
  onNewChat,
}: Props) {
  return (
    <View className="flex-1 bg-[#050816]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-sky-400/10">
        <View className="flex-row items-center">
          <MessageSquare size={16} color="#38BDF8" />
          <Text className="text-slate-50 text-[14px] font-bold ml-2">Chat History</Text>
        </View>
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <X size={18} color="#94A3B8" />
        </TouchableOpacity>
      </View>

      {/* New chat button */}
      <View className="px-4 py-3">
        <TouchableOpacity
          onPress={onNewChat}
          className="flex-row items-center justify-center bg-blue-600/15 border border-blue-500/30 py-2.5 rounded-xl"
        >
          <Plus size={14} color="#38BDF8" />
          <Text className="text-[#38BDF8] text-[13px] font-bold ml-2">Start New Chat</Text>
        </TouchableOpacity>
      </View>

      {/* Sessions */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="small" color="#38BDF8" />
        </View>
      ) : sessions.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-slate-500 text-[13px] text-center">
            No chat history yet.{'\n'}Start a new conversation!
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12 }}>
          {sessions.map((session) => {
            const isActive = activeSessionId === session.session_id;
            return (
              <TouchableOpacity
                key={session.session_id}
                onPress={() => onSelectSession(session.session_id)}
                className={`rounded-xl mb-2 p-3 border ${
                  isActive
                    ? 'bg-blue-600/15 border-blue-500/30'
                    : 'bg-slate-800/30 border-slate-800'
                }`}
              >
                <Text
                  className="text-slate-50 text-[13px] font-semibold mb-1"
                  numberOfLines={1}
                >
                  {session.first_message}
                </Text>
                <View className="flex-row items-center">
                  <Clock size={10} color="#64748B" />
                  <Text className="text-slate-500 text-[10px] ml-1.5">
                    {formatDate(session.created_at)} · {session.count} msgs
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}