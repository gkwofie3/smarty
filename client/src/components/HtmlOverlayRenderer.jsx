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

    return null;
};

export default HtmlOverlayRenderer;
