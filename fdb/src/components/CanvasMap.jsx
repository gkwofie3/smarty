import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Transformer, Group } from 'react-konva';
import FBDBlock from './FBDBlock';
import Connection from './Connection';
import { LAYOUT } from '../constants';
import { calculateOrthogonalPath } from '../utils/fbdUtils';

const CanvasMap = ({ nodes, edges, setNodes, setEdges, stageRef, selectedId, setSelectedId, layoutSize }) => {
    const [selectedEdgeId, setSelectedEdgeId] = useState(null);
    const [tempLine, setTempLine] = useState(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const lastPos = useRef({ x: 0, y: 0 });
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
        setSelectedEdgeId(null); // Clear edge selection when moving node
    };

    const handleNodeTransform = (id, newProps) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, ...newProps } : n));
    };

    const handleDeleteEdge = (id) => {
        setEdges(edges.filter(e => e.id !== id));
    };

    const getPortPosition = (nodeId, portType, portIndex) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return { x: 0, y: 0 };
        const { x, y, width, height, type } = node;

        if (type === 'TERMINAL') {
            return { x: x + 6, y: y + 6 };
        }

        const currentWidth = width || LAYOUT.BLOCK_WIDTH;
        const { HEADER_HEIGHT, PORT_HEIGHT } = LAYOUT;
        const yOffset = HEADER_HEIGHT + 10 + portIndex * PORT_HEIGHT;

        if (portType === 'in') {
            return { x: x, y: y + yOffset };
        } else {
            return { x: x + currentWidth, y: y + yOffset };
        }
    };

    const handleStageClick = (e) => {
        if (tempLine) {
            const stage = e.target.getStage();
            const transform = stage.getAbsoluteTransform().copy();
            transform.invert();
            const pos = transform.point(stage.getPointerPosition());

            setTempLine(prev => ({
                ...prev,
                waypoints: [...(prev.waypoints || []), pos]
            }));
            return;
        }

        if (e.target === e.target.getStage() || e.target.name() === 'grid-bg') {
            setSelectedId(null);
            setSelectedEdgeId(null);
        }
    };

    const handleStageDblClick = (e) => {
        if (tempLine) {
            const stage = e.target.getStage();
            const transform = stage.getAbsoluteTransform().copy();
            transform.invert();
            const pos = transform.point(stage.getPointerPosition());

            // Create a TERMINAL node at this point
            const terminalId = `terminal-${Date.now()}`;
            const newNode = {
                id: terminalId,
                type: 'TERMINAL',
                label: '',
                x: pos.x - 6,
                y: pos.y - 6,
                inputs: 1,
                outputs: 1,
                params: {}
            };

            setNodes(prev => [...prev, newNode]);

            // Complete connection to this terminal
            const newEdge = {
                id: `e-${tempLine.fromNode}-${tempLine.fromPort}-${terminalId}-0`,
                fromNode: tempLine.fromNode,
                fromPort: tempLine.fromPort,
                toNode: terminalId,
                toPort: 0,
                waypoints: tempLine.waypoints || []
            };

            setEdges(prev => [...prev, newEdge]);

            // Continuous Drawing: Start a new line from this terminal's output
            setTempLine({
                fromNode: terminalId,
                fromPort: 0,
                waypoints: [],
                points: [pos.x, pos.y, pos.x, pos.y]
            });
        }
    };

    const handleVanishAndResume = (terminalId, portIndex = 0) => {
        const collectSourceAndWaypoints = (currentNodeId) => {
            const edge = edges.find(e => e.toNode === currentNodeId);
            if (!edge) return null;

            const fromNode = nodes.find(n => n.id === edge.fromNode);
            const terminalPos = getPortPosition(currentNodeId, 'in', 0);

            if (fromNode && fromNode.type !== 'TERMINAL') {
                return {
                    fromNode: edge.fromNode,
                    fromPort: edge.fromPort,
                    waypoints: [...(edge.waypoints || []), terminalPos],
                    removedEdges: [edge.id],
                    removedNodes: [currentNodeId]
                };
            } else {
                const result = collectSourceAndWaypoints(edge.fromNode);
                if (result) {
                    return {
                        ...result,
                        waypoints: [...result.waypoints, ...(edge.waypoints || []), terminalPos],
                        removedEdges: [...result.removedEdges, edge.id],
                        removedNodes: [...result.removedNodes, currentNodeId]
                    };
                }
            }
            return null;
        };

        const mergeResult = collectSourceAndWaypoints(terminalId);
        if (mergeResult) {
            const terminalPos = getPortPosition(terminalId, 'out', portIndex);

            setTempLine({
                fromNode: mergeResult.fromNode,
                fromPort: mergeResult.fromPort,
                waypoints: mergeResult.waypoints,
                points: [terminalPos.x, terminalPos.y, terminalPos.x, terminalPos.y]
            });

            // Remove all merged terminals and edges
            setNodes(prev => prev.filter(n => !mergeResult.removedNodes.includes(n.id)));
            setEdges(prev => prev.filter(e => !mergeResult.removedEdges.includes(e.id)));

            // Also clean up any DEAD edges that were starting from the removed terminals
            setEdges(prev => prev.filter(e => !mergeResult.removedNodes.includes(e.fromNode)));

            setSelectedId(null);
            return true;
        }
        return false;
    };

    const handleNodeDblClick = (nodeId) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return;

        if (node.type === 'TERMINAL') {
            if (handleVanishAndResume(nodeId)) return;
        }

        // Standard continuation for other blocks
        if (node.outputs > 0) {
            const startPos = getPortPosition(nodeId, 'out', 0);
            setTempLine({
                fromNode: nodeId,
                fromPort: 0,
                waypoints: [],
                points: [startPos.x, startPos.y, startPos.x, startPos.y]
            });
        }
    };

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const scaleBy = 1.1;
        const stage = stageRef.current;
        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

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

    // Grid Generation
    const GRID_SIZE = 50;
    const renderGrid = (w, h) => {
        const lines = [];
        for (let i = 0; i <= w; i += GRID_SIZE) {
            lines.push(<Line key={`v${i}`} points={[i, 0, i, h]} stroke="#e0e0e0" strokeWidth={1} />);
        }
        for (let i = 0; i <= h; i += GRID_SIZE) {
            lines.push(<Line key={`h${i}`} points={[0, i, w, i]} stroke="#e0e0e0" strokeWidth={1} />);
        }
        return lines;
    };

    // Port Click logic
    const handlePortClick = (e, nodeId, portType, portIndex, isDblClick = false) => {
        e.cancelBubble = true;
        const node = nodes.find(n => n.id === nodeId);
        const isTerminal = node?.type === 'TERMINAL';

        if (isDblClick) {
            setSelectedEdgeId(null);
            setSelectedId(nodeId);
            // DETACH LOGIC: Double-click always detaches
            const edgeIndex = edges.findIndex(edge =>
                (portType === 'in' && edge.toNode === nodeId && edge.toPort === portIndex) ||
                (portType === 'out' && edge.fromNode === nodeId && edge.fromPort === portIndex)
            );

            if (edgeIndex !== -1) {
                const edge = edges[edgeIndex];
                setEdges(prev => prev.filter((_, i) => i !== edgeIndex));

                // Pick up the connection from the OTHER side
                const fromNode = portType === 'in' ? edge.fromNode : edge.toNode;
                const fromPort = portType === 'in' ? edge.fromPort : edge.toPort;

                // Start a tempLine from that other port
                const startPos = getPortPosition(fromNode, portType === 'in' ? 'out' : 'in', fromPort);
                setTempLine({
                    fromNode: fromNode,
                    fromPort: fromPort,
                    waypoints: edge.waypoints || [],
                    points: [startPos.x, startPos.y, startPos.x, startPos.y]
                });
                return;
            }

            // Continuation logic for Terminal nodes (Vanish and Resume)
            if (isTerminal && portType === 'out') {
                if (handleVanishAndResume(nodeId, portIndex)) return;

                // Fallback (unlikely)
                const startPos = getPortPosition(nodeId, 'out', portIndex);
                setTempLine({
                    fromNode: nodeId,
                    fromPort: portIndex,
                    waypoints: [],
                    points: [startPos.x, startPos.y, startPos.x, startPos.y]
                });
                return;
            }
        }

        if (portType === 'out') {
            if (isTerminal) {
                setSelectedId(nodeId);
                setSelectedEdgeId(null);
                return;
            }
            const startPos = getPortPosition(nodeId, 'out', portIndex);
            setTempLine({
                fromNode: nodeId,
                fromPort: portIndex,
                waypoints: [],
                points: [startPos.x, startPos.y, startPos.x, startPos.y]
            });
        } else if (portType === 'in') {
            // Single click on connected input no longer detaches automatically
            if (tempLine) {
                const newEdge = {
                    id: `e-${tempLine.fromNode}-${tempLine.fromPort}-${nodeId}-${portIndex}`,
                    fromNode: tempLine.fromNode,
                    fromPort: tempLine.fromPort,
                    toNode: nodeId,
                    toPort: portIndex,
                    waypoints: tempLine.waypoints || []
                };
                setEdges(prev => [...prev, newEdge]);
                setTempLine(null);
            }
        }
    };

    // Manual Panning Logic
    const handleMouseDown = (e) => {
        const isBackground = e.target === e.target.getStage() || e.target.name() === 'grid-bg';
        if (isBackground) {
            isPanning.current = true;
            lastPos.current = e.target.getStage().getPointerPosition();
        }
    };

    const handleMouseMove = (e) => {
        const stage = e.target.getStage();
        const pointer = stage.getPointerPosition();

        // 1. Handle Panning
        if (isPanning.current && pointer) {
            const dx = pointer.x - lastPos.current.x;
            const dy = pointer.y - lastPos.current.y;

            setPosition(prev => ({
                x: prev.x + dx,
                y: prev.y + dy
            }));

            lastPos.current = pointer;
        }

        // 2. Handle Temp Line
        if (tempLine && pointer) {
            const transform = stage.getAbsoluteTransform().copy();
            transform.invert();
            const pos = transform.point(pointer);

            setTempLine(prev => ({
                ...prev,
                points: [prev.points[0], prev.points[1], pos.x, pos.y]
            }));
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape' && tempLine) {
            setTempLine(null);
        }
        if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdgeId) {
            setEdges(prev => prev.filter(edge => edge.id !== selectedEdgeId));
            setSelectedEdgeId(null);
        }
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [tempLine, selectedEdgeId]);

    const handleMouseUp = () => {
        isPanning.current = false;
    };

    return (
        <Stage
            width={window.innerWidth - 300}
            height={window.innerHeight}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            ref={stageRef}
            onClick={handleStageClick}
            onDblClick={handleStageDblClick}
            onTap={handleStageClick}
            onDblTap={handleStageDblClick}
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
                <Group clipX={0} clipY={0} clipWidth={layoutSize?.width || 1920} clipHeight={layoutSize?.height || 1080} listening={false}>
                    {renderGrid(layoutSize?.width || 1920, layoutSize?.height || 1080)}
                </Group>

                {/* Edges */}
                {edges.map(edge => {
                    const start = getPortPosition(edge.fromNode, 'out', edge.fromPort);
                    const end = getPortPosition(edge.toNode, 'in', edge.toPort);
                    const allPoints = [start, ...(edge.waypoints || []), end];
                    const points = calculateOrthogonalPath(allPoints);
                    return (
                        <Connection
                            key={edge.id}
                            id={edge.id}
                            points={points}
                            isSelected={edge.id === selectedEdgeId}
                            onSelect={(id) => {
                                setSelectedEdgeId(id);
                                setSelectedId(null);
                            }}
                        />
                    );
                })}

                {/* Temp Line */}
                {tempLine && (
                    <Line
                        points={calculateOrthogonalPath([
                            getPortPosition(tempLine.fromNode, 'out', tempLine.fromPort),
                            ...(tempLine.waypoints || []),
                            { x: tempLine.points[2], y: tempLine.points[3] }
                        ])}
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
                        onSelect={(id) => {
                            setSelectedId(id);
                            setSelectedEdgeId(null);
                        }}
                        onNodeMove={handleNodeMove}
                        onNodeTransform={handleNodeTransform}
                        onPortClick={handlePortClick}
                        onNodeDblClick={handleNodeDblClick}
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
