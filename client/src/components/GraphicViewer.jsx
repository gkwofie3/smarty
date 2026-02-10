import React, { useRef, useState } from 'react';
import { Stage, Layer } from 'react-konva';
import { Button, ButtonGroup } from 'react-bootstrap';
import { BiZoomIn, BiZoomOut, BiReset } from 'react-icons/bi';
import ElementRenderer from './Preview/ElementRenderer';
import HtmlOverlayRenderer from './HtmlOverlayRenderer';

const GraphicViewer = ({ elements, width, height, onNavigate }) => {
    const stageRef = useRef(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleWheel = (e) => {
        e.evt.preventDefault();
        const stage = stageRef.current;
        if (!stage) return;

        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition();

        if (!pointer) return;

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
        };

        const scaleBy = 1.1;
        const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;

        if (newScale < 0.1 || newScale > 10) return;

        setScale(newScale);
        setPosition({
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        });
    };

    const handleZoomIn = () => setScale(s => Math.min(s * 1.2, 10));
    const handleZoomOut = () => setScale(s => Math.max(s / 1.2, 0.1));
    const handleReset = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    const handleElementClick = (element) => {
        if (element.navigation_target_page_id && onNavigate) {
            onNavigate(element.navigation_target_page_id);
        } else if (element.type === 'Hyperlink/Goto Tag' && element.target_url_or_screen) {
            if (element.target_url_or_screen.startsWith('http')) {
                window.open(element.target_url_or_screen, element.open_in_new_window ? '_blank' : '_self');
            } else if (onNavigate) {
                onNavigate(element.target_url_or_screen);
            }
        }
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#e9ecef' }}>
            <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
                <ButtonGroup vertical>
                    <Button variant="light" size="sm" onClick={handleZoomIn} title="Zoom In"><BiZoomIn /></Button>
                    <Button variant="light" size="sm" onClick={handleReset} title="Reset"><BiReset /></Button>
                    <Button variant="light" size="sm" onClick={handleZoomOut} title="Zoom Out"><BiZoomOut /></Button>
                </ButtonGroup>
            </div>

            <Stage
                width={width}
                height={height}
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
                    <React.Fragment>
                        {elements.map((el) => (
                            <ElementRenderer
                                key={el.id}
                                element={el}
                                onClick={() => handleElementClick(el)}
                            />
                        ))}
                    </React.Fragment>
                </Layer>
            </Stage>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: width,
                height: height,
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'top left',
                pointerEvents: 'none' // Overlay container lets clicks through, children have auto
            }}>
                {elements.filter(el => el.type === 'Web View' || el.type === 'Video Player').map(el => (
                    <HtmlOverlayRenderer key={el.id} element={el} />
                ))}
            </div>
        </div>
    );
};

export default GraphicViewer;
