// src/components/chat/ChatBubble.tsx
import React from 'react';
import { View, Text, Image } from 'react-native';
import { Bot } from 'lucide-react-native';
import { ChatMessage } from './types';

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('# ')) {
      return (
        <Text key={i} className="text-slate-50 text-[15px] font-extrabold mb-1.5 mt-1">
          {line.slice(2)}
        </Text>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <Text key={i} className="text-[#38BDF8] text-[13px] font-bold mb-1 mt-1">
          {line.slice(3)}
        </Text>
      );
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <View key={i} className="flex-row mb-0.5 pl-1">
          <Text className="text-[#38BDF8] mr-2">•</Text>
          <Text className="text-slate-100 text-[13px] leading-5 flex-1">
            {renderInline(line.slice(2))}
          </Text>
        </View>
      );
    }
    if (/^\d+\. /.test(line)) {
      const num = line.match(/^(\d+)\. /)?.[1];
      return (
        <View key={i} className="flex-row mb-0.5 pl-1">
          <Text className="text-[#38BDF8] font-bold mr-2">{num}.</Text>
          <Text className="text-slate-100 text-[13px] leading-5 flex-1">
            {renderInline(line.replace(/^\d+\. /, ''))}
          </Text>
        </View>
      );
    }
    if (line.trim() === '') return <View key={i} style={{ height: 4 }} />;
    return (
      <Text key={i} className="text-slate-100 text-[13px] leading-5 mb-0.5">
        {renderInline(line)}
      </Text>
    );
  });
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} className="text-white font-bold">
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

interface Props {
  message: ChatMessage;
  userAvatar?: string | null;
  userInitial?: string;
}

export default function ChatBubble({ message, userAvatar, userInitial = 'U' }: Props) {
  const isUser = message.role === 'user';

  return (
    <View className="mb-4">
      <View
        className={`flex-row items-end gap-2.5 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}
      >
        {/* Assistant Avatar (Left side) */}
        {!isUser && (
          <View className="w-9 h-9 rounded-full bg-blue-600/30 border border-blue-500/40 items-center justify-center mb-1">
            <Bot size={18} color="#38BDF8" />
          </View>
        )}

        {/* Message Bubble */}
        <View className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
          <View
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? 'bg-blue-600 rounded-br-xs text-white'
                : 'bg-[#0F172A] border border-slate-800 rounded-bl-xs'
            }`}
            style={{
              shadowColor: isUser ? '#2563EB' : '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 2,
            }}
          >
            {isUser ? (
              <Text className="text-white text-[13.5px] leading-5 font-normal">
                {message.text}
              </Text>
            ) : (
              <View>{renderMarkdown(message.text)}</View>
            )}
          </View>

          {/* Timestamp directly under message */}
          {message.time && (
            <Text
              className={`text-slate-500 text-[10px] mt-1 px-1 ${
                isUser ? 'text-right' : 'text-left'
              }`}
            >
              {message.time}
            </Text>
          )}
        </View>

        {/* User Avatar (Right side) */}
        {isUser && (
          <View className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 items-center justify-center mb-1 overflow-hidden">
            {userAvatar ? (
              <Image source={{ uri: userAvatar }} className="w-full h-full" />
            ) : (
              <Text className="text-slate-200 font-bold text-xs">{userInitial}</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}