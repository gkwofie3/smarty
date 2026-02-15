import React, { useState, useEffect } from 'react';
import { Rect, Circle, Ellipse, Line, Text, Image, Group, Arc, RegularPolygon, Path, Shape } from 'react-konva';
import { getIconPath } from '../utils/IconLoader';
import { loadGoogleFont } from '../utils/FontLoader';

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

// Helper to evaluate Convert Value rules
const getConvertValueStyle = (value, rules) => {
    if (!rules || !Array.isArray(rules) || value === undefined || value === null) return null;

    for (const rule of rules) {
        const rVal = parseFloat(rule.value);
        const val = parseFloat(value);
        const isNum = !isNaN(rVal) && !isNaN(val);

        let match = false;
        switch (rule.operator) {
            case '=': match = value == rule.value; break; // Loose equality for string/num
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

const ElementRenderer = ({ element, isSelected, onSelect, onChange }) => {
    const [image] = useImage(element.image_source_url);
    const [iconImage] = useImage(element.image_icon);

    // blinking state
    const [blinkVisible, setBlinkVisible] = useState(true);

    // Determine active style from Convert Values
    const activeRule = getConvertValueStyle(element.current_value, element.convert_values);

    // Blinking Effect
    useEffect(() => {
        let interval;
        if (activeRule && activeRule.blink) {
            interval = setInterval(() => {
                setBlinkVisible(prev => !prev);
            }, 500);
        } else {
            setBlinkVisible(true); // Reset to visible if not blinking
        }
        return () => clearInterval(interval);
    }, [activeRule]);

    // Ensure Font is Loaded
    useEffect(() => {
        if (element.font_family) {
            loadGoogleFont(element.font_family);
        }
    }, [element.font_family]);

    const commonProps = {
        id: element.id,
        x: element.x_position || 0,
        y: element.y_position || 0,
        rotation: element.rotation_angle || 0,
        opacity: element.opacity !== undefined ? element.opacity : 1,
        draggable: true,
        onClick: (e) => {
            e.cancelBubble = true;
            onSelect(e);
        },
        onTap: (e) => {
            e.cancelBubble = true;
            onSelect(e);
        },
        onDragEnd: (e) => {
            onChange({
                ...element,
                x_position: Math.round(e.target.x()),
                y_position: Math.round(e.target.y()),
            });
        },
        onTransformEnd: (e) => {
            const node = e.target;
            const scaleX = node.scaleX();
            const scaleY = node.scaleY();

            node.scaleX(1);
            node.scaleY(1);

            onChange({
                ...element,
                x_position: Math.round(node.x()),
                y_position: Math.round(node.y()),
                width: Math.round(Math.max(5, (node.width() || element.width) * scaleX)),
                height: Math.round(Math.max(5, (node.height() || element.height) * scaleY)),
                rotation_angle: Math.round(node.rotation()),
            });
        },
    };

    // Style overrides based on active rule and blink state
    const getOverrideStyle = () => {
        if (!activeRule) return {};

        const style = {};
        if (activeRule.blink && !blinkVisible) {
            // Blink "OFF" state (or alternate color)
            if (activeRule.blink_color) style.stroke = activeRule.blink_color;
            if (activeRule.blink_color) style.fill = activeRule.blink_color; // Text uses fill
            if (activeRule.blink_bg_color) style.fill = activeRule.blink_bg_color; // Shape uses fill
        } else {
            // Normal state (or Blink "ON" matches this if we consider rule.color as primary)
            if (activeRule.color) style.stroke = activeRule.color;
            if (activeRule.color) style.fill = activeRule.color; // Text uses fill
            if (activeRule.bg_color) style.fill = activeRule.bg_color; // Shape uses fill
        }
        return style;
    };

    // Resolve final colors
    // Fill Logic: Shape -> bg_color/fill_color. Text -> font_color/fill.
    // Stroke Logic: Shape -> border_color/stroke_color. Text -> stroke (rarely used).

    // We need specific logic per element type, or generic props?
    // Let's compute generic props and apply them selectively.

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

    // For Text, 'fill' is the text color. 'background_color' is usually not used or is a rect behind.
    // But 'ruleStyle.fill' logic above meant 'Background/Fill Color'.
    // Text Color should come from 'ruleStyle.color'.

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
        case 'Knob':
            {
                // Knob Rendering (Editor Preview - Static)
                const min = Number(element.min_value) || 0;
                const max = Number(element.max_value) || 100;
                const val = Number(element.default_value) || min;

                const startAngle = 135;
                const endAngle = 405;
                const range = max - min;
                const pct = (val - min) / range;
                const angle = startAngle + (pct * (endAngle - startAngle));

                const radius = Math.min(width, height) / 2;

                return (
                    <Group {...commonProps}>
                        {/* Dial Background */}
                        <Circle
                            x={width / 2}
                            y={height / 2}
                            radius={radius}
                            fill={element.dial_color || '#e9ecef'}
                            stroke={element.border_color || '#ced4da'}
                            strokeWidth={element.border_width || 2}
                        />
                        {/* Pointer/Indicator */}
                        <Group
                            x={width / 2}
                            y={height / 2}
                            rotation={angle}
                        >
                            <Circle
                                x={0}
                                y={-radius + 10}
                                radius={element.handle_size ? Number(element.handle_size) : 4}
                                fill={element.knob_color || '#007bff'}
                            />
                        </Group>
                        {/* Labels/Value */}
                        {element.labels_enabled !== false && (
                            <Text
                                text={Math.round(val).toString()}
                                x={0}
                                y={height / 2 - 6}
                                width={width}
                                align="center"
                                fontSize={12}
                                fill="black"
                            />
                        )}
                    </Group>
                );
            }
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
                <Ellipse
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

                let displayText = element.text_content || element.name || 'Text';

                // 1. Convert Value Substitution overrides everything if present
                if (activeRule && activeRule.display_text) {
                    displayText = activeRule.display_text;
                }
                // 2. Data Binding (if not overridden by rule text, or maybe rule text uses {val}?)
                // Current requirement: "Include display text for a particular convert value"
                // So if rule matches and has display_text, use it.
                else if (element.data_binding_source) {
                    if (element.current_value !== undefined && element.current_value !== null) {
                        displayText = String(element.current_value);
                    } else {
                        displayText = `[Bound: ${element.data_binding_source}]`;
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

        case 'Web View':
        case 'Video Player':
        case 'Data Table':
        case 'Alarm Table':
        case 'Event Table':
        case 'Log Table':
        case 'Fault Table':
            let icon = '🌐';
            let label = element.type;
            if (element.type === 'Video Player') icon = '▶';
            if (element.type.includes('Table')) icon = '📅';

            return (
                <Group {...commonProps}>
                    <Rect
                        width={width}
                        height={height}
                        fill={element.background_color || '#ffffff'}
                        stroke={element.border_color || '#ced4da'}
                        strokeWidth={element.border_width || 1}
                        cornerRadius={element.corner_radius || 0}
                        shadowColor={element.shadow_color || null}
                        shadowBlur={element.shadow_offset || 0}
                        shadowOffset={{ x: 2, y: 2 }}
                        shadowOpacity={0.2}
                    />
                    {/* Fake Header */}
                    <Rect
                        x={0}
                        y={0}
                        width={width}
                        height={element.row_height ? parseInt(element.row_height) : 40}
                        fill={element.header_background_color || '#f8f9fa'}
                        stroke={element.border_color || '#ced4da'}
                        strokeWidth={0}
                        strokeBottomWidth={1}
                    />
                    {/* Icon or Label */}
                    <Text
                        text={`${icon} ${label}`}
                        width={width}
                        height={height}
                        align="center"
                        verticalAlign="middle"
                        fontSize={14}
                        fill={element.text_color || "#6c757d"}
                    />
                    <Text
                        text="Table Placeholder"
                        y={height / 2 + 20}
                        width={width}
                        align="center"
                        fontSize={10}
                        fill="#adb5bd"
                    />
                </Group>
            );

        case 'Push Button':
            {
                let safeFont = element.font_family;
                if (typeof safeFont !== 'string') safeFont = 'Arial';

                // Button Background: uses fillProps (bg_color)
                // Button Text: uses textFillProps (color)

                return (
                    <Group {...commonProps}>
                        <Rect
                            width={width}
                            height={height}
                            {...fillProps} // Background
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
            // Toggle usually uses specific logic, but let's apply blink if needed?
            // Use fillProps for background
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
        case 'Link':
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
                            {...fillProps} // Background
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
                const pathData = iconData ? iconData.data : '';
                const viewBox = iconData ? iconData.viewBox : '0 0 512 512';
                const [, , vw, vh] = viewBox.split(' ').map(Number);

                // Use 'size' property, fallback to width/height min, default to 50
                const size = element.size || Math.min(element.width || 50, element.height || 50) || 50;

                const iconFill = ruleStyle.color || ruleStyle.fill || element.fill_color || 'black';

                // Override commonProps for Group
                const iconGroupProps = {
                    ...commonProps,
                    // Use size for selection box
                    width: size,
                    height: size,
                    onTransformEnd: (e) => {
                        const node = e.target;
                        const scaleX = node.scaleX();
                        // Reset scale
                        node.scaleX(1);
                        node.scaleY(1);

                        // Calculate new size
                        const newSize = Math.round(Math.max(5, size * scaleX));

                        onChange({
                            ...element,
                            size: newSize,
                            width: newSize,     // Keep width/height synced
                            height: newSize,
                            x_position: Math.round(node.x()),
                            y_position: Math.round(node.y()),
                            rotation_angle: Math.round(node.rotation())
                        });
                    }
                };

                return (
                    <Group {...iconGroupProps}>
                        <Path
                            data={pathData}
                            fill={iconFill}
                            // Scale Path to fit the Group size
                            scaleX={size / (vw || 512)}
                            scaleY={size / (vh || 512)}
                            {...shadowProps}
                            listening={false} // Let Group handle events? No, path hit is fine. 
                        // But usually best to let Group capture if it has dimensions.
                        // However, Group with no fill/stroke might be transparent to hits?
                        // Adding a transparent rect is safer for hit testing small icons.
                        />
                        <Rect
                            width={size}
                            height={size}
                            fill="transparent"
                            listening={true} // Ensure hit detection works for selection
                        />
                    </Group>
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

                                    // Y = Height (Bottom, Min) -> Y = 0 (Top, Max)
                                    // Y increases downward.
                                    // Val Ratio: 0 -> 1.
                                    // Y = Height - (Ratio * Height).

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
                // If sweep is set, auto-balance start angle around 90 deg (Bottom) for Circular
                // User requirement: "start and end should be of equal angular displacement from y axis"
                const sweepAngle = element.sweep_angle !== undefined ? Number(element.sweep_angle) : 300;

                // Calculate Symmetric Start Angle
                // Bottom is 90 degrees.
                // We want the Gap (360 - Sweep) to be centered at 90.
                // Start = 90 + Gap/2 = 90 + (360 - Sweep)/2
                const gap = 360 - Math.abs(sweepAngle);

                // Allow manual override if user explicitly changes start_angle, but default to formula
                // Actually, user wants symmetry by default. Let's force it if sweep is present
                // unless we want to strictly follow a "symmetric" property. 
                // Given the request, I will enforce symmetry for Circular Gauge if start_angle is NOT explicitly distinct?
                // Or just use the formula. The user SAID "start angle should be 30...". They implied it should happen automatically.
                // Let's use the formula.
                const computedStart = 90 + (gap / 2);

                // Allow user to still override using start_angle property if they REALLY want to rotate it
                // But for now, let's default to the computed symmetric one.
                const startAngle = element.start_angle !== undefined ? Number(element.start_angle) : computedStart;
                const clockwise = sweepAngle >= 0;

                const needleAngle = startAngle + (ratio * sweepAngle);

                const size = Math.min(width, height);
                const cx = width / 2;
                const cy = height / 2;
                const radius = size / 2;

                const minThick = Number(element.min_thickness) || 5;
                const maxThick = Number(element.max_thickness) || 20;

                // Parse Custom Labels (New List Format or Old String Format fallback)
                let customLabels = [];
                if (element.custom_labels_list && Array.isArray(element.custom_labels_list)) {
                    customLabels = element.custom_labels_list.map(item => ({
                        percent: ((Number(item.value) - min) / (max - min)) * 100, // calc percent from value
                        label: item.text,
                        value: Number(item.value)
                    }));
                } else {
                    // Fallback
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

                // Gradient Logic (Old)
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
                    fillLinearGradientEndPoint: { x: width, y: 0 }, // Horizontal gradient approximation
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
                                    context.arc(cx, cy, radius, startRad, startRad + sweepRad, sweepAngle < 0);

                                    // Inner arc (Tapered)
                                    // Iterate backwards
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
                                    context.lineTo(needleLen, 0); // Tip
                                    context.lineTo(0, needleThick / 2);
                                    context.closePath();
                                    context.fillStrokeShape(shape);
                                }}
                                fill={element.pointer_color || "black"}
                            />
                        </Group>

                        {/* Value Text (Center) */}
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
                const barValues = bars.map(b => Number(b.value) || 0);

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
                                let barW = Number(bar.thickness) || 30;
                                if (availableWidthPerBar * 0.8 < barW) {
                                    barW = availableWidthPerBar * 0.8;
                                }

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

                // Parse Points
                // Points list expected as [{ label: '', value: 10, point_id: 123 }]
                // Binding happens in CanvasStage
                const points = element.points_list || [];

                // If no points, show dummy data
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

                const lineType = element.line_type || 'spline'; // spline, step, linear, state
                const isState = lineType === 'state';

                // Y Axis Scale
                let yMin = 0;
                let yMax = 100;

                if (isState) {
                    yMin = 0;
                    yMax = 1; // Binary State
                } else if (element.y_axis_mode === 'manual') {
                    yMin = Number(element.y_min) || 0;
                    yMax = Number(element.y_max);
                    if (isNaN(yMax)) yMax = 100;
                } else {
                    // Auto scale
                    if (values.length > 0) {
                        yMin = Math.min(...values);
                        yMax = Math.max(...values);
                        // Add padding
                        const range = yMax - yMin;
                        if (range === 0) {
                            yMax += 10;
                            yMin = Math.max(0, yMin - 10);
                        } else {
                            yMax += range * 0.1;
                            yMin = Math.max(0, yMin - range * 0.1); // Keep 0 base if relevant? Maybe not always.
                        }
                    }
                }

                // X Axis Scale (Categorical/Ordinal)
                const pointCount = displayPoints.length;
                const xStep = pointCount > 1 ? chartWidth / (pointCount - 1) : chartWidth;

                // Path Construction
                let pathData = "";
                const coordinatePoints = displayPoints.map((p, i) => {
                    const val = Number(p.value) || 0;
                    const clampedVal = Math.max(yMin, Math.min(yMax, val));
                    const ratio = (clampedVal - yMin) / (yMax - yMin);

                    // Invert Y (Canvas Y is down)
                    const py = chartHeight - (ratio * chartHeight);
                    const px = i * xStep; // Start at 0? Or centered in slot? 
                    // Line chart points usually are on ticks.
                    return { x: px, y: py, val: val, label: p.label, point: p };
                });


                if (displayPoints.length > 0) {
                    if (lineType === 'linear') {
                        pathData = `M ${coordinatePoints[0].x} ${coordinatePoints[0].y}`;
                        for (let i = 1; i < coordinatePoints.length; i++) {
                            pathData += ` L ${coordinatePoints[i].x} ${coordinatePoints[i].y}`;
                        }
                    } else if (lineType === 'step' || isState) {
                        // Step: Horizontal then Vertical
                        pathData = `M ${coordinatePoints[0].x} ${coordinatePoints[0].y}`;
                        for (let i = 1; i < coordinatePoints.length; i++) {
                            // Move horizontal to new X, keeping old Y
                            pathData += ` L ${coordinatePoints[i].x} ${coordinatePoints[i - 1].y}`;
                            // Move vertical to new Y
                            pathData += ` L ${coordinatePoints[i].x} ${coordinatePoints[i].y}`;
                        }
                    } else {
                        // Spline (Simple Cardinal or Catmull-Rom? Or simple Quadratic Bezier?)
                        // Konva.Line has bezier=true/false and tension.
                        // But we are constructing a Path or using Line?
                        // If we use Konva.Line with points array, we can set tension.
                        // Let's use Konva.Line for Spline/Linear, and Path for Step.
                    }
                }


                return (
                    <Group {...commonProps}>
                        {/* Main Container Background */}
                        <Rect
                            width={width}
                            height={height}
                            fill={element.background_color || 'transparent'}
                            stroke={element.border_color || null}
                            strokeWidth={element.border_width !== undefined ? Number(element.border_width) : 0}
                        />

                        {/* Chart Area Group (Translated by margin) */}
                        <Group x={margin.left} y={margin.top}>
                            {/* Chart Title */}
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

                            {/* Axes */}
                            {/* Y Axis line */}
                            <Line
                                points={[0, 0, 0, chartHeight]}
                                stroke={axisColor}
                                strokeWidth={axisThickness}
                            />
                            {/* X Axis line */}
                            <Line
                                points={[0, chartHeight, chartWidth, chartHeight]}
                                stroke={axisColor}
                                strokeWidth={axisThickness}
                            />

                            {/* Y Axis Ticks & Labels */}
                            {(() => {
                                const tickCount = 5;
                                return Array.from({ length: tickCount + 1 }).map((_, i) => {
                                    const ratio = i / tickCount;
                                    const yPos = chartHeight - (ratio * chartHeight);
                                    const tickVal = yMin + (ratio * (yMax - yMin));

                                    return (
                                        <Group key={`ytick-${i}`}>
                                            <Line
                                                points={[-5, yPos, 0, yPos]}
                                                stroke={axisColor}
                                                strokeWidth={tickThickness}
                                            />
                                            {/* Grid Line (Optional) */}
                                            {/* <Line points={[0, yPos, chartWidth, yPos]} stroke="#eee" strokeWidth={1} /> */}

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

                            {/* X Axis Ticks & Labels */}
                            {/* X Axis Ticks & Labels */}
                            {coordinatePoints.map((p, i) => (
                                <Group key={`xtick-${i}`}>
                                    <Line
                                        points={[p.x, chartHeight, p.x, chartHeight + 5]}
                                        stroke={axisColor}
                                        strokeWidth={tickThickness}
                                    />
                                    <Text
                                        text={p.label || ''}
                                        x={p.x - 20} // Center approx
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

                            {/* The Line */}
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
                                    fill={null} // Area fill later?
                                />
                            )}

                            {/* Points (Dots) */}
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


                            {/* Axis Labels */}
                            <Text text={yAxisLabel} x={-40} y={chartHeight / 2} rotation={-90} align="center" width={chartHeight} fontSize={10} offsetX={chartWidth / 2} />
                            {/* The above rotation/offset is tricky in Konva Group logic without specific Group wrapper. 
                                Using Group + Rotation is safer. */}
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
            {
                let label = element.label_text;
                if (!label) {
                    if (element.type === 'Increase Button') label = '+';
                    else if (element.type === 'Decrease Button') label = '-';
                    else label = 'Button';
                }

                return (
                    <Group {...commonProps}>
                        <Rect
                            width={width}
                            height={height}
                            fill={element.background_color || '#007bff'}
                            cornerRadius={element.corner_radius || 4}
                            stroke={element.border_color || null}
                            strokeWidth={element.border_width || 0}
                            shadowColor={element.shadow_color || 'black'}
                            shadowBlur={element.shadow_color ? 5 : 0}
                            shadowOpacity={0.3}
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
                        />
                    </Group>
                );
            }

        case 'Toggle Button/Switch':
            {
                const isOn = false; // Static in editor
                const label = isOn ? (element.label_on || 'ON') : (element.label_off || 'OFF');
                const bgColor = isOn ? (element.background_color_on || '#28a745') : (element.background_color_off || '#6c757d');
                const fontColor = isOn ? (element.font_color_on || '#ffffff') : (element.font_color_off || '#ffffff');

                return (
                    <Group {...commonProps}>
                        <Rect
                            width={width}
                            height={height}
                            fill={bgColor}
                            cornerRadius={element.corner_radius || height / 2}
                            stroke={element.border_color}
                            strokeWidth={element.border_width}
                        />
                        <Circle
                            x={height / 2}
                            y={height / 2}
                            radius={(height / 2) - 4}
                            fill="#ffffff"
                        />
                        <Text
                            text={label}
                            x={height}
                            y={0}
                            width={width - height}
                            height={height}
                            align="center"
                            verticalAlign="middle"
                            fontFamily={element.font_family || 'Arial'}
                            fontSize={element.font_size || 12}
                            fontStyle={element.font_weight || 'bold'}
                            fill={fontColor}
                        />
                    </Group>
                );
            }

        case 'Slider':
            {
                const orientation = element.orientation || 'horizontal';
                const isVert = orientation === 'vertical';
                const trackColor = element.track_color || '#e9ecef';
                const fillColor = element.fill_color || '#007bff';
                const handleColor = element.handle_color || '#ffffff';
                const handleSize = Number(element.handle_size) || 15;

                return (
                    <Group {...commonProps}>
                        <Rect
                            x={isVert ? (width / 2 - 4) : 0}
                            y={isVert ? 0 : (height / 2 - 4)}
                            width={isVert ? 8 : width}
                            height={isVert ? height : 8}
                            fill={trackColor}
                            cornerRadius={4}
                        />
                        <Rect
                            x={isVert ? (width / 2 - 4) : 0}
                            y={isVert ? height / 2 : (height / 2 - 4)}
                            width={isVert ? 8 : width / 2}
                            height={isVert ? height / 2 : 8}
                            fill={fillColor}
                            cornerRadius={4}
                        />
                        <Circle
                            x={width / 2}
                            y={height / 2}
                            radius={handleSize}
                            fill={handleColor}
                            stroke="#ccc"
                            strokeWidth={1}
                            shadowColor="black"
                            shadowBlur={2}
                            shadowOpacity={0.2}
                        />
                    </Group>
                );
            }

        case 'Text Input':
        case 'Number Input':
            {
                return (
                    <Group {...commonProps}>
                        <Rect
                            width={width}
                            height={height}
                            fill={element.background_color || '#ffffff'}
                            stroke={element.border_color || '#ced4da'}
                            strokeWidth={element.border_width || 1}
                            cornerRadius={element.corner_radius || 4}
                        />
                        <Text
                            text={element.placeholder_text || (element.type === 'Number Input' ? '0' : 'Text Input')}
                            width={width - 10}
                            height={height}
                            x={5}
                            align={element.text_align || 'left'}
                            verticalAlign="middle"
                            fontFamily={element.font_family || 'Arial'}
                            fontSize={element.font_size || 14}
                            fontStyle={element.font_weight || 'normal'}
                            fill={element.font_color || '#495057'}
                            opacity={0.7}
                        />
                        {element.type === 'Number Input' && element.show_spinner && (
                            <Group x={width - 20} y={0}>
                                <Rect width={20} height={height / 2} fill="#e9ecef" stroke="#dee2e6" strokeWidth={1} />
                                <Rect y={height / 2} width={20} height={height / 2} fill="#e9ecef" stroke="#dee2e6" strokeWidth={1} />
                                <Text text="▲" fontSize={8} x={5} y={2} fill="#666" />
                                <Text text="▼" fontSize={8} x={5} y={height / 2 + 2} fill="#666" />
                            </Group>
                        )}
                    </Group>
                );
            }

        case 'Pie Chart':
        case 'Donut Chart':
            {
                // Pie/Donut Chart Logic
                const isDonut = element.type === 'Donut Chart';
                const chartTitle = element.chart_title || "Chart Title";

                const cx = width / 2;
                const cy = height / 2;
                const radius = Math.min(width, height) / 2 - 20; // 20px padding for title/labels?

                let innerRadius = 0;
                if (isDonut) {
                    if (element.inner_radius) {
                        // If percentage string "50%"
                        if (String(element.inner_radius).includes('%')) {
                            const pct = parseFloat(element.inner_radius) / 100;
                            innerRadius = radius * pct;
                        } else {
                            innerRadius = Number(element.inner_radius);
                        }
                    } else {
                        innerRadius = radius * 0.5; // Default 50%
                    }
                }

                const slices = element.slices_list || [];
                // Default data if empty
                const effectiveSlices = slices.length > 0 ? slices : [
                    { label: 'Slice A', value: 30, color: '#e74c3c' },
                    { label: 'Slice B', value: 50, color: '#3498db' },
                    { label: 'Slice C', value: 20, color: '#2ecc71' }
                ];

                const total = effectiveSlices.reduce((acc, slice) => acc + (Number(slice.value) || 0), 0);

                let currentAngle = 0;

                return (
                    <Group {...commonProps}>
                        {/* Background (Optional) */}
                        <Rect
                            width={width}
                            height={height}
                            fill={element.background_color || 'transparent'}
                            stroke={element.border_color || null}
                            strokeWidth={element.border_width !== undefined ? Number(element.border_width) : 0}
                        />

                        {/* Chart Title */}
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
                                const endAngle = currentAngle + sliceAngle;

                                const midAngle = startAngle + sliceAngle / 2;
                                const rad = (midAngle * Math.PI) / 180;

                                // Update for next iteration
                                currentAngle += sliceAngle;

                                // Label Position (Centroid)
                                const labelRadius = innerRadius + (radius - innerRadius) / 2;
                                const lx = labelRadius * Math.cos(rad);
                                const ly = labelRadius * Math.sin(rad);

                                // Construct Label Text: "Label: Value"
                                let labelText = slice.label || '';
                                if (labelText) labelText += ': ';
                                labelText += val.toString();

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
                                            onMouseEnter={(e) => {
                                                // Optional Hover Effect
                                                const container = e.target.getStage().container();
                                                container.style.cursor = 'pointer';
                                            }}
                                            onMouseLeave={(e) => {
                                                const container = e.target.getStage().container();
                                                container.style.cursor = 'default';
                                            }}
                                        />

                                        {/* Slice Label */}
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

                        {/* Redraw Labels on top? Or just trust z-order. 
                            If slice text color is black, it might be hard to see on dark slice.
                            Let's use slice.label_color if present.
                        */}
                    </Group>
                );
            }
            return (
                <Group {...commonProps}>
                    <Rect width={width} height={height} stroke="red" strokeWidth={1} dash={[5, 5]} fill="rgba(255,0,0,0.05)" />
                    <Text text={element.type} fontSize={10} fill="red" padding={5} width={width} />
                </Group>
            );

    }
};

export default ElementRenderer;

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
        const lastRatio = stops[stops.length - 2];
        const lastColor = stops[stops.length - 1];
        if (lastRatio < 1) {
            stops.push(1, lastColor);
        } else if (lastRatio > 0 && stops.length === 2) {
            stops.unshift(0, lastColor);
        }
    }

    return stops;
};
