const fs = require('fs');
const path = require('path');

const files = [
    "editor/src/components/ElementRenderer.jsx",
    "client/src/components/Preview/ElementRenderer.jsx"
];

console.log("Starting patch...");

files.forEach(fileRel => {
    const filePath = path.resolve(__dirname, fileRel);
    if (!fs.existsSync(filePath)) {
        console.log(`File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Vertical Gauge Logic
    // Target: text={val.toFixed(1)} ... x={0} ... width={width}
    // We can replace the specific lines if we find the block.
    // Block Start: case 'Vertical Gauge':

    // We will use a regex that matches the Text component props specifically.
    // Regex for Vertical Text Component:
    // <Text\s+text=\{val\.toFixed\(1\)\}\s+x=\{0\}\s+y=\{height\s*-\s*\(ratio\s*\*\s*height\)\s*-\s*15\}\s+width=\{width\}\s+align="center"

    // Note: JS Regex doesn't support dotAll flag until recently (s flag). We use [\s\S]*? or similar.
    // Or just simple string replace if we are confident about whitespace.
    // Given previous failures with exact string, regex is better.

    const vertRegex = /(<Text\s+text=\{val\.toFixed\(1\)\}\s+x=\{0\}\s+y=\{height\s*-\s*\(ratio\s*\*\s*height\)\s*-\s*15\}\s+width=\{width\}\s+align="center")/g;

    if (vertRegex.test(content)) {
        console.log(`  Patching Vertical Gauge in ${fileRel}`);
        content = content.replace(vertRegex, (match) => {
            return match.replace('x={0}', 'x={(width / 2) - 100}')
                .replace('width={width}', 'width={200}');
        });
    } else {
        console.log(`  Vertical Gauge regex did not match in ${fileRel}`);
        // Fallback: try strict string replace of the block part
        const strictBlock = `                            <Text
                                text={val.toFixed(1)}
                                x={0}
                                y={height - (ratio * height) - 15}
                                width={width}
                                align="center"`;
        if (content.includes(strictBlock)) {
            console.log("  Patching Vertical Gauge via strict block match");
            const newBlock = `                            <Text
                                text={val.toFixed(1)}
                                x={(width / 2) - 100}
                                y={height - (ratio * height) - 15}
                                width={200}
                                align="center"`;
            content = content.replace(strictBlock, newBlock);
        }
    }

    // Horizontal Gauge Logic
    // Target: text={val.toFixed(1)} ... x={ratio * width - 15} ... width={30}

    const horzRegex = /(<Text\s+text=\{val\.toFixed\(1\)\}\s+x=\{ratio\s*\*\s*width\s*-\s*15\}\s+y=\{height\s*\+\s*5\}\s+width=\{30\}\s+align="center")/g;

    if (horzRegex.test(content)) {
        console.log(`  Patching Horizontal Gauge in ${fileRel}`);
        content = content.replace(horzRegex, (match) => {
            // Replace x
            let newX = match.replace(/x=\{ratio\s*\*\s*width\s*-\s*15\}/, 'x={(ratio * width) - 50}');
            return newX.replace('width={30}', 'width={100}');
        });
    } else {
        console.log(`  Horizontal Gauge regex did not match in ${fileRel}`);
        // Fallback strict block
        const strictBlockH = `                            <Text
                                text={val.toFixed(1)}
                                x={ratio * width - 15}
                                y={height + 5}
                                width={30}
                                align="center"`;
        if (content.includes(strictBlockH)) {
            console.log("  Patching Horizontal Gauge via strict block match");
            const newBlockH = `                            <Text
                                text={val.toFixed(1)}
                                x={(ratio * width) - 50}
                                y={height + 5}
                                width={100}
                                align="center"`;
            content = content.replace(strictBlockH, newBlockH);
        }
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`  Saved changes to ${fileRel}`);
    } else {
        console.log(`  No changes made to ${fileRel}`);
    }
});
