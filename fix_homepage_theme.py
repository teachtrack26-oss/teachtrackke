import os

path = r'c:\Users\MKT\Desktop\teachtrack\frontend\app\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# ============ BACKGROUNDS ============
# Main container - Deep Navy
content = content.replace(
    'className="min-h-screen bg-gradient-to-b from-gray-50 to-white"',
    'className="min-h-screen bg-[#020617]"'
)

# Features Section
content = content.replace(
    '<section id="features" className="py-24 bg-white">',
    '<section id="features" className="py-24 bg-[#020617]">'
)

# Testimonials Section
content = content.replace(
    '<section className="py-24 bg-gradient-to-b from-gray-50 to-white">',
    '<section className="py-24 bg-[#0F172A]">'
)

# How it Works Section  
content = content.replace(
    '<section className="py-24 bg-white">',
    '<section className="py-24 bg-[#020617]">'
)

# ============ TEXT COLORS (Feature Cards) ============
# Feature card text - make it stay dark since cards are light
# But section headings should be white

# Section Headers - White text
content = content.replace(
    'text-4xl md:text-5xl font-bold mb-4">',
    'text-4xl md:text-5xl font-bold mb-4 text-white">'
)
content = content.replace(
    'className="text-xl text-gray-600 max-w-2xl mx-auto"',
    'className="text-xl text-slate-400 max-w-2xl mx-auto"'
)
content = content.replace(
    'className="text-xl text-gray-600"',
    'className="text-xl text-slate-400"'
)

# "to Stay Organized" text (after gradient span)
content = content.replace(
    '</span>{" "}\n              to Stay Organized',
    '</span>{" "}\n              <span className="text-white">to Stay Organized</span>'
)

# Testimonial cards - keep white bg like Saatosa
content = content.replace(
    'className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"',
    'className="bg-white rounded-3xl p-8 shadow-2xl hover:shadow-cyan-500/20 transition-all duration-500 hover:-translate-y-2 border border-white/10"'
)

# How it Works cards - dark glass style
content = content.replace(
    'className="group relative flex items-start gap-6 p-8 bg-gradient-to-r from-gray-50 to-white rounded-3xl hover:shadow-xl transition-all duration-500 hover:-translate-x-2 border border-gray-100"',
    'className="group relative flex items-start gap-6 p-8 bg-white/5 backdrop-blur-sm rounded-3xl hover:shadow-xl hover:shadow-primary-500/10 transition-all duration-500 hover:-translate-x-2 border border-white/10"'
)

# Step titles and descriptions - white text
content = content.replace(
    '<h3 className="text-2xl font-bold text-gray-900">',
    '<h3 className="text-2xl font-bold text-white">'
)
content = content.replace(
    '<p className="text-gray-600 leading-relaxed text-lg">',
    '<p className="text-slate-400 leading-relaxed text-lg">'
)

# ============ FEATURE CARDS - Keep Light Background ============
# Feature cards should stay light colored (pop against dark bg)
# But they use bgColor like "bg-primary-50" which is light - that's fine

# Feature card titles - these are inside light cards so keep dark
# Already "text-gray-900" which is correct

# ============ TESTIMONIALS INTERNAL TEXT ============
# Already uses text-gray-700, text-gray-900 inside white cards - correct

# ============ OTHER SECTION HEADERS ============
content = content.replace(
    '<h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">',
    '<h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">'
)

print("Homepage updated with Saatosa Dark Theme!")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
