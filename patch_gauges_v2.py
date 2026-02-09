import re
import os

files = [
    r"c:\Users\ADMIN\source\smarty\editor\src\components\ElementRenderer.jsx",
    r"c:\Users\ADMIN\source\smarty\client\src\components\Preview\ElementRenderer.jsx"
]

print("Script started...")

for file_path in files:
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        continue
        
    print(f"Processing {file_path}...")
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Strategy: Find the specific Text component by its unique prop 'text={val.toFixed(1)}'
    # Then look ahead for x={0} (Vertical) or x={ratio...} (Horizontal)
    
    # Vertical Gauge Replacement
    # Find: text={val.toFixed(1)} ... x={0} ... width={width}
    # We will use string replacement on strict blocks if possible, or regex on the block.
    
    # We will split the file into potential component blocks if needed, but regex is easier.
    # We need to match the whole Text tag to be safe.
    
    # Vertical Pattern:
    # <Text [anything until] text={val.toFixed(1)} [anything until] x={0} [anything] width={width} [anything] />
    
    # Relaxed Regex for Vertical
    # Note: re.DOTALL makes . match newlines
    
    # We specificy x={0} to identify Vertical Gauge (as opposed to Horizontal which has complex x)
    # But wait, Horizontal gauge has x={ratio...}.
    # So x={0} is unique to Vertical Gauge value text (ticks have x={width+5} or x={0} in Horizontal ticks).
    # Horizontal Ticks: <Text text={min.toString()} x={0} ...
    # This has text={min...} NOT text={val.toFixed...}
    # So if we match text={val.toFixed(1)} AND x={0}, it IS the Vertical Gauge Value Text.
    
    # Regex: (<Text\s+[^>]*?text=\{val\.toFixed\(1\)\}[^>]*?)(x=\{0\})([^>]*?)(width=\{width\})([^>]*?/>)
    # This assumes order: Text -> text -> x -> width. 
    # In my view_file output, order was: text, x, y, width.
    # regex: text=\{val\.toFixed\(1\)\} .? x=\{0\} .? y=... .? width=\{width\}
    
    # Let's try matching the exact block structure seen in view_file, but with \s+
    
    pattern_v = re.compile(
        r'(<Text\s+text=\{val\.toFixed\(1\)\}\s+x=\{0\}\s+y=\{.*?\-15\}\s+width=\{width\}\s+align="center")',
        re.DOTALL
    )
    
    match_v = pattern_v.search(content)
    if match_v:
        print("  Found Vertical Gauge Text block")
        replacement = match_v.group(1)
        replacement = replacement.replace('x={0}', 'x={(width / 2) - 100}')
        replacement = replacement.replace('width={width}', 'width={200}')
        content = content.replace(match_v.group(1), replacement)
    else:
        print("  Vertical Gauge Text block NOT found (regex mismatch)")

    # Horizontal Gauge Replacement
    # text={val.toFixed(1)} ... x={ratio * width - 15} ... width={30}
    
    pattern_h = re.compile(
        r'(<Text\s+text=\{val\.toFixed\(1\)\}\s+x=\{ratio\s*\*\s*width\s*-\s*15\}\s+.*?\s+width=\{30\}\s+align="center")',
        re.DOTALL
    )
    
    match_h = pattern_h.search(content)
    if match_h:
        print("  Found Horizontal Gauge Text block")
        replacement = match_h.group(1)
        # Replacing x
        replacement = re.sub(r'x=\{ratio\s*\*\s*width\s*-\s*15\}', r'x={(ratio * width) - 50}', replacement)
        replacement = replacement.replace('width={30}', 'width={100}')
        content = content.replace(match_h.group(1), replacement)
    else:
        print("  Horizontal Gauge Text block NOT found (regex mismatch)")

    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("  Saved.")

print("Script finished.")
