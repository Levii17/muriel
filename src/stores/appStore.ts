import { atom } from 'jotai';

export const isOnlineAtom = atom<boolean>(true);
export const saveStatusAtom = atom<'idle' | 'saving' | 'saved' | 'error'>('idle');
// Collapsed state for left sidebar (symbol library)
export const leftSidebarCollapsedAtom = atom<boolean>(false);