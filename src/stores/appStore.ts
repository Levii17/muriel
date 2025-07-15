import { atom } from 'jotai';
import type { CanvasTool } from '../components/Toolbar/MainToolbar';

export const isOnlineAtom = atom<boolean>(true);
export const saveStatusAtom = atom<'idle' | 'saving' | 'saved' | 'error'>('idle');
// Collapsed state for left sidebar (symbol library)
export const leftSidebarCollapsedAtom = atom<boolean>(false);
export const selectedToolAtom = atom<CanvasTool>('select');