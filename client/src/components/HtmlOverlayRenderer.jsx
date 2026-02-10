import React from 'react';

const HtmlOverlayRenderer = ({ element }) => {
    const commonStyle = {
        position: 'absolute',
        left: element.x_position,
        top: element.y_position,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation_angle || 0}deg)`,
        opacity: element.opacity !== undefined ? element.opacity : 1,
        pointerEvents: 'auto', // Always interactive in Client
        zIndex: element.z_index || 0,
    };

    if (element.type === 'Web View') {
        const url = element.data_binding_url || element.url_source || 'about:blank';
        return (
            <div style={commonStyle}>
                <iframe
                    src={url}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title={element.name || 'Web View'}
                />
            </div>
        );
    }

    if (element.type === 'Video Player') {
        const url = element.video_source_url;
        // Basic Youtube detection
        const isYoutube = url && (url.includes('youtube.com') || url.includes('youtu.be'));
        const videoRef = React.useRef(null);

        React.useEffect(() => {
            if (isYoutube) return; // Cannot control iframe easily without API

            const handleKeyDown = (e) => {
                if (e.code === 'Space') {
                    e.preventDefault(); // Prevent scrolling
                    const video = videoRef.current;
                    if (video) {
                        if (video.paused) video.play();
                        else video.pause();
                    }
                }
            };

            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }, [isYoutube]);

        return (
            <div style={commonStyle}>
                {isYoutube ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={(() => {
                            if (!url) return "";
                            let embedUrl = url;
                            let videoId = "";

                            if (url.includes("youtube.com/watch?v=")) {
                                videoId = url.split("v=")[1]?.split("&")[0];
                                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                            } else if (url.includes("youtu.be/")) {
                                videoId = url.split("youtu.be/")[1]?.split("?")[0];
                                embedUrl = `https://www.youtube.com/embed/${videoId}`;
                            } else if (url.includes("youtube.com/embed/")) {
                                videoId = url.split("embed/")[1]?.split("?")[0];
                            }

                            const params = [];
                            if (element.autoplay) {
                                params.push("autoplay=1");
                                params.push("mute=1"); // Required for autoplay
                            }
                            if (element.loop && videoId) {
                                params.push("loop=1");
                                params.push(`playlist=${videoId}`); // Required for looping single video
                            }
                            if (element.controls_visible === false) {
                                params.push("controls=0");
                            }

                            if (params.length > 0) {
                                embedUrl += (embedUrl.includes("?") ? "&" : "?") + params.join("&");
                            }
                            return embedUrl;
                        })()}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ width: '100%', height: '100%' }}
                    ></iframe>
                ) : (
                    <video
                        ref={videoRef}
                        width="100%"
                        height="100%"
                        src={url}
                        controls={element.controls_visible !== false}
                        autoPlay={element.autoplay}
                        loop={element.loop}
                        muted={element.autoplay} // Only initial mute if autoplay, user can unmute
                        style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                    />
                )}
            </div>
        );
    }

    if (['Alarm Table', 'Event Table', 'Log Table', 'Fault Table'].includes(element.type)) {
        const [data, setData] = React.useState([]);
        const [loading, setLoading] = React.useState(true);
        const [error, setError] = React.useState(null);
        const [searchTerm, setSearchTerm] = React.useState('');
        const [currentPage, setCurrentPage] = React.useState(1);

        const endpointMap = {
            'Alarm Table': 'alarms',
            'Event Table': 'events',
            'Log Table': 'logs',
            'Fault Table': 'faults'
        };

        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Token ${token}` } : {};

                let queryParams = new URLSearchParams();

                // Filtering based on properties
                if (element.type === 'Alarm Table') {
                    if (element.show_active) queryParams.append('active', 'true');
                    if (element.show_acknowledged) queryParams.append('acknowledged', 'true');
                    if (element.show_cleared) queryParams.append('cleared', 'true');
                } else if (element.type === 'Event Table') {
                    if (element.show_notified) queryParams.append('notified', 'true');
                } else if (element.type === 'Fault Table') {
                    if (element.show_resolved) queryParams.append('resolved', 'true');
                }

                const response = await fetch(`http://localhost:8000/api/${endpointMap[element.type]}/?${queryParams.toString()}`, { headers });
                if (!response.ok) throw new Error('Failed to fetch data');
                const result = await response.json();
                const items = Array.isArray(result) ? result : (result.results || []);
                setData(items);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        React.useEffect(() => {
            fetchData();
            const interval = setInterval(fetchData, (element.update_interval || 30) * 1000);
            return () => clearInterval(interval);
        }, [element.type, element.update_interval, element.show_active, element.show_acknowledged, element.show_cleared, element.show_notified, element.show_resolved]);

        const handleAction = async (action, id = null) => {
            try {
                const token = localStorage.getItem('token');
                const headers = token ? { 'Authorization': `Token ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
                let url = `http://localhost:8000/api/alarms/${action}/`; // Default list action
                if (id) {
                    url = `http://localhost:8000/api/alarms/${id}/${action}/`; // Detail action
                }

                const response = await fetch(url, { method: 'POST', headers });
                if (response.ok) {
                    fetchData(); // Refresh data
                } else {
                    console.error("Action failed");
                }
            } catch (err) {
                console.error(err);
            }
        };

        // Filtering Client-side (Text Search)
        const filteredData = data.filter(item => {
            if (!element.search_enabled || !searchTerm) return true;
            return Object.values(item).some(val =>
                String(val).toLowerCase().includes(searchTerm.toLowerCase())
            );
        });

        // Pagination
        const pageSize = element.pagination_size ? parseInt(element.pagination_size) : 10;
        const totalPages = Math.ceil(filteredData.length / pageSize);
        const paginatedData = element.pagination_enabled
            ? filteredData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
            : filteredData;

        // Columns
        const getColumns = () => {
            const defaultColumns = {
                'Alarm Table': ['start_time', 'description', 'severity', 'is_active', 'is_acknowledged', 'is_cleared'],
                'Event Table': ['timestamp', 'event_type', 'description', 'severity', 'is_notified'],
                'Log Table': ['timestamp', 'source', 'message'],
                'Fault Table': ['timestamp', 'device', 'description', 'is_resolved']
            };

            let cols = [];
            if (data.length > 0) {
                const keys = Object.keys(data[0]);
                cols = keys.filter(k => k !== 'id' && k !== 'point');
            }

            // If data is empty OR if filtering removed all columns, fallback to defaults
            if (cols.length === 0) {
                cols = defaultColumns[element.type] || [];
            }

            if (element.type === 'Alarm Table' && element.acknowledge_button) {
                return [...cols, 'actions'];
            }
            return cols;
        };
        const columns = getColumns();

        const tableStyle = {
            width: '100%',
            height: '100%',
            overflow: 'auto',
            fontFamily: element.font_family || 'inherit',
            fontSize: `${element.font_size || 14}px`,
            color: element.text_color || '#212529',
            backgroundColor: element.background_color || '#ffffff',
            minHeight: '100px' // Ensure visibility
        };

        return (
            <div style={commonStyle}>
                <div style={{ ...tableStyle, display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
                    <div style={{ padding: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        {element.search_enabled && (
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ padding: '4px', fontSize: '12px' }}
                            />
                        )}
                        {element.type === 'Alarm Table' && (
                            <div style={{ display: 'flex', gap: '5px' }}>
                                {/* Global Acknowledge/Clear Buttons could go here if requested to be "main button for the table itself" */}
                                <button onClick={() => handleAction('acknowledge_all')} style={{ fontSize: '11px', cursor: 'pointer' }}>Ack All</button>
                                <button onClick={() => handleAction('clear_all')} style={{ fontSize: '11px', cursor: 'pointer' }}>Clear All</button>
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, overflow: 'auto' }}>
                        {error && <div style={{ color: 'red', padding: '5px' }}>Error: {error}</div>}

                        <table style={{ width: '100%', borderCollapse: 'collapse', border: element.bordered ? `1px solid ${element.border_color || '#dee2e6'}` : 'none' }}>
                            <thead style={{
                                backgroundColor: element.header_background_color || '#f8f9fa',
                                color: element.header_text_color || '#212529',
                                position: 'sticky', top: 0, zIndex: 1
                            }}>
                                <tr>
                                    {columns.length > 0 ? columns.map(col => (
                                        <th key={col} style={{
                                            padding: '8px',
                                            textAlign: 'left',
                                            fontSize: `${element.header_font_size || element.font_size || 14}px`,
                                            fontWeight: element.header_font_weight || 'bold',
                                            borderBottom: `2px solid ${element.border_color || '#dee2e6'}`
                                        }}>
                                            {col === 'actions' ? 'Actions' : col.replace(/_/g, ' ').toUpperCase()}
                                        </th>
                                    )) : <th style={{ padding: '8px' }}>No Attributes Configured</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedData.length > 0 ? paginatedData.map((row, idx) => (
                                    <tr key={idx} style={{
                                        backgroundColor: element.striped_rows && idx % 2 === 1
                                            ? (element.alternate_row_color || 'rgba(0,0,0,0.05)')
                                            : (element.row_background_color || 'transparent'),
                                        color: element.row_text_color || 'inherit'
                                    }}>
                                        {columns.map(col => {
                                            if (col === 'actions') {
                                                return (
                                                    <td key={col} style={{ padding: '8px', borderBottom: '1px solid #dee2e6' }}>
                                                        {!row.is_acknowledged && (
                                                            <button onClick={() => handleAction('acknowledge', row.id)} style={{ marginRight: '5px', cursor: 'pointer' }}>Ack</button>
                                                        )}
                                                        {/* Optional individual clear button if needed, user only explicitly asked for Ack button on row */}
                                                    </td>
                                                );
                                            }
                                            return (
                                                <td key={col} style={{
                                                    padding: `${element.row_height ? parseInt(element.row_height) / 4 : 8}px`,
                                                    borderBottom: element.bordered ? `1px solid ${element.border_color || '#dee2e6'}` : '1px solid #dee2e6',
                                                    fontSize: `${element.row_font_size || element.font_size || 14}px`,
                                                    fontFamily: element.row_font_family || 'inherit',
                                                    textAlign: element.row_text_align || 'left'
                                                }}>
                                                    {typeof row[col] === 'object' ? JSON.stringify(row[col]) : row[col]}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={columns.length || 1} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
                                            {loading ? 'Loading...' : 'No Data Available'}
                                            {/* DEBUG INFO: Remove before production */}
                                            <div style={{ fontSize: '10px', marginTop: '5px' }}>
                                                Type: {element.type} | Cols: {columns.length} | Err: {error || 'None'}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {element.pagination_enabled && totalPages > 1 && (
                        <div style={{ padding: '5px', display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>&lt;</button>
                            <span>{currentPage} / {totalPages}</span>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>&gt;</button>
                        </div>
                    )}
                </div>
            </div>
        );
    }
};

export default HtmlOverlayRenderer;
