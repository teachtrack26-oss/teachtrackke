import json
import re

print('Reading Pre-Technical Studies JSON...')
with open('../G9/grade 9 pretechnical studies.json', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix smart quotes first
content = content.replace('\u201c', '"').replace('\u201d', '"')
content = content.replace('\u2018', "'").replace('\u2019', "'")

# Fix specific patterns
# 1. Fix double quotes before array close: software""] -> software"]
content = re.sub(r'""(\s*\])', r'"\1', content)

# 2. Fix ]", -> ],
content = re.sub(r'\]"(\s*,)', r']\1', content)

print('Attempting to parse...')
try:
    data = json.loads(content)
    print('✅ JSON is now valid!')
    
    # Write formatted version
    with open('../G9/grade 9 pretechnical studies.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f'Subject: {data.get("subject")}')
    print(f'Grade: {data.get("grade")}')
    print(f'Strands: {len(data.get("strands", []))}')
    
except json.JSONDecodeError as e:
    print(f'❌ Still has error at line {e.lineno}, column {e.colno}')
    print(f'Message: {e.msg}')
    
    # Show problematic area
    lines = content.split('\n')
    start = max(0, e.lineno - 3)
    end = min(len(lines), e.lineno + 2)
    
    print(f'\nContext around error:')
    for i in range(start, end):
        marker = '>>> ' if i == e.lineno - 1 else '    '
        print(f'{marker}{i+1}: {lines[i][:150]}')
    
    # Save partial fixes
    with open('../G9/grade 9 pretechnical studies.json', 'w', encoding='utf-8') as f:
        f.write(content)
    print('\nPartial fixes saved to file')
