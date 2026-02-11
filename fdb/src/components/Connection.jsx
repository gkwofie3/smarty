import React from 'react';
import { Arrow } from 'react-konva';

const Connection = ({ points }) => {
    return (
        <Arrow
            points={points}
            stroke="#000"
            strokeWidth={2}
            fill="#000"
            pointerLength={5}
            pointerWidth={5}
            lineCap="round"
            lineJoin="round"
        />
    );
};

export default Connection;
