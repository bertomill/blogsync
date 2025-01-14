-- Add is_read column to articles table
ALTER TABLE articles
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;
-- Create index for better performance when querying by read status
CREATE INDEX IF NOT EXISTS articles_is_read_idx ON articles(is_read);
-- Update RLS policies to allow users to update read status of their own articles
CREATE POLICY "Users can update read status of their own articles" ON articles FOR
UPDATE USING (auth.uid() = user_id);