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
            
            # Import substrands (accept multiple naming conventions)
            substrands_list = strand_data.get("substrands") or strand_data.get("sub_strands") or strand_data.get("subStrands", [])
            for substrand_order, substrand_data in enumerate(substrands_list, start=1):
                # Check if this substrand has sub-sub-strands (Kiswahili structure)
                # Handle both camelCase and snake_case
                sub_sub_strands_list = substrand_data.get("subSubStrands") or substrand_data.get("sub_sub_strands", [])
                
                if sub_sub_strands_list:
                    # For each sub-sub-strand, create a separate substrand entry
                    # This flattens the 3-level structure into 2 levels for database
                    for sub_sub_order, sub_sub_data in enumerate(sub_sub_strands_list, start=1):
                        substrand = TemplateSubstrand(
                            strand_id=strand.id,
                            substrand_number=sub_sub_data.get("sub_sub_strand_number") or sub_sub_data.get("subSubStrandNumber", f"{strand_order}.{substrand_order}.{sub_sub_order}"),
                            substrand_name=sub_sub_data.get("sub_sub_strand_name") or sub_sub_data.get("subSubStrandName", ""),
                            number_of_lessons=sub_sub_data.get("number_of_lessons") or sub_sub_data.get("numberOfLessons", 1),
                            specific_learning_outcomes=sub_sub_data.get("specific_learning_outcomes") or sub_sub_data.get("specificLearningOutcomes", []),
                            suggested_learning_experiences=sub_sub_data.get("suggested_learning_experiences") or sub_sub_data.get("suggestedLearningExperiences", []),
                            key_inquiry_questions=sub_sub_data.get("key_inquiry_questions") or sub_sub_data.get("keyInquiryQuestions", []),
                            core_competencies=sub_sub_data.get("core_competencies") or sub_sub_data.get("coreCompetencies", []),
                            values=sub_sub_data.get("values", []),
                            pcis=sub_sub_data.get("pcis", []),
                            links_to_other_subjects=sub_sub_data.get("links_to_other_subjects") or sub_sub_data.get("linkToOtherSubjects", []),
                            sequence_order=substrand_order * 100 + sub_sub_order  # Maintain order
                        )
                        db.add(substrand)
                else:
                    # Regular 2-level structure (like Mathematics, Science, etc.)
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
        
        # Count totals (handle both 2-level and 3-level formats)
        total_strands = len(json_data.get("strands", []))
        total_substrands = 0
        total_lessons = 0
        
        for strand in json_data.get("strands", []):
            substrands_list = strand.get("substrands") or strand.get("sub_strands", [])
            for substrand in substrands_list:
                # Handle both camelCase and snake_case
                sub_sub_strands = substrand.get("sub_sub_strands") or substrand.get("subSubStrands", [])
                if sub_sub_strands:
                    # 3-level structure: count sub-sub-strands
                    total_substrands += len(sub_sub_strands)
                    total_lessons += sum(
                        sss.get("number_of_lessons") or sss.get("numberOfLessons", 1) 
                        for sss in sub_sub_strands
                    )
                else:
                    # 2-level structure: count regular substrands
                    total_substrands += 1
                    total_lessons += substrand.get("number_of_lessons", 1)
        
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
