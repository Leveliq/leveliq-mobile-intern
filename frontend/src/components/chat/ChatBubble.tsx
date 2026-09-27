import React from 'react';
import { View, Text } from 'react-native';
import { Bot } from 'lucide-react-native';
import { ChatMessage } from './types';

// Simple markdown renderer for React Native
function renderMarkdown(text: string) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    if (line.startsWith('# ')) {
      return (
        <Text key={i} className="text-slate-50 text-[15px] font-extrabold mb-1.5 mt-2">
          {line.slice(2)}
        </Text>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <Text key={i} className="text-[#38BDF8] text-[13px] font-bold mb-1 mt-1.5">
          {line.slice(3)}
        </Text>
      );
    }
    if (line.startsWith('- ') || line.startsWith('• ')) {
      return (
        <View key={i} className="flex-row mb-0.5 pl-1">
          <Text className="text-[#38BDF8] mr-2">•</Text>
          <Text className="text-slate-50 text-[13px] leading-5 flex-1">
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
          <Text className="text-slate-50 text-[13px] leading-5 flex-1">
            {renderInline(line.replace(/^\d+\. /, ''))}
          </Text>
        </View>
      );
    }
    if (line.trim() === '') return <View key={i} style={{ height: 5 }} />;
    return (
      <Text key={i} className="text-slate-50 text-[13px] leading-5 mb-0.5">
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
        <Text key={i} className="text-slate-50 font-bold">
          {part.slice(2, -2)}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

interface Props {
  message: ChatMessage;
}

export default function ChatBubble({ message }: Props) {
  const isUser = message.role === 'user';

  return (
    <View
      className={`flex-row items-end mb-3 ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      {!isUser && (
        <View className="w-8 h-8 rounded-lg bg-blue-600 items-center justify-center mr-2">
          <Bot size={14} color="#fff" />
        </View>
      )}

      <View className={`max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <View
          className={`px-3.5 py-2.5 ${
            isUser
              ? 'bg-blue-600 rounded-[18px] rounded-br-[4px]'
              : 'bg-slate-800/70 border border-slate-700/50 rounded-[18px] rounded-bl-[4px]'
          }`}
        >
          {isUser ? (
            <Text className="text-white text-[13px] leading-5">{message.text}</Text>
          ) : (
            <View>{renderMarkdown(message.text)}</View>
          )}
        </View>

        {message.time && (
          <Text className="text-slate-600 text-[10px] mt-1 px-1">{message.time}</Text>
        )}
      </View>
    </View>
  );
}