import os

# All admin related directories
admin_dir = r'c:\Users\MKT\Desktop\teachtrack\frontend\app\admin'

updated_files = []

for root, dirs, files in os.walk(admin_dir):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            try:
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
                    updated_files.append(os.path.relpath(path, admin_dir))
                    
            except Exception as e:
                print(f"Error processing {path}: {e}")

if updated_files:
    print(f"Updated {len(updated_files)} files:")
    for f in updated_files:
        print(f"  - {f}")
else:
    print("No files needed updating")

print("\nAdmin pages updated with Saatosa Dark Theme!")
