import React from 'react';
import { Layer, Line } from 'react-konva';
import { GRID_SIZE, MAJOR_GRID_SIZE, PAPER_A3 } from '../../utils/grid-utils';

const CANVAS_WIDTH = PAPER_A3.width;
const CANVAS_HEIGHT = PAPER_A3.height;

const minorColor = '#e0e0e0';
const majorColor = '#bdbdbd';

const CanvasGrid: React.FC = () => {
  const lines = [];

  // Vertical lines
  for (let x = 0; x <= CANVAS_WIDTH; x += GRID_SIZE) {
    const isMajor = x % MAJOR_GRID_SIZE === 0;
    lines.push(
      <Line
        key={`v-${x}`}
        points={[x, 0, x, CANVAS_HEIGHT]}
        stroke={isMajor ? majorColor : minorColor}
        strokeWidth={isMajor ? 1.2 : 0.7}
        listening={false}
      />
    );
  }

  // Horizontal lines
  for (let y = 0; y <= CANVAS_HEIGHT; y += GRID_SIZE) {
    const isMajor = y % MAJOR_GRID_SIZE === 0;
    lines.push(
      <Line
        key={`h-${y}`}
        points={[0, y, CANVAS_WIDTH, y]}
        stroke={isMajor ? majorColor : minorColor}
        strokeWidth={isMajor ? 1.2 : 0.7}
        listening={false}
      />
    );
  }

  return <Layer>{lines}</Layer>;
};

export default CanvasGrid;
