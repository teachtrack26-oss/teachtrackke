import os

# Update both Login and Register pages

auth_files = [
    r'c:\Users\MKT\Desktop\teachtrack\frontend\app\(auth)\login\page.tsx',
    r'c:\Users\MKT\Desktop\teachtrack\frontend\app\(auth)\register\page.tsx',
    r'c:\Users\MKT\Desktop\teachtrack\frontend\app\(auth)\forgot-password\page.tsx',
    r'c:\Users\MKT\Desktop\teachtrack\frontend\app\(auth)\reset-password\page.tsx',
    r'c:\Users\MKT\Desktop\teachtrack\frontend\app\(auth)\verify-email\page.tsx',
]

for path in auth_files:
    if not os.path.exists(path):
        print(f"Skipping (not found): {path}")
        continue
        
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # ============ PAGE BACKGROUND ============
    # Change light gradient to Deep Navy with subtle blue glow
    content = content.replace(
        'bg-gradient-to-br from-primary-50 via-cyan-50 to-gray-50',
        'bg-[#020617]'
    )
    
    # ============ CARD STYLING ============
    # Make cards white (pop effect) - Login/Register main card
    content = content.replace(
        'bg-white rounded-[2rem] shadow-2xl p-8',
        'bg-white rounded-[2rem] shadow-2xl shadow-primary-500/5 p-8 border border-white/10'
    )
    
    # ============ LOADING STATE ============
    # Loading spinner on dark bg
    content = content.replace(
        '<p className="mt-4 text-gray-600">Loading...</p>',
        '<p className="mt-4 text-slate-400">Loading...</p>'
    )
    
    # ============ FORM ELEMENTS ============
    # Input styling - keep them light since card is white
    # Labels should stay readable on white card - no change needed
    
    # ============ DIVIDER LINE ============
    # "Or continue with email" divider
    content = content.replace(
        'className="w-full border-t border-gray-300"',
        'className="w-full border-t border-gray-200"'
    )
    content = content.replace(
        '<span className="px-2 bg-white text-gray-500">',
        '<span className="px-2 bg-white text-slate-500">'
    )
    
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {os.path.basename(path)}")
    else:
        print(f"No changes needed: {os.path.basename(path)}")

print("\nAuth pages updated with Saatosa Dark Theme!")
