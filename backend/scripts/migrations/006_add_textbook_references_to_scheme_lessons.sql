-- Add textbook reference fields to scheme_lessons table
ALTER TABLE scheme_lessons 
ADD COLUMN textbook_name VARCHAR(500),
ADD COLUMN textbook_teacher_guide_pages VARCHAR(100),
ADD COLUMN textbook_learner_book_pages VARCHAR(100);
