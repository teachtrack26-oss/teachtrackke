import os

path = r'c:\Users\MKT\Desktop\teachtrack\frontend\components\navbar.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# Target the logo block I previously inserted
# It had 'className="relative w-40 h-10 transition-transform duration-300 group-hover:scale-105"'

target_class = 'className="relative w-40 h-10 transition-transform duration-300 group-hover:scale-105"'

# New container:
# 1. Taller (h-12)
# 2. White background (bg-white)
# 3. Padding (p-2)
# 4. Rounded corners (rounded-xl)
# 5. Shadow (shadow-lg) to make it look premium
new_class = 'className="relative w-48 h-12 bg-white rounded-xl px-3 py-1.5 shadow-lg flex items-center justify-center transition-transform duration-300 group-hover:scale-105 overflow-hidden"'

if target_class in content:
    content = content.replace(target_class, new_class)
    
    # Also verify the Image props, mainly object-contain is correct
    # I used 'className="object-contain"' which is good.
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added white background container to logo!")
else:
    print("Could not find the specific logo container line to update.")
