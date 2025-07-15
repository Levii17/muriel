import React from 'react';
import { Layer, Rect } from 'react-konva';
import { PAPER_A3, MARGIN_PX } from '../../utils/grid-utils';

const DrawingBorder: React.FC = () => {
  const { width, height } = PAPER_A3;
  return (
    <Layer>
      {/* Thick outer border (paper edge) */}
      <Rect x={0} y={0} width={width} height={height} stroke="#000" strokeWidth={2} listening={false} />
      {/* Thin inner margin (10mm inside) */}
      <Rect x={MARGIN_PX} y={MARGIN_PX} width={width - 2 * MARGIN_PX} height={height - 2 * MARGIN_PX} stroke="#444" strokeWidth={1} dash={[6, 4]} listening={false} />
    </Layer>
  );
};

export default DrawingBorder;
