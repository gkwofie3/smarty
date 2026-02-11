import React from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import { LAYOUT } from '../../pages/Programs/fbdConstants';

const FBDViewerBlock = ({ node, runtimeData }) => {
    const { id, type, x, y, width, height, inputs, outputs, label } = node;
    const currentWidth = width || LAYOUT.BLOCK_WIDTH;
    const currentHeight = height || (LAYOUT.HEADER_HEIGHT + Math.max(inputs, outputs) * LAYOUT.PORT_HEIGHT + 10);

    const { HEADER_HEIGHT, PORT_HEIGHT, PORT_RADIUS } = LAYOUT;

    return (
        <Group x={x} y={y}>
            {/* Shadow/Outline */}
            <Rect
                width={currentWidth}
                height={currentHeight}
                fill="white"
                stroke="#333"
                strokeWidth={1}
                shadowBlur={3}
                cornerRadius={2}
            />

            {/* Header */}
            <Rect
                width={currentWidth}
                height={HEADER_HEIGHT}
                fill={node.params?.color || "#555"}
                cornerRadius={[2, 2, 0, 0]}
            />
            <Text
                text={label || type}
                width={currentWidth}
                height={HEADER_HEIGHT}
                align="center"
                verticalAlign="middle"
                fill="white"
                fontSize={10}
                fontStyle="bold"
            />

            {/* Inputs */}
            {Array.from({ length: inputs || 0 }).map((_, i) => (
                <Group key={`in-${i}`} y={HEADER_HEIGHT + 10 + i * PORT_HEIGHT}>
                    <Circle
                        x={0}
                        y={0}
                        radius={PORT_RADIUS}
                        fill="#ddd"
                        stroke="#666"
                    />
                    <Text
                        text={`IN${i}`}
                        x={PORT_RADIUS + 2}
                        y={-5}
                        fontSize={8}
                    />
                </Group>
            ))}

            {/* Outputs */}
            {Array.from({ length: outputs || 0 }).map((_, i) => {
                const outputKey = `${id}_out_${i}`;
                const value = runtimeData[outputKey];
                const isBool = typeof value === 'boolean';

                return (
                    <Group key={`out-${i}`} x={currentWidth} y={HEADER_HEIGHT + 10 + i * PORT_HEIGHT}>
                        <Circle
                            x={0}
                            y={0}
                            radius={PORT_RADIUS}
                            fill={isBool ? (value ? "#28a745" : "#dc3545") : "#2196f3"}
                            stroke="#666"
                        />
                        <Group x={-PORT_RADIUS - 30} y={-5}>
                            <Text
                                text={`OUT${i}`}
                                width={30}
                                align="right"
                                fontSize={8}
                            />
                            {/* Live Value Display for Analogue */}
                            {!isBool && value !== undefined && (
                                <Text
                                    text={String(value)}
                                    y={10}
                                    width={50}
                                    x={-20}
                                    align="right"
                                    fontSize={8}
                                    fill="#2196f3"
                                    fontStyle="bold"
                                />
                            )}
                            {/* Visual Indicator for Bool if needed on block too */}
                            {isBool && (
                                <Text
                                    text={value ? "ON" : "OFF"}
                                    y={10}
                                    width={30}
                                    align="right"
                                    fontSize={7}
                                    fill={value ? "#28a745" : "#dc3545"}
                                    fontStyle="bold"
                                />
                            )}
                        </Group>
                    </Group>
                );
            })}
        </Group>
    );
};

export default FBDViewerBlock;
