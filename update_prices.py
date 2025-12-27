import os

path = r'c:\Users\MKT\Desktop\teachtrack\frontend\app\pricing\page.tsx'

with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

original = content

# ============ UPDATE PRICES ============
# Currently: 
# const termlyPriceKes = Number(pricingConfig?.termly?.price_kes ?? 350);
# const yearlyPriceKes = Number(pricingConfig?.yearly?.price_kes ?? 1000);

content = content.replace(
    'pricingConfig?.termly?.price_kes ?? 350',
    'pricingConfig?.termly?.price_kes ?? 200'
)

content = content.replace(
    'pricingConfig?.yearly?.price_kes ?? 1000',
    'pricingConfig?.yearly?.price_kes ?? 500'
)

if content != original:
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Prices updated to Termly:200 / Yearly:500")
else:
    print("No changes needed (or pattern not found)")
