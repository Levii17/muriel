import React from 'react';
import type { ElectricalSymbol } from '../../types';
import { useSetAtom } from 'jotai';
import { draggedSymbolAtom } from '../../stores/symbolStore';

interface SymbolItemProps {
  symbol: ElectricalSymbol;
}

const SymbolItem: React.FC<SymbolItemProps> = ({ symbol }) => {
  const setDraggedSymbol = useSetAtom(draggedSymbolAtom);
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(symbol));
    setDraggedSymbol(symbol);
  };
  const handleDragEnd = () => {
    setDraggedSymbol(null);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        border: '1px solid #ccc',
        borderRadius: 4,
        padding: 8,
        background: '#fff',
        cursor: 'grab',
      }}
    >
      <div
        style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        dangerouslySetInnerHTML={{ __html: symbol.svg }}
      />
      <div>
        <div style={{ fontWeight: 500 }}>{symbol.name}</div>
        <div style={{ fontSize: 12, color: '#666' }}>{symbol.category}</div>
      </div>
    </div>
  );
};

export default SymbolItem; 