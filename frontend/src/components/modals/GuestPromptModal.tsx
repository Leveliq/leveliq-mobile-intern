// src/components/modals/GuestPromptModal.tsx
import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { UserPlus } from 'lucide-react-native';

interface GuestPromptModalProps {
  visible: boolean;
  onClose: () => void;
  onSignOut: () => void;
}

export default function GuestPromptModal({ visible, onClose, onSignOut }: GuestPromptModalProps) {
  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/75 justify-center items-center px-5">
        <View className="w-full max-w-[360px] bg-[#0f172a] border border-sky-400/30 rounded-2xl p-6 shadow-2xl items-center">
          
          <View className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-sky-400/30 items-center justify-center mb-4">
            <UserPlus size={22} color="#38BDF8" />
          </View>

          <Text className="text-slate-50 text-lg font-extrabold text-center mb-2">
            Enjoying Level<Text className="text-[#38BDF8]">IQ</Text>?
          </Text>

          <Text className="text-slate-400 text-xs text-center leading-5 mb-6">
            You've been exploring as a guest for a while. Sign in or create a free account to unlock chat history, save portfolio reports, and access all features permanently.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onSignOut}
            className="w-full bg-blue-600 rounded-xl py-3 items-center justify-center mb-2.5"
          >
            <Text className="text-white text-xs font-bold">Sign In / Create Account</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onClose}
            className="w-full bg-transparent border border-slate-700/50 rounded-xl py-2.5 items-center justify-center"
          >
            <Text className="text-slate-300 text-xs font-semibold">Continue Browsing</Text>
          </TouchableOpacity>

        </View>
      </View>
    </Modal>
  );
}