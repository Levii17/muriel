import { atom } from 'jotai';

export const isOnlineAtom = atom<boolean>(true);
export const saveStatusAtom = atom<'idle' | 'saving' | 'saved' | 'error'>('idle');
// Collapsed state for left sidebar (symbol library)
export const leftSidebarCollapsedAtom = atom<boolean>(false);

// Snackbar notification atom
export interface SnackbarState {
  open: boolean;
  message: string;
  severity?: 'success' | 'info' | 'warning' | 'error';
}
export const snackbarAtom = atom<SnackbarState>({
  open: false,
  message: '',
  severity: 'info',
});