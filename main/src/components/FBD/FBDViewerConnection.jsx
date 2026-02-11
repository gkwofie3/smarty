import React from 'react';
import { Arrow } from 'react-konva';

const FBDViewerConnection = ({ points, isActive }) => {
    return (
        <Arrow
            points={points}
            stroke={isActive ? "#28a745" : "#6c757d"} // Green for True, Gray for False/Ana
            strokeWidth={isActive ? 3 : 2}
            fill={isActive ? "#28a745" : "#6c757d"}
            pointerLength={5}
            pointerWidth={5}
            lineCap="round"
            lineJoin="round"
            shadowBlur={isActive ? 5 : 0}
            shadowColor="#28a745"
        />
    );
};

export default FBDViewerConnection;
