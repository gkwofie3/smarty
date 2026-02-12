import React from 'react';
import { Arrow } from 'react-konva';

const Connection = ({ id, points, isSelected, onSelect }) => {
    return (
        <Arrow
            points={points}
            stroke={isSelected ? '#007bff' : '#000'}
            strokeWidth={isSelected ? 3 : 2}
            fill={isSelected ? '#007bff' : '#000'}
            pointerLength={5}
            pointerWidth={5}
            lineCap="round"
            lineJoin="round"
            onClick={(e) => {
                e.cancelBubble = true;
                if (onSelect) onSelect(id);
            }}
            hitStrokeWidth={10}
        />
    );
};

export default Connection;
