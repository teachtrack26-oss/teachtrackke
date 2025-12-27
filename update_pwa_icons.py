import shutil
import os

# Files
source_logo = r'c:\Users\MKT\Desktop\teachtrack\frontend\public\logo.png'
public_dir = r'c:\Users\MKT\Desktop\teachtrack\frontend\public'

# Targets to overwrite
targets = [
    'icon-192.png',
    'icon-512.png',
    'apple-icon.png',
    'favicon.ico' 
]

if os.path.exists(source_logo):
    for target in targets:
        dst = os.path.join(public_dir, target)
        try:
            shutil.copy2(source_logo, dst)
            print(f"Updated {target} with new logo")
        except Exception as e:
            print(f"Failed to update {target}: {e}")
            
    # Also check if there is an 'icons' folder which some PWA generators use
    icons_dir = os.path.join(public_dir, 'icons')
    if os.path.exists(icons_dir):
        # List files in icons dir and overwrite common ones
        for file in os.listdir(icons_dir):
            if '192' in file or '512' in file or 'icon' in file:
                 shutil.copy2(source_logo, os.path.join(icons_dir, file))
                 print(f"Updated icons/{file}")
else:
    print("Error: Source logo not found!")
