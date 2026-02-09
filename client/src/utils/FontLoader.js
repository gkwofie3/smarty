// Utility to dynamically load Google Fonts
export const loadGoogleFont = (fontFamily) => {
    if (!fontFamily) return;

    // Check if checking for standard web fonts
    const webSafeFonts = [
        'Arial', 'Verdana', 'Times New Roman', 'Courier New', 'Georgia',
        'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS', 'Trebuchet MS',
        'Arial Black', 'Impact', 'Lucida Sans Unicode', 'Tahoma', 'sans-serif', 'serif', 'monospace'
    ];

    if (webSafeFonts.includes(fontFamily)) return;

    // Check if already loaded
    const id = `font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(id)) return;

    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@100;300;400;500;700;900&display=swap`;

    document.head.appendChild(link);
};

export const loadGoogleFonts = (fonts) => {
    if (!Array.isArray(fonts)) return;
    fonts.forEach(loadGoogleFont);
};
