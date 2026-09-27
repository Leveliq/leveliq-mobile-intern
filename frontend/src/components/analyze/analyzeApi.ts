import { ResolvedFund, ParsedResponse, PickedFile, SearchFundItem, API_BASE_URL } from './types';

const searchCache = new Map<string, SearchFundItem[]>();

export async function runAnalysis(resolved: ResolvedFund[], userId: string): Promise<string> {
  const holdings = resolved.map((r) => ({
    scheme_code: r.scheme_code,
    scheme_name: r.scheme_name,
    value: r.value,
  }));

  const res = await fetch(`${API_BASE_URL}/api/portfolio/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ holdings, user_id: userId }),
  });

  if (!res.ok) throw new Error('Analysis request failed');
  const data = await res.json();
  if (!data?.report?.share_token) throw new Error('Invalid analysis response');
  return data.report.share_token as string;
}

export async function parseUploadFile(
  endpoint: string,
  file: PickedFile,
  signal?: AbortSignal
): Promise<ParsedResponse> {
  const formData = new FormData();
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
    signal,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.error || 'Failed to process document');
  }

  return res.json();
}

export async function searchMutualFunds(
  query: string,
  signal?: AbortSignal
): Promise<SearchFundItem[]> {
  const trimmed = query.trim().toLowerCase();
  if (trimmed.length < 2) return [];

  if (searchCache.has(trimmed)) {
    return searchCache.get(trimmed)!;
  }

  const res = await fetch(
    `${API_BASE_URL}/api/mf/search?q=${encodeURIComponent(trimmed)}`,
    { signal }
  );

  if (!res.ok) return [];
  const data = await res.json();
  const funds: SearchFundItem[] = data.funds || [];
  searchCache.set(trimmed, funds);
  return funds;
}
