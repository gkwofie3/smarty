import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Group, Line } from 'react-konva';
import FBDViewerBlock from './FBDViewerBlock';
import FBDViewerConnection from './FBDViewerConnection';
import { LAYOUT } from '../../pages/Programs/fbdConstants';
import { calculateOrthogonalPath } from '../../services/fbdUtils';

const FBDCanvasViewer = ({ nodes, edges, runtimeData, layoutSize }) => {
    const stageRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 20, y: 20 });

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

    return (
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', background: '#f0f0f0' }}>
            <Stage
                width={window.innerWidth}
                height={window.innerHeight}
                draggable
                onWheel={handleWheel}
                scaleX={scale}
                scaleY={scale}
                x={position.x}
                y={position.y}
                ref={stageRef}
                onDragEnd={(e) => setPosition({ x: e.target.x(), y: e.target.y() })}
            >
                <Layer>
                    {/* Background */}
                    <Rect
                        x={0}
                        y={0}
                        width={layoutSize?.width || 2000}
                        height={layoutSize?.height || 2000}
                        fill={layoutSize?.backgroundColor || "#fff"}
                        shadowBlur={5}
                    />

                    {/* Connections */}
                    {edges.map(edge => {
                        const start = getPortPosition(edge.fromNode, 'out', edge.fromPort);
                        const end = getPortPosition(edge.toNode, 'in', edge.toPort);

                        // Determine if connection is active for highlighting
                        const value = runtimeData[`${edge.fromNode}_out_${edge.fromPort}`];
                        const isActive = value === true;

                        const points = calculateOrthogonalPath([start, ...(edge.waypoints || []), end]);

                        return (
                            <FBDViewerConnection
                                key={edge.id}
                                points={points}
                                isActive={isActive}
                            />
                        );
                    })}

                    {/* Blocks */}
                    {nodes.map(node => (
                        <FBDViewerBlock
                            key={node.id}
                            node={node}
                            runtimeData={runtimeData}
                        />
                    ))}
                </Layer>
            </Stage>
        </div>
    );
};

export default FBDCanvasViewer;
