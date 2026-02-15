import os
import sys
try:
    from PIL import Image
except ImportError:
    import subprocess
    print("Installing Pillow for icon conversion...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image

def convert_png_to_ico(png_path):
    if not os.path.exists(png_path):
        print(f"Warning: {png_path} not found.")
        return
    
    ico_path = os.path.splitext(png_path)[0] + ".ico"
    print(f"Converting {png_path} to {ico_path}...")
    
    img = Image.open(png_path)
    # Define standard icon sizes for Windows
    icon_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    img.save(ico_path, format='ICO', sizes=icon_sizes)
    print(f"Successfully created {ico_path}")

def main():
    icons = [
        'main/public/logo.png',
        'editor/public/editor.png',
        'client/public/client.png',
        'fdb/public/fdb.png',
        'script/public/script.png'
    ]
    
    base_dir = os.path.dirname(os.path.abspath(__file__))
    for icon in icons:
        full_path = os.path.join(base_dir, icon)
        convert_png_to_ico(full_path)

if __name__ == "__main__":
    main()
