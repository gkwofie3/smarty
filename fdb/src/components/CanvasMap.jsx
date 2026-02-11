import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Transformer } from 'react-konva';
import FBDBlock from './FBDBlock';
import Connection from './Connection';
import { LAYOUT } from '../constants';

const CanvasMap = ({ nodes, edges, setNodes, setEdges, stageRef, selectedId, setSelectedId }) => {
    const [tempLine, setTempLine] = useState(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const trRef = useRef();

    // Handle Selection & Transformer
    useEffect(() => {
        if (selectedId && trRef.current) {
            const selectedNode = stageRef.current.findOne('#' + selectedId);
            if (selectedNode) {
                trRef.current.nodes([selectedNode]);
                trRef.current.getLayer().batchDraw();
            }
        } else if (trRef.current) {
            trRef.current.nodes([]);
        }
    }, [selectedId, nodes]); // Update when nodes change too

    const handleNodeMove = (id, newX, newY) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, x: newX, y: newY } : n));
    };

    const handleNodeTransform = (id, newProps) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, ...newProps } : n));
    };

    const getPortPosition = (nodeId, portType, portIndex) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return { x: 0, y: 0 };
        const { x, y, width, height, inputs, outputs } = node;
        const currentWidth = width || LAYOUT.BLOCK_WIDTH;
        // const currentHeight = height || (LAYOUT.HEADER_HEIGHT + Math.max(inputs, outputs) * LAYOUT.PORT_HEIGHT + 10);

        const { HEADER_HEIGHT, PORT_HEIGHT } = LAYOUT;

        // Calculate port Y relative to node Y, scaling if node is resized?
        // For simple resizing, we might just scale the whole group, OR we re-calculate positions.
        // If we use Transform (scaleX, scaleY), the internal coords stay same but visual changes.
        // But for connections, we need Absolute coordinates.
        // Let's assume resizing CHANGES width/height props, not just scale.
        // But Transformer only changes scale/rotation by default usually.
        // We will force Transformer to update width/height and reset scale to 1.

        const yOffset = HEADER_HEIGHT + 10 + portIndex * PORT_HEIGHT;

        if (portType === 'in') {
            return { x: x, y: y + yOffset };
        } else {
            return { x: x + currentWidth, y: y + yOffset };
        }
    };

    const handleStageClick = (e) => {
        // If clicked on empty stage or grid, deselect
        if (e.target === e.target.getStage() || e.target.name() === 'grid-bg') {
            setSelectedId(null);
            setTempLine(null);
        }
    };

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const newScale = e.evt.deltaY > 0 ? oldScale / scaleBy : oldScale * scaleBy;
        setScale(newScale);

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };
        setPosition(newPos);
    };

    const handleDragEnd = (e) => {
        setPosition({ x: e.target.x(), y: e.target.y() });
    };

    // Grid Generation
    const GRID_SIZE = 50;
    const renderGrid = () => {
        // Simple infinite grid effect? 
        // We can draw a huge rect with fillPattern or just lines.
        // Lines are better for 'faint lines'.
        // But creating thousands of lines is heavy.
        // Better: Use a fill pattern on a big rect? 
        // Or just lines for the visible area?
        // For now, let's just make a static large grid (e.g. 5000x5000)
        const lines = [];
        const size = 5000;
        for (let i = -size; i < size; i += GRID_SIZE) {
            lines.push(
                <Line
                    key={`v${i}`}
                    points={[i, -size, i, size]}
                    stroke="#ddd"
                    strokeWidth={1}
                />
            );
            lines.push(
                <Line
                    key={`h${i}`}
                    points={[-size, i, size, i]}
                    stroke="#ddd"
                    strokeWidth={1}
                />
            );
        }
        return lines;
    };


    // ... Port Click logic same as before ... 
    const handlePortClick = (e, nodeId, portType, portIndex) => {
        // ... (Keep existing logic, ensure getPortPosition is updated) ...
        e.cancelBubble = true;
        if (portType === 'out') {
            const startPos = getPortPosition(nodeId, 'out', portIndex);
            setTempLine({
                fromNode: nodeId,
                fromPort: portIndex,
                points: [startPos.x, startPos.y, startPos.x, startPos.y]
            });
        } else if (portType === 'in' && tempLine) {
            const existingInput = edges.find(e => e.toNode === nodeId && e.toPort === portIndex);
            if (existingInput) {
                alert('Input already connected!');
                setTempLine(null);
                return;
            }
            const newEdge = {
                id: `e-${tempLine.fromNode}-${tempLine.fromPort}-${nodeId}-${portIndex}`,
                fromNode: tempLine.fromNode,
                fromPort: tempLine.fromPort,
                toNode: nodeId,
                toPort: portIndex
            };
            setEdges([...edges, newEdge]);
            setTempLine(null);
        }
    };

    const handleMouseMove = (e) => {
        if (tempLine) {
            const stage = e.target.getStage();
            // Need to account for scale/position in pointer? 
            // stage.getPointerPosition() returns absolute window coords relative to stage container?
            // Actually getPointerPosition returns {x,y} of pointer.
            // But we need to transform it to "Stage Universe" coords for the Line points if the Line is inside the Layer which is scaled.
            // Wait, tempLine is in Layer. Layer is scaled.
            // So we need pointer relative to stage transform.
            const transform = stage.getAbsoluteTransform().copy();
            transform.invert();
            const pos = transform.point(stage.getPointerPosition());

            // Re-calc start point because node might have moved? No, tempLine stores initial points.
            // But initial points were calculated when?
            // getPortPosition returns coord in "World" (Node coords).
            // So `points` should be in World coords.
            // So `pos` (World coords) is correct.

            setTempLine(prev => ({
                ...prev,
                points: [prev.points[0], prev.points[1], pos.x, pos.y]
            }));
        }
    };

    return (
        <Stage
            width={window.innerWidth - 300}
            height={window.innerHeight}
            draggable
            onDragEnd={handleDragEnd}
            onWheel={handleWheel}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            ref={stageRef}
            onClick={handleStageClick}
            onTap={handleStageClick}
            onMouseMove={handleMouseMove}
            style={{ backgroundColor: '#f8f9fa' }}
        >
            <Layer>
                {/* Grid */}
                <React.Fragment>
                    {/* Background rect for clicking */}
                    <Rect x={-5000} y={-5000} width={10000} height={10000} fill="#f8f9fa" name="grid-bg" />
                    {renderGrid()}
                </React.Fragment>

                {/* Edges */}
                {edges.map(edge => {
                    const start = getPortPosition(edge.fromNode, 'out', edge.fromPort);
                    const end = getPortPosition(edge.toNode, 'in', edge.toPort);
                    return <Connection key={edge.id} points={[start.x, start.y, end.x, end.y]} />;
                })}

                {/* Temp Line */}
                {tempLine && (
                    <Line
                        points={tempLine.points}
                        stroke="#0d6efd"
                        strokeWidth={2}
                        dash={[5, 5]}
                    />
                )}

                {/* Nodes */}
                {nodes.map(node => (
                    <FBDBlock
                        key={node.id}
                        node={node}
                        selected={node.id === selectedId}
                        onSelect={setSelectedId}
                        onNodeMove={handleNodeMove}
                        onNodeTransform={handleNodeTransform}
                        onPortClick={handlePortClick}
                    />
                ))}

                {/* Transformer */}
                <Transformer
                    ref={trRef}
                    boundBoxFunc={(oldBox, newBox) => {
                        // Limit minimum size
                        if (newBox.width < 50 || newBox.height < 50) {
                            return oldBox;
                        }
                        return newBox;
                    }}
                />
            </Layer>
        </Stage>
    );
};

export default CanvasMap;
