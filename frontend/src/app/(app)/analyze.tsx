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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 18, paddingBottom: 64 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Section */}
        <View className="items-center mb-6 mt-1">
          <View className="flex-row items-center bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full mb-3">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2" />
            <Text className="text-[11px] font-bold text-emerald-400 tracking-wider">
              PORTFOLIO ANALYSIS
            </Text>
          </View>
          <Text className="text-2xl font-black text-slate-100 text-center tracking-tight">
            Add your portfolio
          </Text>
          <Text className="text-xs text-slate-400 text-center mt-1.5 leading-5 px-3">
            We scan for hidden overlaps, expense leakages, and generate a full X-Ray report.
          </Text>
        </View>

        {/* Main Card Container */}
        <View className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
          {/* Segmented Tab Bar */}
          <View className="flex-row bg-slate-950/80 p-1 rounded-2xl mb-5 border border-slate-800">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  activeOpacity={0.7}
                  className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
                    isActive ? 'bg-blue-600 shadow-md' : 'bg-transparent'
                  }`}
                >
                  <Icon size={14} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                  <Text
                    className={`ml-1.5 text-xs font-bold ${
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

        {/* Privacy Note */}
        <Text className="text-[11px] text-slate-500 text-center mt-4 font-medium">
          🔒 Raw files never stored · Holdings anonymized after analysis
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}