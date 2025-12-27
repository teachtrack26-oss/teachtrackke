import os

path = r'c:\Users\MKT\Desktop\teachtrack\frontend\app\(dashboard)\dashboard\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ============ MAIN BACKGROUND ============
# Change light gray to Deep Navy
content = content.replace(
    'className="min-h-screen bg-[#F3F4F6]',
    'className="min-h-screen bg-[#020617]'
)

# ============ HEADER / STICKY BAR ============
# Change white glass to dark glass
content = content.replace(
    'backdrop-blur-xl bg-white/70 border-b border-white/50',
    'backdrop-blur-xl bg-[#0F172A]/80 border-b border-white/10'
)

# ============ BLOB BACKGROUNDS ============
# Keep the blobs but tone them down for dark mode
content = content.replace(
    'bg-purple-400/30',
    'bg-purple-600/20'
)
content = content.replace(
    'bg-primary-400/30',
    'bg-primary-600/20'
)
content = content.replace(
    'bg-pink-400/30',
    'bg-pink-600/20'
)
content = content.replace(
    'bg-grid-slate-200/50',
    'bg-grid-slate-800/30'
)

# ============ CARDS & SECTIONS ============
# Glass cards - already handled by global CSS, but ensure local overrides match
content = content.replace(
    'bg-white/70',
    'bg-white/90'  # Keep cards bright white for contrast
)
content = content.replace(
    'bg-white/80',
    'bg-white/95'
)

if content != original:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Dashboard page updated with Saatosa Dark Theme!")
else:
    print("No changes needed for Dashboard page")
