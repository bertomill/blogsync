-- Add reading_status enum type
CREATE TYPE reading_status AS ENUM ('not_started', 'in_progress', 'completed');
-- Add reading_status column to articles table
ALTER TABLE articles
ADD COLUMN reading_status reading_status DEFAULT 'not_started';
-- Add progress_updated_at column to track when the progress was last updated
ALTER TABLE articles
ADD COLUMN progress_updated_at TIMESTAMP WITH TIME ZONE;