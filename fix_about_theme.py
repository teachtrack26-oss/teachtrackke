import os

path = r'c:\Users\MKT\Desktop\teachtrack\frontend\app\about\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ============ MAIN PAGE BACKGROUND ============
content = content.replace(
    'className="min-h-screen bg-gray-50"',
    'className="min-h-screen bg-[#020617]"'
)

# ============ SECTION BACKGROUNDS ============
# Stats section
content = content.replace(
    'className="py-12 bg-white border-b border-gray-100"',
    'className="py-12 bg-[#0F172A] border-b border-white/10"'
)

# Mission section
content = content.replace(
    'className="py-20 bg-white"',
    'className="py-20 bg-[#020617]"'
)

# Features section
content = content.replace(
    'className="py-20 bg-gray-50"',
    'className="py-20 bg-[#0F172A]"'
)

# Value cards background
content = content.replace(
    'className="bg-gray-50 p-6 rounded-[2rem]',
    'className="bg-white/5 backdrop-blur-sm p-6 rounded-[2rem]'
)

# Feature cards
content = content.replace(
    'className="group relative bg-white rounded-3xl p-8',
    'className="group relative bg-white rounded-3xl p-8'  # Keep white for pop effect
)

# ============ TEXT COLORS ============
# Mission title
content = content.replace(
    'className="text-3xl md:text-4xl font-bold text-gray-900 mb-6"',
    'className="text-3xl md:text-4xl font-bold text-white mb-6"'
)

# Features section title
content = content.replace(
    'className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"',
    'className="text-3xl md:text-4xl font-bold text-white mb-4"'
)

# Subtitle text
content = content.replace(
    'className="text-lg text-gray-600 max-w-2xl mx-auto"',
    'className="text-lg text-slate-400 max-w-2xl mx-auto"'
)

# Prose text in mission
content = content.replace(
    'className="prose prose-lg text-gray-600"',
    'className="prose prose-lg text-slate-400"'
)

# Stats label text
content = content.replace(
    'className="text-gray-600 font-medium"',
    'className="text-slate-400 font-medium"'
)

# Value card titles
content = content.replace(
    '<h3 className="font-bold text-gray-900 mb-2">',
    '<h3 className="font-bold text-white mb-2">'
)

# Value card descriptions
content = content.replace(
    '<p className="text-sm text-gray-600">',
    '<p className="text-sm text-slate-400">'
)

# Icon background
content = content.replace(
    'className="w-12 h-12 bg-primary-100 text-primary-600',
    'className="w-12 h-12 bg-primary-500/20 text-primary-400'
)

if content != original:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("About page updated with Saatosa Dark Theme!")
else:
    print("No changes needed")
