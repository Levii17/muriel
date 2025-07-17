import Dexie from 'dexie';
import type { Table } from 'dexie';
import type { CanvasElement, Viewport } from '../../types';
import type { TitleBlockData } from '../../types/titleBlock';
// import { v4 as uuidv4 } from 'uuid';

function uuidv4() {
  // fallback: not cryptographically secure, but fine for local IDs
  return 'id-' + Date.now() + '-' + Math.random().toString(16).slice(2);
}

export interface DiagramRecord {
  id: string; // uuid or timestamp
  name: string;
  elements: CanvasElement[];
  titleBlock: TitleBlockData;
  viewport: Viewport;
  createdAt: string;
  updatedAt: string;
}

class DiagramDB extends Dexie {
  diagrams!: Table<DiagramRecord, string>;

  constructor() {
    super('MurielDiagramDB');
    this.version(1).stores({
      diagrams: 'id, name, createdAt, updatedAt',
    });
  }
}

export const db = new DiagramDB();

// Save (add or update)
export async function saveDiagram(record: Omit<DiagramRecord, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) {
  const now = new Date().toISOString();
  const id = record.id || uuidv4();
  const existing = await db.diagrams.get(id);
  const diagram: DiagramRecord = {
    ...record,
    id,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await db.diagrams.put(diagram);
  return diagram;
}

// Load by ID
export async function loadDiagram(id: string) {
  return db.diagrams.get(id);
}

// List all
export async function listDiagrams() {
  return db.diagrams.orderBy('updatedAt').reverse().toArray();
}

// Delete
export async function deleteDiagram(id: string) {
  return db.diagrams.delete(id);
}
