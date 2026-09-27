// src/components/chat/ChatInput.tsx
import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Send, Camera } from 'lucide-react-native';

interface Props {
  value: string;
  onChangeText: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function ChatInput({
  value,
  onChangeText,
  onSend,
  disabled,
  placeholder = 'Type Your Message',
}: Props) {
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <View className="px-4 py-3 bg-[#050816]">
      <View className="flex-row items-center bg-[#0F172A] border border-slate-800 rounded-full px-3 py-1.5 shadow-lg">
        {/* Left Action Icon */}
        <TouchableOpacity
          activeOpacity={0.7}
          className="w-9 h-9 items-center justify-center rounded-full"
        >
          <Camera size={20} color="#64748B" />
        </TouchableOpacity>

        {/* Text Input */}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748B"
          onSubmitEditing={onSend}
          returnKeyType="send"
          multiline={false}
          className="flex-1 text-slate-100 text-[13.5px] px-2 py-2"
        />

        {/* Right Action Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onSend}
          disabled={!canSend}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            canSend ? 'bg-blue-600' : 'bg-slate-800/80'
          }`}
          style={{
            shadowColor: canSend ? '#2563EB' : 'transparent',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.4,
            shadowRadius: 6,
            elevation: canSend ? 4 : 0,
          }}
        >
          <Send size={16} color={canSend ? '#FFFFFF' : '#475569'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}