import re
import os

files = [
    r"c:\Users\ADMIN\source\smarty\editor\src\components\ElementRenderer.jsx",
    r"c:\Users\ADMIN\source\smarty\client\src\components\Preview\ElementRenderer.jsx"
]

for file_path in files:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Vertical Gauge Logic
    # Pattern: <Text ... text={val.toFixed(1)} ... x={0} ... y={...} ... width={width} ... align="center"
    # We use flexible whitespace \s+
    
    pattern_vert = re.compile(
        r'(<Text\s+text=\{val\.toFixed\(1\)\}\s+x=\{0\}\s+y=\{height\s*-\s*\(ratio\s*\*\s*height\)\s*-\s*15\}\s+width=\{width\}\s+align="center")', 
        re.DOTALL
    )
    
    def repl_vert(match):
        s = match.group(1)
        s = s.replace('x={0}', 'x={(width / 2) - 100}')
        s = s.replace('width={width}', 'width={200}')
        return s

    content_v = pattern_vert.sub(repl_vert, content)

    # Horizontal Gauge Logic
    # Pattern: <Text ... text={val.toFixed(1)} ... x={ratio * width - 15} ... y={height + 5} ... width={30} ... align="center"
    
    pattern_horz = re.compile(
        r'(<Text\s+text=\{val\.toFixed\(1\)\}\s+x=\{ratio\s*\*\s*width\s*-\s*15\}\s+y=\{height\s*\+\s*5\}\s+width=\{30\}\s+align="center")', 
        re.DOTALL
    )

    def repl_horz(match):
        s = match.group(1)
        # Using regex sub for x replacement to handle potential minor spacing differences inside curly braces
        s = re.sub(r'x=\{ratio\s*\*\s*width\s*-\s*15\}', r'x={(ratio * width) - 50}', s)
        s = s.replace('width={30}', 'width={100}')
        return s

    content_h = pattern_horz.sub(repl_horz, content_v)

    if content_h != content:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content_h)
        print(f"Updated {file_path}")
    else:
        print(f"No match found in {file_path}")
