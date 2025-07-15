import { atom } from 'jotai';
import type { ElectricalSymbol } from '../types';

export const symbolLibraryAtom = atom<ElectricalSymbol[]>([]);
export const symbolSearchQueryAtom = atom<string>('');
export const filteredSymbolsAtom = atom(
  (get) => {
    const query = get(symbolSearchQueryAtom).toLowerCase();
    const symbols = get(symbolLibraryAtom);
    if (!query) return symbols;
    return symbols.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.category.toLowerCase().includes(query)
    );
  }
);