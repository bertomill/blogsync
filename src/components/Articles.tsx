import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@radix-ui/themes';
import { TrashIcon } from '@radix-ui/react-icons';

interface Article {
  id: string;
  blog_id: string;
  title: string;
  url: string;
  author: string | null;
  date_published: string | null;
  date_read: string | null;
  is_read: boolean;
  created_at: string;
}

interface ArticlesProps {
  blogId: string;
  blogName: string;
}

export default function Articles({ blogId, blogName }: ArticlesProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, [blogId]);

  const fetchArticles = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setArticles(data || []);
    } catch (err) {
      console.error('Error fetching articles:', err);
      setError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  const toggleReadStatus = async (articleId: string, currentStatus: boolean) => {
    try {
      const { error: updateError } = await supabase
        .from('articles')
        .update({ 
          is_read: !currentStatus,
          date_read: !currentStatus ? new Date().toISOString() : null 
        })
        .eq('id', articleId);

      if (updateError) throw updateError;

      // Update local state
      setArticles(articles.map(article => 
        article.id === articleId 
          ? { 
              ...article, 
              is_read: !currentStatus,
              date_read: !currentStatus ? new Date().toISOString() : null
            }
          : article
      ));
    } catch (err) {
      console.error('Error updating article status:', err);
      setError('Failed to update article status');
    }
  };

  const deleteArticle = async (articleId: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .eq('id', articleId);

      if (deleteError) throw deleteError;

      // Update local state
      setArticles(articles.filter(article => article.id !== articleId));
    } catch (err) {
      console.error('Error deleting article:', err);
      setError('Failed to delete article');
    }
  };

  if (loading) return <div className="text-gray-500">Loading articles...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (articles.length === 0) return <div className="text-gray-500">No articles found</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-100">
          Articles from {blogName}
        </h2>
        <div className="text-sm text-gray-500">
          {articles.filter(a => a.is_read).length} of {articles.length} read
        </div>
      </div>

      <div className="space-y-2">
        {articles.map((article) => (
          <div
            key={article.id}
            className="flex items-center justify-between p-4 bg-[#1a1a1a] border border-[#262626] rounded-lg"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div 
                  className={`w-2 h-2 rounded-full ${
                    article.is_read ? 'bg-green-500' : 'bg-blue-500'
                  }`} 
                />
                <div className="flex-1 min-w-0">
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-100 hover:text-blue-400 truncate block"
                  >
                    {article.title}
                  </a>
                  <div className="text-xs text-gray-500 mt-1">
                    {article.author && (
                      <span className="mr-3">By {article.author}</span>
                    )}
                    {article.date_published && (
                      <span className="mr-3">
                        Published: {new Date(article.date_published).toLocaleDateString()}
                      </span>
                    )}
                    {article.date_read && (
                      <span className="text-green-500">
                        Read on {new Date(article.date_read).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="soft"
                color={article.is_read ? 'gray' : 'blue'}
                onClick={() => toggleReadStatus(article.id, article.is_read)}
                className="whitespace-nowrap"
              >
                {article.is_read ? 'Mark Unread' : 'Mark Read'}
              </Button>
              <Button
                variant="soft"
                color="red"
                onClick={() => deleteArticle(article.id)}
                className="px-2"
              >
                <TrashIcon />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 