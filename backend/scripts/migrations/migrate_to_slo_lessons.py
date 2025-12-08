"""
Migration script to convert existing lessons to SLO-based lessons

This script will:
1. Find all SubStrands with specific_learning_outcomes
2. Delete existing generic lessons
3. Create new lessons - one per SLO
4. Update lesson counts
"""

from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Subject, Strand, SubStrand, Lesson
import json

def migrate_subject_to_slo_lessons(db: Session, subject_id: int):
    """Migrate a single subject to SLO-based lessons"""
    
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        print(f"Subject {subject_id} not found")
        return
    
    print(f"\n{'='*80}")
    print(f"Migrating: {subject.subject_name} - Grade {subject.grade}")
    print(f"{'='*80}")
    
    total_old_lessons = 0
    total_new_lessons = 0
    
    # Process each strand
    for strand in subject.strands:
        print(f"\nStrand: {strand.strand_name}")
        
        for substrand in strand.sub_strands:
            slos = substrand.specific_learning_outcomes or []
            
            if not slos or len(slos) == 0:
                print(f"  ⚠ SubStrand '{substrand.substrand_name}' has no SLOs, skipping...")
                continue
            
            # Count existing lessons
            existing_lessons = db.query(Lesson).filter(
                Lesson.substrand_id == substrand.id
            ).all()
            old_count = len(existing_lessons)
            total_old_lessons += old_count
            
            # Delete existing lessons
            for lesson in existing_lessons:
                db.delete(lesson)
            
            print(f"  SubStrand: {substrand.substrand_name}")
            print(f"    ✗ Deleted {old_count} old lessons")
            
            # Create new lessons - one per SLO
            for slo_idx, slo_text in enumerate(slos, start=1):
                lesson = Lesson(
                    substrand_id=substrand.id,
                    lesson_number=slo_idx,
                    lesson_title=slo_text.strip(),
                    learning_outcomes=slo_text.strip(),
                    sequence_order=slo_idx,
                    is_completed=False
                )
                db.add(lesson)
                total_new_lessons += 1
            
            # Update substrand lesson count
            substrand.lessons_count = len(slos)
            
            print(f"    ✓ Created {len(slos)} SLO-based lessons")
    
    # Update subject totals
    subject.total_lessons = total_new_lessons
    subject.lessons_completed = 0  # Reset progress
    subject.progress_percentage = 0.0
    
    db.commit()
    
    print(f"\n{'='*80}")
    print(f"Migration Complete!")
    print(f"  Old lessons: {total_old_lessons}")
    print(f"  New lessons: {total_new_lessons}")
    print(f"  Difference: {total_new_lessons - total_old_lessons:+d}")
    print(f"{'='*80}\n")


def migrate_all_subjects(db: Session):
    """Migrate all subjects to SLO-based lessons"""
    subjects = db.query(Subject).all()
    
    print(f"\n{'='*80}")
    print(f"Found {len(subjects)} subjects to migrate")
    print(f"{'='*80}")
    
    for subject in subjects:
        try:
            migrate_subject_to_slo_lessons(db, subject.id)
        except Exception as e:
            print(f"ERROR migrating subject {subject.id}: {str(e)}")
            db.rollback()


def main():
    """Main entry point"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*80)
        print("SLO-BASED LESSONS MIGRATION")
        print("="*80)
        print("\nThis will convert all existing lessons to be based on Specific")
        print("Learning Outcomes (SLOs). Each SLO becomes its own trackable lesson.")
        print("\nWARNING: This will reset lesson completion progress!")
        
        choice = input("\nProceed? (yes/no): ").strip().lower()
        
        if choice == 'yes':
            migrate_all_subjects(db)
            print("\n✓ Migration completed successfully!")
        else:
            print("\n✗ Migration cancelled")
    
    except Exception as e:
        print(f"\nERROR: {str(e)}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
