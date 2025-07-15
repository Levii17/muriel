import { useEffect, useState } from 'react';
import { useSetAtom } from 'jotai';
import { symbolLibraryAtom } from '../stores/symbolStore';
import type { ElectricalSymbol } from '../types';

export function useSymbols() {
  const setSymbols = useSetAtom(symbolLibraryAtom);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetch('/src/data/symbols/sans-symbols.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load symbol data');
        return res.json();
      })
      .then((data: ElectricalSymbol[]) => {
        if (isMounted) {
          setSymbols(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [setSymbols]);

  return { loading, error };
} 