import React from 'react';
import { Line, Rect, Circle, Ellipse, Path, Group } from 'react-konva';

const parseColor = (color?: string) => color || '#000';

export function parseSvgToKonvaShapes(
  svg: string,
  keyPrefix = '',
  width?: number,
  height?: number
): React.ReactNode {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svg, 'image/svg+xml');
  const shapes: React.ReactNode[] = [];
  let key = 0;

  // Get original SVG size
  const svgEl = doc.querySelector('svg');
  const origWidth = Number(svgEl?.getAttribute('width')) || 50;
  const origHeight = Number(svgEl?.getAttribute('height')) || 50;
  const scaleX = width ? width / origWidth : 1;
  const scaleY = height ? height / origHeight : 1;

  // <line>
  doc.querySelectorAll('line').forEach((el: any) => {
    shapes.push(
      <Line
        key={keyPrefix + 'line' + key++}
        points={[
          Number(el.getAttribute('x1')) * scaleX,
          Number(el.getAttribute('y1')) * scaleY,
          Number(el.getAttribute('x2')) * scaleX,
          Number(el.getAttribute('y2')) * scaleY,
        ]}
        stroke={parseColor(el.getAttribute('stroke'))}
        strokeWidth={Number(el.getAttribute('stroke-width')) || 2}
      />
    );
  });

  // <rect>
  doc.querySelectorAll('rect').forEach((el: any) => {
    shapes.push(
      <Rect
        key={keyPrefix + 'rect' + key++}
        x={Number(el.getAttribute('x')) * scaleX}
        y={Number(el.getAttribute('y')) * scaleY}
        width={Number(el.getAttribute('width')) * scaleX}
        height={Number(el.getAttribute('height')) * scaleY}
        stroke={parseColor(el.getAttribute('stroke'))}
        strokeWidth={Number(el.getAttribute('stroke-width')) || 2}
        fill={el.getAttribute('fill') || undefined}
      />
    );
  });

  // <circle>
  doc.querySelectorAll('circle').forEach((el: any) => {
    shapes.push(
      <Circle
        key={keyPrefix + 'circle' + key++}
        x={Number(el.getAttribute('cx')) * scaleX}
        y={Number(el.getAttribute('cy')) * scaleY}
        radius={Number(el.getAttribute('r')) * Math.max(scaleX, scaleY)}
        stroke={parseColor(el.getAttribute('stroke'))}
        strokeWidth={Number(el.getAttribute('stroke-width')) || 2}
        fill={el.getAttribute('fill') || undefined}
      />
    );
  });

  // <ellipse>
  doc.querySelectorAll('ellipse').forEach((el: any) => {
    shapes.push(
      <Ellipse
        key={keyPrefix + 'ellipse' + key++}
        x={Number(el.getAttribute('cx')) * scaleX}
        y={Number(el.getAttribute('cy')) * scaleY}
        radiusX={Number(el.getAttribute('rx')) * scaleX}
        radiusY={Number(el.getAttribute('ry')) * scaleY}
        stroke={parseColor(el.getAttribute('stroke'))}
        strokeWidth={Number(el.getAttribute('stroke-width')) || 2}
        fill={el.getAttribute('fill') || undefined}
      />
    );
  });

  // <path>
  doc.querySelectorAll('path').forEach((el: any) => {
    shapes.push(
      <Path
        key={keyPrefix + 'path' + key++}
        data={el.getAttribute('d') || ''}
        scale={{ x: scaleX, y: scaleY }}
        stroke={parseColor(el.getAttribute('stroke'))}
        strokeWidth={Number(el.getAttribute('stroke-width')) || 2}
        fill={el.getAttribute('fill') || undefined}
      />
    );
  });

  return <Group>{shapes}</Group>;
} 