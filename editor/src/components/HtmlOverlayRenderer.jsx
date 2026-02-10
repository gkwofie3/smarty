import React from 'react';

const HtmlOverlayRenderer = ({ element, isPreview = false }) => {
    const commonStyle = {
        position: 'absolute',
        left: element.x_position,
        top: element.y_position,
        width: element.width,
        height: element.height,
        transform: `rotate(${element.rotation_angle || 0}deg)`,
        opacity: element.opacity !== undefined ? element.opacity : 1,
        pointerEvents: isPreview ? 'auto' : 'none', // Allow interaction only in preview/client
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
                {!isPreview && <div style={{ position: 'absolute', inset: 0, background: 'transparent' }} />}
                {/* Overlay to prevent iframe capturing mouse events in Editor if pointer-events is not enough or for selection helper */}
            </div>
        );
    }

    if (element.type === 'Video Player') {
        const url = element.video_source_url;
        // Basic Youtube detection
        const isYoutube = url && (url.includes('youtube.com') || url.includes('youtu.be'));

        return (
            <div style={commonStyle}>
                {isYoutube ? (
                    <iframe
                        width="100%"
                        height="100%"
                        src={url ? url.replace("watch?v=", "embed/") : ""}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ width: '100%', height: '100%' }}
                    ></iframe>
                ) : (
                    <video
                        width="100%"
                        height="100%"
                        src={url}
                        controls={element.controls_visible !== false}
                        autoPlay={element.autoplay}
                        loop={element.loop}
                        muted={element.muted || element.autoplay} // Autoplay usually requires muted
                        style={{ objectFit: 'cover' }}
                    />
                )}
            </div>
        );
    }

    return null;
};

export default HtmlOverlayRenderer;
