"""
Fix JSON encoding issues (BOM, invisible characters, etc.)
"""
import json
import os
import sys

def fix_json_file(input_path, output_path=None):
    """Fix JSON file by removing BOM and re-encoding properly"""
    
    if output_path is None:
        output_path = input_path
    
    try:
        # Read with UTF-8-sig to remove BOM
        with open(input_path, 'r', encoding='utf-8-sig') as f:
            content = f.read()
        
        # Strip any leading/trailing whitespace and invisible characters
        content = content.strip()
        
        # Parse to validate
        data = json.loads(content)
        
        # Write back cleanly
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Fixed: {os.path.basename(input_path)}")
        print(f"   Subject: {data.get('subject')}")
        print(f"   Grade: {data.get('grade')}")
        print(f"   Strands: {len(data.get('strands', []))}")
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Still invalid after fix: {e.msg}")
        print(f"   Line {e.lineno}, Column {e.colno}")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def fix_directory(directory):
    """Fix all JSON files in a directory"""
    json_files = [f for f in os.listdir(directory) if f.endswith('.json')]
    
    if not json_files:
        print("No JSON files found")
        return
    
    print(f"Found {len(json_files)} JSON files\n")
    
    for filename in json_files:
        filepath = os.path.join(directory, filename)
        fix_json_file(filepath)
        print()

if __name__ == "__main__":
    if len(sys.argv) > 1:
        path = sys.argv[1]
        if os.path.isfile(path):
            fix_json_file(path)
        elif os.path.isdir(path):
            fix_directory(path)
        else:
            print(f"Path not found: {path}")
    else:
        print("Usage: python fix_json.py <file_or_directory>")
