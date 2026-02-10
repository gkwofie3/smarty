import React, { useState, useEffect } from 'react';
import { Rect, Circle, Ellipse, Line, Text, Image, Group, Arc, RegularPolygon, Path, Shape } from 'react-konva';
import { getIconPath } from '../../utils/IconLoader';
import { loadGoogleFont } from '../../utils/FontLoader';

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
    const combined = `${weight} ${style}`.trim();
    return combined || 'normal';
};

const getConvertValueStyle = (value, rules) => {
    if (!rules || !Array.isArray(rules) || value === undefined || value === null) return null;

    for (const rule of rules) {
        const rVal = parseFloat(rule.value);
        const val = parseFloat(value);
        const isNum = !isNaN(rVal) && !isNaN(val);

        let match = false;
        switch (rule.operator) {
            case '=': match = value == rule.value; break;
            case '>': match = isNum && val > rVal; break;
            case '<': match = isNum && val < rVal; break;
            case '>=': match = isNum && val >= rVal; break;
            case '<=': match = isNum && val <= rVal; break;
            case '!=': match = value != rule.value; break;
            case 'is_even': match = isNum && val % 2 === 0; break;
            case 'is_odd': match = isNum && Math.abs(val % 2) === 1; break;
            default: break;
        }

        if (match) return rule;
    }
    return null;
};

const RenderPushButton = ({ element, commonProps, width, height }) => {
    const [pressed, setPressed] = useState(false);

    let label = element.label_text;
    if (!label) {
        if (element.type === 'Increase Button') label = '+';
        else if (element.type === 'Decrease Button') label = '-';
        else label = 'Button';
    }

    return (
        <Group
            {...commonProps}
            onMouseDown={(e) => {
                e.cancelBubble = true;
                setPressed(true);
                if (commonProps.onMouseDown) commonProps.onMouseDown(e);
            }}
            onMouseUp={(e) => {
                e.cancelBubble = true;
                setPressed(false);
                if (commonProps.onMouseUp) commonProps.onMouseUp(e);
            }}
            onMouseLeave={() => setPressed(false)}
        >
            <Rect
                width={width}
                height={height}
                fill={pressed ? (element.background_color_active || '#0056b3') : (element.background_color || '#007bff')}
                cornerRadius={element.corner_radius || 4}
                stroke={element.border_color || null}
                strokeWidth={element.border_width || 0}
                shadowColor={element.shadow_color || 'black'}
                shadowBlur={element.shadow_color ? 5 : 0}
                shadowOpacity={pressed ? 0.1 : 0.3}
                shadowOffset={pressed ? { x: 1, y: 1 } : { x: element.shadow_offset || 5, y: element.shadow_offset || 5 }}
            />
            <Text
                text={label}
                width={width}
                height={height}
                align="center"
                verticalAlign="middle"
                fontFamily={element.font_family || 'Arial'}
                fontSize={element.font_size || 14}
                fontStyle={element.font_weight || 'normal'}
                fill={element.font_color || '#ffffff'}
                listening={false}
            />
        </Group>
    );
};

const RenderToggleButton = ({ element, commonProps, width, height }) => {
    const [isOn, setIsOn] = useState(false);

    const toggle = (e) => {
        e.cancelBubble = true;
        setIsOn(!isOn);
    };

    const label = isOn ? (element.label_on || 'ON') : (element.label_off || 'OFF');
    const bgColor = isOn ? (element.background_color_on || '#28a745') : (element.background_color_off || '#6c757d');
    const fontColor = isOn ? (element.font_color_on || '#ffffff') : (element.font_color_off || '#ffffff');

    return (
        <Group {...commonProps} onClick={toggle} onTap={toggle}>
            <Rect
                width={width}
                height={height}
                fill={bgColor}
                cornerRadius={element.corner_radius || height / 2}
                stroke={element.border_color}
                strokeWidth={element.border_width}
            />
            <Circle
                x={isOn ? width - height / 2 : height / 2}
                y={height / 2}
                radius={(height / 2) - 4}
                fill="#ffffff"
                shadowColor="black"
                shadowBlur={2}
                shadowOpacity={0.2}
            />
            <Text
                text={label}
                x={isOn ? 0 : height}
                y={0}
                width={width - height}
                height={height}
                align="center"
                verticalAlign="middle"
                fontFamily={element.font_family || 'Arial'}
                fontSize={element.font_size || 12}
                fontStyle={element.font_weight || 'bold'}
                fill={fontColor}
                listening={false}
            />
        </Group>
    );
};

const RenderSlider = ({ element, commonProps, width, height }) => {
    const isVert = element.orientation === 'vertical';
    const min = Number(element.min_value) || 0;
    const max = Number(element.max_value) || 100;
    const [val, setVal] = useState(Number(element.default_value) || min);

    // Track Dimensions
    const trackSize = isVert ? height : width;
    const handleSize = Number(element.handle_size) || 15;
    const effectiveTrack = trackSize - (handleSize * 2); // padding logic

    // Position
    const pct = (val - min) / (max - min);
    // Simple positioning: center of handle. 
    // Let's assume handle moves from 0 to width (or height).
    const pos = pct * trackSize;

    const updateVal = (newPos) => {
        const clamped = Math.max(0, Math.min(newPos, trackSize));
        const newPct = clamped / trackSize;
        const newVal = min + (newPct * (max - min));
        setVal(newVal);
    };

    return (
        <Group {...commonProps}>
            {/* Track Area (Clickable) */}
            <Rect
                x={isVert ? (width / 2 - 10) : 0}
                y={isVert ? 0 : (height / 2 - 10)}
                width={isVert ? 20 : width}
                height={isVert ? height : 20}
                fill="transparent"
                onMouseDown={(e) => {
                    e.cancelBubble = true;
                    // Simple jump to click
                    const node = e.target;
                    const stage = node.getStage();
                    const pointer = stage.getPointerPosition();
                    const group = node.getParent();
                    const transform = group.getAbsoluteTransform().copy().invert();
                    const local = transform.point(pointer);
                    updateVal(isVert ? local.y : local.x);
                }}
            />

            {/* Visual Track */}
            <Rect
                x={isVert ? (width / 2 - 4) : 0}
                y={isVert ? 0 : (height / 2 - 4)}
                width={isVert ? 8 : width}
                height={isVert ? height : 8}
                fill={element.track_color || '#e9ecef'}
                cornerRadius={4}
                listening={false}
            />
            {/* Fill */}
            <Rect
                x={isVert ? (width / 2 - 4) : 0}
                y={isVert ? pos : (height / 2 - 4)} // Vert fill from top? Or bottom? Standard sliders fill from left/bottom. Left=0. Top=0.
                // If vert, usually bottom is min? 
                // Let's stick to Top=Min for now as logic implies 0->Height.
                width={isVert ? 8 : pos}
                // Actually if Top is 0/Min, then Fill is from 0 to Pos.
                height={isVert ? pos : 8}
                fill={element.fill_color || '#007bff'}
                cornerRadius={4}
                listening={false}
            />

            {/* Handle */}
            <Circle
                x={isVert ? width / 2 : pos}
                y={isVert ? pos : height / 2}
                radius={handleSize}
                fill={element.handle_color || '#ffffff'}
                stroke="#ccc"
                strokeWidth={1}
                shadowColor="black"
                shadowBlur={2}
                shadowOpacity={0.2}
                draggable
                dragBoundFunc={(pos) => {
                    // We can't easily constrain here without absolute knowledge.
                    // But we can just rely on onDragMove to update state which updates position.
                    // Return pos to allow drag, visual snap will happen on re-render.
                    // Actually return pos causes jitter if we force position in render.
                    // Better to just let it drag and use 'dragmove' to update value?
                    return pos;
                }}
                onDragMove={(e) => {
                    e.cancelBubble = true;
                    const node = e.target;
                    // We need local coord.
                    // Node x/y is local if parent is Group? Yes.
                    updateVal(isVert ? node.y() : node.x());
                    // Force node back to constrained line?
                    node.x(isVert ? width / 2 : node.x());
                    node.y(isVert ? node.y() : height / 2);
                }}
            />
            {/* Value Tooltip? */}
            {element.labels_enabled && (
                <Text
                    text={Math.round(val).toString()}
                    x={isVert ? width + 10 : pos - 10}
                    y={isVert ? pos - 5 : height + 10}
                    fontSize={10}
                    fill="black"
                />
            )}
        </Group>
    );
};

const RenderInput = ({ element, commonProps, width, height, type }) => {
    const [val, setVal] = useState(element.default_value || '');

    const handleClick = (e) => {
        e.cancelBubble = true;
        // Simple Prompt
        const newVal = prompt(`Enter ${type === 'Number Input' ? 'Number' : 'Text'}:`, val);
        if (newVal !== null) {
            setVal(newVal);
            if (element.event_on_change) {
                // Trigger event logic?
            }
        }
    };

    return (
        <Group {...commonProps} onClick={handleClick} onTap={handleClick}>
            <Rect
                width={width}
                height={height}
                fill={element.background_color || '#ffffff'}
                stroke={element.border_color || '#ced4da'}
                strokeWidth={element.border_width || 1}
                cornerRadius={element.corner_radius || 4}
            />
            <Text
                text={val ? val.toString() : (element.placeholder_text || '')}
                width={width - 10}
                height={height}
                x={5}
                align={element.text_align || 'left'}
                verticalAlign="middle"
                fontFamily={element.font_family || 'Arial'}
                fontSize={element.font_size || 14}
                fontStyle={element.font_weight || 'normal'}
                fill={element.font_color || '#495057'}
                opacity={val ? 1 : 0.6}
                listening={false}
            />
        </Group>
    );
};

const ElementRenderer = ({ element, onClick }) => {
    const [image] = useImage(element.image_source_url);
    const [iconImage] = useImage(element.image_icon);

    // blinking state
    const [blinkVisible, setBlinkVisible] = useState(true);

    // Determine active style from Convert Values
    const activeRule = getConvertValueStyle(element.current_value, element.convert_values);

    // Ensure Font is Loaded
    useEffect(() => {
        if (element.font_family) {
            loadGoogleFont(element.font_family);
        }
    }, [element.font_family]);

    // Blinking Effect
    useEffect(() => {
        let interval;
        if (activeRule && activeRule.blink) {
            interval = setInterval(() => {
                setBlinkVisible(prev => !prev);
            }, 500);
        } else {
            setBlinkVisible(true);
        }
        return () => clearInterval(interval);
    }, [activeRule]);

    const commonProps = {
        id: element.id,
        x: element.x_position || 0,
        y: element.y_position || 0,
        rotation: element.rotation_angle || 0,
        opacity: element.opacity !== undefined ? element.opacity : 1,
        listening: true,
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

    // Style overrides based on active rule and blink state
    const ruleStyle = activeRule ? (
        (activeRule.blink && !blinkVisible) ?
            { stroke: activeRule.blink_bg_color, fill: activeRule.blink_color, color: activeRule.blink_color } :
            { stroke: activeRule.bg_color, fill: activeRule.color, color: activeRule.color }
    ) : {};

    const strokeProps = {
        stroke: ruleStyle.stroke || element.stroke_color || element.border_color || 'black',
        strokeWidth: element.border_width !== undefined ? Number(element.border_width) : (element.stroke_width !== undefined ? Number(element.stroke_width) : 1),
        dash: element.stroke_style === 'dashed' || element.border_style === 'dashed' ? [10, 5] : undefined,
    };

    const fillProps = {
        fill: ruleStyle.fill || element.fill_color || element.background_color || 'transparent',
    };

    const textFillProps = {
        fill: ruleStyle.color || element.font_color || '#000000'
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
            return <Rect {...commonProps} width={width} height={height} {...fillProps} {...strokeProps} cornerRadius={element.corner_radius || 0} {...shadowProps} />;
        case 'Ellipse/Circle':
            return <Ellipse {...commonProps} radiusX={width / 2} radiusY={height / 2} {...fillProps} {...strokeProps} {...shadowProps} />;
        case 'Polygon':
            return <RegularPolygon {...commonProps} sides={element.sides || 5} radius={width / 2} {...fillProps} {...strokeProps} {...shadowProps} />;
        case 'Arc':
            return <Arc {...commonProps} innerRadius={width / 4} outerRadius={width / 2} angle={element.end_angle || 90} rotation={element.start_angle || 0} {...fillProps} {...strokeProps} {...shadowProps} />;
        case 'Line':
            return <Line {...commonProps} points={[0, 0, width, height]} {...strokeProps} />;
        case 'Static Text Label':
        case 'Dynamic Text (Variable Text)':
            {
                let safeFont = element.font_family;
                if (typeof safeFont !== 'string') safeFont = 'Arial';
                let displayText = element.text_content || element.name || 'Text';

                // 1. Convert Value Substitution
                if (activeRule && activeRule.display_text) {
                    displayText = activeRule.display_text;
                }
                // 2. Data Binding
                else if (element.data_binding_source) {
                    if (element.current_value !== undefined) {
                        displayText = element.current_value === null ? "---" : String(element.current_value);
                    } else {
                        displayText = `(Wait: ${element.data_binding_source})`;
                    }
                }

                return (
                    <Text
                        {...commonProps}
                        text={displayText}
                        fontSize={Number(element.font_size) || 16}
                        fontFamily={safeFont}
                        fontStyle={fontStyle}
                        {...textFillProps} // Use computed text color
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
            return <Image {...commonProps} image={image} width={width} height={height} {...strokeProps} {...shadowProps} />;
        case 'Push Button':
            {
                let safeFont = element.font_family;
                if (typeof safeFont !== 'string') safeFont = 'Arial';

                return (
                    <Group {...commonProps}>
                        <Rect
                            width={width}
                            height={height}
                            {...fillProps}
                            {...strokeProps}
                            cornerRadius={element.corner_radius || 4}
                            shadowBlur={2}
                        />

                        {element.image_icon && iconImage ? (
                            <Image
                                image={iconImage}
                                width={width * 0.8}
                                height={height * 0.8}
                                x={width * 0.1}
                                y={height * 0.1}
                                listening={false}
                            />
                        ) : (
                            <Text
                                text={element.label_text || 'Button'}
                                width={width}
                                height={height}
                                align="center"
                                verticalAlign="middle"
                                fontSize={Number(element.font_size) || 14}
                                fontFamily={safeFont}
                                fontStyle={fontStyle}
                                fill={ruleStyle.stroke || element.font_color || 'black'} // Text Color (from Bg Color rule)
                                listening={false}
                            />
                        )}
                    </Group>
                );
            }
        case 'Toggle Button/Switch':
            return (
                <Group {...commonProps}>
                    <Rect width={width} height={height} fill="#ccc" cornerRadius={height / 2} {...(activeRule ? fillProps : {})} />
                    <Circle x={height / 2} y={height / 2} radius={height / 2 - 2} fill="white" />
                </Group>
            );
        case 'Slider':
            return (
                <Group {...commonProps}>
                    <Rect y={height / 2 - 2} width={width} height={4} fill="#ddd" />
                    <Circle x={width / 2} y={height / 2} radius={8} fill="#007bff" {...(activeRule ? fillProps : {})} />
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
                    <Rect width={width} height={height} fill="white" stroke="black" strokeWidth={1} />
                    <Rect x={0} y={0} width={width} height={30} fill="#f0f0f0" stroke="black" strokeWidth={1} />
                    <Text text={element.type === 'Data Table' ? "ID | Name | Value | Status" : "Time | Severity | Message | State"} x={5} y={10} width={width} fontSize={12} fontStyle="bold" />
                    <Line points={[0, 30, width, 30]} stroke="black" strokeWidth={1} />
                    {[1, 2, 3].map(i => (
                        <Group key={i} y={30 + (i * 25)}>
                            <Text text={element.type === 'Data Table' ? `00${i} | Item ${i} | ${(Math.random() * 100).toFixed(1)} | OK` : `10:0${i} | High | Alarm ${i} Active | ACK`} x={5} y={5} fontSize={12} />
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
                    <Line points={[30, 10, 30, height - 20, width - 10, height - 20]} stroke="black" strokeWidth={2} />
                    <Text text="Y-Axis" x={5} y={height / 2} rotation={-90} fontSize={10} />
                    <Text text="X-Axis (Time)" x={width / 2 - 20} y={height - 15} fontSize={10} />
                    {element.type.includes('Trend') ? (
                        <Line
                            points={[30, height - 20, 30 + (width - 40) * 0.2, height - 20 - (height - 40) * 0.3, 30 + (width - 40) * 0.4, height - 20 - (height - 40) * 0.6, 30 + (width - 40) * 0.6, height - 20 - (height - 40) * 0.4, 30 + (width - 40) * 0.8, height - 20 - (height - 40) * 0.8, width - 10, height - 20 - (height - 40) * 0.5]}
                            stroke={element.line_colors || "blue"} strokeWidth={2}
                        />
                    ) : (
                        <Group>
                            {[0.2, 0.5, 0.8, 0.4, 0.7].map((val, idx) => (
                                <Rect key={idx} x={40 + (idx * ((width - 50) / 5))} y={height - 20 - (val * (height - 30))} width={((width - 50) / 5) - 5} height={val * (height - 30)} fill={element.fill_color || "blue"} />
                            ))}
                        </Group>
                    )}
                </Group>
            );


        case 'Hyperlink/Goto Tag':
            {
                let safeFont = element.font_family;
                if (typeof safeFont !== 'string') safeFont = 'Arial';

                // Link Text Color: prefer rule Bg Color (as Color is used for Shape Fill), else blue
                const linkTextFill = ruleStyle.stroke || element.font_color || 'blue';


                return (
                    <Group {...commonProps}>
                        {/* Background (Optional) */}
                        <Rect
                            width={width}
                            height={height}
                            {...fillProps}
                            {...strokeProps}
                            cornerRadius={element.corner_radius || 0}
                        />

                        {element.image_icon && iconImage ? (
                            <Image
                                image={iconImage}
                                width={width * 0.8}
                                height={height * 0.8}
                                x={width * 0.1}
                                y={height * 0.1}
                                listening={false}
                            />
                        ) : (
                            <Text
                                text={element.label_text || 'Link'}
                                width={width}
                                height={height}
                                align="center"
                                verticalAlign="middle"
                                fontSize={Number(element.font_size) || 14}
                                fontFamily={safeFont}
                                fontStyle={fontStyle}
                                fill={linkTextFill}
                                textDecoration={element.underline ? 'underline' : ''}
                                listening={false}
                            />
                        )}
                    </Group>
                );
            }



        case 'Icon':
            {
                const iconData = getIconPath(element.icon_set || 'Font Awesome', element.icon_name);
                const pathData = iconData ? iconData.data : (ICON_PATHS['home'] || '');
                const viewBox = iconData ? iconData.viewBox : '0 0 512 512';
                const [, , vw, vh] = viewBox.split(' ').map(Number);

                // Icon Color: Prefer 'color' (text/stroke color) over 'bg_color' (fill)
                const iconFill = ruleStyle.color || ruleStyle.fill || element.fill_color || 'black';

                return (
                    <Path
                        {...commonProps}
                        data={pathData}
                        fill={iconFill}
                        scaleX={width / (vw || 512)}
                        scaleY={height / (vh || 512)}
                        {...shadowProps}
                    />
                );
            }

        case 'Vertical Gauge':
            {
                const min = Number(element.min_value) || 0;
                const max = Number(element.max_value) || 100;
                let val = Number(element.current_value);
                if (isNaN(val)) val = min;
                val = Math.max(min, Math.min(max, val));
                const ratio = (val - min) / (max - min);

                // Ranges Logic
                const ranges = element.ranges || [];
                const useRanges = ranges.length > 0;
                const rangeGradient = element.range_color_mode === 'gradient';
                const defaultColor = element.gauge_color || "#eee";

                const pointerColor = element.pointer_color || "black";
                const pointerThick = Number(element.pointer_thickness) || 2;

                return (
                    <Group {...commonProps}>
                        {/* Background / Tracks */}
                        <Group>
                            {useRanges && !rangeGradient ? (
                                ranges.map((range, idx) => {
                                    const rStart = Math.max(min, Math.min(max, range.start));
                                    const rEnd = Math.max(min, Math.min(max, range.end));
                                    if (rStart >= rEnd) return null;

                                    const rStartRatio = (rStart - min) / (max - min);
                                    const rEndRatio = (rEnd - min) / (max - min);

                                    const yBottom = height - (rStartRatio * height);
                                    const yTop = height - (rEndRatio * height);

                                    return (
                                        <Rect
                                            key={idx}
                                            x={0}
                                            y={yTop}
                                            width={width}
                                            height={yBottom - yTop}
                                            fill={range.color}
                                        />
                                    )
                                })
                            ) : (
                                <Rect
                                    width={width}
                                    height={height}
                                    {...(useRanges && rangeGradient ? {
                                        fillLinearGradientStartPoint: { x: 0, y: height },
                                        fillLinearGradientEndPoint: { x: 0, y: 0 },
                                        fillLinearGradientColorStops: getSafeGradientStops(ranges, min, max, defaultColor)
                                    } : {
                                        fill: defaultColor
                                    })}
                                    stroke={element.border_color || 'black'}
                                    strokeWidth={element.border_width !== undefined ? Number(element.border_width) : 1}
                                    cornerRadius={element.corner_radius || 0}
                                />
                            )}
                        </Group>

                        {/* Marker Line */}
                        <Line
                            points={[0, height - (ratio * height), width, height - (ratio * height)]}
                            stroke={pointerColor}
                            strokeWidth={pointerThick}
                        />

                        {/* Value Text */}
                        {element.labels_enabled !== false && (
                            <Text
                                text={val.toFixed(1)}
                                x={(width / 2) - 100}
                                y={height - (ratio * height) - 15}
                                width={200}
                                align="center"
                                fontSize={element.font_size || 12}
                                fill={element.current_value_color || 'black'}
                                listening={false}
                            />
                        )}

                        {/* Ticks (Simple) */}
                        {element.tick_marks && (
                            <Group>
                                <Text text={max.toString()} x={width + 5} y={0} fontSize={10} />
                                <Text text={min.toString()} x={width + 5} y={height - 10} fontSize={10} />
                            </Group>
                        )}
                    </Group>
                );
            }

        case 'Horizontal Gauge':
            {
                const min = Number(element.min_value) || 0;
                const max = Number(element.max_value) || 100;
                let val = Number(element.current_value);
                if (isNaN(val)) val = min;
                val = Math.max(min, Math.min(max, val));
                const ratio = (val - min) / (max - min);

                // Ranges Logic
                const ranges = element.ranges || [];
                const useRanges = ranges.length > 0;
                const rangeGradient = element.range_color_mode === 'gradient';
                const defaultColor = element.gauge_color || "#eee";

                const pointerColor = element.pointer_color || "black";
                const pointerThick = Number(element.pointer_thickness) || 2;

                return (
                    <Group {...commonProps}>
                        {/* Background / Tracks */}
                        <Group>
                            {useRanges && !rangeGradient ? (
                                ranges.map((range, idx) => {
                                    const rStart = Math.max(min, Math.min(max, range.start));
                                    const rEnd = Math.max(min, Math.min(max, range.end));
                                    if (rStart >= rEnd) return null;

                                    const rStartRatio = (rStart - min) / (max - min);
                                    const rEndRatio = (rEnd - min) / (max - min);

                                    const xLeft = rStartRatio * width;
                                    const xRight = rEndRatio * width;

                                    return (
                                        <Rect
                                            key={idx}
                                            x={xLeft}
                                            y={0}
                                            width={xRight - xLeft}
                                            height={height}
                                            fill={range.color}
                                        />
                                    )
                                })
                            ) : (
                                <Rect
                                    width={width}
                                    height={height}
                                    {...(useRanges && rangeGradient ? {
                                        fillLinearGradientStartPoint: { x: 0, y: 0 },
                                        fillLinearGradientEndPoint: { x: width, y: 0 },
                                        fillLinearGradientColorStops: getSafeGradientStops(ranges, min, max, defaultColor)
                                    } : {
                                        fill: defaultColor
                                    })}
                                    stroke={element.border_color || 'black'}
                                    strokeWidth={element.border_width !== undefined ? Number(element.border_width) : 1}
                                    cornerRadius={element.corner_radius || 0}
                                />
                            )}
                        </Group>

                        {/* Marker Line */}
                        <Line
                            points={[ratio * width, 0, ratio * width, height]}
                            stroke={pointerColor}
                            strokeWidth={pointerThick}
                        />

                        {/* Value Text */}
                        {element.labels_enabled !== false && (
                            <Text
                                text={val.toFixed(1)}
                                x={(ratio * width) - 50}
                                y={height + 5}
                                width={100}
                                align="center"
                                fontSize={element.font_size || 12}
                                fill={element.current_value_color || 'black'}
                                listening={false}
                            />
                        )}

                        {/* Ticks */}
                        {element.tick_marks && (
                            <Group>
                                <Text text={min.toString()} x={0} y={height + 20} fontSize={10} />
                                <Text text={max.toString()} x={width - 20} y={height + 20} fontSize={10} />
                            </Group>
                        )}
                    </Group>
                );
            }



        case 'Circular Gauge':
            {
                // Circular Gauge Logic
                const min = Number(element.min_value) || 0;
                const max = Number(element.max_value) || 100;
                let val = Number(element.current_value);
                if (isNaN(val)) val = min;
                val = Math.max(min, Math.min(max, val));

                const ratio = (val - min) / (max - min);

                // Symmetric Sweep Logic
                const sweepAngle = element.sweep_angle !== undefined ? Number(element.sweep_angle) : 300;
                const gap = 360 - Math.abs(sweepAngle);
                const computedStart = 90 + (gap / 2); // Center gap at 90 (Bottom)

                const startAngle = element.start_angle !== undefined ? Number(element.start_angle) : computedStart;
                const clockwise = sweepAngle >= 0;

                const needleAngle = startAngle + (ratio * sweepAngle);

                const size = Math.min(width, height);
                const cx = width / 2;
                const cy = height / 2;
                const radius = size / 2;

                const minThick = Number(element.min_thickness) || 5;
                const maxThick = Number(element.max_thickness) || 20;

                // Parse Custom Labels
                let customLabels = [];
                if (element.custom_labels_list && Array.isArray(element.custom_labels_list)) {
                    customLabels = element.custom_labels_list.map(item => ({
                        percent: ((Number(item.value) - min) / (max - min)) * 100,
                        label: item.text,
                        value: Number(item.value)
                    }));
                } else {
                    customLabels = (element.custom_labels || "")
                        .split(',')
                        .map(s => s.trim())
                        .filter(s => s)
                        .map(s => {
                            const [p, l] = s.split(':');
                            return { percent: parseFloat(p), label: l };
                        });
                }

                // Ranges Logic
                const ranges = element.ranges || [];
                const useRanges = ranges.length > 0;
                const rangeGradient = element.range_color_mode === 'gradient';

                // Gradient Logic (Legacy)
                const useGradient = !useRanges && element.min_color && element.max_color;

                let midStop = 0.5;
                if (useGradient && element.mid_value !== undefined && element.mid_value !== null && element.mid_value !== "") {
                    const midVal = Number(element.mid_value);
                    if (!isNaN(midVal) && (max - min) !== 0) {
                        midStop = (midVal - min) / (max - min);
                        midStop = Math.max(0, Math.min(1, midStop)); // Clamp
                    }
                }

                const fillProps = useGradient ? {
                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                    fillLinearGradientEndPoint: { x: width, y: 0 },
                    fillLinearGradientColorStops: [
                        0, element.min_color,
                        midStop, element.mid_color || element.min_color,
                        1, element.max_color
                    ]
                } : {
                    fill: element.gauge_color || "#eee"
                };

                return (
                    <Group {...commonProps}>
                        {/* Tapered Arc Background (Ranges or Single) */}
                        {useRanges && !rangeGradient ? (
                            // Solid Segments
                            ranges.map((range, idx) => {
                                const rStart = Math.max(min, Math.min(max, range.start));
                                const rEnd = Math.max(min, Math.min(max, range.end));
                                if (rStart >= rEnd) return null;

                                const rStartRatio = (rStart - min) / (max - min);
                                const rEndRatio = (rEnd - min) / (max - min);

                                const rStartAngle = startAngle + (rStartRatio * sweepAngle);
                                const rSweepAngle = (rEndRatio - rStartRatio) * sweepAngle;

                                const rMinThick = minThick + (maxThick - minThick) * rStartRatio;
                                const rMaxThick = minThick + (maxThick - minThick) * rEndRatio;

                                return (
                                    <Shape
                                        key={idx}
                                        sceneFunc={(context, shape) => {
                                            const sRad = (rStartAngle * Math.PI) / 180;
                                            const swRad = (rSweepAngle * Math.PI) / 180;
                                            const counterClockwise = rSweepAngle < 0;
                                            const steps = 30;

                                            context.beginPath();
                                            context.arc(cx, cy, radius, sRad, sRad + swRad, counterClockwise);

                                            for (let i = steps; i >= 0; i--) {
                                                const t = i / steps;
                                                const angle = sRad + swRad * t;
                                                const currentThick = rMinThick + (rMaxThick - rMinThick) * t;
                                                const r = radius - currentThick;
                                                const px = cx + r * Math.cos(angle);
                                                const py = cy + r * Math.sin(angle);
                                                context.lineTo(px, py);
                                            }
                                            context.closePath();
                                            context.fillStrokeShape(shape);
                                        }}
                                        fill={range.color}
                                    />
                                );
                            })
                        ) : (
                            <Shape
                                sceneFunc={(context, shape) => {
                                    const startRad = (startAngle * Math.PI) / 180;
                                    const sweepRad = (sweepAngle * Math.PI) / 180;
                                    const steps = 100;

                                    context.beginPath();
                                    context.arc(cx, cy, radius, startRad, startRad + sweepRad, !clockwise);

                                    for (let i = steps; i >= 0; i--) {
                                        const t = i / steps;
                                        const angle = startRad + sweepRad * t;
                                        const currentThick = minThick + (maxThick - minThick) * t;
                                        const r = radius - currentThick;
                                        const px = cx + r * Math.cos(angle);
                                        const py = cy + r * Math.sin(angle);
                                        context.lineTo(px, py);
                                    }
                                    context.closePath();
                                    context.fillStrokeShape(shape);
                                }}
                                {...(useRanges && rangeGradient ? {
                                    fillLinearGradientStartPoint: { x: 0, y: 0 },
                                    fillLinearGradientEndPoint: { x: width, y: 0 },
                                    fillLinearGradientColorStops: getSafeGradientStops(ranges, min, max, element.gauge_color || "#eee")
                                } : fillProps)}
                                stroke={element.border_color || null}
                                strokeWidth={element.border_width || 0}
                            />
                        )}

                        {/* Custom Labels */}
                        {element.labels_enabled !== false && customLabels.length > 0 && customLabels.map((item, idx) => {
                            if (isNaN(item.percent)) return null;
                            const t = item.percent / 100;
                            const angle = startAngle + sweepAngle * t;
                            const rad = (angle * Math.PI) / 180;
                            const currentThick = minThick + (maxThick - minThick) * t;
                            const labelRadius = radius - currentThick - 15;
                            const lx = cx + labelRadius * Math.cos(rad);
                            const ly = cy + labelRadius * Math.sin(rad);

                            return (
                                <Text
                                    key={idx}
                                    text={item.label || ''}
                                    x={lx - 15}
                                    y={ly - 5}
                                    width={30}
                                    align="center"
                                    fontSize={element.font_size || 10}
                                    fill={element.current_value_color || 'black'}
                                    listening={false}
                                />
                            );
                        })}

                        {/* Pointer (Needle) */}
                        <Group x={cx} y={cy} rotation={needleAngle}>
                            <Circle radius={5} fill={element.pointer_color || "black"} />
                            <Shape
                                sceneFunc={(context, shape) => {
                                    const needleLen = radius - 5;
                                    const needleThick = Number(element.pointer_thickness) || 2;
                                    context.beginPath();
                                    context.moveTo(0, -needleThick / 2);
                                    context.lineTo(needleLen, 0);
                                    context.lineTo(0, needleThick / 2);
                                    context.closePath();
                                    context.fillStrokeShape(shape);
                                }}
                                fill={element.pointer_color || "black"}
                            />
                        </Group>

                        {/* Value Text */}
                        {element.labels_enabled !== false && !customLabels.length && (
                            <Text
                                text={val.toFixed(1)}
                                x={cx - 50}
                                y={cy - 10}
                                width={100}
                                align="center"
                                fontSize={element.font_size || 16}
                                fill={element.current_value_color || 'black'}
                                listening={false}
                            />
                        )}
                    </Group>
                );
            }


        case 'Line Chart':
            {
                // Line Chart Logic
                // Support Spline (Curved), Step, Linear (Straight), State
                const chartTitle = element.chart_title || "Chart Title";
                const xAxisLabel = element.x_axis_label || "X Axis";
                const yAxisLabel = element.y_axis_label || "Y Axis";

                const margin = { top: 30, right: 30, bottom: 40, left: 50 };
                const chartWidth = width - margin.left - margin.right;
                const chartHeight = height - margin.top - margin.bottom;

                const points = element.points_list || [];

                const displayPoints = points.length > 0 ? points : [
                    { label: 'T1', value: 10 },
                    { label: 'T2', value: 40 },
                    { label: 'T3', value: 25 },
                    { label: 'T4', value: 60 },
                    { label: 'T5', value: 30 }
                ];

                const values = displayPoints.map(p => Number(p.value) || 0);

                const axisColor = element.axis_color || 'black';
                const axisThickness = Number(element.axis_thickness) || 1;
                const tickThickness = Number(element.tick_thickness) || 1;
                const lineColor = element.line_color || '#3498db';
                const lineWidth = Number(element.line_width) || 2;
                const pointRadius = Number(element.point_radius) || 3;

                const lineType = element.line_type || 'spline';
                const isState = lineType === 'state';

                let yMin = 0;
                let yMax = 100;

                if (isState) {
                    yMin = 0;
                    yMax = 1;
                } else if (element.y_axis_mode === 'manual') {
                    yMin = Number(element.y_min) || 0;
                    yMax = Number(element.y_max);
                    if (isNaN(yMax)) yMax = 100;
                } else {
                    if (values.length > 0) {
                        yMin = Math.min(...values);
                        yMax = Math.max(...values);
                        const range = yMax - yMin;
                        if (range === 0) {
                            yMax += 10;
                            yMin = Math.max(0, yMin - 10);
                        } else {
                            yMax += range * 0.1;
                            yMin = Math.max(0, yMin - range * 0.1);
                        }
                    }
                }

                const pointCount = displayPoints.length;
                const xStep = pointCount > 1 ? chartWidth / (pointCount - 1) : chartWidth;

                let pathData = "";
                const coordinatePoints = displayPoints.map((p, i) => {
                    const val = Number(p.value) || 0;
                    const clampedVal = Math.max(yMin, Math.min(yMax, val));
                    const ratio = (clampedVal - yMin) / (yMax - yMin);

                    const py = chartHeight - (ratio * chartHeight);
                    const px = i * xStep;
                    return { x: px, y: py, val: val, label: p.label, point: p };
                });

                if (displayPoints.length > 0) {
                    if (lineType === 'linear') {
                        pathData = `M ${coordinatePoints[0].x} ${coordinatePoints[0].y}`;
                        for (let i = 1; i < coordinatePoints.length; i++) {
                            pathData += ` L ${coordinatePoints[i].x} ${coordinatePoints[i].y}`;
                        }
                    } else if (lineType === 'step' || isState) {
                        pathData = `M ${coordinatePoints[0].x} ${coordinatePoints[0].y}`;
                        for (let i = 1; i < coordinatePoints.length; i++) {
                            pathData += ` L ${coordinatePoints[i].x} ${coordinatePoints[i - 1].y}`;
                            pathData += ` L ${coordinatePoints[i].x} ${coordinatePoints[i].y}`;
                        }
                    }
                }

                return (
                    <Group {...commonProps}>
                        <Rect
                            width={width}
                            height={height}
                            fill={element.background_color || 'transparent'}
                            stroke={element.border_color || null}
                            strokeWidth={element.border_width !== undefined ? Number(element.border_width) : 0}
                        />

                        <Group x={margin.left} y={margin.top}>
                            <Text
                                text={chartTitle}
                                x={0}
                                y={-25}
                                width={chartWidth}
                                align="center"
                                fontSize={element.chart_title_font_size || 14}
                                fontFamily={element.chart_title_font_family || 'Arial'}
                                fontStyle={element.chart_title_font_weight || 'bold'}
                                fill={element.chart_title_color || 'black'}
                            />

                            <Line points={[0, 0, 0, chartHeight]} stroke={axisColor} strokeWidth={axisThickness} />
                            <Line points={[0, chartHeight, chartWidth, chartHeight]} stroke={axisColor} strokeWidth={axisThickness} />

                            {(() => {
                                const tickCount = 5;
                                return Array.from({ length: tickCount + 1 }).map((_, i) => {
                                    const ratio = i / tickCount;
                                    const yPos = chartHeight - (ratio * chartHeight);
                                    const tickVal = yMin + (ratio * (yMax - yMin));

                                    return (
                                        <Group key={`ytick-${i}`}>
                                            <Line points={[-5, yPos, 0, yPos]} stroke={axisColor} strokeWidth={tickThickness} />
                                            <Text
                                                text={isState ? (Math.round(tickVal) ? 'ON' : 'OFF') : tickVal.toFixed(1)}
                                                x={-45}
                                                y={yPos - 5}
                                                width={40}
                                                align="right"
                                                fontSize={10}
                                                fill={axisColor}
                                            />
                                        </Group>
                                    );
                                });
                            })()}

                            {coordinatePoints.map((p, i) => (
                                <Group key={`xtick-${i}`}>
                                    <Line points={[p.x, chartHeight, p.x, chartHeight + 5]} stroke={axisColor} strokeWidth={tickThickness} />
                                    <Text
                                        text={p.label || ''}
                                        x={p.x - 20}
                                        y={chartHeight + 5}
                                        width={40}
                                        align="center"
                                        fontSize={p.point.label_font_size || 10}
                                        fontFamily={p.point.label_font_family || 'Arial'}
                                        fontStyle={p.point.label_font_weight || 'normal'}
                                        fill={p.point.label_font_color || axisColor}
                                    />
                                </Group>
                            ))}

                            {(lineType === 'linear' || lineType === 'spline') && (
                                <Line
                                    points={coordinatePoints.flatMap(p => [p.x, p.y])}
                                    stroke={lineColor}
                                    strokeWidth={lineWidth}
                                    tension={lineType === 'spline' ? 0.4 : 0}
                                    bezier={false}
                                />
                            )}

                            {(lineType === 'step' || isState) && (
                                <Path
                                    data={pathData}
                                    stroke={lineColor}
                                    strokeWidth={lineWidth}
                                    fill={null}
                                />
                            )}

                            {coordinatePoints.map((p, i) => (
                                <Circle
                                    key={`pt-${i}`}
                                    x={p.x}
                                    y={p.y}
                                    radius={pointRadius}
                                    fill={p.point.color || lineColor}
                                    stroke="white"
                                    strokeWidth={1}
                                />
                            ))}

                            <Group x={-40} y={chartHeight / 2} rotation={-90}>
                                <Text
                                    text={yAxisLabel}
                                    x={-chartHeight / 2}
                                    y={0}
                                    width={chartHeight}
                                    align="center"
                                    fontSize={element.y_axis_label_font_size || 12}
                                    fill={element.y_axis_label_font_color || axisColor}
                                />
                            </Group>

                            <Text
                                text={xAxisLabel}
                                x={0}
                                y={chartHeight + 25}
                                width={chartWidth}
                                align="center"
                                fontSize={element.x_axis_label_font_size || 12}
                                fill={element.x_axis_label_font_color || axisColor}
                            />

                        </Group>
                    </Group>
                );
            }

        case 'Push Button':
        case 'Increase Button':
        case 'Decrease Button':
            return <RenderPushButton element={element} commonProps={commonProps} width={width} height={height} />;

        case 'Toggle Button/Switch':
            return <RenderToggleButton element={element} commonProps={commonProps} width={width} height={height} />;

        case 'Slider':
            return <RenderSlider element={element} commonProps={commonProps} width={width} height={height} />;

        case 'Text Input':
            return <RenderInput element={element} commonProps={commonProps} width={width} height={height} type="Text Input" />;

        case 'Number Input':
            return <RenderInput element={element} commonProps={commonProps} width={width} height={height} type="Number Input" />;

        case 'Pie Chart':
        case 'Donut Chart':
            {
                // Pie/Donut Chart Logic
                const isDonut = element.type === 'Donut Chart';
                const chartTitle = element.chart_title || "Chart Title";

                const cx = width / 2;
                const cy = height / 2;
                const radius = Math.min(width, height) / 2 - 20; // 20px padding

                let innerRadius = 0;
                if (isDonut) {
                    if (element.inner_radius) {
                        if (String(element.inner_radius).includes('%')) {
                            const pct = parseFloat(element.inner_radius) / 100;
                            innerRadius = radius * pct;
                        } else {
                            innerRadius = Number(element.inner_radius);
                        }
                    } else {
                        innerRadius = radius * 0.5;
                    }
                }

                const slices = element.slices_list || [];
                const effectiveSlices = slices.length > 0 ? slices : [
                    { label: 'Slice A', value: 30, color: '#e74c3c' },
                    { label: 'Slice B', value: 50, color: '#3498db' },
                    { label: 'Slice C', value: 20, color: '#2ecc71' }
                ];

                const total = effectiveSlices.reduce((acc, slice) => acc + (Number(slice.value) || 0), 0);

                let currentAngle = 0;

                return (
                    <Group {...commonProps}>
                        {/* Background */}
                        <Rect
                            width={width}
                            height={height}
                            fill={element.background_color || 'transparent'}
                            stroke={element.border_color || null}
                            strokeWidth={element.border_width !== undefined ? Number(element.border_width) : 0}
                        />

                        {/* Title */}
                        {element.chart_title && (
                            <Text
                                text={chartTitle}
                                x={0}
                                y={5}
                                width={width}
                                align="center"
                                fontSize={element.chart_title_font_size || 14}
                                fontFamily={element.chart_title_font_family || 'Arial'}
                                fontStyle={element.chart_title_font_weight || 'bold'}
                                fill={element.chart_title_color || 'black'}
                            />
                        )}

                        {/* Slices */}
                        <Group x={cx} y={cy}>
                            {effectiveSlices.map((slice, i) => {
                                const val = Number(slice.value) || 0;
                                if (val <= 0) return null;

                                const sliceAngle = (val / total) * 360;
                                const startAngle = currentAngle;

                                const midAngle = startAngle + sliceAngle / 2;
                                const rad = (midAngle * Math.PI) / 180;

                                currentAngle += sliceAngle;

                                const labelRadius = innerRadius + (radius - innerRadius) / 2;
                                const lx = labelRadius * Math.cos(rad);
                                const ly = labelRadius * Math.sin(rad);

                                // Construct Label Text: "Label: Value" or just "Value"
                                let labelText = slice.label || '';
                                if (labelText) labelText += ': ';
                                labelText += val.toString(); // TODO: Formatting?

                                return (
                                    <Group key={i}>
                                        <Arc
                                            innerRadius={innerRadius}
                                            outerRadius={radius}
                                            angle={sliceAngle}
                                            rotation={startAngle}
                                            fill={slice.color || '#ccc'}
                                            stroke="white"
                                            strokeWidth={1}
                                        />

                                        <Text
                                            text={labelText}
                                            x={lx - 30}
                                            y={ly - 5}
                                            width={60}
                                            align="center"
                                            fontSize={slice.label_font_size || 10}
                                            fontFamily={slice.label_font_family || 'Arial'}
                                            fontStyle={slice.label_font_weight || 'bold'}
                                            fill={slice.label_color || 'white'}
                                        />
                                    </Group>
                                );
                            })}
                        </Group>
                    </Group>
                );
            }

        case 'Bar Chart':
            {
                // Bar Chart Logic
                const chartTitle = element.chart_title || "Chart Title";
                const xAxisLabel = element.x_axis_label || "X Axis";
                const yAxisLabel = element.y_axis_label || "Y Axis";

                const margin = { top: 30, right: 20, bottom: 40, left: 50 };
                const chartWidth = width - margin.left - margin.right;
                const chartHeight = height - margin.top - margin.bottom;

                // Parse Bars
                const bars = element.bars_list || [];
                const barValues = bars.map(b => {
                    // Client logic: Check for Point Binding + Manual Override
                    // For now, adhere to Editor logic: value prop.
                    // Future: resolve point_id to actual value from context/store
                    return Number(b.value) || 0;
                });

                const axisColor = element.axis_color || 'black';
                const axisThickness = Number(element.axis_thickness) || 1;
                const tickThickness = Number(element.tick_thickness) || 1;

                // Y Axis Scale
                let yMin = 0;
                let yMax = 100;

                if (element.y_axis_mode === 'manual') {
                    yMin = Number(element.y_min) || 0;
                    yMax = Number(element.y_max);
                    if (isNaN(yMax)) yMax = 100;
                } else {
                    // Auto Scale
                    if (bars.length > 0) {
                        const maxVal = Math.max(...barValues);
                        const minVal = Math.min(...barValues);
                        yMax = maxVal + (maxVal * 0.1); // add 10% padding
                        yMin = Math.min(0, minVal); // start at 0 unless negative
                        if (yMax === 0 && yMin === 0) yMax = 100;
                    }
                }

                if (yMax <= yMin) yMax = yMin + 1; // Prevent div by zero

                // X Axis Logic (Evenly distributed)
                const barCount = bars.length;
                const availableWidthPerBar = barCount > 0 ? chartWidth / barCount : chartWidth;

                return (
                    <Group {...commonProps}>
                        {/* Background */}
                        <Rect
                            width={width}
                            height={height}
                            fill={element.background_color || 'white'}
                            stroke={element.border_color || '#ccc'}
                            strokeWidth={element.border_width !== undefined ? Number(element.border_width) : 1}
                        />

                        {/* Chart Title */}
                        <Text
                            text={chartTitle}
                            x={0}
                            y={5}
                            width={width}
                            align="center"
                            fontSize={element.chart_title_font_size || 14}
                            fontFamily={element.chart_title_font_family || 'Arial'}
                            fontStyle={element.chart_title_font_weight || 'bold'}
                            fill={element.chart_title_color || 'black'}
                        />

                        {/* Plot Area Group (Shifted by margin) */}
                        <Group x={margin.left} y={margin.top}>
                            {/* Y Axis Line */}
                            <Line points={[0, 0, 0, chartHeight]} stroke={axisColor} strokeWidth={axisThickness} />

                            {/* X Axis Line */}
                            <Line points={[0, chartHeight, chartWidth, chartHeight]} stroke={axisColor} strokeWidth={axisThickness} />

                            {/* Y Axis Ticks & Labels */}
                            {(() => {
                                let ticks = [];
                                const div = element.y_axis_divisions ? parseInt(element.y_axis_divisions) : 0;

                                if (div > 0) {
                                    // Custom Divisions
                                    for (let i = 0; i <= div; i++) {
                                        ticks.push(yMin + ((yMax - yMin) / div) * i);
                                    }
                                } else {
                                    // Default (Min, Mid, Max)
                                    ticks = [yMin, (yMin + yMax) / 2, yMax];
                                }

                                return ticks.map((tickVal, tIdx) => {
                                    const normalized = Math.max(yMin, Math.min(yMax, tickVal));
                                    const ratio = (normalized - yMin) / (yMax - yMin);
                                    const yPos = chartHeight - (ratio * chartHeight);

                                    return (
                                        <Group key={tIdx}>
                                            <Line points={[-5, yPos, 0, yPos]} stroke={axisColor} strokeWidth={tickThickness} />
                                            <Text
                                                text={tickVal.toFixed(1)}
                                                x={-45}
                                                y={yPos - 5}
                                                width={40}
                                                align="right"
                                                fontSize={10}
                                                fill={axisColor}
                                            />
                                        </Group>
                                    );
                                });
                            })()}

                            {/* Y Axis Title (Rotated) */}
                            <Group x={-40} y={chartHeight / 2} rotation={-90}>
                                <Text
                                    text={element.y_axis_label || "Y Axis"}
                                    x={-chartHeight / 2}
                                    y={0}
                                    width={chartHeight}
                                    align="center"
                                    fontSize={element.y_axis_label_font_size || 12}
                                    fontFamily={element.y_axis_label_font_family || 'Arial'}
                                    fontStyle={element.y_axis_label_font_weight || 'normal'}
                                    fill={element.y_axis_label_font_color || axisColor}
                                />
                            </Group>


                            {/* Bars */}
                            {bars.map((bar, i) => {
                                const val = Number(bar.value) || 0;
                                const normalizedVal = Math.max(yMin, Math.min(yMax, val));
                                const ratio = (normalizedVal - yMin) / (yMax - yMin);

                                const barH = ratio * chartHeight;
                                // Safely handle width calculation
                                let barW = Number(bar.thickness) || 30;
                                if (availableWidthPerBar * 0.8 < barW) {
                                    barW = availableWidthPerBar * 0.8;
                                }

                                // Center bar in slot
                                const slotX = i * availableWidthPerBar;
                                const barX = slotX + (availableWidthPerBar - barW) / 2;
                                const barY = chartHeight - barH;

                                return (
                                    <Group key={i}>
                                        <Rect
                                            x={barX}
                                            y={barY}
                                            width={barW}
                                            height={barH}
                                            fill={bar.color || '#3498db'}
                                            stroke="black"
                                            strokeWidth={1}
                                        />
                                        {/* X Axis Tick */}
                                        <Line
                                            points={[
                                                slotX + availableWidthPerBar / 2,
                                                chartHeight,
                                                slotX + availableWidthPerBar / 2,
                                                chartHeight + 5
                                            ]}
                                            stroke={axisColor}
                                            strokeWidth={tickThickness}
                                        />
                                        {/* X Label */}
                                        <Text
                                            text={bar.label || ''}
                                            x={slotX}
                                            y={chartHeight + 5}
                                            width={availableWidthPerBar}
                                            align="center"
                                            fontSize={bar.label_font_size || 10}
                                            fontFamily={bar.label_font_family || 'Arial'}
                                            fontStyle={bar.label_font_weight || 'normal'}
                                            fill={bar.label_font_color || axisColor}
                                        />
                                    </Group>
                                );
                            })}

                            {/* X Axis Title */}
                            <Text
                                text={element.x_axis_label || "X Axis"}
                                x={0}
                                y={chartHeight + 25}
                                width={chartWidth}
                                align="center"
                                fontSize={element.x_axis_label_font_size || 12}
                                fontFamily={element.x_axis_label_font_family || 'Arial'}
                                fontStyle={element.x_axis_label_font_weight || 'normal'}
                                fill={element.x_axis_label_font_color || axisColor}
                            />

                        </Group>
                    </Group>
                );
            }

        case 'Web View':
        case 'Video Player':
            return (
                <Group {...commonProps}>
                    <Rect
                        width={width}
                        height={height}
                        fill={element.background_color || 'transparent'}
                        stroke={element.border_color || null}
                        strokeWidth={element.border_width || 0}
                        cornerRadius={element.corner_radius || 0}
                        shadowColor={element.shadow_color || null}
                        shadowBlur={element.shadow_offset || 0}
                        shadowOffset={{ x: 2, y: 2 }}
                        shadowOpacity={0.2}
                    />
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

// Helper for safe gradient stops
const getSafeGradientStops = (ranges, min, max, defaultColor) => {
    if (!ranges || ranges.length === 0) return [0, defaultColor, 1, defaultColor];
    if (max - min === 0) return [0, defaultColor, 1, defaultColor]; // Avoid divide by zero

    const sorted = ranges
        .map(r => ({ start: Number(r.start), end: Number(r.end), color: r.color }))
        .sort((a, b) => a.start - b.start);

    const stops = [];
    sorted.forEach(r => {
        // Clamp and normalize start
        const ratio = Math.max(0, Math.min(1, (r.start - min) / (max - min)));
        if (!isNaN(ratio)) {
            stops.push(ratio);
            stops.push(r.color || defaultColor);
        }
    });

    // Ensure we have at least 2 stops for a valid gradient
    if (stops.length === 0) {
        return [0, defaultColor, 1, defaultColor];
    }

    // If only one logical stop (ratio+color), duplicate it at 1.0 or 0.0 to make it valid
    if (stops.length === 2) {
        // We have [ratio, color]. 
        // If ratio is 0, add [1, color]. If ratio is 1, add [0, color].
        // Simplest: just ensure start and end exist?
        // Let's just blindly add 1.0 with the last color if it's not there.
        const lastRatio = stops[stops.length - 2];
        const lastColor = stops[stops.length - 1];
        if (lastRatio < 1) {
            stops.push(1, lastColor);
        } else if (lastRatio > 0 && stops.length === 2) {
            // Started at 1? Add 0.
            stops.unshift(0, lastColor);
        }
    }

    return stops;
};

export default ElementRenderer;
