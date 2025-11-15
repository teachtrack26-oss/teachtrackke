-- Migration: Make subject_id nullable in notes table
-- This allows users to upload notes without associating them to a specific subject

ALTER TABLE notes 
MODIFY COLUMN subject_id INT NULL;

-- Update foreign key constraint to allow NULL and SET NULL on delete
ALTER TABLE notes
DROP FOREIGN KEY notes_ibfk_2;

ALTER TABLE notes
ADD CONSTRAINT notes_ibfk_2 
FOREIGN KEY (subject_id) 
REFERENCES subjects(id) 
ON DELETE SET NULL;

-- Add comment to document the change
ALTER TABLE notes 
MODIFY COLUMN subject_id INT NULL 
COMMENT 'Optional: Subject this note belongs to';
