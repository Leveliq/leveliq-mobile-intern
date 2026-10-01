// src/components/analyze/QuickToolsGrid.tsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Search, CreditCard, GraduationCap, LineChart } from 'lucide-react-native';

const TOOLS = [
  {
    title: 'Pre-SIP Check',
    description: 'Check fund overlap & metrics',
    icon: Search,
    route: '/(app)/sip-checker',
    color: '#38BDF8',
  },
  {
    title: 'Debt Check',
    description: 'Manage & optimize loans',
    icon: CreditCard,
    route: '/(app)/debt',
    color: '#F43F5E',
  },
  {
    title: 'Starter IQ',
    description: 'Beginner investing guides',
    icon: GraduationCap,
    route: '/(app)/starter-iq',
    color: '#10B981',
  },
  {
    title: 'Stocks IQ',
    description: 'Explore stock insights',
    icon: LineChart,
    route: '/(app)/stocks-iq',
    color: '#F59E0B',
  },
];

export function QuickToolsGrid() {
  const router = useRouter();

  return (
    <View className="mt-2">
      <Text className="text-slate-200 text-base font-bold mb-3 tracking-wide">
        Explore Smart Tools
      </Text>
      
      {/* 2x2 Grid Layout */}
      <View className="flex-row flex-wrap justify-between gap-y-3">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <TouchableOpacity
              key={tool.title}
              activeOpacity={0.7}
              onPress={() => router.push(tool.route as any)}
              className="w-[48%] bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 justify-between"
              style={{ minHeight: 110 }}
            >
              <View 
                className="w-9 h-9 rounded-xl items-center justify-center mb-2"
                style={{ backgroundColor: `${tool.color}15`, borderWidth: 1, borderColor: `${tool.color}30` }}
              >
                <Icon size={18} color={tool.color} />
              </View>

              <View>
                <Text className="text-white text-xs font-bold mb-0.5" numberOfLines={1}>
                  {tool.title}
                </Text>
                <Text className="text-slate-400 text-[10px] leading-3.5" numberOfLines={2}>
                  {tool.description}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}