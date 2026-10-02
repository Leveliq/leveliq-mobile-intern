// src/components/modals/ProfileModal.tsx
import React from 'react';
import { View, Text, Image, TouchableOpacity, Modal, Pressable } from 'react-native';
import { LayoutDashboard, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ProfileModal({ visible, onClose }: ProfileModalProps) {
  const { user, userName, signOut, isGuest } = useAuth();
  const router = useRouter();

  const displayName = userName || 'Investor';
  const avatarUrl = user?.user_metadata?.avatar_url;
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/60 justify-start items-end pt-14 pr-4" onPress={onClose}>
        <Pressable className="w-72 bg-[#0f172a] border border-sky-400/20 rounded-2xl p-4 shadow-2xl">
          <View className="flex-row items-center mb-3 pb-3 border-b border-slate-800">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="w-11 h-11 rounded-full bg-slate-800" />
            ) : (
              <View className="w-11 h-11 rounded-full bg-blue-600/25 border border-[#38BDF8] items-center justify-center">
                <Text className="text-[#38BDF8] text-base font-bold">{initial}</Text>
              </View>
            )}
            <View className="ml-3 flex-1">
              <Text className="text-slate-50 text-sm font-bold" numberOfLines={1}>{displayName}</Text>
              <Text className="text-slate-400 text-[11px] lowercase mt-0.5" numberOfLines={1}>{isGuest ? 'Guest Mode' : user?.email}</Text>
            </View>
          </View>

          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => {
              onClose();
              router.push('/(app)');
            }}
            className="flex-row items-center px-3 py-2.5 rounded-xl mb-1 bg-slate-800/40"
          >
            <LayoutDashboard size={16} color="#38BDF8" />
            <Text className="ml-3 text-slate-200 text-xs font-semibold">Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={async () => {
              onClose();
              await signOut();
            }}
            className="flex-row items-center px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 mt-1"
          >
            <LogOut size={16} color="#F87171" />
            <Text className="ml-3 text-red-400 text-xs font-semibold">{isGuest ? 'Exit Guest Mode' : 'Sign Out'}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}