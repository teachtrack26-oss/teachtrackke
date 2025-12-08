
import json
import os
import glob

def check_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        subject = data.get('subject') or data.get('subjectName')
        strands = data.get('strands', [])
        total_sub_strands = sum(len(s.get('subStrands', [])) for s in strands)
        
        # Check first sub-strand of first strand (sampling)
        status = "Complete"
        missing_fields = []
        
        if strands and strands[0].get('subStrands'):
            ss = strands[0]['subStrands'][0]
            required = ['numberOfLessons', 'coreCompetencies', 'values', 'pcis', 'linkToOtherSubjects']
            missing = [r for r in required if r not in ss]
            if missing:
                status = "Missing Metadata"
                missing_fields = missing
        elif not strands:
            status = "No Strands"
        
        return {
            "file": os.path.basename(file_path),
            "subject": subject,
            "strands": len(strands),
            "sub_strands": total_sub_strands,
            "status": status,
            "missing": missing_fields
        }
    except Exception as e:
        return {"file": os.path.basename(file_path), "status": f"Error: {e}"}

def main():
    folder = r"data/curriculum/G3"
    files = glob.glob(os.path.join(folder, "*.json"))
    
    print(f"Status Report for Grade 3:")
    print("-" * 50)
    for file_path in files:
        res = check_file(file_path)
        subject = res.get('subject', 'Unknown')
        status = res['status']
        print(f"• {subject}: {status}")

if __name__ == "__main__":
    main()
