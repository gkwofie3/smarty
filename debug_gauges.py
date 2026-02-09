import os

file_path = r"c:\Users\ADMIN\source\smarty\editor\src\components\ElementRenderer.jsx"

if not os.path.exists(file_path):
    with open("debug_patch.txt", "w") as f:
        f.write("File not found.")
    exit()

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Line 436 (0-indexed is 435)
target_line_idx = 435
if target_line_idx < len(lines):
    line = lines[target_line_idx]
    with open("debug_patch.txt", "w") as f:
        f.write(f"Line {target_line_idx+1}: {repr(line)}\n")
        f.write(f"Line {target_line_idx+1} hex: {line.encode('utf-8').hex()}\n")
else:
    with open("debug_patch.txt", "w") as f:
        f.write("Line index out of bounds.\n")

# Attempt patch immediately if found
import re
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Regex for Vertical Text
# Matches <Text ... text={val.toFixed(1)} ... x={...} ... width={...} ... align="center"
# We handle any whitespace via \s+
pattern_v = re.compile(
    r'(<Text\s+text=\{val\.toFixed\(1\)\}\s+x=\{0\}\s+y=\{.*?\-15\}\s+width=\{width\}\s+align="center")',
    re.DOTALL
)

match_v = pattern_v.search(content)
if match_v:
    with open("debug_patch.txt", "a") as f:
        f.write("Vertical Gauge Regex Matched!\n")
    
    replacement = match_v.group(1)
    replacement = replacement.replace('x={0}', 'x={(width / 2) - 100}')
    replacement = replacement.replace('width={width}', 'width={200}')
    
    content = content.replace(match_v.group(1), replacement)
else:
    with open("debug_patch.txt", "a") as f:
        f.write("Vertical Regex Failed.\n")

# Horizontal Regex
pattern_h = re.compile(
    r'(<Text\s+text=\{val\.toFixed\(1\)\}\s+x=\{ratio\s*\*\s*width\s*-\s*15\}\s+y=\{.*?\+5\}\s+width=\{30\}\s+align="center")',
    re.DOTALL
)
match_h = pattern_h.search(content)
if match_h:
    with open("debug_patch.txt", "a") as f:
        f.write("Horizontal Gauge Regex Matched!\n")
    replacement = match_h.group(1)
    # Using re.sub for x just in case
    replacement = re.sub(r'x=\{ratio\s*\*\s*width\s*-\s*15\}', r'x={(ratio * width) - 50}', replacement)
    replacement = replacement.replace('width={30}', 'width={100}')
    content = content.replace(match_h.group(1), replacement)
else:
    with open("debug_patch.txt", "a") as f:
        f.write("Horizontal Regex Failed.\n")

# Save if regex matched
if match_v or match_h:
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    with open("debug_patch.txt", "a") as f:
        f.write("File updated.\n")

# Do the same for Client file?
client_path = r"c:\Users\ADMIN\source\smarty\client\src\components\Preview\ElementRenderer.jsx"
if os.path.exists(client_path):
    with open(client_path, "r", encoding="utf-8") as f:
        c_content = f.read()
    
    match_vc = pattern_v.search(c_content)
    if match_vc:
         repl = match_vc.group(1).replace('x={0}', 'x={(width / 2) - 100}').replace('width={width}', 'width={200}')
         c_content = c_content.replace(match_vc.group(1), repl)
    
    match_hc = pattern_h.search(c_content)
    if match_hc:
         repl = match_hc.group(1)
         repl = re.sub(r'x=\{ratio\s*\*\s*width\s*-\s*15\}', r'x={(ratio * width) - 50}', repl)
         repl = repl.replace('width={30}', 'width={100}')
         c_content = c_content.replace(match_hc.group(1), repl)
         
    if match_vc or match_hc:
        with open(client_path, "w", encoding="utf-8") as f:
            f.write(c_content)
        with open("debug_patch.txt", "a") as f:
            f.write("Client File updated.\n")

