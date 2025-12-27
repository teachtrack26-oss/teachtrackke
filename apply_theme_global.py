import os

target_dirs = [
    r'c:\Users\MKT\Desktop\teachtrack\frontend\app',
    r'c:\Users\MKT\Desktop\teachtrack\frontend\components'
]

print("Starting Global Theme Application...")

for directory in target_dirs:
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.jsx'):
                path = os.path.join(root, file)
                try:
                    with open(path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original_content = content
                    
                    # 1. Color Migration (Indigo -> Primary Brand Color)
                    content = content.replace('text-indigo-', 'text-primary-')
                    content = content.replace('bg-indigo-', 'bg-primary-')
                    content = content.replace('border-indigo-', 'border-primary-')
                    content = content.replace('ring-indigo-', 'ring-primary-')
                    content = content.replace('from-indigo-', 'from-primary-')
                    content = content.replace('to-indigo-', 'to-primary-')

                    # 2. Card Styling (Apply 'glass-card' pattern)
                    # Pattern 1: Standard Dashboard Cards
                    content = content.replace('bg-white p-6 rounded-2xl shadow-sm border border-gray-100', 'glass-card p-6')
                    # Pattern 2: Simpler Cards
                    content = content.replace('bg-white rounded-xl shadow-sm border border-gray-100', 'glass-card')
                    content = content.replace('bg-white rounded-2xl shadow-sm', 'glass-card')
                    
                    # 3. Typography & Shapes
                    # Upgrade rounding to match "Saatosa" (Very rounded)
                    content = content.replace('rounded-2xl', 'rounded-[2rem]')
                    # bumping xl to 2xl
                    content = content.replace('rounded-xl', 'rounded-2xl')

                    if content != original_content:
                        with open(path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        print(f"Updated {file}")
                
                except Exception as e:
                    print(f"Skipping {path}: {e}")

print("Global Theme Application Complete.")
