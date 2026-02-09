import React, { useState, useEffect } from 'react';
import { Rect, Circle, Line, Text, Image, Group, Arc, RegularPolygon } from 'react-konva';

// Simple useImage hook to avoid dependency on 'use-image' package
const useImage = (url) => {
    const [image, setImage] = useState(null);
    useEffect(() => {
        if (!url) return;
        const img = new window.Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => setImage(img);
    }, [url]);
    return [image];
};

const getFontStyle = (element) => {
    const weight = element.font_weight && element.font_weight !== 'normal' ? element.font_weight : '';
    const style = element.font_style && element.font_style !== 'normal' ? element.font_style : '';

    // Combine, trim. If empty, return 'normal'
    const combined = `${weight} ${style}`.trim();
    return combined || 'normal';
};

const ElementRenderer = ({ element, onClick }) => {
    const [image] = useImage(element.image_source_url);

    const commonProps = {
        id: element.id,
        x: element.x_position || 0,
        y: element.y_position || 0,
        rotation: element.rotation_angle || 0,
        opacity: element.opacity !== undefined ? element.opacity : 1,
        listening: true, // Enable interaction for Preview/Dashboard (click)
        onClick: onClick,
        onTap: onClick,
        onMouseEnter: (e) => {
            const container = e.target.getStage().container();
            if (onClick) container.style.cursor = 'pointer';
        },
        onMouseLeave: (e) => {
            const container = e.target.getStage().container();
            container.style.cursor = 'default';
        },
    };

    const strokeProps = {
        stroke: element.stroke_color || element.border_color || 'black',
        strokeWidth: element.stroke_width || element.border_width || 1,
        dash: element.stroke_style === 'dashed' || element.border_style === 'dashed' ? [10, 5] : undefined,
    };

    const fillProps = {
        fill: element.fill_color || element.background_color || 'transparent',
    };

    const shadowProps = element.shadow_color ? {
        shadowColor: element.shadow_color,
        shadowBlur: element.shadow_offset || 5,
        shadowOpacity: 0.6,
        shadowOffset: { x: element.shadow_offset || 5, y: element.shadow_offset || 5 }
    } : {};

    const width = element.width || 100;
    const height = element.height || 100;
    const fontStyle = getFontStyle(element);

    switch (element.type) {
        case 'Rectangle':
            return (
                <Rect
                    {...commonProps}
                    width={width}
                    height={height}
                    {...fillProps}
                    {...strokeProps}
                    cornerRadius={element.corner_radius || 0}
                    {...shadowProps}
                />
            );
        case 'Ellipse/Circle':
            return (
                <Circle
                    {...commonProps}
                    radiusX={width / 2}
                    radiusY={height / 2}
                    {...fillProps}
                    {...strokeProps}
                    {...shadowProps}
                />
            );
        case 'Polygon':
            return (
                <RegularPolygon
                    {...commonProps}
                    sides={element.sides || 5}
                    radius={width / 2}
                    {...fillProps}
                    {...strokeProps}
                    {...shadowProps}
                />
            );
        case 'Arc':
            return (
                <Arc
                    {...commonProps}
                    innerRadius={width / 4}
                    outerRadius={width / 2}
                    angle={element.end_angle || 90}
                    rotation={element.start_angle || 0}
                    {...fillProps}
                    {...strokeProps}
                    {...shadowProps}
                />
            );
        case 'Line':
            return (
                <Line
                    {...commonProps}
                    points={[0, 0, width, height]}
                    {...strokeProps}
                />
            );
        case 'Static Text Label':
        case 'Dynamic Text (Variable Text)':
            {
                let safeFont = element.font_family;
                if (typeof safeFont !== 'string') safeFont = 'Arial';

                return (
                    <Text
                        {...commonProps}
                        text={element.text_content || element.name || 'Text'}
                        fontSize={Number(element.font_size) || 16}
                        fontFamily={safeFont}
                        fontStyle={fontStyle}
                        fill={element.font_color || '#000000'}
                        align={element.alignment_horizontal || 'left'}
                        verticalAlign={element.alignment_vertical || 'top'}
                        width={width}
                        height={height}
                        {...shadowProps}
                    />
                );
            }
        case 'Static Image':
        case 'Animated Image':
            return (
                <Image
                    {...commonProps}
                    image={image}
                    width={width}
                    height={height}
                    {...strokeProps}
                    {...shadowProps}
                />
            );

        case 'Push Button':
            {
                let safeFont = element.font_family;
                if (typeof safeFont !== 'string') safeFont = 'Arial';

                return (
                    <Group {...commonProps}>
                        <Rect width={width} height={height} fill={element.background_color || '#e0e0e0'} stroke="gray" cornerRadius={4} shadowBlur={2} />
                        <Text
                            text={element.label_text || 'Button'}
                            width={width}
                            height={height}
                            align="center"
                            verticalAlign="middle"
                            fontSize={Number(element.font_size) || 14}
                            fontFamily={safeFont}
                            fontStyle={fontStyle}
                            fill={element.font_color || 'black'}
                        />
                    </Group>
                );
            }
        case 'Toggle Button/Switch':
            return (
                <Group {...commonProps}>
                    <Rect width={width} height={height} fill="#ccc" cornerRadius={height / 2} />
                    <Circle x={height / 2} y={height / 2} radius={height / 2 - 2} fill="white" />
                </Group>
            );
        case 'Slider':
            return (
                <Group {...commonProps}>
                    <Rect y={height / 2 - 2} width={width} height={4} fill="#ddd" />
                    <Circle x={width / 2} y={height / 2} radius={8} fill="#007bff" />
                </Group>
            );
        case 'Analog Gauge':
            return (
                <Group {...commonProps}>
                    <Arc innerRadius={width / 2 - 10} outerRadius={width / 2} angle={180} rotation={180} fill="#eee" stroke="#ccc" />
                    <Arc innerRadius={width / 2 - 10} outerRadius={width / 2} angle={120} rotation={180} fill="#28a745" />
                    <Text text={element.value || '0'} x={0} y={0} width={width} align="center" fontSize={20} />
                </Group>
            );

        case 'Data Table':
        case 'Alarm List/Table':
            return (
                <Group {...commonProps}>
                    {/* Background */}
                    <Rect width={width} height={height} fill="white" stroke="black" strokeWidth={1} />

                    {/* Header */}
                    <Rect x={0} y={0} width={width} height={30} fill="#f0f0f0" stroke="black" strokeWidth={1} />
                    <Text
                        text={element.type === 'Data Table' ? "ID | Name | Value | Status" : "Time | Severity | Message | State"}
                        x={5}
                        y={10}
                        width={width}
                        fontSize={12}
                        fontStyle="bold"
                    />

                    {/* Rows */}
                    <Line points={[0, 30, width, 30]} stroke="black" strokeWidth={1} />

                    {[1, 2, 3].map(i => (
                        <Group key={i} y={30 + (i * 25)}>
                            <Text
                                text={element.type === 'Data Table' ? `00${i} | Item ${i} | ${(Math.random() * 100).toFixed(1)} | OK` : `10:0${i} | High | Alarm ${i} Active | ACK`}
                                x={5}
                                y={5}
                                fontSize={12}
                            />
                            <Line points={[0, 25, width, 25]} stroke="#ddd" strokeWidth={1} />
                        </Group>
                    ))}
                </Group>
            );
        case 'Trend Chart/Graph':
        case 'Bar Gauge/Graph':
            return (
                <Group {...commonProps}>
                    <Rect width={width} height={height} fill="white" stroke="black" strokeWidth={1} />

                    {/* Axes */}
                    <Line points={[30, 10, 30, height - 20, width - 10, height - 20]} stroke="black" strokeWidth={2} />

                    {/* Labels */}
                    <Text text="Y-Axis" x={5} y={height / 2} rotation={-90} fontSize={10} />
                    <Text text="X-Axis (Time)" x={width / 2 - 20} y={height - 15} fontSize={10} />

                    {/* Data Line (Mock) */}
                    {element.type.includes('Trend') ? (
                        <Line
                            points={[
                                30, height - 20,
                                30 + (width - 40) * 0.2, height - 20 - (height - 40) * 0.3,
                                30 + (width - 40) * 0.4, height - 20 - (height - 40) * 0.6,
                                30 + (width - 40) * 0.6, height - 20 - (height - 40) * 0.4,
                                30 + (width - 40) * 0.8, height - 20 - (height - 40) * 0.8,
                                width - 10, height - 20 - (height - 40) * 0.5
                            ]}
                            stroke={element.line_colors || "blue"}
                            strokeWidth={2}
                        />
                    ) : (
                        // Bar Graph Mock
                        <Group>
                            {[0.2, 0.5, 0.8, 0.4, 0.7].map((val, idx) => (
                                <Rect
                                    key={idx}
                                    x={40 + (idx * ((width - 50) / 5))}
                                    y={height - 20 - (val * (height - 30))}
                                    width={((width - 50) / 5) - 5}
                                    height={val * (height - 30)}
                                    fill={element.fill_color || "blue"}
                                />
                            ))}
                        </Group>
                    )}
                </Group>
            );

        default:
            return (
                <Group {...commonProps}>
                    <Rect width={width} height={height} stroke="red" strokeWidth={1} dash={[5, 5]} fill="rgba(255,0,0,0.05)" />
                    <Text text={element.type} fontSize={10} fill="red" padding={5} width={width} />
                </Group>
            );
    }
};

export default ElementRenderer;
