import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Card } from '@radix-ui/themes';
import { seedBlogs } from '@/lib/seedBlogs';
import BlogNotes from './BlogNotes';

interface Blog {
  id: string;
  name: string;
  url: string;
  last_visited: string | null;
}

export default function Blogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('name');

      if (error) throw error;
      setBlogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSeedBlogs = async () => {
    setSeeding(true);
    try {
      await seedBlogs();
      await fetchBlogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed blogs');
    } finally {
      setSeeding(false);
    }
  };

  const handleVisit = async (blog: Blog) => {
    // Open the blog in a new tab
    window.open(blog.url, '_blank');

    // Update the last_visited timestamp
    const { error } = await supabase
      .from('blogs')
      .update({ last_visited: new Date().toISOString() })
      .eq('id', blog.id);

    if (error) {
      console.error('Error updating last visited:', error);
      return;
    }

    // Update the local state
    setBlogs(blogs.map(b => 
      b.id === blog.id 
        ? { ...b, last_visited: new Date().toISOString() } 
        : b
    ));
  };

  const openAllBlogs = () => {
    // Update all blogs' last_visited timestamps
    blogs.forEach(blog => handleVisit(blog));
  };

  const formatDate = (date: string | null) => {
    if (!date) return 'Never';
    const visitDate = new Date(date);
    const now = new Date();
    
    // If visited today
    if (visitDate.toDateString() === now.toDateString()) {
      return `Today at ${visitDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit'
      })}`;
    }
    
    // If visited yesterday
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (visitDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise show the date
    return visitDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isVisitedToday = (date: string | null) => {
    if (!date) return false;
    const visitDate = new Date(date);
    const now = new Date();
    return visitDate.toDateString() === now.toDateString();
  };

  if (loading) return (
    <div className="text-gray-300 text-center mt-8">
      Loading blogs...
    </div>
  );
  
  if (error) return (
    <div className="text-red-400 text-center mt-8">
      Error: {error}
    </div>
  );

  return (
    <>
      <Card className="mt-6 max-w-4xl mx-auto p-6 bg-[#141414] border border-[#262626]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-100">My AI Blogs</h2>
          {blogs.length > 0 && (
            <Button onClick={openAllBlogs} variant="soft">
              Open All Blogs
            </Button>
          )}
        </div>

        <div className="grid gap-4">
          {blogs.map((blog) => (
            <div
              key={blog.id}
              className={`p-4 border rounded-lg transition-colors ${
                isVisitedToday(blog.last_visited)
                  ? 'border-blue-500/30 bg-[#1a1f2c] hover:bg-[#1e2436]'
                  : 'border-[#262626] bg-[#1a1a1a] hover:bg-[#202020]'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <a
                    href={blog.url}
                    onClick={(e) => {
                      e.preventDefault();
                      handleVisit(blog);
                    }}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-medium text-gray-100 hover:text-blue-400 transition-colors"
                  >
                    {blog.name}
                  </a>
                  {isVisitedToday(blog.last_visited) && (
                    <span className="px-2 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded-full">
                      Visited today
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    Last visited: {formatDate(blog.last_visited)}
                  </span>
                  <Button 
                    variant="soft" 
                    color="blue"
                    onClick={() => setSelectedBlog(blog)}
                  >
                    Take Notes
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {blogs.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No blogs added yet.</p>
              <Button 
                onClick={handleSeedBlogs} 
                disabled={seeding}
                variant="soft"
                color="blue"
              >
                {seeding ? 'Adding Blogs...' : 'Add AI Blogs Collection'}
              </Button>
            </div>
          )}
        </div>
      </Card>

      {selectedBlog && (
        <BlogNotes
          blogId={selectedBlog.id}
          blogName={selectedBlog.name}
          onClose={() => setSelectedBlog(null)}
        />
      )}
    </>
  );
} 