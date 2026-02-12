import React from 'react';
import { Group, Rect, Text, Circle } from 'react-konva';
import { LAYOUT } from '../../pages/Programs/fbdConstants';

const FBDViewerBlock = ({ node, runtimeData }) => {
    const { id, type, x, y, width, height, inputs, outputs, label, params } = node;
    const { BLOCK_WIDTH, HEADER_HEIGHT, PORT_HEIGHT, PORT_RADIUS } = LAYOUT;

    const currentWidth = width || BLOCK_WIDTH;
    const currentHeight = height || (HEADER_HEIGHT + Math.max(inputs, outputs) * PORT_HEIGHT + 10);

    // Helper for boolean coercion
    const toBool = (val) => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'number') return val > 0.5;
        if (typeof val === 'string') return ['1', 'true', 'on', 'yes'].includes(val.toLowerCase());
        return false;
    };

    // Get the primary value to show in the center for constants/displays/IO
    let centerValue = null;
    const runtimeVal = runtimeData[`${id}_out_0`];

    if (type.includes('CONST')) {
        centerValue = (params?.value !== undefined && params?.value !== null) ? String(params.value) : null;
        if (type === 'CONST_DIG') {
            centerValue = toBool(params?.value) ? "TRUE" : "FALSE";
        }
    } else if (type.includes('DISP')) {
        centerValue = (runtimeVal !== undefined && runtimeVal !== null) ? String(runtimeVal) : '---';
        if (type === 'DIG_DISP' && runtimeVal !== undefined && runtimeVal !== null) {
            centerValue = toBool(runtimeVal) ? "TRUE" : "FALSE";
        }
    } else if (type.includes('_IN') || type.includes('_OUT')) {
        // Show current state of IO points in the center too
        if (runtimeVal !== undefined && runtimeVal !== null) {
            if (type.includes('DIGITAL')) {
                centerValue = toBool(runtimeVal) ? "TRUE" : "FALSE";
            } else {
                centerValue = String(runtimeVal);
            }
        }
    }

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
                fill={params?.color || "#555"}
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

            {/* Center Value for Constants */}
            {centerValue !== null && (
                <Text
                    text={centerValue}
                    width={currentWidth}
                    y={HEADER_HEIGHT + (currentHeight - HEADER_HEIGHT) / 2 - 6}
                    align="center"
                    fontSize={12}
                    fontStyle="bold"
                    fill="#333"
                />
            )}

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
                const boolValue = (type.includes('DIGITAL') || type.includes('Gate') || type === 'DIG_DISP' || type === 'CONST_DIG') ? toBool(value) : null;
                const isBool = boolValue !== null;

                return (
                    <Group key={`out-${i}`} x={currentWidth} y={HEADER_HEIGHT + 10 + i * PORT_HEIGHT}>
                        <Circle
                            x={0}
                            y={0}
                            radius={PORT_RADIUS}
                            fill={isBool ? (boolValue ? "#28a745" : "#dc3545") : "#2196f3"}
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
                                    text={boolValue ? "TRUE" : "FALSE"}
                                    y={10}
                                    width={35}
                                    align="right"
                                    x={-5}
                                    fontSize={7}
                                    fill={boolValue ? "#28a745" : "#dc3545"}
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
