// src/app/(app)/analyze.tsx
import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import {
  FileText, Camera, Edit3, Upload, CheckCircle, ArrowRight,
  Info, Plus, AlertCircle, Trash2,
} from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

const API = process.env.EXPO_PUBLIC_API_URL || 'https://leveliq-production.up.railway.app';

type Tab = 'pdf' | 'screenshot' | 'manual';

// ══════════════════════════════════════════════════════════════
// Shared: Run analysis after resolving holdings
// ══════════════════════════════════════════════════════════════
async function runAnalysis(resolved: any[], userId: string) {
  const holdings = resolved.map((r: any) => ({
    scheme_code: r.scheme_code,
    scheme_name: r.scheme_name,
    value: r.value,
  }));

  const res = await fetch(`${API}/api/portfolio/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ holdings, user_id: userId }),
  });

  if (!res.ok) throw new Error('Analysis failed');
  return await res.json();
}

// ══════════════════════════════════════════════════════════════
// PDF UPLOAD SECTION
// ══════════════════════════════════════════════════════════════
function PDFUpload({ userId, onComplete }: { userId: string; onComplete: (token: string) => void }) {
  const [status, setStatus] = useState<'idle' | 'parsing' | 'confirm' | 'analyzing' | 'error'>('idle');
  const [parsed, setParsed] = useState<any>(null);
  const [error, setError] = useState('');

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      setStatus('parsing');
      setError('');

      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: 'application/pdf',
      } as any);

      const res = await fetch(`${API}/api/parse/pdf`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!data.success || !data.resolved?.length) {
        setError(data.error || 'No funds found. Try a CAMS or KFin statement.');
        setStatus('error');
        return;
      }

      setParsed(data);
      setStatus('confirm');
    } catch (err: any) {
      console.error('PDF upload error:', err);
      setError('Failed to parse PDF. Please try again.');
      setStatus('error');
    }
  };

  const handleAnalyze = async () => {
    setStatus('analyzing');
    try {
      const result = await runAnalysis(parsed.resolved, userId);
      if (result?.report?.share_token) {
        onComplete(result.report.share_token);
      } else {
        throw new Error('Invalid analysis response');
      }
    } catch (err) {
      setError('Analysis failed. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'parsing') {
    return (
      <View className="items-center py-12">
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text className="text-slate-50 font-bold text-[15px] mt-4">Reading your portfolio...</Text>
        <Text className="text-slate-500 text-[13px] mt-1.5">Extracting all holdings from PDF</Text>
      </View>
    );
  }

  if (status === 'analyzing') {
    return (
      <View className="items-center py-12">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-slate-50 font-bold text-[15px] mt-4">Analyzing your portfolio...</Text>
        <Text className="text-slate-500 text-[13px] mt-1.5">Calculating health score and overlaps</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View>
        <View className="flex-row items-start bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
          <AlertCircle size={16} color="#EF4444" style={{ marginTop: 1 }} />
          <Text className="text-red-300 text-[13px] ml-2.5 flex-1">{error}</Text>
        </View>
        <TouchableOpacity onPress={() => setStatus('idle')} className="border border-sky-500/30 py-3.5 rounded-xl items-center">
          <Text className="text-[#38BDF8] font-bold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'confirm' && parsed) {
    return (
      <View>
        <View className="flex-row items-center mb-4">
          <CheckCircle size={18} color="#22C55E" />
          <Text className="text-slate-100 text-sm font-semibold ml-2">
            Found {parsed.stats.resolved_count} funds
            {parsed.stats.unresolved_count > 0 && ` · ${parsed.stats.unresolved_count} unmatched`}
          </Text>
        </View>

        <ScrollView style={{ maxHeight: 280 }} className="mb-4">
          {parsed.resolved.map((f: any, i: number) => (
            <View key={i} className="flex-row items-center justify-between bg-green-500/5 border border-green-500/15 rounded-[10px] px-3.5 py-2.5 mb-2">
              <View className="flex-1 pr-2">
                <Text className="text-slate-200 text-[13px] font-semibold" numberOfLines={2}>{f.scheme_name}</Text>
                <Text className="text-slate-500 text-[11px] mt-0.5">{f.input_name}</Text>
              </View>
              <View className="items-end">
                <Text className="text-slate-100 text-[13px] font-semibold">₹{f.value?.toLocaleString('en-IN')}</Text>
                <Text className="text-green-500 text-[10px]">{f.confidence}% match</Text>
              </View>
            </View>
          ))}
          {parsed.unresolved?.map((f: any, i: number) => (
            <View key={i} className="flex-row items-center justify-between bg-red-500/5 border border-red-500/15 rounded-[10px] px-3.5 py-2.5 mb-2">
              <Text className="text-red-300 text-[13px] flex-1">{f.name}</Text>
              <Text className="text-red-500 text-[11px]">Not matched</Text>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity onPress={handleAnalyze} className="bg-blue-600 py-3.5 rounded-xl items-center justify-center flex-row">
          <Text className="text-white font-bold text-[14px] mr-2">Analyze {parsed.stats.resolved_count} Funds</Text>
          <ArrowRight size={16} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setStatus('idle')} className="mt-2.5 py-2">
          <Text className="text-slate-500 text-xs text-center underline">Upload different file</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        onPress={pickPDF}
        activeOpacity={0.8}
        className="border-2 border-dashed border-sky-500/30 rounded-2xl p-8 items-center bg-sky-500/5"
      >
        <View className="w-14 h-14 rounded-2xl bg-sky-500/10 border border-sky-500/25 items-center justify-center mb-3.5">
          <Upload size={24} color="#38BDF8" />
        </View>
        <Text className="text-slate-50 font-semibold text-[15px] mb-1.5">Tap to select CAMS / KFin PDF</Text>
        <Text className="text-slate-500 text-xs mb-3.5">or browse from Files</Text>
        <View className="bg-slate-800 px-3 py-1 rounded-full">
          <Text className="text-slate-400 text-[11px] font-bold">PDF only · Max 10MB</Text>
        </View>
      </TouchableOpacity>

      <View className="flex-row bg-sky-500/5 border border-sky-500/15 rounded-xl p-3.5 mt-3.5">
        <Info size={14} color="#38BDF8" style={{ marginTop: 2 }} />
        <View className="ml-2.5 flex-1">
          <Text className="text-[#38BDF8] text-xs font-semibold mb-1">How to get your CAS statement</Text>
          <Text className="text-slate-500 text-xs leading-5">
            Visit mfcentral.com → Login with PAN + OTP → Consolidated Account Statement → Download PDF → Upload here.
          </Text>
        </View>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// SCREENSHOT UPLOAD SECTION
// ══════════════════════════════════════════════════════════════
function ScreenshotUpload({ userId, onComplete }: { userId: string; onComplete: (token: string) => void }) {
  const [status, setStatus] = useState<'idle' | 'parsing' | 'confirm' | 'analyzing' | 'error'>('idle');
  const [parsed, setParsed] = useState<any>(null);
  const [error, setError] = useState('');

  const pickImage = async () => {
    try {
      const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permStatus !== 'granted') {
        Alert.alert('Permission needed', 'Please allow gallery access to upload screenshots.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setStatus('parsing');
      setError('');

      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName || 'screenshot.jpg',
        type: asset.mimeType || 'image/jpeg',
      } as any);

      const res = await fetch(`${API}/api/parse/screenshot`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!data.success || !data.resolved?.length) {
        setError(data.error || 'Could not read funds. Try a clearer image.');
        setStatus('error');
        return;
      }

      setParsed(data);
      setStatus('confirm');
    } catch (err) {
      console.error('Screenshot error:', err);
      setError('Failed to read screenshot. Please try again.');
      setStatus('error');
    }
  };

  const handleAnalyze = async () => {
    setStatus('analyzing');
    try {
      const result = await runAnalysis(parsed.resolved, userId);
      if (result?.report?.share_token) {
        onComplete(result.report.share_token);
      } else {
        throw new Error('Invalid analysis response');
      }
    } catch (err) {
      setError('Analysis failed. Please try again.');
      setStatus('error');
    }
  };

  if (status === 'parsing') {
    return (
      <View className="items-center py-12">
        <ActivityIndicator size="large" color="#EC4899" />
        <Text className="text-slate-50 font-bold text-[15px] mt-4">AI is reading your screenshot...</Text>
        <Text className="text-slate-500 text-[13px] mt-1.5">Extracting fund names and values</Text>
      </View>
    );
  }

  if (status === 'analyzing') {
    return (
      <View className="items-center py-12">
        <ActivityIndicator size="large" color="#22C55E" />
        <Text className="text-slate-50 font-bold text-[15px] mt-4">Analyzing your portfolio...</Text>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View>
        <View className="flex-row bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-4">
          <AlertCircle size={16} color="#EF4444" style={{ marginTop: 1 }} />
          <Text className="text-red-300 text-[13px] ml-2.5 flex-1">{error}</Text>
        </View>
        <TouchableOpacity onPress={() => setStatus('idle')} className="border border-sky-500/30 py-3.5 rounded-xl items-center">
          <Text className="text-[#38BDF8] font-bold">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'confirm' && parsed) {
    return (
      <View>
        <View className="flex-row items-center mb-4">
          <CheckCircle size={18} color="#22C55E" />
          <Text className="text-slate-100 text-sm font-semibold ml-2">Found {parsed.stats.resolved_count} funds</Text>
        </View>

        <ScrollView style={{ maxHeight: 280 }} className="mb-4">
          {parsed.resolved.map((f: any, i: number) => (
            <View key={i} className="flex-row items-center justify-between bg-pink-500/5 border border-pink-500/15 rounded-[10px] px-3.5 py-2.5 mb-2">
              <View className="flex-1 pr-2">
                <Text className="text-slate-200 text-[13px] font-semibold" numberOfLines={2}>{f.scheme_name}</Text>
                <Text className="text-slate-500 text-[11px] mt-0.5">{f.input_name}</Text>
              </View>
              <View className="items-end">
                <Text className="text-slate-100 text-[13px] font-semibold">₹{f.value?.toLocaleString('en-IN')}</Text>
                <Text className="text-pink-300 text-[10px]">{f.confidence}% match</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity onPress={handleAnalyze} className="bg-blue-600 py-3.5 rounded-xl items-center justify-center flex-row">
          <Text className="text-white font-bold text-[14px] mr-2">Analyze {parsed.stats.resolved_count} Funds</Text>
          <ArrowRight size={16} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setStatus('idle')} className="mt-2.5 py-2">
          <Text className="text-slate-500 text-xs text-center underline">Upload different image</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        onPress={pickImage}
        activeOpacity={0.8}
        className="border-2 border-dashed border-pink-500/30 rounded-2xl p-8 items-center bg-pink-500/5"
      >
        <View className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/25 items-center justify-center mb-3.5">
          <Camera size={24} color="#F9A8D4" />
        </View>
        <Text className="text-slate-50 font-semibold text-[15px] mb-1.5">Upload a portfolio screenshot</Text>
        <Text className="text-slate-500 text-xs mb-3.5">Zerodha · Groww · Angel One · Kuvera</Text>
        <View className="bg-pink-500/10 border border-pink-500/20 px-3 py-1 rounded-full">
          <Text className="text-pink-300 text-[11px] font-bold">JPG / PNG · Max 5MB</Text>
        </View>
      </TouchableOpacity>

      <View className="bg-pink-500/5 border border-pink-500/15 rounded-xl p-3 mt-3">
        <Text className="text-pink-300 text-xs text-center">🤖 AI reads your screenshot automatically. You just confirm what it found.</Text>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// MANUAL ENTRY SECTION
// ══════════════════════════════════════════════════════════════
function ManualEntry({ userId, onComplete }: { userId: string; onComplete: (token: string) => void }) {
  const [holdings, setHoldings] = useState([
    { name: '', value: '', scheme_code: '' },
    { name: '', value: '', scheme_code: '' },
    { name: '', value: '', scheme_code: '' },
  ]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const searchFunds = async (query: string, index: number) => {
    setActiveIndex(index);
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`${API}/api/mf/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSuggestions(data.funds || []);
    } catch {
      setSuggestions([]);
    }
  };

  const selectFund = (fund: any, index: number) => {
    const n = [...holdings];
    n[index].name = fund.scheme_name;
    n[index].scheme_code = fund.scheme_code;
    setHoldings(n);
    setSuggestions([]);
    setActiveIndex(null);
  };

  const updateField = (index: number, field: 'name' | 'value', value: string) => {
    const n = [...holdings];
    n[index][field] = value;
    if (field === 'name') n[index].scheme_code = '';
    setHoldings(n);
  };

  const removeRow = (index: number) => {
    if (holdings.length <= 2) return;
    setHoldings(holdings.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    const filled = holdings.filter(h => h.name && h.value);
    if (filled.length < 2) {
      Alert.alert('Add more', 'Please add at least 2 holdings to analyze.');
      return;
    }
    setLoading(true);
    try {
      const holdingsWithCodes = filled.map(h => ({
        scheme_code: h.scheme_code || '100016',
        scheme_name: h.name,
        value: parseFloat(h.value.replace(/[₹,]/g, '')) || 10000,
      }));

      const result = await runAnalysis(holdingsWithCodes, userId);
      if (result?.report?.share_token) {
        onComplete(result.report.share_token);
      } else {
        throw new Error('Invalid response');
      }
    } catch {
      Alert.alert('Failed', 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text className="text-slate-500 text-[13px] mb-4">Type fund name to search and select from dropdown.</Text>

      {holdings.map((h, i) => (
        <View key={i} className="mb-3">
          <View className="flex-row gap-2">
            <View className="flex-1 relative">
              <TextInput
                className="bg-[#0b1326] border border-sky-500/15 rounded-xl px-3.5 py-3 text-slate-50 text-[13px]"
                placeholder="Search fund e.g. HDFC Flexi"
                placeholderTextColor="#475569"
                value={h.name}
                onChangeText={(text) => {
                  updateField(i, 'name', text);
                  searchFunds(text, i);
                }}
                onBlur={() => setTimeout(() => setSuggestions([]), 200)}
              />
              {h.scheme_code ? (
                <View className="absolute right-3 top-3">
                  <CheckCircle size={16} color="#22C55E" />
                </View>
              ) : null}

              {activeIndex === i && suggestions.length > 0 && (
                <View className="absolute top-[46px] left-0 right-0 bg-[#0F172A] border border-sky-500/30 rounded-xl mt-1 max-h-[200px] z-50">
                  <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                    {suggestions.map((fund: any) => (
                      <TouchableOpacity
                        key={fund.scheme_code}
                        onPress={() => selectFund(fund, i)}
                        className="px-3.5 py-2.5 border-b border-slate-700/50"
                      >
                        <Text className="text-slate-50 text-xs font-medium">{fund.scheme_name}</Text>
                        <Text className="text-slate-500 text-[10px] mt-0.5">{fund.fund_house}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            <TextInput
              className="bg-[#0b1326] border border-sky-500/15 rounded-xl px-3 py-3 text-slate-50 text-[13px] w-[95px]"
              placeholder="₹ amount"
              placeholderTextColor="#475569"
              value={h.value}
              onChangeText={(text) => updateField(i, 'value', text)}
              keyboardType="numeric"
            />

            {holdings.length > 2 && (
              <TouchableOpacity onPress={() => removeRow(i)} className="w-10 items-center justify-center">
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      ))}

      <TouchableOpacity
        onPress={() => setHoldings([...holdings, { name: '', value: '', scheme_code: '' }])}
        className="flex-row items-center border border-sky-500/30 rounded-xl py-2.5 px-4 self-start mb-4"
      >
        <Plus size={14} color="#38BDF8" />
        <Text className="text-[#38BDF8] text-xs font-bold ml-1.5">Add row</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={handleAnalyze}
        disabled={loading}
        className={`bg-blue-600 py-3.5 rounded-xl items-center justify-center flex-row ${loading ? 'opacity-70' : ''}`}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text className="text-white font-bold text-[14px] mr-2">Analyze My Portfolio</Text>
            <ArrowRight size={16} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// MAIN SCREEN
// ══════════════════════════════════════════════════════════════
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'screenshot', label: 'Screenshot', icon: Camera },
  { id: 'manual', label: 'Type it in', icon: Edit3 },
];

export default function AnalyzeScreen() {
  const [active, setActive] = useState<Tab>('manual');
  const { user } = useAuth();
  const router = useRouter();

  const handleComplete = (shareToken: string) => {
    router.push(`/(app)/report/${shareToken}` as any);
  };

  if (!user) {
    return (
      <View className="flex-1 bg-[#050816] items-center justify-center">
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#050816' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="items-center mb-6">
          <View className="bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-full mb-4 flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" />
            <Text className="text-green-400 text-[11px] font-semibold">Portfolio Analysis</Text>
          </View>
          <Text className="text-slate-50 text-[26px] font-extrabold tracking-tight mb-2">Add your portfolio</Text>
          <Text className="text-slate-500 text-[13px] text-center px-4">
            We scan for hidden overlaps and give you a full X-Ray report.
          </Text>
        </View>

        {/* Main Card */}
        <View className="bg-[#0f172a] border border-sky-500/15 rounded-3xl p-5">
          {/* Tabs */}
          <View className="flex-row gap-1.5 p-1.5 bg-black/25 rounded-xl mb-6">
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = active === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setActive(t.id)}
                  className={`flex-1 flex-row items-center justify-center py-2.5 rounded-lg ${isActive ? 'bg-blue-600' : ''}`}
                >
                  <Icon size={13} color={isActive ? '#fff' : '#94A3B8'} />
                  <Text className={`ml-1.5 text-[12px] font-bold ${isActive ? 'text-white' : 'text-slate-400'}`}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {active === 'pdf' && <PDFUpload userId={user.id} onComplete={handleComplete} />}
          {active === 'screenshot' && <ScreenshotUpload userId={user.id} onComplete={handleComplete} />}
          {active === 'manual' && <ManualEntry userId={user.id} onComplete={handleComplete} />}
        </View>

        <Text className="text-slate-600 text-[11px] text-center mt-4">
          🔒 Raw files never stored · Holdings anonymized after analysis
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}