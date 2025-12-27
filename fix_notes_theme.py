import os

path = r'c:\Users\MKT\Desktop\teachtrack\frontend\app\notes\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ============ MAIN PAGE BACKGROUNDS ============
content = content.replace('bg-gray-50', 'bg-[#020617]')
content = content.replace('bg-slate-50', 'bg-[#020617]')
content = content.replace('bg-[#F8FAFC]', 'bg-[#020617]')
content = content.replace('from-gray-50', 'from-[#020617]')
content = content.replace('to-gray-50', 'to-[#0F172A]')

# ============ SECTION BACKGROUNDS ============
content = content.replace('bg-gray-100', 'bg-[#0F172A]')
content = content.replace('bg-slate-100', 'bg-[#0F172A]')

# ============ HEADERS ============
content = content.replace('backdrop-blur-xl bg-white/70', 'backdrop-blur-xl bg-[#0F172A]/80')
content = content.replace('bg-white/90 backdrop-blur', 'bg-[#0F172A]/90 backdrop-blur')
content = content.replace('border-b border-gray-100', 'border-b border-white/10')
content = content.replace('border-b border-gray-200', 'border-b border-white/10')

if content != original:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Notes page updated with Saatosa Dark Theme!")
else:
    print("No changes needed")
