import React, { useRef, useEffect } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import ElementRenderer from './ElementRenderer';

const CanvasStage = ({
    elements,
    selectedElementId,
    onSelect,
    onChange,
    onDropElement,
    zoom,
    setZoom,
    canvasSize,
    showGrid,
    isShiftPressed
}) => {
    const stageRef = useRef();
    const trRef = useRef(null);

    // Initial Zoom / Fit Logic
    useEffect(() => {
        // Handled by parent (Editor) now
    }, []);

    // Selection Transformer Logic
    useEffect(() => {
        if (trRef.current && stageRef.current) {
            const stage = stageRef.current;
            const selectedNode = stage.findOne('#' + selectedElementId);
            if (selectedNode) {
                trRef.current.nodes([selectedNode]);
                trRef.current.getLayer().batchDraw();
            } else {
                trRef.current.nodes([]);
                trRef.current.getLayer().batchDraw();
            }
        }
    }, [selectedElementId, elements]);

    const checkDeselect = (e) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            onSelect(null);
        }
    };

    const handleWheel = (e) => {
        if (e.evt.ctrlKey) {
            e.evt.preventDefault();
            const scaleBy = 1.1;
            const stage = stageRef.current;
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
            const clampedScale = Math.max(0.1, Math.min(newScale, 5));

            stage.scale({ x: clampedScale, y: clampedScale });

            const newPos = {
                x: pointer.x - mousePointTo.x * clampedScale,
                y: pointer.y - mousePointTo.y * clampedScale,
            };
            stage.position(newPos);
            setZoom(clampedScale);
        }
    };

    // HTML5 Drop (from Toolbox)
    const handleDrop = (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('elementType');
        const stage = stageRef.current;

        if (type && stage) {
            const container = stage.container();
            const rect = container.getBoundingClientRect();

            const domX = e.clientX - rect.left;
            const domY = e.clientY - rect.top;

            const transform = stage.getAbsoluteTransform().copy();
            transform.invert();
            const pos = transform.point({ x: domX, y: domY });

            onDropElement(type, pos.x, pos.y);
        }
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                overflow: 'auto', // Scrollable Container
                position: 'relative'
            }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            <Stage
                width={canvasSize.width * zoom + 100} // Extra space for handles
                height={canvasSize.height * zoom + 100}
                scaleX={zoom}
                scaleY={zoom}
                ref={stageRef}
                onMouseDown={checkDeselect}
                onTouchStart={checkDeselect}
                onWheel={handleWheel}
                style={{ background: '#e0e0e0' }} // Canvas Background
            >
                <Layer>
                    {/* Visual Page Boundary */}
                    <Rect
                        x={0}
                        y={0}
                        width={canvasSize.width}
                        height={canvasSize.height}
                        fill="#ffffff"
                        shadowColor="black"
                        shadowBlur={10}
                        shadowOpacity={0.1}
                    />

                    {/* Grid Lines */}
                    {showGrid && (
                        <React.Fragment>
                            {/* Simple Grid using Pattern or Lines? Pattern is efficient */}
                        </React.Fragment>
                    )}

                    {elements.map((el) => (
                        <ElementRenderer
                            key={el.id}
                            element={el}
                            onChange={onChange}
                            isSelected={el.id === selectedElementId}
                            onSelect={() => onSelect(el.id)}
                        />
                    ))}

                    <Transformer
                        ref={trRef}
                        resizeEnabled
                        rotateEnabled
                        keepRatio={!isShiftPressed}
                        anchorSize={10}
                        borderStroke="#0d6efd"
                        anchorFill="white"
                        anchorStroke="#0d6efd"
                        boundBoxFunc={(oldBox, newBox) => {
                            if (newBox.width < 5 || newBox.height < 5) {
                                return oldBox;
                            }
                            return newBox;
                        }}
                    />
                </Layer>
            </Stage>
        </div>
    );
};

export default CanvasStage;
