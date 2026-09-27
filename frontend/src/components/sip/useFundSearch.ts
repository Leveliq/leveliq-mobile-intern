import { useState, useEffect, useRef, useCallback } from 'react';
import { FundItem, API_BASE_URL } from './types';

// In-memory query cache: saves API calls on backspacing / repeated queries
const searchCache = new Map<string, FundItem[]>();

export function useFundSearch(query: string) {
  const [results, setResults] = useState<FundItem[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim().toLowerCase();

    // Abort any ongoing request
    abortRef.current?.abort();

    if (trimmed.length < 3) {
      setResults([]);
      setLoading(false);
      return;
    }

    // Check cache first for instant results
    if (searchCache.has(trimmed)) {
      setResults(searchCache.get(trimmed)!);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/mf/search?q=${encodeURIComponent(trimmed)}`,
          { signal: controller.signal }
        );
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json();
        const funds: FundItem[] = data.funds || [];

        // Save to cache
        searchCache.set(trimmed, funds);
        setResults(funds);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setResults([]);
        }
      } finally {
        if (abortRef.current === controller) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  return { results, loading, setResults, clearResults };
}
