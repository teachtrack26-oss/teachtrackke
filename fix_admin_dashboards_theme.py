import os

dashboard_files = [
    r'c:\Users\MKT\Desktop\teachtrack\frontend\components\dashboard\SuperAdminDashboard.tsx',
    r'c:\Users\MKT\Desktop\teachtrack\frontend\components\dashboard\SchoolAdminDashboard.tsx',
    r'c:\Users\MKT\Desktop\teachtrack\frontend\app\(dashboard)\dashboard-components.tsx',
]

for path in dashboard_files:
    if not os.path.exists(path):
        print(f"Skipping (not found): {path}")
        continue
        
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # ============ MAIN CONTAINER BACKGROUNDS ============
    # Light backgrounds to Dark Navy
    content = content.replace('bg-gray-50', 'bg-[#020617]')
    content = content.replace('bg-slate-50', 'bg-[#020617]')
    content = content.replace('bg-[#F3F4F6]', 'bg-[#020617]')
    
    # ============ SECTION BACKGROUNDS ============
    # Mid-level sections
    content = content.replace('bg-gray-100', 'bg-[#0F172A]')
    
    # ============ TEXT COLORS (for dark bg) ============
    # Headers/Titles - need to be light on dark background
    # But inside white cards, they should stay dark
    # This is tricky - we'll target specific patterns
    
    # General text that's on the main bg (not inside cards)
    # Pattern: "text-gray-900" outside of glass-card context → white
    # Since the cards are white, text inside cards should remain dark
    # Global handler already sets card text to dark via .glass-card { color: ... }
    
    # ============ HEADERS ============
    content = content.replace('backdrop-blur-xl bg-white/70', 'backdrop-blur-xl bg-[#0F172A]/80')
    content = content.replace('border-b border-gray-100', 'border-b border-white/10')
    
    if content != original:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {os.path.basename(path)}")
    else:
        print(f"No changes: {os.path.basename(path)}")

print("\nAdmin dashboards updated!")
