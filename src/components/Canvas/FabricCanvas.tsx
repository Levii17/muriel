import React from 'react';
import { useCanvas } from '../../hooks/useCanvas';

const FabricCanvas: React.FC = () => {
  const {
    containerRef,
    canvasRef,
    ghostPos,
    draggedSymbol,
    handleDragOver,
    handleDrop,
    handleDragLeave,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  } = useCanvas();

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#fff',
      }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragLeave={handleDragLeave}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      />
      {/* Ghost preview for drag-and-drop */}
      {draggedSymbol && ghostPos && (
        <div
          style={{
            position: 'absolute',
            pointerEvents: 'none',
            left: ghostPos.x - (draggedSymbol.dimensions?.width ?? 25) / 2,
            top: ghostPos.y - (draggedSymbol.dimensions?.height ?? 25) / 2,
            opacity: 0.5,
            zIndex: 10,
            width: draggedSymbol.dimensions?.width ?? 50,
            height: draggedSymbol.dimensions?.height ?? 50,
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))',
          }}
          aria-label="Symbol preview"
        >
          <div
            style={{ width: '100%', height: '100%' }}
            dangerouslySetInnerHTML={{ __html: draggedSymbol.svg }}
          />
        </div>
      )}
      {/* Fallback message for debugging */}
      {false && <div style={{ color: 'red' }}>Canvas or Fabric.js failed to load</div>}
    </div>
  );
};

export default FabricCanvas; 