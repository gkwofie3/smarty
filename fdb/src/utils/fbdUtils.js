export const calculateOrthogonalPath = (points) => {
    if (points.length < 2) return points;

    const result = [];

    for (let i = 0; i < points.length - 1; i++) {
        const start = points[i];
        const end = points[i + 1];
        const isFirst = i === 0;
        const isLast = i === points.length - 2;

        const { x: x1, y: y1 } = start;
        const { x: x2, y: y2 } = end;

        if (isFirst && isLast) {
            // Original 3-segment routing for simple direct connections
            const horizontalGap = 20;
            if (x2 > x1 + horizontalGap * 2) {
                const midX = x1 + (x2 - x1) / 2;
                result.push(x1, y1, midX, y1, midX, y2);
            } else {
                const midY = y1 + (y2 - y1) / 2;
                result.push(x1, y1, x1 + horizontalGap, y1, x1 + horizontalGap, midY, x2 - horizontalGap, midY, x2 - horizontalGap, y2);
            }
        } else {
            // For general segments (waypoints), we just do a simple L-shape to keep it 90 deg
            // We alternate H-V or V-H based on position or previous segment?
            // Actually, keep it consistent: always H then V for exit/entry logic?
            // FBD usually prefers exiting horizontally.
            result.push(x1, y1);
            result.push(x2, y1); // Horizontal then Vertical
        }
    }

    // Add final point
    const lastPoint = points[points.length - 1];
    result.push(lastPoint.x, lastPoint.y);

    return result;
};
