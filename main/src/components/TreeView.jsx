import React, { useState } from 'react';

const TreeNode = ({ node, level, onSelect, selectedId }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasChildren = node.children && node.children.length > 0;

    const handleToggle = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    const handleSelect = (e) => {
        e.stopPropagation();
        onSelect(node);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'device': return 'fa fa-hdd text-inverse fa-lg';
            case 'register': return 'fa fa-microchip text-primary fa-lg';
            case 'group': return 'fa fa-cubes text-info fa-lg';
            case 'point': return 'fa fa-circle text-success fa-lg';
            default: return 'fa fa-folder text-warning fa-lg';
        }
    };

    return (
        <div style={{ paddingLeft: `${level * 20}px` }}>
            <div
                className={`d-flex align-items-center p-1 rounded cursor-pointer ${selectedId === node.id ? 'bg-primary text-white' : 'hover-bg-light'}`}
                onClick={handleSelect}
                style={{ cursor: 'pointer' }}
            >
                {/* Toggle Icon */}
                <div style={{ width: '20px', textAlign: 'center', marginRight: '5px' }} onClick={handleToggle}>
                    {hasChildren && (
                        <i className={`fa ${isExpanded ? 'fa-caret-down' : 'fa-caret-right'} text-secondary`}></i>
                    )}
                </div>

                {/* Node Icon */}
                <i className={`${getIcon(node.type)} me-2 ${selectedId === node.id ? 'text-white' : ''}`}></i>

                {/* Label */}
                <span className="fw-bold">{node.text}</span>
            </div>

            {/* Children */}
            {isExpanded && hasChildren && (
                <div>
                    {node.children.map(child => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            onSelect={onSelect}
                            selectedId={selectedId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const TreeView = ({ data, onSelect }) => {
    const [selectedId, setSelectedId] = useState(null);

    const handleSelect = (node) => {
        setSelectedId(node.id);
        if (onSelect) {
            onSelect({ ...node, original: node }); // Maintain compatibility with previous jstree structure
        }
    };

    return (
        <div className="tree-view-container">
            {data.map(node => (
                <TreeNode
                    key={node.id}
                    node={node}
                    level={0}
                    onSelect={handleSelect}
                    selectedId={selectedId}
                />
            ))}
        </div>
    );
};

export default TreeView;
