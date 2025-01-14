import { supabase } from './supabase';

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

export async function seedBlogs() {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('No user found. Please sign in first.');
    return;
  }

  const blogsWithUserId = initialBlogs.map(blog => ({
    ...blog,
    user_id: user.id
  }));

  const { data, error } = await supabase
    .from('blogs')
    .insert(blogsWithUserId)
    .select();

  if (error) {
    console.error('Error seeding blogs:', error);
    return;
  }

  console.log('Successfully added blogs:', data);
  return data;
} 