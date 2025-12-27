import os

path = r'c:\Users\MKT\Desktop\teachtrack\frontend\components\navbar.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Navbar Background (Scrolled/Unscrolled)
# Replace white bg with dark navy
content = content.replace('"bg-white/90 backdrop-blur-md shadow-lg border-b border-gray-200/50"', 
                          '"bg-[#020617]/90 backdrop-blur-md shadow-lg border-b border-white/10"')
content = content.replace('"bg-white/80 backdrop-blur-sm border-b border-transparent"', 
                          '"bg-[#020617]/80 backdrop-blur-sm border-b border-transparent"')

# 2. Text Colors
content = content.replace('text-gray-600', 'text-slate-400')
content = content.replace('text-gray-500', 'text-slate-500')
content = content.replace('text-gray-700', 'text-slate-300')
content = content.replace('text-gray-900', 'text-white')

# 3. Hover States (Backgrounds)
content = content.replace('hover:bg-gray-50', 'hover:bg-white/5')
content = content.replace('bg-gray-50', 'bg-white/5') # Generic light grey bg
content = content.replace('bg-white', 'bg-[#0F172A]') # Dropdowns etc -> Slate 900

# 4. Borders
content = content.replace('border-gray-200', 'border-white/10')
content = content.replace('border-gray-100', 'border-white/10')

# 5. Dropdown Specifics
# "bg-white rounded-[2rem] shadow-xl border border-gray-100" (from user's recent global script?)
content = content.replace('bg-[#0F172A] rounded-[2rem]', 'bg-[#0F172A] border border-white/10 rounded-[2rem]')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Navbar updated for Dark Mode")
