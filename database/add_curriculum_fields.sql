-- Add additional curriculum fields to sub_strands table
-- These fields store detailed learning information from templates

ALTER TABLE sub_strands 
ADD COLUMN specific_learning_outcomes JSON COMMENT 'Array of specific learning outcomes for this sub-strand';

ALTER TABLE sub_strands 
ADD COLUMN suggested_learning_experiences JSON COMMENT 'Array of suggested learning activities';

ALTER TABLE sub_strands 
ADD COLUMN core_competencies JSON COMMENT 'Array of core competencies to be developed';

ALTER TABLE sub_strands 
ADD COLUMN `values` JSON COMMENT 'Array of values to be developed';

ALTER TABLE sub_strands 
ADD COLUMN pcis JSON COMMENT 'Array of Pertinent and Contemporary Issues (PCIs)';

ALTER TABLE sub_strands 
ADD COLUMN links_to_other_subjects JSON COMMENT 'Array of links to other learning areas';
