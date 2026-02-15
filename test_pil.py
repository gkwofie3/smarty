try:
    from PIL import Image
    import os
    img = Image.open('main/public/logo.png')
    img.save('main/public/logo.ico', format='ICO')
    print("SUCCESS: logo.ico created")
except Exception as e:
    print(f"FAILURE: {e}")
