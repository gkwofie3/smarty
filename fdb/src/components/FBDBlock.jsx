import React from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import { LAYOUT } from '../constants';

const FBDBlock = ({ node, onSelect, selected, onNodeMove, onPortClick }) => {
    const { id, type, label, x, y, inputs, outputs } = node;
    const { BLOCK_WIDTH, HEADER_HEIGHT, PORT_HEIGHT, PORT_RADIUS } = LAYOUT;

    const bodyHeight = Math.max(inputs, outputs) * PORT_HEIGHT + 10;
    const height = HEADER_HEIGHT + bodyHeight;

    return (
        <Group
            x={x}
            y={y}
            draggable
            onClick={() => onSelect(id)}
            onTap={() => onSelect(id)}
            onDragEnd={(e) => {
                const newX = e.target.x();
                const newY = e.target.y();
                if (onNodeMove) onNodeMove(id, newX, newY);
            }}
            id={id}
        >
            {/* Main Body */}
            <Rect
                width={BLOCK_WIDTH}
                height={height}
                fill="white"
                stroke={selected ? '#0d6efd' : '#333'}
                strokeWidth={selected ? 2 : 1}
                cornerRadius={5}
                shadowBlur={5}
                shadowColor="black"
                shadowOpacity={0.1}
            />

            {/* Header */}
            <Rect
                width={BLOCK_WIDTH}
                height={HEADER_HEIGHT}
                fill="#f0f0f0"
                stroke="#333"
                strokeWidth={1}
                cornerRadius={[5, 5, 0, 0]}
            />
            <Text
                text={type}
                width={BLOCK_WIDTH}
                height={HEADER_HEIGHT}
                align="center"
                verticalAlign="middle"
                fontSize={12}
                fontStyle="bold"
            />

            {/* Inputs */}
            {Array.from({ length: inputs || 0 }).map((_, i) => (
                <Group key={`in-${i}`} x={0} y={HEADER_HEIGHT + 10 + i * PORT_HEIGHT}>
                    <Circle
                        radius={PORT_RADIUS}
                        fill="#666"
                        stroke="black"
                        strokeWidth={1}
                        name={`port-in-${id}-${i}`} // ID used for collision/connection
                        onClick={(e) => {
                            e.cancelBubble = true;
                            if (onPortClick) onPortClick(e, id, 'in', i);
                        }}
                    />
                    <Text
                        text={`IN${i + 1}`}
                        x={8}
                        y={-5}
                        fontSize={10}
                        fill="#333"
                    />
                </Group>
            ))}

            {/* Outputs */}
            {Array.from({ length: outputs || 0 }).map((_, i) => (
                <Group key={`out-${i}`} x={BLOCK_WIDTH} y={HEADER_HEIGHT + 10 + i * PORT_HEIGHT}>
                    <Circle
                        radius={PORT_RADIUS}
                        fill="#666"
                        stroke="black"
                        strokeWidth={1}
                        name={`port-out-${id}-${i}`}
                        onClick={(e) => {
                            e.cancelBubble = true;
                            if (onPortClick) onPortClick(e, id, 'out', i);
                        }}
                    />
                    <Text
                        text={`OUT${i + 1}`}
                        x={-35}
                        y={-5}
                        fontSize={10}
                        fill="#333"
                        align="right"
                        width={30}
                    />
                </Group>
            ))}

            {/* Label below */}
            {label && (
                <Text
                    text={label}
                    x={0}
                    y={height + 5}
                    width={BLOCK_WIDTH}
                    align="center"
                    fontSize={10}
                    fill="#666"
                />
            )}
        </Group>
    );
};

export default FBDBlock;
