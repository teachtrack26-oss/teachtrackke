"""
Helper script to mark lessons as complete for testing
"""
import requests
import sys

def mark_lessons_complete(token, subject_id, num_lessons=5):
    """Mark first N lessons of a subject as complete"""
    
    base_url = "http://localhost:8000/api/v1"
    headers = {"Authorization": f"Bearer {token}"}
    
    # Get all lessons for the subject
    print(f"\nFetching lessons for subject {subject_id}...")
    response = requests.get(
        f"{base_url}/subjects/{subject_id}/lessons",
        headers=headers
    )
    
    if response.status_code != 200:
        print(f"❌ Error fetching lessons: {response.text}")
        return
    
    data = response.json()
    lessons = data['lessons']
    
    print(f"✓ Found {len(lessons)} total lessons")
    print(f"\nMarking first {num_lessons} lessons as complete...\n")
    
    completed_count = 0
    for i, lesson in enumerate(lessons[:num_lessons]):
        lesson_id = lesson['id']
        lesson_title = lesson['lesson_title']
        
        # Skip if already completed
        if lesson['is_completed']:
            print(f"  ⏭  Lesson {lesson_id}: {lesson_title} (already complete)")
            continue
        
        # Mark as complete
        response = requests.post(
            f"{base_url}/lessons/{lesson_id}/complete",
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            print(f"  ✓ Lesson {lesson_id}: {lesson_title}")
            print(f"     Subject progress: {result['subject_progress']:.1f}%")
            completed_count += 1
        else:
            print(f"  ❌ Failed to mark lesson {lesson_id}: {response.text}")
    
    print(f"\n✓ Marked {completed_count} new lessons as complete!")
    print(f"\nView progress at: http://localhost:3000/curriculum/tracking")

if __name__ == "__main__":
    print("=== Curriculum Tracking - Mark Lessons Complete ===\n")
    
    if len(sys.argv) < 3:
        print("Usage: python mark_lessons.py <access_token> <subject_id> [num_lessons]")
        print("\nExample:")
        print('  python mark_lessons.py "eyJhbGc..." 24 10')
        print("\nTo get your access token:")
        print("1. Login at http://localhost:3000/login")
        print("2. Open browser console (F12)")
        print("3. Run: localStorage.getItem('accessToken')")
        sys.exit(1)
    
    token = sys.argv[1]
    subject_id = int(sys.argv[2])
    num_lessons = int(sys.argv[3]) if len(sys.argv) > 3 else 5
    
    mark_lessons_complete(token, subject_id, num_lessons)
