import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Upload, Camera, CheckCircle, ArrowRight, Info, AlertCircle } from 'lucide-react-native';

import { ParsedResponse, PickedFile } from './types';
import { parseUploadFile, runAnalysis } from './analyzeApi';

// ── Generic Upload Flow ──
interface UploadFlowProps {
  userId: string;
  onComplete: (token: string) => void;
  parseEndpoint: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  badgeText: string;
  tip?: React.ReactNode;
  pickFile: () => Promise<PickedFile | null | 'permission-denied'>;
  parsingTitle: string;
  parsingSubtitle: string;
  themeColor: 'sky' | 'pink';
}

function UploadFlowView({
  userId,
  onComplete,
  parseEndpoint,
  icon,
  title,
  subtitle,
  badgeText,
  tip,
  pickFile,
  parsingTitle,
  parsingSubtitle,
  themeColor,
}: UploadFlowProps) {
  const [status, setStatus] = useState<'idle' | 'parsing' | 'confirm' | 'analyzing' | 'error'>('idle');
  const [parsed, setParsed] = useState<ParsedResponse | null>(null);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const handlePick = async () => {
    const file = await pickFile();
    if (!file) return;
    if (file === 'permission-denied') {
      Alert.alert('Permission Needed', 'Please allow gallery access to upload screenshots.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('parsing');
    setError('');

    try {
      const data = await parseUploadFile(parseEndpoint, file, controller.signal);
      if (!mountedRef.current) return;

      if (!data.success || !data.resolved?.length) {
        setError(data.error || 'No mutual fund holdings found. Try a clearer file.');
        setStatus('error');
        return;
      }

      setParsed(data);
      setStatus('confirm');
    } catch (err: unknown) {
      if (!mountedRef.current) return;
      if (err instanceof Error && err.name === 'AbortError') return;
      setError('Failed to extract data from the file. Please try again.');
      setStatus('error');
    }
  };

  const handleAnalyze = async () => {
    if (!parsed?.resolved?.length) return;
    setStatus('analyzing');

    let token: string | null = null;
    try {
      token = await runAnalysis(parsed.resolved, userId);
    } catch (err: any) {
      console.error('UploadTab analysis error:', err);
      if (mountedRef.current) {
        setError(err?.message || 'Analysis failed. Please check your connection and try again.');
        setStatus('error');
      }
      return;
    }

    if (mountedRef.current && token) {
      onComplete(token);
    }
  };

  // 1. Parsing Spinner
  if (status === 'parsing') {
    return (
      <View className="items-center py-12">
        <ActivityIndicator size="large" color={themeColor === 'sky' ? '#38BDF8' : '#EC4899'} />
        <Text className="text-sm font-bold text-slate-100 mt-4">{parsingTitle}</Text>
        <Text className="text-xs text-slate-400 mt-1">{parsingSubtitle}</Text>
      </View>
    );
  }

  // 2. Analyzing Spinner
  if (status === 'analyzing') {
    return (
      <View className="items-center py-12">
        <ActivityIndicator size="large" color="#10B981" />
        <Text className="text-sm font-bold text-slate-100 mt-4">Analyzing your portfolio...</Text>
        <Text className="text-xs text-slate-400 mt-1">Calculating health scores and overlap metrics</Text>
      </View>
    );
  }

  // 3. Error Banner
  if (status === 'error') {
    return (
      <View>
        <View className="flex-row items-start bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 mb-4">
          <AlertCircle size={16} color="#F43F5E" className="mt-0.5" />
          <Text className="text-xs text-rose-300 ml-2.5 flex-1 leading-4">{error}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setStatus('idle')}
          className="h-11 rounded-xl border border-sky-500/40 items-center justify-center"
        >
          <Text className="text-xs font-bold text-sky-400">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 4. Confirm & Preview Detected Holdings
  if (status === 'confirm' && parsed) {
    const resolved = parsed.resolved || [];
    const unresolved = parsed.unresolved || [];
    const resolvedCount = parsed.stats?.resolved_count ?? resolved.length;
    const unresolvedCount = parsed.stats?.unresolved_count ?? unresolved.length;

    return (
      <View>
        <View className="flex-row items-center mb-3">
          <CheckCircle size={17} color="#10B981" />
          <Text className="text-xs font-bold text-slate-100 ml-2">
            Found {resolvedCount} funds{unresolvedCount > 0 ? ` · ${unresolvedCount} unmatched` : ''}
          </Text>
        </View>

        {/* Holdings Preview List */}
        <ScrollView className="max-h-64 mb-4">
          {resolved.map((f, i) => (
            <View
              key={`${f.scheme_code}-${i}`}
              className="flex-row items-center justify-between bg-slate-800/80 border border-slate-700/70 rounded-xl px-3.5 py-2.5 mb-2"
            >
              <View className="flex-1 pr-2">
                <Text className="text-xs font-semibold text-slate-200" numberOfLines={1}>
                  {f.scheme_name}
                </Text>
                {f.input_name ? (
                  <Text className="text-[10px] text-slate-400 mt-0.5">{f.input_name}</Text>
                ) : null}
              </View>
              <View className="items-end">
                <Text className="text-xs font-bold text-slate-100">
                  ₹{Number(f.value ?? 0).toLocaleString('en-IN')}
                </Text>
                {typeof f.confidence === 'number' && (
                  <Text className="text-[10px] text-emerald-400 font-medium">
                    {f.confidence}% match
                  </Text>
                )}
              </View>
            </View>
          ))}

          {unresolved.map((f, i) => (
            <View
              key={`unres-${i}`}
              className="flex-row items-center justify-between bg-rose-500/10 border border-rose-500/25 rounded-xl px-3.5 py-2.5 mb-2"
            >
              <Text className="text-xs text-rose-300 flex-1">{f.name}</Text>
              <Text className="text-[10px] text-rose-400 font-bold">Not matched</Text>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity
          onPress={handleAnalyze}
          activeOpacity={0.8}
          className="h-12 rounded-xl bg-blue-600 flex-row items-center justify-center shadow-md mb-2"
        >
          <Text className="text-xs font-bold text-white mr-1.5">
            Analyze {resolvedCount} Funds
          </Text>
          <ArrowRight size={15} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setStatus('idle')}
          className="py-2 items-center"
        >
          <Text className="text-[11px] text-slate-400 underline">Upload a different file</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 5. Idle Upload Dropzone
  const isSky = themeColor === 'sky';
  return (
    <View>
      <TouchableOpacity
        onPress={handlePick}
        activeOpacity={0.8}
        className={`border-2 border-dashed rounded-2xl p-6 items-center ${
          isSky
            ? 'border-sky-500/30 bg-sky-500/5'
            : 'border-pink-500/30 bg-pink-500/5'
        }`}
      >
        <View
          className={`w-14 h-14 rounded-2xl items-center justify-center mb-3 border ${
            isSky
              ? 'bg-sky-500/15 border-sky-400/30'
              : 'bg-pink-500/15 border-pink-400/30'
          }`}
        >
          {icon}
        </View>
        <Text className="text-sm font-bold text-slate-100 mb-1">{title}</Text>
        <Text className="text-xs text-slate-400 mb-3">{subtitle}</Text>
        <View className="bg-slate-800 border border-slate-700/80 px-3 py-1 rounded-full">
          <Text className="text-[10px] font-bold text-slate-300">{badgeText}</Text>
        </View>
      </TouchableOpacity>
      {tip}
    </View>
  );
}

// ── PDF Upload Component ──
export function PDFUpload({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete: (token: string) => void;
}) {
  const pickFile = useCallback(async (): Promise<PickedFile | null> => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    const file = result.assets[0];
    return { uri: file.uri, name: file.name, type: 'application/pdf' };
  }, []);

  return (
    <UploadFlowView
      userId={userId}
      onComplete={onComplete}
      parseEndpoint="/api/parse/pdf"
      themeColor="sky"
      icon={<Upload size={24} color="#38BDF8" />}
      title="Tap to select CAMS / KFin PDF"
      subtitle="or browse from Files"
      badgeText="PDF only · Max 10MB"
      parsingTitle="Reading your portfolio..."
      parsingSubtitle="Extracting all mutual fund folios from PDF"
      pickFile={pickFile}
      tip={
        <View className="flex-row bg-slate-900 border border-slate-800 rounded-xl p-3.5 mt-3 items-start">
          <Info size={14} color="#38BDF8" className="mt-0.5" />
          <View className="ml-2.5 flex-1">
            <Text className="text-xs font-bold text-sky-400 mb-0.5">
              How to get your CAS statement
            </Text>
            <Text className="text-[11px] text-slate-400 leading-4">
              Visit mfcentral.com → Consolidated Account Statement → Download PDF → Upload here.
            </Text>
          </View>
        </View>
      }
    />
  );
}

// ── Screenshot Upload Component ──
export function ScreenshotUpload({
  userId,
  onComplete,
}: {
  userId: string;
  onComplete: (token: string) => void;
}) {
  const pickFile = useCallback(async (): Promise<PickedFile | null | 'permission-denied'> => {
    const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== 'granted') return 'permission-denied';

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      name: asset.fileName || 'screenshot.jpg',
      type: asset.mimeType || 'image/jpeg',
    };
  }, []);

  return (
    <UploadFlowView
      userId={userId}
      onComplete={onComplete}
      parseEndpoint="/api/parse/screenshot"
      themeColor="pink"
      icon={<Camera size={24} color="#F472B6" />}
      title="Upload a portfolio screenshot"
      subtitle="Zerodha · Groww · Angel One · Kuvera"
      badgeText="JPG / PNG · Max 5MB"
      parsingTitle="Reading your screenshot..."
      parsingSubtitle="Detecting fund schemes and values via OCR"
      pickFile={pickFile}
      tip={
        <View className="bg-pink-500/5 border border-pink-500/20 rounded-xl p-3 mt-3">
          <Text className="text-[11px] text-pink-300 text-center leading-4">
            Upload a clear screenshot. You can review detected holdings before continuing.
          </Text>
        </View>
      }
    />
  );
}
