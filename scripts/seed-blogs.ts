import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const initialBlogs = [
  { name: 'OpenAI News', url: 'https://openai.com/news/' },
  { name: 'LangChain Blog', url: 'https://blog.langchain.dev/' },
  { name: 'DeepMind Blog', url: 'https://deepmind.google/discover/blog/' },
  { name: 'Meta AI Blog', url: 'https://ai.meta.com/blog/' },
  { name: 'NVIDIA Blog', url: 'https://blogs.nvidia.com/' },
  { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog' },
  { name: 'Cohere Blog', url: 'https://cohere.com/blog' },
  { name: 'Microsoft AI Blog', url: 'https://www.microsoft.com/en-us/ai/blog/' },
  { name: 'Anthropic News', url: 'https://www.anthropic.com/news' },
  { name: 'Frame AI Blog', url: 'https://frame.ai/blog/' },
  { name: 'Moveworks Blog', url: 'https://www.moveworks.com/us/en/resources/blog' },
  { name: 'Databricks Blog', url: 'https://www.databricks.com/blog' },
  { name: 'Codeium Blog', url: 'https://codeium.com/blog' },
  { name: 'Play.ht Blog', url: 'https://play.ht/blog/' },
  { name: 'MindsDB Blog', url: 'https://mindsdb.com/blog' },
  { name: 'Shield AI Blog', url: 'https://shield.ai/blog/' },
  { name: 'Dataiku Blog', url: 'https://blog.dataiku.com/' },
  { name: 'Groq Blog', url: 'https://groq.com/blog/' },
  { name: 'Grammarly Blog', url: 'https://www.grammarly.com/blog/' },
  { name: 'AlphaSense Blog', url: 'https://www.alpha-sense.com/blog/' },
  { name: 'Scale AI Blog', url: 'https://scale.com/blog' },
  { name: 'Sequoia Stories', url: 'https://www.sequoiacap.com/stories/?_story-category=perspective' }
];

async function seedBlogs(userId: string) {
  const blogsWithUserId = initialBlogs.map(blog => ({
    ...blog,
    user_id: userId
  }));

  const { data, error } = await supabase
    .from('blogs')
    .insert(blogsWithUserId)
    .select();

  if (error) {
    console.error('Error seeding blogs:', error);
    return;
  }

  console.log('Successfully seeded blogs:', data);
}

// To use this script:
// 1. Set your NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
// 2. Replace USER_ID with your actual user ID
// 3. Run with: npx ts-node scripts/seed-blogs.ts
// Example: seedBlogs('your-user-id-here'); 