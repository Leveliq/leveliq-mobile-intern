// src/app/(app)/analyze.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, useWindowDimensions,
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
// Theme — mirrors AuthScreen.tsx exactly, single source of truth
// ══════════════════════════════════════════════════════════════
const COLORS = {
  bg: '#050816',
  card: 'rgba(15, 23, 42, 0.88)',
  cardBorder: 'rgba(56, 189, 248, 0.15)',
  input: '#0b1326',
  inputBorder: 'rgba(148, 163, 184, 0.15)',
  accent: '#38BDF8',
  primary: '#2563EB',
  primaryShadow: '#38BDF8',
  textPrimary: '#F8FAFC',
  textMuted: '#94A3B8',
  textFaint: '#475569',
  green: '#22C55E',
  greenBg: 'rgba(34, 197, 94, 0.08)',
  greenBorder: 'rgba(34, 197, 94, 0.18)',
  red: '#EF4444',
  redBg: 'rgba(239, 68, 68, 0.1)',
  redBorder: 'rgba(239, 68, 68, 0.25)',
  pink: '#EC4899',
  pinkLight: '#F9A8D4',
  pinkBg: 'rgba(236, 72, 153, 0.06)',
  pinkBorder: 'rgba(236, 72, 153, 0.16)',
};

const cardShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 12 },
  shadowOpacity: 0.5,
  shadowRadius: 24,
  elevation: 10,
};

const primaryButtonStyle = (disabled?: boolean) => ({
  backgroundColor: COLORS.primary,
  borderRadius: 12,
  paddingVertical: 14,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
  flexDirection: 'row' as const,
  shadowColor: COLORS.primaryShadow,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 10,
  elevation: 4,
  opacity: disabled ? 0.6 : 1,
});

const inputStyle = (hasError?: boolean) => ({
  backgroundColor: COLORS.input,
  color: COLORS.textPrimary,
  paddingHorizontal: 13,
  paddingVertical: 12,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: hasError ? COLORS.red : COLORS.inputBorder,
  fontSize: 13,
  minHeight: 46,
});

// ══════════════════════════════════════════════════════════════
// Shared types + analyze call
// ══════════════════════════════════════════════════════════════
type ResolvedFund = {
  scheme_code: string;
  scheme_name: string;
  input_name?: string;
  value: number;
  confidence?: number;
};
type ParsedResponse = {
  success: boolean;
  error?: string;
  stats?: { resolved_count: number; unresolved_count: number };
  resolved?: ResolvedFund[];
  unresolved?: { name: string }[];
};

async function runAnalysis(resolved: ResolvedFund[], userId: string) {
  const holdings = resolved.map((r) => ({
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
  const data = await res.json();
  if (!data?.report?.share_token) throw new Error('Invalid analysis response');
  return data.report.share_token as string;
}

// ══════════════════════════════════════════════════════════════
// Small shared pieces
// ══════════════════════════════════════════════════════════════
function StatusSpinner({ color, title, subtitle }: { color: string; title: string; subtitle?: string }) {
  return (
    <View className="items-center py-12">
      <ActivityIndicator size="large" color={color} />
      <Text style={{ color: COLORS.textPrimary, fontWeight: '700', fontSize: 15, marginTop: 16 }}>{title}</Text>
      {subtitle ? <Text style={{ color: COLORS.textMuted, fontSize: 13, marginTop: 6 }}>{subtitle}</Text> : null}
    </View>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', backgroundColor: COLORS.redBg, borderColor: COLORS.redBorder, borderWidth: 1, borderRadius: 12, padding: 14, marginBottom: 16 }}>
        <AlertCircle size={16} color={COLORS.red} style={{ marginTop: 1 }} />
        <Text style={{ color: '#FCA5A5', fontSize: 13, marginLeft: 10, flex: 1 }}>{message}</Text>
      </View>
      <TouchableOpacity
        onPress={onRetry}
        style={{ borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}
      >
        <Text style={{ color: COLORS.accent, fontWeight: '700' }}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

function ResolvedList({
  parsed, accent, accentBg, accentBorder, confidenceColor,
}: {
  parsed: ParsedResponse; accent: string; accentBg: string; accentBorder: string; confidenceColor: string;
}) {
  const resolved = parsed.resolved ?? [];
  const unresolved = parsed.unresolved ?? [];
  return (
    <ScrollView style={{ maxHeight: 280 }} className="mb-4">
      {resolved.map((f, i) => (
        <View key={`${f.scheme_code}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: accentBg, borderColor: accentBorder, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 }}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600' }} numberOfLines={2}>{f.scheme_name}</Text>
            {f.input_name ? <Text style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 2 }}>{f.input_name}</Text> : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' }}>
              ₹{Number(f.value ?? 0).toLocaleString('en-IN')}
            </Text>
            {typeof f.confidence === 'number' && (
              <Text style={{ color: confidenceColor, fontSize: 10 }}>{f.confidence}% match</Text>
            )}
          </View>
        </View>
      ))}
      {unresolved.map((f, i) => (
        <View key={`unres-${i}`} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.redBg, borderColor: COLORS.redBorder, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 8 }}>
          <Text style={{ color: '#FCA5A5', fontSize: 13, flex: 1 }}>{f.name}</Text>
          <Text style={{ color: COLORS.red, fontSize: 11 }}>Not matched</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ══════════════════════════════════════════════════════════════
// Generic file-based upload flow (used by both PDF + Screenshot)
// ══════════════════════════════════════════════════════════════
type PickedFile = { uri: string; name: string; type: string };

function UploadFlow({
  userId, onComplete, parseEndpoint,
  accent, accentBg, accentBorder, confidenceColor,
  icon, title, subtitle, badgeText, tip,
  pickFile, parsingTitle, parsingSubtitle,
}: {
  userId: string;
  onComplete: (token: string) => void;
  parseEndpoint: string;
  accent: string; accentBg: string; accentBorder: string; confidenceColor: string;
  icon: React.ReactNode; title: string; subtitle: string; badgeText: string; tip?: React.ReactNode;
  pickFile: () => Promise<PickedFile | null | 'permission-denied'>;
  parsingTitle: string; parsingSubtitle: string;
}) {
  const [status, setStatus] = useState<'idle' | 'parsing' | 'confirm' | 'analyzing' | 'error'>('idle');
  const [parsed, setParsed] = useState<ParsedResponse | null>(null);
  const [error, setError] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => () => {
    mountedRef.current = false;
    abortRef.current?.abort();
  }, []);

  const handlePick = async () => {
    const file = await pickFile();
    if (!file) return;
    if (file === 'permission-denied') {
      Alert.alert('Permission needed', 'Please allow access to continue.');
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('parsing');
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', { uri: file.uri, name: file.name, type: file.type } as any);

      const res = await fetch(`${API}${parseEndpoint}`, { method: 'POST', body: formData, signal: controller.signal });
      const data: ParsedResponse = await res.json();
      if (!mountedRef.current) return;

      if (!data.success || !data.resolved?.length) {
        setError(data.error || 'No funds found. Try a clearer file.');
        setStatus('error');
        return;
      }
      setParsed(data);
      setStatus('confirm');
    } catch (err: any) {
      if (!mountedRef.current || err?.name === 'AbortError') return;
      setError('Failed to read the file. Please try again.');
      setStatus('error');
    }
  };

  const handleAnalyze = async () => {
    if (!parsed?.resolved?.length) return;
    setStatus('analyzing');
    try {
      const token = await runAnalysis(parsed.resolved, userId);
      if (mountedRef.current) onComplete(token);
    } catch {
      if (mountedRef.current) {
        setError('Analysis failed. Please try again.');
        setStatus('error');
      }
    }
  };

  if (status === 'parsing') return <StatusSpinner color={accent} title={parsingTitle} subtitle={parsingSubtitle} />;
  if (status === 'analyzing') return <StatusSpinner color={COLORS.green} title="Analyzing your portfolio..." subtitle="Calculating health score and overlaps" />;
  if (status === 'error') return <ErrorState message={error} onRetry={() => setStatus('idle')} />;

  if (status === 'confirm' && parsed) {
    const resolvedCount = parsed.stats?.resolved_count ?? parsed.resolved?.length ?? 0;
    const unresolvedCount = parsed.stats?.unresolved_count ?? parsed.unresolved?.length ?? 0;
    return (
      <View>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <CheckCircle size={18} color={COLORS.green} />
          <Text style={{ color: '#F1F5F9', fontSize: 14, fontWeight: '600', marginLeft: 8 }}>
            Found {resolvedCount} funds{unresolvedCount > 0 ? ` · ${unresolvedCount} unmatched` : ''}
          </Text>
        </View>

        <ResolvedList parsed={parsed} accent={accent} accentBg={accentBg} accentBorder={accentBorder} confidenceColor={confidenceColor} />

        <TouchableOpacity onPress={handleAnalyze} style={primaryButtonStyle()}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginRight: 8 }}>Analyze {resolvedCount} Funds</Text>
          <ArrowRight size={16} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setStatus('idle')} style={{ marginTop: 10, paddingVertical: 8 }}>
          <Text style={{ color: COLORS.textFaint, fontSize: 12, textAlign: 'center', textDecorationLine: 'underline' }}>Upload a different file</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        onPress={handlePick}
        activeOpacity={0.8}
        style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: accentBorder, borderRadius: 16, padding: 32, alignItems: 'center', backgroundColor: accentBg }}
      >
        <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: accentBg, borderWidth: 1, borderColor: accentBorder, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          {icon}
        </View>
        <Text style={{ color: COLORS.textPrimary, fontWeight: '600', fontSize: 15, marginBottom: 6 }}>{title}</Text>
        <Text style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 14 }}>{subtitle}</Text>
        <View style={{ backgroundColor: 'rgba(255,255,255,0.06)', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999 }}>
          <Text style={{ color: COLORS.textMuted, fontSize: 11, fontWeight: '700' }}>{badgeText}</Text>
        </View>
      </TouchableOpacity>
      {tip}
    </View>
  );
}

function PDFUpload({ userId, onComplete }: { userId: string; onComplete: (token: string) => void }) {
  const pickFile = useCallback(async (): Promise<PickedFile | null> => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return null;
    const file = result.assets[0];
    return { uri: file.uri, name: file.name, type: 'application/pdf' };
  }, []);

  return (
    <UploadFlow
      userId={userId}
      onComplete={onComplete}
      parseEndpoint="/api/parse/pdf"
      accent={COLORS.accent}
      accentBg={COLORS.greenBg}
      accentBorder={COLORS.greenBorder}
      confidenceColor={COLORS.green}
      icon={<Upload size={24} color={COLORS.accent} />}
      title="Tap to select CAMS / KFin PDF"
      subtitle="or browse from Files"
      badgeText="PDF only · Max 10MB"
      parsingTitle="Reading your portfolio..."
      parsingSubtitle="Extracting all holdings from PDF"
      pickFile={pickFile}
      tip={
        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(56,189,248,0.05)', borderColor: 'rgba(56,189,248,0.15)', borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 14 }}>
          <Info size={14} color={COLORS.accent} style={{ marginTop: 2 }} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={{ color: COLORS.accent, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>How to get your CAS statement</Text>
            <Text style={{ color: COLORS.textFaint, fontSize: 12, lineHeight: 18 }}>
              Visit mfcentral.com → Login with PAN + OTP → Consolidated Account Statement → Download PDF → Upload here.
            </Text>
          </View>
        </View>
      }
    />
  );
}

function ScreenshotUpload({ userId, onComplete }: { userId: string; onComplete: (token: string) => void }) {
  const pickFile = useCallback(async (): Promise<PickedFile | null | 'permission-denied'> => {
    const { status: permStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permStatus !== 'granted') return 'permission-denied';
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0];
    return { uri: asset.uri, name: asset.fileName || 'screenshot.jpg', type: asset.mimeType || 'image/jpeg' };
  }, []);

  return (
    <UploadFlow
      userId={userId}
      onComplete={onComplete}
      parseEndpoint="/api/parse/screenshot"
      accent={COLORS.pink}
      accentBg={COLORS.pinkBg}
      accentBorder={COLORS.pinkBorder}
      confidenceColor={COLORS.pinkLight}
      icon={<Camera size={24} color={COLORS.pinkLight} />}
      title="Upload a portfolio screenshot"
      subtitle="Zerodha · Groww · Angel One · Kuvera"
      badgeText="JPG / PNG · Max 5MB"
      parsingTitle="Reading your screenshot..."
      parsingSubtitle="Finding fund names and values"
      pickFile={pickFile}
      tip={
        <View style={{ backgroundColor: COLORS.pinkBg, borderColor: COLORS.pinkBorder, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12 }}>
          <Text style={{ color: COLORS.pinkLight, fontSize: 12, textAlign: 'center', lineHeight: 18 }}>Upload a clear screenshot. You can review the detected holdings before continuing.</Text>
        </View>
      }
    />
  );
}

// ══════════════════════════════════════════════════════════════
// Manual entry — debounced/abortable search, no fake fallback data
// ══════════════════════════════════════════════════════════════
type HoldingRow = { name: string; value: string; scheme_code: string; touched: boolean };

function useDebouncedFundSearch() {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback((query: string, index: number) => {
    setActiveIndex(index);
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();

    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(`${API}/api/mf/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await res.json();
        setSuggestions(data.funds || []);
      } catch (err: any) {
        if (err?.name !== 'AbortError') setSuggestions([]);
      }
    }, 300);
  }, []);

  const clear = useCallback(() => {
    setSuggestions([]);
    setActiveIndex(null);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();
  }, []);

  return { suggestions, activeIndex, search, clear };
}

function ManualEntry({ userId, onComplete }: { userId: string; onComplete: (token: string) => void }) {
  const [holdings, setHoldings] = useState<HoldingRow[]>([
    { name: '', value: '', scheme_code: '', touched: false },
    { name: '', value: '', scheme_code: '', touched: false },
    { name: '', value: '', scheme_code: '', touched: false },
  ]);
  const [loading, setLoading] = useState(false);
  const { suggestions, activeIndex, search, clear } = useDebouncedFundSearch();
  const { width } = useWindowDimensions();
  const compact = width < 380;

  const selectFund = (fund: any, index: number) => {
    const n = [...holdings];
    n[index] = { ...n[index], name: fund.scheme_name, scheme_code: fund.scheme_code, touched: true };
    setHoldings(n);
    clear();
  };

  const updateField = (index: number, field: 'name' | 'value', value: string) => {
    const n = [...holdings];
    n[index] = { ...n[index], [field]: value, touched: true };
    if (field === 'name') n[index].scheme_code = '';
    setHoldings(n);
  };

  const removeRow = (index: number) => {
    if (holdings.length <= 2) return;
    setHoldings(holdings.filter((_, i) => i !== index));
  };

  // A row only counts if a fund was actually picked from suggestions and the amount is a valid positive number.
  const rowStatus = (h: HoldingRow) => {
    if (!h.touched || (!h.name && !h.value)) return null;
    if (h.name && !h.scheme_code) return 'Select a fund from the suggestions list';
    const amount = parseFloat(h.value.replace(/[₹,]/g, ''));
    if (h.name && h.scheme_code && (!h.value || isNaN(amount) || amount <= 0)) return 'Enter a valid amount';
    return null;
  };

  const handleAnalyze = async () => {
    const errors = holdings.map(rowStatus).filter(Boolean);
    if (errors.length) {
      setHoldings((prev) => prev.map((h) => ({ ...h, touched: true })));
      Alert.alert('Check your entries', errors[0] as string);
      return;
    }

    const valid = holdings.filter((h) => h.scheme_code && h.value);
    if (valid.length < 2) {
      Alert.alert('Add more', 'Please add and select at least 2 holdings to analyze.');
      return;
    }

    setLoading(true);
    try {
      const resolved: ResolvedFund[] = valid.map((h) => ({
        scheme_code: h.scheme_code,
        scheme_name: h.name,
        value: parseFloat(h.value.replace(/[₹,]/g, '')),
      }));
      const token = await runAnalysis(resolved, userId);
      onComplete(token);
    } catch {
      Alert.alert('Failed', 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 16 }}>Type a fund name and select it from the dropdown.</Text>

      {holdings.map((h, i) => {
        const error = h.touched ? rowStatus(h) : null;
        return (
          <View key={i} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: compact ? 'column' : 'row', gap: 8 }}>
              <View style={{ flex: 1, position: 'relative' }}>
                <TextInput
                  style={inputStyle(!!error)}
                  placeholder="Search fund e.g. HDFC Flexi"
                  placeholderTextColor={COLORS.textFaint}
                  value={h.name}
                  onChangeText={(text) => { updateField(i, 'name', text); search(text, i); }}
                  onBlur={() => setTimeout(clear, 200)}
                />
                {h.scheme_code ? (
                  <View style={{ position: 'absolute', right: 12, top: 13 }}>
                    <CheckCircle size={16} color={COLORS.green} />
                  </View>
                ) : null}

                {activeIndex === i && suggestions.length > 0 && (
                  <View style={{ position: 'absolute', top: 48, left: 0, right: 0, backgroundColor: '#0F172A', borderColor: 'rgba(56,189,248,0.3)', borderWidth: 1, borderRadius: 12, marginTop: 4, maxHeight: 200, zIndex: 50 }}>
                    <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                      {suggestions.map((fund: any) => (
                        <TouchableOpacity
                          key={fund.scheme_code}
                          onPress={() => selectFund(fund, i)}
                          style={{ paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(51,65,85,0.5)' }}
                        >
                          <Text style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: '500' }}>{fund.scheme_name}</Text>
                          <Text style={{ color: COLORS.textFaint, fontSize: 10, marginTop: 2 }}>{fund.fund_house}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              <TextInput
                style={[inputStyle(!!error), compact ? { width: '100%' } : { flex: 0, width: 112 }]}
                placeholder="₹ amount"
                placeholderTextColor={COLORS.textFaint}
                value={h.value}
                onChangeText={(text) => updateField(i, 'value', text)}
                keyboardType="numeric"
              />

              {holdings.length > 2 && (
                <TouchableOpacity onPress={() => removeRow(i)} style={{ width: compact ? '100%' : 40, height: compact ? 42 : 40, borderRadius: 10, borderWidth: compact ? 1 : 0, borderColor: COLORS.redBorder, alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={16} color={COLORS.red} />
                </TouchableOpacity>
              )}
            </View>
            {error ? <Text style={{ color: COLORS.red, fontSize: 11, marginTop: 4, marginLeft: 2 }}>{error}</Text> : null}
          </View>
        );
      })}

      <TouchableOpacity
        onPress={() => setHoldings([...holdings, { name: '', value: '', scheme_code: '', touched: false }])}
        style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(56,189,248,0.3)', borderRadius: 12, paddingVertical: 10, paddingHorizontal: compact ? 4 : 16, alignSelf: 'flex-start', marginBottom: 16 }}
      >
        <Plus size={14} color={COLORS.accent} />
        <Text style={{ color: COLORS.accent, fontSize: compact ? 10 : 12, fontWeight: '700', marginLeft: 6 }}>Add row</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleAnalyze} disabled={loading} style={primaryButtonStyle(loading)}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14, marginRight: 8 }}>Analyze My Portfolio</Text>
            <ArrowRight size={16} color="#fff" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════
// Main screen
// ══════════════════════════════════════════════════════════════
const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'pdf', label: 'PDF', icon: FileText },
  { id: 'screenshot', label: 'Screenshot', icon: Camera },
  { id: 'manual', label: 'Type it in', icon: Edit3 },
];

export default function AnalyzeScreen() {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const horizontalPadding = compact ? 14 : 20;
  const [active, setActive] = useState<Tab>('manual');
  const { user } = useAuth();
  const router = useRouter();

  const handleComplete = (shareToken: string) => {
    router.push(`/(app)/report/${shareToken}` as any);
  };

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: horizontalPadding, paddingTop: compact ? 14 : 20, paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.2)', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 16 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.green, marginRight: 8 }} />
            <Text style={{ color: '#4ADE80', fontSize: 11, fontWeight: '600' }}>Portfolio Analysis</Text>
          </View>
          <Text style={{ color: COLORS.textPrimary, fontSize: compact ? 23 : 26, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 }}>Add your portfolio</Text>
          <Text style={{ color: COLORS.textMuted, fontSize: 13, textAlign: 'center', paddingHorizontal: 16 }}>
            We scan for hidden overlaps and give you a full X-Ray report.
          </Text>
        </View>

        {/* Card — same treatment as AuthScreen's auth card */}
        <View style={{ backgroundColor: COLORS.card, borderColor: COLORS.cardBorder, borderWidth: 1, borderRadius: 20, padding: compact ? 12 : 20, ...cardShadow }}>
          <View style={{ flexDirection: 'row', gap: 4, padding: 4, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 12, marginBottom: compact ? 18 : 24 }}>
            {TABS.map((t) => {
              const Icon = t.icon;
              const isActive = active === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setActive(t.id)}
                  style={{
                    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    paddingVertical: compact ? 11 : 10, paddingHorizontal: compact ? 2 : 6, borderRadius: 9,
                    backgroundColor: isActive ? COLORS.primary : 'transparent',
                    ...(isActive ? { shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 3 } : {}),
                  }}
                >
                  <Icon size={13} color={isActive ? '#fff' : COLORS.textMuted} />
                  <Text style={{ marginLeft: 6, fontSize: 12, fontWeight: '700', color: isActive ? '#fff' : COLORS.textMuted }}>{t.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {active === 'pdf' && <PDFUpload userId={user.id} onComplete={handleComplete} />}
          {active === 'screenshot' && <ScreenshotUpload userId={user.id} onComplete={handleComplete} />}
          {active === 'manual' && <ManualEntry userId={user.id} onComplete={handleComplete} />}
        </View>

        <Text style={{ color: '#334155', fontSize: 11, textAlign: 'center', marginTop: 16 }}>
          🔒 Raw files never stored · Holdings anonymized after analysis
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}