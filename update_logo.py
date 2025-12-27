import os
import shutil

# 1. MOVE THE FILE
src = r'c:\Users\MKT\Desktop\teachtrack\TTLOGO.png'
dst = r'c:\Users\MKT\Desktop\teachtrack\frontend\public\logo.png'
dst_dir = os.path.dirname(dst)

if not os.path.exists(dst_dir):
    os.makedirs(dst_dir)

if os.path.exists(src):
    shutil.copy2(src, dst)
    print(f"Copied {src} to {dst}")
else:
    print(f"Error: Source file {src} not found")

# 2. UPDATE NAVBAR
nav_path = r'c:\Users\MKT\Desktop\teachtrack\frontend\components\navbar.tsx'

with open(nav_path, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# Add Import
if 'import Image from "next/image";' not in content:
    content = content.replace(
        'import Link from "next/link";',
        'import Link from "next/link";\nimport Image from "next/image";'
    )

# Replace Logo JSX
old_logo = """
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                T
              </div>
              <div className="ml-3 flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                  TeachTrack
                </span>
                <span className="text-xs text-slate-500 font-medium tracking-wider">
                  CBC EDITION
                </span>
              </div>
            </Link>
"""

new_logo = """
            <Link href="/" className="flex-shrink-0 flex items-center group">
              <div className="relative w-40 h-10 transition-transform duration-300 group-hover:scale-105">
                <Image
                  src="/logo.png"
                  alt="TeachTrack Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </Link>
"""

# Try direct replacement (stripping whitespace to match)
# Since block replacement is tricky with exact whitespace, we'll try to target the core parts
if '<div className="w-10 h-10 bg-gradient-to-br' in content:
    # Find the start of the Link block
    start_marker = '<Link href="/" className="flex-shrink-0 flex items-center group">'
    end_marker = '</Link>'
    
    start_idx = content.find(start_marker)
    if start_idx != -1:
        # Find the closing tag matching this open tag... simplified assumption: first </Link> after start
        # This is risky if simpler logic fails, but let's try finding the closing of this specific block
        # The block ends after "CBC EDITION" spans
        
        subset = content[start_idx:]
        end_idx = subset.find(end_marker) + len(end_marker)
        
        if end_idx != -1:
            full_block_to_replace = subset[:end_idx]
            content = content.replace(full_block_to_replace, new_logo.strip())

if content != original:
    with open(nav_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Navbar updated with new Logo!")
else:
    print("Navbar modify failed - could not match logo block")
