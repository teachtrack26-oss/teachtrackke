"""
JSON Validator and Fixer for Curriculum Files
Run this to validate and fix your JSON files before uploading
"""
import json
import sys
import os

def validate_json_file(filepath):
    """Validate a JSON file and show detailed errors"""
    print(f"\n{'='*60}")
    print(f"Validating: {os.path.basename(filepath)}")
    print(f"{'='*60}")
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Try to parse JSON
        data = json.loads(content)
        
        # Validate structure
        required_fields = ['subject', 'grade', 'strands']
        missing_fields = [field for field in required_fields if field not in data]
        
        if missing_fields:
            print(f"❌ Missing required fields: {', '.join(missing_fields)}")
            return False
            
        # Check strands
        if not isinstance(data.get('strands'), list):
            print(f"❌ 'strands' must be an array")
            return False
            
        if len(data.get('strands', [])) == 0:
            print(f"⚠️  Warning: No strands found")
            
        # Validate each strand
        for idx, strand in enumerate(data.get('strands', []), 1):
            if 'strand_name' not in strand:
                print(f"❌ Strand {idx} missing 'strand_name'")
                return False
                
            if 'substrands' not in strand or not isinstance(strand['substrands'], list):
                print(f"❌ Strand {idx} missing 'substrands' array")
                return False
        
        print(f"✅ Valid JSON!")
        print(f"   Subject: {data.get('subject')}")
        print(f"   Grade: {data.get('grade')}")
        print(f"   Strands: {len(data.get('strands', []))}")
        
        total_substrands = sum(len(s.get('substrands', [])) for s in data.get('strands', []))
        total_lessons = sum(
            ss.get('number_of_lessons', 0) 
            for s in data.get('strands', []) 
            for ss in s.get('substrands', [])
        )
        print(f"   Substrands: {total_substrands}")
        print(f"   Total Lessons: {total_lessons}")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ JSON Syntax Error:")
        print(f"   Line {e.lineno}, Column {e.colno}")
        print(f"   {e.msg}")
        
        # Show the problematic line
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                if e.lineno <= len(lines):
                    print(f"\n   Problem at line {e.lineno}:")
                    start = max(0, e.lineno - 3)
                    end = min(len(lines), e.lineno + 2)
                    for i in range(start, end):
                        marker = ">>>" if i == e.lineno - 1 else "   "
                        print(f"   {marker} {i+1}: {lines[i].rstrip()}")
        except:
            pass
            
        print("\n💡 Common Issues:")
        print("   1. Missing quotes around property names")
        print("   2. Single quotes instead of double quotes")
        print("   3. Trailing commas in arrays/objects")
        print("   4. Missing commas between items")
        print("   5. Unicode/special characters not escaped")
        
        return False
        
    except Exception as e:
        print(f"❌ Error reading file: {str(e)}")
        return False

def validate_directory(directory):
    """Validate all JSON files in a directory"""
    json_files = [f for f in os.listdir(directory) if f.endswith('.json')]
    
    if not json_files:
        print("No JSON files found in directory")
        return
        
    print(f"\nFound {len(json_files)} JSON files")
    
    results = []
    for filename in json_files:
        filepath = os.path.join(directory, filename)
        is_valid = validate_json_file(filepath)
        results.append((filename, is_valid))
    
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    
    valid_count = sum(1 for _, valid in results if valid)
    invalid_count = len(results) - valid_count
    
    print(f"✅ Valid: {valid_count}")
    print(f"❌ Invalid: {invalid_count}")
    
    if invalid_count > 0:
        print("\nInvalid files:")
        for filename, valid in results:
            if not valid:
                print(f"  - {filename}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        path = sys.argv[1]
        if os.path.isfile(path):
            validate_json_file(path)
        elif os.path.isdir(path):
            validate_directory(path)
        else:
            print(f"Path not found: {path}")
    else:
        # Default: check curiculum directory
        curriculum_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'curiculum')
        if os.path.exists(curriculum_dir):
            validate_directory(curriculum_dir)
        else:
            print("Usage: python validate_json.py <file_or_directory>")
            print("Or place JSON files in ../curiculum/ directory")
