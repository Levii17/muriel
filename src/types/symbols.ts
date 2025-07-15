export type SymbolCategory = 'switches' | 'lights' | 'outlets' | 'protection' | 'motors';

export interface ConnectionPoint {
  x: number;
  y: number;
  type: 'input' | 'output';
}

export interface ElectricalSymbol {
  id: string;
  name: string;
  category: SymbolCategory;
  svg: string;
  connectionPoints: ConnectionPoint[];
  properties: Record<string, any>;
  sansCompliant: boolean;
  dimensions: { width: number; height: number };
}