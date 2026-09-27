import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { Send } from 'lucide-react-native';

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
  placeholder = 'Ask about investing...',
}: Props) {
  const canSend = value.trim().length > 0 && !disabled;

  return (
    <View className="flex-row items-center gap-2 px-3 py-3 border-t border-sky-400/10 bg-[#050816]">
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        onSubmitEditing={onSend}
        returnKeyType="send"
        multiline={false}
        className="flex-1 bg-slate-800/50 border border-sky-500/25 rounded-xl px-3.5 py-2.5 text-slate-50 text-[13px]"
      />
      <TouchableOpacity
        onPress={onSend}
        disabled={!canSend}
        className={`w-10 h-10 rounded-xl items-center justify-center ${
          canSend ? 'bg-blue-600' : 'bg-slate-800'
        }`}
      >
        <Send size={15} color={canSend ? '#fff' : '#475569'} />
      </TouchableOpacity>
    </View>
  );
}