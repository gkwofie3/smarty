import React, { useRef, useEffect } from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import { LAYOUT } from '../constants';

const FBDBlock = ({ node, onSelect, selected, onNodeMove, onNodeTransform, onPortClick }) => {
    const { id, type, label, x, y, width, height, inputs, outputs, params } = node;
    const { BLOCK_WIDTH, HEADER_HEIGHT, PORT_HEIGHT, PORT_RADIUS } = LAYOUT;
    const groupRef = useRef();

    const currentWidth = width || BLOCK_WIDTH;
    // Auto-calculate height if not manually set, or enforce minimum based on ports
    const minHeight = HEADER_HEIGHT + Math.max(inputs, outputs) * PORT_HEIGHT + 20;
    const currentHeight = height ? Math.max(height, minHeight) : minHeight;
    const bgColor = params?.color || '#ffffff';
    const isForced = params?.isForced;
    const displayValue = (type.includes('CONST') || type.includes('DISP')) ? (params?.value !== undefined ? String(params.value) : '???') : null;

    return (
        <Group
            x={x}
            y={y}
            width={currentWidth} // For Transformer
            height={currentHeight} // For Transformer
            draggable
            onClick={() => onSelect(id)}
            onTap={() => onSelect(id)}
            onDragStart={(e) => {
                e.cancelBubble = true;
            }}
            onDragEnd={(e) => {
                if (onNodeMove) onNodeMove(id, e.target.x(), e.target.y());
            }}
            onTransformEnd={(e) => {
                // Transformer changes scaleX/scaleY. We want to apply that to width/height and reset scale.
                const node = groupRef.current;
                const scaleX = node.scaleX();
                const scaleY = node.scaleY();

                // Reset scale
                node.scaleX(1);
                node.scaleY(1);

                if (onNodeTransform) {
                    onNodeTransform(id, {
                        x: node.x(),
                        y: node.y(),
                        width: Math.max(50, node.width() * scaleX),
                        height: Math.max(minHeight, node.height() * scaleY),
                    });
                }
            }}
            ref={groupRef}
            id={id}
        >
            {/* Main Body */}
            <Rect
                width={currentWidth}
                height={currentHeight}
                fill={bgColor}
                stroke={selected ? '#0d6efd' : (isForced ? '#ffc107' : '#333')}
                strokeWidth={selected ? 2 : (isForced ? 2 : 1)}
                cornerRadius={5}
                shadowBlur={5}
                shadowColor="black"
                shadowOpacity={0.1}
            />

            {/* Forced Badge Indicator */}
            {isForced && (
                <Group x={currentWidth - 15} y={currentHeight - 15}>
                    <Circle radius={8} fill="#ffc107" />
                    <Text text="F" x={-3} y={-5} fontSize={10} fontStyle="bold" fill="black" />
                </Group>
            )}

            {/* Value Display in center for relevant blocks */}
            {displayValue !== null && (
                <Text
                    text={displayValue}
                    x={0}
                    y={HEADER_HEIGHT + (currentHeight - HEADER_HEIGHT) / 2 - 8}
                    width={currentWidth}
                    align="center"
                    fontSize={14}
                    fontStyle="bold"
                    fill="#333"
                />
            )}

            {/* Header */}
            <Rect
                width={currentWidth}
                height={HEADER_HEIGHT}
                fill="#f0f0f0"
                stroke="#333"
                strokeWidth={1}
                cornerRadius={[5, 5, 0, 0]}
            />
            <Text
                text={type}
                width={currentWidth}
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
                        name={`port-in-${id}-${i}`}
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
                <Group key={`out-${i}`} x={currentWidth} y={HEADER_HEIGHT + 10 + i * PORT_HEIGHT}>
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
                    y={currentHeight + 5}
                    width={currentWidth}
                    align="center"
                    fontSize={10}
                    fill="#666"
                />
            )}
        </Group>
    );
};

export default FBDBlock;
