import { atom } from 'jotai';
import type { CanvasElement, Viewport } from '../types';

export const canvasElementsAtom = atom<CanvasElement[]>([]);
export const selectedElementsAtom = atom<string[]>([]);
export const canvasViewportAtom = atom<Viewport>({ zoom: 1, pan: { x: 0, y: 0 } });