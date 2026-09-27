// src/app/(app)/analyze.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

import { Tab, TABS } from '../../components/analyze/types';
import { PDFUpload, ScreenshotUpload } from '../../components/analyze/UploadTab';
import { ManualEntryTab } from '../../components/analyze/ManualEntryTab';

export default function AnalyzeScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('manual');
  const { user } = useAuth();
  const router = useRouter();

  const handleComplete = (shareToken: string) => {
    router.push(`/(app)/report/${shareToken}` as any);
  };

  if (!user) {
    return (
      <View className="flex-1 bg-slate-950 items-center justify-center">
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-slate-950"
      behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 20}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: 20, paddingBottom: 140 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets={true}
      >
        {/* Header Section */}
        <View className="mb-8 mt-6">
          <Text className="text-3xl font-bold text-white tracking-tight mb-2">
            Add Portfolio
          </Text>
          <Text className="text-sm text-slate-400 leading-5">
            Discover hidden overlaps, high expense ratios, and optimize your investments with a complete X-Ray scan.
          </Text>
        </View>

        {/* Main Card Container */}
        <View className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-5 mb-6">
          
          {/* Segmented Tab Bar */}
          <View className="flex-row bg-slate-950 p-1.5 rounded-xl mb-6 border border-slate-800/60 gap-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.8}
                  className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${
                    isActive ? 'bg-slate-800' : 'bg-transparent'
                  }`}
                >
                  <Icon size={14} color={isActive ? '#38BDF8' : '#64748B'} />
                  <Text
                    numberOfLines={1}
                    className={`ml-1.5 text-[11px] font-semibold tracking-wide ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Active Tab View */}
          <View className="min-h-[250px]">
            {activeTab === 'pdf' && (
              <PDFUpload userId={user.id} onComplete={handleComplete} />
            )}
            {activeTab === 'screenshot' && (
              <ScreenshotUpload userId={user.id} onComplete={handleComplete} />
            )}
            {activeTab === 'manual' && (
              <ManualEntryTab userId={user.id} onComplete={handleComplete} />
            )}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}