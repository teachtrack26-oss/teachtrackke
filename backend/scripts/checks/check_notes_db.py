"""
Check what file types are stored in the notes table
"""
from database import get_db
from models import Note

def check_notes():
    db = next(get_db())
    
    # Get all notes
    notes = db.query(Note).all()
    
    print(f"\n{'='*100}")
    print(f"Total Notes in Database: {len(notes)}")
    print(f"{'='*100}\n")
    
    if not notes:
        print("No notes found in database!")
        return
    
    print(f"{'ID':<5} | {'Title':<35} | {'File Type':<10} | {'File URL (last 60 chars)'}")
    print(f"{'-'*100}")
    
    for note in notes:
        url_suffix = note.file_url[-60:] if note.file_url else 'None'
        title_short = note.title[:35] if note.title else 'Untitled'
        file_type = note.file_type if note.file_type else 'NULL'
        
        print(f"{note.id:<5} | {title_short:<35} | {file_type:<10} | ...{url_suffix}")
    
    print(f"\n{'='*100}")
    print("File Type Summary:")
    print(f"{'='*100}")
    
    # Count file types
    file_type_counts = {}
    for note in notes:
        ft = note.file_type if note.file_type else 'NULL'
        file_type_counts[ft] = file_type_counts.get(ft, 0) + 1
    
    for ft, count in sorted(file_type_counts.items()):
        print(f"  {ft}: {count} files")
    
    print()

if __name__ == "__main__":
    check_notes()
