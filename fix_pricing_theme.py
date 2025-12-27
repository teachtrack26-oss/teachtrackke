import os

path = r'c:\Users\MKT\Desktop\teachtrack\frontend\app\pricing\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ============ MAIN PAGE BACKGROUND ============
# Change light gradient to Deep Navy
content = content.replace(
    'bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100',
    'bg-[#020617]'
)

# ============ SECTION BACKGROUNDS ============
content = content.replace('bg-gray-50', 'bg-[#0F172A]')
content = content.replace('bg-slate-50', 'bg-[#0F172A]')
content = content.replace('bg-gray-100', 'bg-[#1E293B]')

# ============ TEXT COLORS FOR PAGE (not cards) ============
# Page header title - change from gray to white
content = content.replace(
    'text-4xl font-extrabold text-gray-900',
    'text-4xl font-extrabold text-white'
)

# Subtitle
content = content.replace(
    'text-xl text-gray-500">',
    'text-xl text-slate-400">'
)

# ============ CARDS - Keep white for pop effect ============
# Cards should stay white to pop against dark bg
# But ensure card footers match style

# ============ CARD STYLING ============
# Keep cards looking identical to Saatosa pricing (white cards)
# They're already using bg-white which is correct

if content != original:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Pricing page updated with Saatosa Dark Theme!")
else:
    print("No changes needed")
