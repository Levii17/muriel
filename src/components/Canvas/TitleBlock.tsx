import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { PAPER_A3, MARGIN_PX } from '../../utils/grid-utils';
import { useAtom } from 'jotai';
import { titleBlockAtom } from '../../stores/titleBlockStore';

const TITLE_BLOCK_WIDTH = 340; // wider for more fields
const TITLE_BLOCK_HEIGHT = 80; // taller for two rows
const ROW_HEIGHT = TITLE_BLOCK_HEIGHT / 2;
const COLS = [56, 80, 90, 56, 58]; // Logo, Org/Name, Project/Title, Date/Scale, Page
const COL_X = COLS.reduce((acc, w, i) => {
  acc.push((acc[i - 1] || 0) + (COLS[i - 1] || 0));
  return acc;
}, [] as number[]);

const TitleBlock: React.FC = () => {
  const { width, height } = PAPER_A3;
  const x = width - MARGIN_PX - TITLE_BLOCK_WIDTH;
  const y = height - MARGIN_PX - TITLE_BLOCK_HEIGHT;
  const [titleBlock] = useAtom(titleBlockAtom);

  return (
    <Group x={x} y={y}>
      {/* Outer border */}
      <Rect width={TITLE_BLOCK_WIDTH} height={TITLE_BLOCK_HEIGHT} stroke="#222" strokeWidth={2} fill="#fff" />
      {/* Vertical lines */}
      {COL_X.slice(1).map((cx, i) => (
        <Rect key={`vline-${i}`} x={cx} y={0} width={0.5} height={TITLE_BLOCK_HEIGHT} fill="#222" />
      ))}
      {/* Horizontal line (between rows) */}
      <Rect x={0} y={ROW_HEIGHT} width={TITLE_BLOCK_WIDTH} height={0.5} fill="#222" />

      {/* LOGO cell */}
      <Rect x={0} y={0} width={COLS[0]} height={TITLE_BLOCK_HEIGHT} stroke="#222" strokeWidth={0.5} fill="#e3f2fd" />
      <Text x={8} y={TITLE_BLOCK_HEIGHT/2-16} text="M" fontSize={32} fontStyle="bold" fill="#1976d2" />

      {/* Top row fields */}
      <Text x={COL_X[1]+6} y={8} text="Organization" fontSize={11} fill="#333" />
      <Text x={COL_X[2]+6} y={8} text="Project Name" fontSize={11} fill="#333" />
      <Text x={COL_X[3]+6} y={8} text="Date" fontSize={8} fill="#333" />
      <Text x={COL_X[4]+6} y={8} text="Page" fontSize={11} fill="#333" />
      {/* Top row values from atom */}
      <Text x={COL_X[1]+6} y={24} text={titleBlock.company || '<Org>'} fontSize={13} fontStyle="bold" fill="#1976d2" />
      <Text x={COL_X[2]+6} y={24} text={titleBlock.project || '<Project>'} fontSize={13} fontStyle="bold" fill="#1976d2" />
      <Text x={COL_X[3]+6} y={24} text={titleBlock.date || '09/07/2025'} fontSize={13} fontStyle="bold" fill="#1976d2" />
      <Text x={COL_X[4]+6} y={24} text={"1 / 1"} fontSize={13} fontStyle="bold" fill="#1976d2" />

      {/* Bottom row fields */}
      <Text x={COL_X[1]+6} y={ROW_HEIGHT+6} text="Name" fontSize={11} fill="#333" />
      <Text x={COL_X[2]+6} y={ROW_HEIGHT+6} text="Drawing Title(s)" fontSize={11} fill="#333" />
      <Text x={COL_X[3]+6} y={ROW_HEIGHT+6} text="Scale" fontSize={11} fill="#333" />
      <Text x={COL_X[4]+6} y={ROW_HEIGHT+6} text="Revision" fontSize={11} fill="#333" />
      {/* Bottom row values from atom */}
      <Text x={COL_X[1]+6} y={ROW_HEIGHT+22} text={titleBlock.designer || '<Name>'} fontSize={13} fontStyle="bold" fill="#1976d2" />
      <Text x={COL_X[2]+6} y={ROW_HEIGHT+22} text={titleBlock.ecsaNumber || '<Title>'} fontSize={13} fontStyle="bold" fill="#1976d2" />
      <Text x={COL_X[3]+6} y={ROW_HEIGHT+22} text={titleBlock.scale || '1:1'} fontSize={13} fontStyle="bold" fill="#1976d2" />
      <Text x={COL_X[4]+6} y={ROW_HEIGHT+22} text={titleBlock.revision || 'A'} fontSize={13} fontStyle="bold" fill="#1976d2" />
    </Group>
  );
};

export default TitleBlock;
