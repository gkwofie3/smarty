import React, { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Rect, Transformer } from 'react-konva';
import ElementRenderer from './ElementRenderer';
import api from '../services/api';

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
    const wrapperRef = useRef(null);
    const [pointMap, setPointMap] = useState({});

    // Live Data Fetching
    useEffect(() => {
        let isMounted = true;
        const fetchPoints = async () => {
            try {
                const res = await api.get('points/?page_size=1000');
                if (!isMounted) return;
                const rawData = res.data;
                const points = Array.isArray(rawData) ? rawData : (rawData?.results || []);

                const newMap = {};
                points.forEach(p => {
                    if (p && p.id != null) {
                        // Support newly renamed live_value or legacy current_value
                        const val = p.live_value !== undefined ? p.live_value : p.current_value;
                        newMap[String(p.id)] = val;
                        if (!isNaN(p.id)) newMap[Number(p.id)] = val;
                    }
                });
                setPointMap(newMap);
            } catch (err) {
                console.error("Editor failed to fetch points", err);
            }
        };

        fetchPoints();
        const interval = setInterval(fetchPoints, 2000);
        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

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

    // Wheel Zoom Logic attached to Wrapper to cover entire pane
    useEffect(() => {
        const wrapper = wrapperRef.current;
        if (!wrapper) return;

        const onWheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault();

                const scaleBy = 1.1;
                const oldScale = zoom;

                // Calculate mouse position relative to stage content
                // We need to account for scroll position
                // However, since we update zoom state which updates Stage width/height, 
                // the scroll usually adjusts or we might lose pointer focus.
                // Simple centering zoom is often strictly sufficient or robust enough.
                // But let's try to keep pointer focus logic.

                const newScale = e.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
                const clampedScale = Math.max(0.1, Math.min(newScale, 5));

                setZoom(clampedScale);
            }
        };

        wrapper.addEventListener('wheel', onWheel, { passive: false });
        return () => wrapper.removeEventListener('wheel', onWheel);
    }, [zoom, setZoom]); // Dependencies important for oldScale closure

    const checkDeselect = (e) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            onSelect(null);
        }
    };

    // HTML5 Drop (from Toolbox)
    const handleDrop = (e) => {
        e.preventDefault();
        const type = e.dataTransfer.getData('elementType');
        const stage = stageRef.current; // Still need stage for transform logic?
        // Actually drop position relative to stage is tricky if we scroll wrapper.
        // We need (clientX - stageRect.left) / scale

        if (type && stageRef.current) {
            stageRef.current.setPointersPositions(e);

            // Calculate position relative to stage content
            const stageRect = stageRef.current.container().getBoundingClientRect();
            const x = (e.clientX - stageRect.left) / zoom;
            const y = (e.clientY - stageRect.top) / zoom;

            onDropElement(type, x, y);
        }
    };

    // Helper to find value from ID
    const getLiveValue = (id) => {
        if (!id) return undefined;
        let rawId = id;
        if (typeof id === 'object') {
            rawId = id.id || id.value || JSON.stringify(id);
        }
        // Try multiple lookups
        let val = pointMap[rawId];
        if (val === undefined) val = pointMap[String(rawId).trim()];
        if (val === undefined && !isNaN(rawId)) val = pointMap[Number(rawId)];

        return val;
    };

    return (
        <div
            ref={wrapperRef}
            style={{
                width: '100%',
                height: '100%',
                overflow: 'auto', // Scrollbars when content > container
                position: 'relative',
                display: 'flex',       // Required for margin: auto centering
                backgroundColor: '#e0e0e0', // Grey background
                touchAction: 'none'
            }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
        >
            <div style={{
                // Inner container determines scrollable size
                // Using margin: auto centers it when smaller than viewport
                // but allows scrolling to start/end when larger.
                margin: 'auto',
                width: canvasSize.width * zoom + 200,
                height: canvasSize.height * zoom + 200,
                flexShrink: 0,
                padding: '50px' // Visual padding
            }}>
                <Stage
                    width={canvasSize.width * zoom + 200}
                    height={canvasSize.height * zoom + 200}
                    scaleX={zoom}
                    scaleY={zoom}
                    ref={stageRef}
                    onMouseDown={checkDeselect}
                    onTouchStart={checkDeselect}
                    // onWheel removed, handled by wrapper
                    style={{ background: 'transparent' }}
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
                                {/* Keep it simple: Just dots or lines if needed. For now, white bg is clean. */}
                            </React.Fragment>
                        )}

                        {elements.map((el) => {
                            // Inject live values
                            const liveEl = { ...el };

                            // 1. Data Binding Source
                            if (liveEl.data_binding_source) {
                                let val = getLiveValue(liveEl.data_binding_source);
                                if (val === undefined && liveEl.current_value) val = getLiveValue(liveEl.current_value);
                                if (val !== undefined) liveEl.current_value = val;
                            }
                            // 2. Fallback for Gauge
                            else if (liveEl.type && liveEl.type.includes('Gauge') && liveEl.current_value) {
                                const val = getLiveValue(liveEl.current_value);
                                if (val !== undefined) liveEl.current_value = val;
                            }

                            // 3. Charts (Pie, Donut, Bar)
                            if (liveEl.slices_list && Array.isArray(liveEl.slices_list)) {
                                liveEl.slices_list = liveEl.slices_list.map(slice => {
                                    if (slice.point_id) {
                                        const val = getLiveValue(slice.point_id);
                                        if (val !== undefined) return { ...slice, value: val };
                                    }
                                    return slice;
                                });
                            }
                            if (liveEl.bars_list && Array.isArray(liveEl.bars_list)) {
                                liveEl.bars_list = liveEl.bars_list.map(bar => {
                                    if (bar.point_id) {
                                        const val = getLiveValue(bar.point_id);
                                        if (val !== undefined) return { ...bar, value: val };
                                    }
                                    return bar;
                                });
                            }
                            if (liveEl.points_list && Array.isArray(liveEl.points_list)) {
                                liveEl.points_list = liveEl.points_list.map(point => {
                                    if (point.point_id) {
                                        const val = getLiveValue(point.point_id);
                                        if (val !== undefined) return { ...point, value: val };
                                    }
                                    return point;
                                });
                            }

                            return (
                                <ElementRenderer
                                    key={el.id}
                                    element={liveEl}
                                    onChange={onChange}
                                    isSelected={el.id === selectedElementId}
                                    onSelect={() => onSelect(el.id)}
                                />
                            );
                        })}

                        <Transformer
                            ref={trRef}
                            resizeEnabled
                            rotateEnabled
                            keepRatio={!isShiftPressed} // Inverted behavior as requested: Shift = Free, No Shift = Ratio
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
        </div>
    );
};

export default CanvasStage;
