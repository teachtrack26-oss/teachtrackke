"""
Prepare all curriculum JSON files for import
- Removes smart quotes
- Converts to snake_case
- Validates structure
"""
import json
import re
import os
import sys

def camel_to_snake(name):
    """Convert camelCase to snake_case"""
    name = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', name).lower()

def convert_keys(obj):
    """Recursively convert all keys"""
    if isinstance(obj, dict):
        return {camel_to_snake(k): convert_keys(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [convert_keys(item) for item in obj]
    else:
        return obj

def prepare_json_file(filepath):
    """Prepare a single JSON file"""
    filename = os.path.basename(filepath)
    print(f"\n{'='*60}")
    print(f"Processing: {filename}")
    print(f"{'='*60}")
    
    try:
        # Read file
        with open(filepath, 'r', encoding='utf-8-sig') as f:
            content = f.read()
        
        # Fix smart quotes
        content = content.replace('\u201c', '"')
        content = content.replace('\u201d', '"')
        content = content.replace('\u2018', "'")
        content = content.replace('\u2019', "'")
        content = content.strip()
        
        # Parse JSON
        data = json.loads(content)
        
        # Convert keys to snake_case
        data = convert_keys(data)
        
        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        # Show stats
        substrands_list = data.get("substrands") or data.get("sub_strands", [])
        total_strands = len(data.get("strands", []))
        total_substrands = sum(
            len(s.get("substrands") or s.get("sub_strands", [])) 
            for s in data.get("strands", [])
        )
        total_lessons = sum(
            ss.get("number_of_lessons", 1) 
            for s in data.get("strands", []) 
            for ss in (s.get("substrands") or s.get("sub_strands", []))
        )
        
        print(f"✅ SUCCESS")
        print(f"   Subject: {data.get('subject')}")
        print(f"   Grade: {data.get('grade')}")
        print(f"   Strands: {total_strands}")
        print(f"   Substrands: {total_substrands}")
        print(f"   Total Lessons: {total_lessons}")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON Error: {e.msg}")
        print(f"   Line {e.lineno}, Column {e.colno}")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

def prepare_directory(directory):
    """Prepare all JSON files in a directory"""
    json_files = [f for f in os.listdir(directory) if f.endswith('.json')]
    
    if not json_files:
        print("No JSON files found")
        return
    
    print(f"\nFound {len(json_files)} JSON files\n")
    
    results = []
    for filename in json_files:
        filepath = os.path.join(directory, filename)
        success = prepare_json_file(filepath)
        results.append((filename, success))
    
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    
    success_count = sum(1 for _, s in results if s)
    failed_count = len(results) - success_count
    
    print(f"✅ Prepared: {success_count}")
    print(f"❌ Failed: {failed_count}")
    
    if failed_count > 0:
        print("\nFailed files:")
        for filename, success in results:
            if not success:
                print(f"  - {filename}")
    
    if success_count > 0:
        print(f"\n🎉 Ready to import! Go to http://localhost:3000/admin/import-curriculum")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        path = sys.argv[1]
        if os.path.isfile(path):
            prepare_json_file(path)
        elif os.path.isdir(path):
            prepare_directory(path)
        else:
            print(f"Path not found: {path}")
    else:
        print("Usage: python prepare_curriculum_files.py <file_or_directory>")
        print("\nExample: python prepare_curriculum_files.py ../G9")
