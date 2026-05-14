-- Add competence columns to teachers table
ALTER TABLE teachers ADD COLUMN specific_competences TEXT;
ALTER TABLE teachers ADD COLUMN general_competences TEXT;
ALTER TABLE teachers ADD COLUMN complementary_competences TEXT;
