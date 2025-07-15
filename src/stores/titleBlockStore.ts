import { atom } from 'jotai';
import type { TitleBlockData } from '../types';

export const titleBlockAtom = atom<TitleBlockData>({
  company: '',
  project: '',
  designer: '',
  date: '',
  scale: '',
  drawingTitle: '',
  details: '',
});