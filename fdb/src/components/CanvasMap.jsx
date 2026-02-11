import React, { useState, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import FBDBlock from './FBDBlock';
import Connection from './Connection';
import { LAYOUT } from '../constants';

const CanvasMap = ({ nodes, edges, setNodes, setEdges, stageRef, selectedId, setSelectedId }) => {
    const [tempLine, setTempLine] = useState(null);

    const handleNodeMove = (id, newX, newY) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, x: newX, y: newY } : n));
    };

    const getPortPosition = (nodeId, portType, portIndex) => {
        const node = nodes.find(n => n.id === nodeId);
        if (!node) return { x: 0, y: 0 };
        const { x, y } = node;
        const { BLOCK_WIDTH, HEADER_HEIGHT, PORT_HEIGHT } = LAYOUT;
        const yOffset = HEADER_HEIGHT + 10 + portIndex * PORT_HEIGHT;

        // Adjust for circle center roughly
        if (portType === 'in') {
            return { x: x, y: y + yOffset };
        } else {
            return { x: x + BLOCK_WIDTH, y: y + yOffset };
        }
    };

    const handleStageClick = (e) => {
        // If clicked on empty stage, deselect
        if (e.target === e.target.getStage()) {
            setSelectedId(null);
            setTempLine(null);
        }
    };

    const handlePortClick = (e, nodeId, portType, portIndex) => {
        e.cancelBubble = true; // Prevent stage click

        if (portType === 'out') {
            // Start connection
            const startPos = getPortPosition(nodeId, 'out', portIndex);
            setTempLine({
                fromNode: nodeId,
                fromPort: portIndex,
                points: [startPos.x, startPos.y, startPos.x, startPos.y]
            });
        } else if (portType === 'in' && tempLine) {
            // Complete connection
            // Check if connection already exists? (Maybe allow multiple lines from same output, but logic is 1 to 1 usually for clean FBD, or 1 to many is fine for output, many to 1 for input is usually invalid)
            // For now allow 1 to many for output, ensure 1 input has 1 source.

            // Check existing input connection
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
            const point = stage.getPointerPosition();
            if (point) {
                setTempLine(prev => ({
                    ...prev,
                    points: [prev.points[0], prev.points[1], point.x, point.y]
                }));
            }
        }
    };

    return (
        <Stage
            width={window.innerWidth - 500} // Approximate, resize listener ideally
            height={window.innerHeight}
            ref={stageRef}
            onClick={handleStageClick}
            onTap={handleStageClick}
            onMouseMove={handleMouseMove}
        >
            <Layer>
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
                        onPortClick={handlePortClick}
                    />
                ))}
            </Layer>
        </Stage>
    );
};

export default CanvasMap;
