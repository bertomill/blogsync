-- Create blogs table
CREATE TABLE IF NOT EXISTS blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT,
    last_visited TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create index for faster queries
CREATE INDEX IF NOT EXISTS blogs_user_id_idx ON blogs(user_id);
-- Enable Row Level Security
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;
-- Create policy to allow users to see only their blogs
CREATE POLICY "Users can view their own blogs" ON blogs FOR
SELECT USING (auth.uid() = user_id);
-- Create policy to allow users to insert their own blogs
CREATE POLICY "Users can insert their own blogs" ON blogs FOR
INSERT WITH CHECK (auth.uid() = user_id);
-- Create policy to allow users to update their own blogs
CREATE POLICY "Users can update their own blogs" ON blogs FOR
UPDATE USING (auth.uid() = user_id);
-- Create policy to allow users to delete their own blogs
CREATE POLICY "Users can delete their own blogs" ON blogs FOR DELETE USING (auth.uid() = user_id);