// src/components/chat/ChatHistoryModal.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { X, MessageSquare, Clock } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { loadSessions } from './chatApi';
import { ChatSession } from './types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelectSession: (sessionId: string) => void;
}

export default function ChatHistoryModal({ visible, onClose, onSelectSession }: Props) {
  const { user, isGuest } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && user && !isGuest) {
      setLoading(true);
      loadSessions(user.id).then((data) => {
        setSessions(data);
        setLoading(false);
      });
    }
  }, [visible, user, isGuest]);

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/70 justify-start items-end pt-14 pr-4" onPress={onClose}>
        <Pressable className="w-80 max-h-[70%] bg-[#0B132B] border border-sky-400/20 rounded-3xl p-5 shadow-2xl">
          
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3.5 mb-3 border-b border-slate-800">
            <View className="flex-row items-center gap-2">
              <Clock size={18} color="#38BDF8" />
              <Text className="text-slate-50 text-base font-extrabold tracking-wide">Chat History</Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1 rounded-full bg-slate-800/80">
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Body List */}
          {isGuest ? (
            <View className="py-8 items-center">
              <Text className="text-slate-400 text-xs text-center">Chat history is only available for signed-in users.</Text>
            </View>
          ) : loading ? (
            <View className="py-10 items-center">
              <ActivityIndicator size="small" color="#38BDF8" />
            </View>
          ) : sessions.length === 0 ? (
            <View className="py-10 items-center">
              <Text className="text-slate-400 text-xs">No previous chats found.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {sessions.map((session) => (
                <TouchableOpacity
                  key={session.session_id}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelectSession(session.session_id);
                    onClose();
                  }}
                  className="flex-row items-center bg-[#111C44] border border-sky-400/10 p-3 rounded-2xl mb-2.5"
                >
                  <MessageSquare size={16} color="#38BDF8" />
                  <Text className="text-slate-200 text-xs font-semibold ml-3 flex-1" numberOfLines={1}>
                    {session.first_message}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

        </Pressable>
      </Pressable>
    </Modal>
  );
}