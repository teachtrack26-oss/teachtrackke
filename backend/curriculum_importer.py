"""
Curriculum Importer - Import curriculum JSON files into database
"""
import json
from sqlalchemy.orm import Session
from models import CurriculumTemplate, TemplateStrand, TemplateSubstrand
from database import SessionLocal

def import_curriculum_from_json(json_data: dict, db: Session):
    """
    Import curriculum data from JSON into database
    
    Expected JSON structure:
    {
        "subject": "Mathematics",
        "grade": "Grade 9",
        "education_level": "Junior Secondary",
        "strands": [
            {
                "strand_number": "1",
                "strand_name": "Numbers",
                "substrands": [
                    {
                        "substrand_number": "1.1",
                        "substrand_name": "Integers",
                        "number_of_lessons": 10,
                        "specific_learning_outcomes": [...],
                        ...
                    }
                ]
            }
        ]
    }
    """
    
    try:
        # Check if curriculum already exists
        existing = db.query(CurriculumTemplate).filter(
            CurriculumTemplate.subject == json_data["subject"],
            CurriculumTemplate.grade == json_data["grade"]
        ).first()
        
        if existing:
            return {
                "success": False,
                "message": f"Curriculum for {json_data['subject']} {json_data['grade']} already exists",
                "curriculum_id": existing.id
            }
        
        # Create curriculum template
        curriculum = CurriculumTemplate(
            subject=json_data["subject"],
            grade=json_data["grade"],
            education_level=json_data.get("education_level", "Junior Secondary"),
            is_active=True
        )
        db.add(curriculum)
        db.flush()  # Get the ID
        
        # Import strands
        for strand_order, strand_data in enumerate(json_data.get("strands", []), start=1):
            strand = TemplateStrand(
                curriculum_template_id=curriculum.id,
                strand_number=strand_data.get("strand_number", str(strand_order)),
                strand_name=strand_data["strand_name"],
                sequence_order=strand_order
            )
            db.add(strand)
            db.flush()
            
            # Import substrands (accept both 'substrands' and 'sub_strands')
            substrands_list = strand_data.get("substrands") or strand_data.get("sub_strands", [])
            for substrand_order, substrand_data in enumerate(substrands_list, start=1):
                # Handle both snake_case and with underscores
                substrand = TemplateSubstrand(
                    strand_id=strand.id,
                    substrand_number=substrand_data.get("substrand_number") or substrand_data.get("sub_strand_number", f"{strand_order}.{substrand_order}"),
                    substrand_name=substrand_data.get("substrand_name") or substrand_data.get("sub_strand_name"),
                    number_of_lessons=substrand_data.get("number_of_lessons", 1),
                    specific_learning_outcomes=substrand_data.get("specific_learning_outcomes", []),
                    suggested_learning_experiences=substrand_data.get("suggested_learning_experiences", []),
                    key_inquiry_questions=substrand_data.get("key_inquiry_questions", []),
                    core_competencies=substrand_data.get("core_competencies", []),
                    values=substrand_data.get("values", []),
                    pcis=substrand_data.get("pcis", []),
                    links_to_other_subjects=substrand_data.get("links_to_other_subjects", []),
                    sequence_order=substrand_order
                )
                db.add(substrand)
        
        db.commit()
        
        # Count totals (handle both formats)
        total_strands = len(json_data.get("strands", []))
        total_substrands = sum(
            len(s.get("substrands") or s.get("sub_strands", [])) 
            for s in json_data.get("strands", [])
        )
        total_lessons = sum(
            ss.get("number_of_lessons", 1) 
            for s in json_data.get("strands", []) 
            for ss in (s.get("substrands") or s.get("sub_strands", []))
        )
        
        return {
            "success": True,
            "message": f"Successfully imported {json_data['subject']} {json_data['grade']}",
            "curriculum_id": curriculum.id,
            "stats": {
                "strands": total_strands,
                "substrands": total_substrands,
                "lessons": total_lessons
            }
        }
        
    except Exception as e:
        db.rollback()
        return {
            "success": False,
            "message": f"Error importing curriculum: {str(e)}",
            "error": str(e)
        }

def import_from_file(file_path: str, db: Session):
    """Import curriculum from a JSON file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            json_data = json.load(f)
        return import_curriculum_from_json(json_data, db)
    except Exception as e:
        return {
            "success": False,
            "message": f"Error reading file: {str(e)}",
            "error": str(e)
        }

def get_imported_curricula(db: Session):
    """Get list of all imported curricula"""
    curricula = db.query(CurriculumTemplate).all()
    return [
        {
            "id": c.id,
            "subject": c.subject,
            "grade": c.grade,
            "education_level": c.education_level,
            "is_active": c.is_active,
            "created_at": c.created_at.isoformat() if c.created_at else None
        }
        for c in curricula
    ]
