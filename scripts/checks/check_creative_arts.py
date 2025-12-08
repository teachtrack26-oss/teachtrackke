import mysql.connector
import sys

try:
    db = mysql.connector.connect(
        host='localhost',
        user='root',
        password='2078@lk//K.',
        database='teachtrack'
    )
    cursor = db.cursor(dictionary=True)
    
    # Check Creative Arts templates
    cursor.execute("""
        SELECT * FROM curriculum_templates 
        WHERE subject LIKE '%Creative%' AND grade = 'Grade 6'
    """)
    templates = cursor.fetchall()
    
    if not templates:
        print("No Creative Arts templates found for Grade 6!")
        sys.exit(1)
    
    for template in templates:
        print(f"\nTemplate ID: {template['id']}")
        print(f"Subject: {template['subject']}")
        print(f"Grade: {template['grade']}")
        
        # Count strands
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM template_strands 
            WHERE curriculum_template_id = %s
        """, (template['id'],))
        strands = cursor.fetchone()
        print(f"Strands: {strands['count']}")
        
        # Count sub-strands
        cursor.execute("""
            SELECT COUNT(*) as count 
            FROM template_substrands 
            WHERE strand_id IN (
                SELECT id FROM template_strands WHERE curriculum_template_id = %s
            )
        """, (template['id'],))
        substrands = cursor.fetchone()
        print(f"Sub-strands: {substrands['count']}")
        
        # Sum lessons
        cursor.execute("""
            SELECT SUM(number_of_lessons) as total 
            FROM template_substrands 
            WHERE strand_id IN (
                SELECT id FROM template_strands WHERE curriculum_template_id = %s
            )
        """, (template['id'],))
        lessons = cursor.fetchone()
        print(f"Total lessons: {lessons['total']}")
        
    cursor.close()
    db.close()
    
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
