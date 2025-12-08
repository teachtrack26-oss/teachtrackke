"""
Delete all subjects created from template and allow re-import with full curriculum details
"""
from database import engine
from sqlalchemy import text

def delete_template_subjects():
    print("Deleting subjects created from templates...")
    
    with engine.connect() as conn:
        # Check how many will be deleted
        result = conn.execute(text(
            "SELECT id, subject_name, grade FROM subjects WHERE template_id IS NOT NULL"
        ))
        subjects = result.fetchall()
        
        if not subjects:
            print("No template-based subjects found.")
            return
        
        print(f"\nFound {len(subjects)} subject(s) to delete:")
        for subj in subjects:
            print(f"  - ID {subj[0]}: {subj[1]} {subj[2]}")
        
        # Delete them (CASCADE will handle strands, sub_strands, lessons)
        conn.execute(text("DELETE FROM subjects WHERE template_id IS NOT NULL"))
        conn.commit()
        
        print(f"\n✓ Deleted {len(subjects)} subject(s) successfully!")
        print("\nYou can now re-add subjects from templates with full curriculum details:")
        print("1. Go to http://localhost:3000/curriculum")
        print("2. Click 'Add CBC Curriculum'")
        print("3. Select 'Mathematics Grade 9'")
        print("4. Click 'Add to My Subjects'")
        print("\nAll curriculum details will now be included!")

if __name__ == "__main__":
    delete_template_subjects()
