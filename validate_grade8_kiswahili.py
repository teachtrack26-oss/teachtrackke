#!/usr/bin/env python3
"""
Validate Grade 8 Kiswahili curriculum JSON structure 
Uses three-level hierarchy: strands → sub-strands → sub-sub-strands
Usage: python validate_grade8_kiswahili.py <json_file>
"""

import json
import sys
from pathlib import Path

def validate_json(file_path):
    """Validate curriculum JSON structure with three-level hierarchy"""
    
    print(f"[INFO] Validating {file_path}...")
    print()
    
    # Load JSON
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except json.JSONDecodeError as e:
        print(f"[ERROR] Invalid JSON: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Failed to read file: {e}")
        return False
    
    errors = []
    warnings = []
    
    # Check top-level fields
    if 'subject' not in data:
        errors.append("Missing required field: 'subject'")
    else:
        print(f"✓ Subject: {data['subject']}")
    
    if 'grade' not in data:
        errors.append("Missing required field: 'grade'")
    else:
        print(f"✓ Grade: {data['grade']}")
    
    if 'educationLevel' not in data:
        errors.append("Missing required field: 'educationLevel'")
    else:
        print(f"✓ Education Level: {data['educationLevel']}")
    
    if 'strands' not in data:
        errors.append("Missing required field: 'strands'")
        return False
    
    if not isinstance(data['strands'], list):
        errors.append("'strands' must be an array")
        return False
    
    if len(data['strands']) == 0:
        errors.append("'strands' array is empty")
        return False
    
    print(f"✓ Strands: {len(data['strands'])} found")
    print()
    
    # Validate each strand
    total_substrands = 0
    total_subsubstrands = 0
    total_lessons = 0
    
    for i, strand in enumerate(data['strands'], 1):
        print(f"--- Strand {i} ---")
        
        if 'strandNumber' not in strand:
            errors.append(f"Strand {i}: Missing 'strandNumber'")
        else:
            print(f"  Number: {strand['strandNumber']}")
        
        if 'strandName' not in strand:
            errors.append(f"Strand {i}: Missing 'strandName'")
        else:
            print(f"  Name: {strand['strandName']}")
        
        if 'subStrands' not in strand:
            errors.append(f"Strand {i}: Missing 'subStrands'")
            continue
        
        if not isinstance(strand['subStrands'], list):
            errors.append(f"Strand {i}: 'subStrands' must be an array")
            continue
        
        if len(strand['subStrands']) == 0:
            warnings.append(f"Strand {i} ({strand.get('strandName', 'Unknown')}): No sub-strands")
            continue
        
        print(f"  Sub-strands: {len(strand['subStrands'])}")
        total_substrands += len(strand['subStrands'])
        
        # Validate each sub-strand
        strand_lessons = 0
        strand_subsubstrands = 0
        
        for j, substrand in enumerate(strand['subStrands'], 1):
            # Check sub-strand basic fields
            if 'subStrandNumber' not in substrand:
                errors.append(f"Strand {i}, Sub-strand {j}: Missing 'subStrandNumber'")
            
            if 'subStrandName' not in substrand:
                errors.append(f"Strand {i}, Sub-strand {j}: Missing 'subStrandName'")
            
            # Check sub-sub-strands
            if 'subSubStrands' not in substrand:
                errors.append(f"Strand {i}, Sub-strand {j}: Missing 'subSubStrands'")
                continue
            
            if not isinstance(substrand['subSubStrands'], list):
                errors.append(f"Strand {i}, Sub-strand {j}: 'subSubStrands' must be an array")
                continue
            
            # Validate each sub-sub-strand (where the actual content is)
            for k, subsubstrand in enumerate(substrand['subSubStrands'], 1):
                strand_subsubstrands += 1
                
                # Required fields at sub-sub-strand level
                required = [
                    'subSubStrandNumber',
                    'subSubStrandName',
                    'numberOfLessons',
                    'specificLearningOutcomes',
                    'suggestedLearningExperiences',
                    'keyInquiryQuestions',
                    'coreCompetencies',
                    'values',
                    'pcis',
                    'linkToOtherSubjects'
                ]
                
                missing = [field for field in required if field not in subsubstrand]
                if missing:
                    errors.append(f"Strand {i}.{j}.{k}: Missing fields: {', '.join(missing)}")
                    continue
                
                # Check array fields
                array_fields = [
                    'specificLearningOutcomes',
                    'suggestedLearningExperiences',
                    'keyInquiryQuestions',
                    'coreCompetencies',
                    'values',
                    'pcis',
                    'linkToOtherSubjects'
                ]
                
                for field in array_fields:
                    if not isinstance(subsubstrand.get(field), list):
                        errors.append(f"Strand {i}.{j}.{k}: '{field}' must be an array")
                
                # Check number of lessons
                lessons = subsubstrand.get('numberOfLessons', 0)
                if not isinstance(lessons, int) or lessons < 1:
                    errors.append(f"Strand {i}.{j}.{k}: 'numberOfLessons' must be >= 1")
                else:
                    strand_lessons += lessons
                
                # Check for empty arrays (warnings only)
                for field in array_fields:
                    if isinstance(subsubstrand.get(field), list) and len(subsubstrand[field]) == 0:
                        warnings.append(
                            f"Strand {i}.{j}.{k} ({subsubstrand.get('subSubStrandName', '?')}): '{field}' is empty"
                        )
        
        print(f"  Sub-sub-strands: {strand_subsubstrands}")
        print(f"  Total lessons: {strand_lessons}")
        total_subsubstrands += strand_subsubstrands
        total_lessons += strand_lessons
        print()
    
    # Summary
    print("=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    print(f"Subject: {data.get('subject', 'N/A')}")
    print(f"Grade: {data.get('grade', 'N/A')}")
    print(f"Education Level: {data.get('educationLevel', 'N/A')}")
    print(f"Total Strands: {len(data['strands'])}")
    print(f"Total Sub-strands: {total_substrands}")
    print(f"Total Sub-sub-strands: {total_subsubstrands}")
    print(f"Total Lessons: {total_lessons}")
    print()
    
    # Report errors
    if errors:
        print(f"[ERROR] {len(errors)} errors found:")
        for error in errors[:10]:  # Show first 10
            print(f"  ✗ {error}")
        if len(errors) > 10:
            print(f"  ... and {len(errors) - 10} more errors")
        print()
        return False
    else:
        print("[SUCCESS] No errors found! ✓")
        print()
    
    # Report warnings
    if warnings:
        print(f"[WARNING] {len(warnings)} warnings (optional checks):")
        for warning in warnings[:5]:  # Show first 5
            print(f"  ⚠ {warning}")
        if len(warnings) > 5:
            print(f"  ... and {len(warnings) - 5} more warnings")
        print()
        print("Note: Warnings don't prevent import, but may indicate areas to review.")
        print()
    
    # Final message
    if not errors:
        print("[INFO] This file is ready to import!")
        print(f"[INFO] Expected structure: 15 strands × 4 sub-strands × 1 sub-sub-strand = 60 lessons")
        print(f"[INFO] Actual: {len(data['strands'])} strands, {total_substrands} sub-strands, {total_subsubstrands} sub-sub-strands, {total_lessons} lessons")
        return True
    
    return False


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python validate_grade8_kiswahili.py <json_file>")
        print("Example: python validate_grade8_kiswahili.py 'G8/grade 8 kiswahili.json'")
        sys.exit(1)
    
    json_file = sys.argv[1]
    
    if not Path(json_file).exists():
        print(f"[ERROR] File not found: {json_file}")
        sys.exit(1)
    
    success = validate_json(json_file)
    sys.exit(0 if success else 1)