import os

path = r'c:\Users\MKT\Desktop\teachtrack\frontend\components\dashboard\SuperAdminDashboard.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace hardcoded Indigo with Primary (Brand Color)
content = content.replace('text-indigo-', 'text-primary-')
content = content.replace('bg-indigo-', 'bg-primary-')
content = content.replace('border-indigo-', 'border-primary-')
content = content.replace('ring-indigo-', 'ring-primary-')

# Upgrade Cards to Premium Glass
# Finding strict matches for the standard card pattern used in this file
content = content.replace('bg-white p-6 rounded-2xl shadow-sm border border-gray-100', 'glass-card p-6')

# Upgrade roundedness generally
content = content.replace('rounded-2xl', 'rounded-[2rem]') # Saatosa style (very rounded)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Theme applied to SuperAdminDashboard.tsx")
