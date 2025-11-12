"""
Convert curriculum JSON from camelCase to snake_case
"""
import json
import re

def camel_to_snake(name):
    """Convert camelCase to snake_case"""
    name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()

def convert_keys(obj):
    """Recursively convert all keys in dict/list from camelCase to snake_case"""
    if isinstance(obj, dict):
        return {camel_to_snake(k): convert_keys(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_keys(item) for item in obj]
    else:
        return obj

def convert_file(input_path, output_path=None):
    """Convert JSON file from camelCase to snake_case"""
    if output_path is None:
        output_path = input_path
    
    try:
        with open(input_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Convert keys
        converted = convert_keys(data)
        
        # Write back
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(converted, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Converted: {input_path}")
        print(f"   Subject: {converted.get('subject')}")
        print(f"   Grade: {converted.get('grade')}")
        print(f"   Strands: {len(converted.get('strands', []))}")
        
        return True
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == "__main__":
    import sys
    import os
    
    if len(sys.argv) > 1:
        path = sys.argv[1]
        if os.path.isfile(path):
            convert_file(path)
        elif os.path.isdir(path):
            json_files = [f for f in os.listdir(path) if f.endswith('.json')]
            for filename in json_files:
                filepath = os.path.join(path, filename)
                convert_file(filepath)
                print()
        else:
            print(f"Path not found: {path}")
    else:
        print("Usage: python convert_to_snake_case.py <file_or_directory>")
