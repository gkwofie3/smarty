import React from 'react';
import { BiLayer, BiSquare, BiCircle, BiText, BiImage } from 'react-icons/bi';

const getIconForType = (type) => {
    if (type.includes('Rectangle')) return <BiSquare />;
    if (type.includes('Circle')) return <BiCircle />;
    if (type.includes('Text')) return <BiText />;
    if (type.includes('Image')) return <BiImage />;
    return <BiLayer />;
};

const ElementsList = ({ elements, selectedIds, onSelect }) => {
    // Reverse to Order by appearance: Konva renders 0 -> N. N is top.
    const reversedElements = [...elements].reverse();

    const handleClick = (e, id) => {
        if (e.ctrlKey || e.metaKey) {
            if (selectedIds.includes(id)) {
                onSelect(selectedIds.filter(sid => sid !== id));
            } else {
                onSelect([...selectedIds, id]);
            }
        } else {
            onSelect([id]);
        }
    };

    return (
        <div className="d-flex flex-column h-100">
            <div className="p-2 border-bottom bg-light">
                <small className="fw-bold text-uppercase text-muted">Layers ({selectedIds.length} selected)</small>
            </div>
            <div className="flex-grow-1 overflow-auto">
                {reversedElements.length === 0 && (
                    <div className="p-3 text-center text-muted small">No elements</div>
                )}
                {reversedElements.map((el) => (
                    <div
                        key={el.id}
                        className={`d-flex align-items-center p-2 border-bottom cursor-pointer ${selectedIds.includes(el.id) ? 'bg-primary text-white' : 'hover-bg-light'}`}
                        style={{ cursor: 'pointer', fontSize: '0.85rem' }}
                        onClick={(e) => handleClick(e, el.id)}
                    >
                        <span className="me-2 opacity-75">
                            {getIconForType(el.type)}
                        </span>
                        <span className="text-truncate flex-grow-1">
                            {el.name || el.type}
                        </span>
                    </div>
                ))}
            </div>
            <style>{`
                .hover-bg-light:hover {
                    background-color: #f8f9fa;
                }
            `}</style>
        </div>
    );
};

export default ElementsList;
