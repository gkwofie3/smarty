import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Transformer, Group } from 'react-konva';
import FBDBlock from './FBDBlock';
import Connection from './Connection';
import { LAYOUT } from '../constants';

const CanvasMap = ({ nodes, edges, setNodes, setEdges, stageRef, selectedId, setSelectedId, layoutSize }) => {
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
    const renderGrid = (w, h) => {
        const lines = [];
        // Vertical
        for (let i = 0; i <= w; i += GRID_SIZE) {
            lines.push(
                <Line
                    key={`v${i}`}
                    points={[i, 0, i, h]}
                    stroke="#e0e0e0"
                    strokeWidth={1}
                />
            );
        }
        // Horizontal
        for (let i = 0; i <= h; i += GRID_SIZE) {
            lines.push(
                <Line
                    key={`h${i}`}
                    points={[0, i, w, i]}
                    stroke="#e0e0e0"
                    strokeWidth={1}
                />
            );
        }
        return lines;
    };


    // ... Port Click logic same as before ... 
    const handlePortClick = (e, nodeId, portType, portIndex) => {
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
            const transform = stage.getAbsoluteTransform().copy();
            transform.invert();
            const pos = transform.point(stage.getPointerPosition());

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
            style={{ backgroundColor: '#e0e0e0' }}
        >
            <Layer>
                {/* Page Boundary */}
                <Rect
                    x={0}
                    y={0}
                    width={layoutSize?.width || 1920}
                    height={layoutSize?.height || 1080}
                    fill={layoutSize?.backgroundColor || "#ffffff"}
                    shadowBlur={10}
                    shadowColor="black"
                    shadowOpacity={0.2}
                    name="grid-bg"
                />

                {/* Grid */}
                <Group clipX={0} clipY={0} clipWidth={layoutSize?.width || 1920} clipHeight={layoutSize?.height || 1080}>
                    {renderGrid(layoutSize?.width || 1920, layoutSize?.height || 1080)}
                </Group>

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
