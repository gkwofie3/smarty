import * as FaIcons from 'react-icons/fa';
import * as MdIcons from 'react-icons/md';
import * as BsIcons from 'react-icons/bs';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';

// Helper to convert kebab-case to PascalCase
const toPascalCase = (str) => {
    if (!str) return '';
    // Handle camelCase, kebab-case, snake_case -> PascalCase
    return str
        .replace(/[-_]+(\w)/g, (_, c) => c.toUpperCase()) // underscore/hyphen to Upper
        .replace(/^\w/, c => c.toUpperCase()); // First char to Upper
};

const ICON_SETS = {
    'Font Awesome': { prefix: 'Fa', icons: FaIcons },
    'Material Icons': { prefix: 'Md', icons: MdIcons },
    'Bootstrap Icons': { prefix: 'Bs', icons: BsIcons }
};

export const getIconComponent = (iconSet, iconName) => {
    const setConfig = ICON_SETS[iconSet];
    if (!setConfig) return null;
    const pascalName = toPascalCase(iconName);
    const componentName = `${setConfig.prefix}${pascalName}`;
    return setConfig.icons[componentName] || null;
};

export const getIconPath = (iconSet, iconName) => {
    const setConfig = ICON_SETS[iconSet];
    if (!setConfig) return null;

    const pascalName = toPascalCase(iconName);
    const componentName = `${setConfig.prefix}${pascalName}`;
    const IconComponent = setConfig.icons[componentName];

    if (!IconComponent) {
        // console.warn(`Icon not found: ${iconSet} / ${componentName}`);
        return null;
    }

    try {
        const markup = renderToStaticMarkup(React.createElement(IconComponent));

        // Regex to match d attribute (supporting single/double quotes)
        const matchD = markup.match(/d=["']([^"']+)["']/);
        const matchViewBox = markup.match(/viewBox=["']([^"']+)["']/);

        let viewBox = '0 0 512 512'; // Default Fallback

        if (matchViewBox && matchViewBox[1]) {
            viewBox = matchViewBox[1];
        } else {
            // Contextual Defaults based on Set
            if (iconSet === 'Material Icons') viewBox = '0 0 24 24';
            if (iconSet === 'Bootstrap Icons') viewBox = '0 0 16 16';
            if (iconSet === 'Font Awesome') viewBox = '0 0 512 512';
        }

        if (matchD && matchD[1]) {
            return {
                data: matchD[1],
                viewBox: viewBox
            };
        }
    } catch (e) {
        console.error("Error extracting icon path:", e);
    }
    return null;
};
