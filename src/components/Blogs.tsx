import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Card } from '@radix-ui/themes';
import { seedBlogs } from '@/lib/seedBlogs';
import BlogNotes from './BlogNotes';
import Articles from './Articles';

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
  const [showingArticles, setShowingArticles] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBlogName, setNewBlogName] = useState('');
  const [newBlogUrl, setNewBlogUrl] = useState('');
  const [addingBlog, setAddingBlog] = useState(false);

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

  const handleAddBlog = async () => {
    if (!newBlogName.trim() || !newBlogUrl.trim()) {
      setError('Please fill in both name and URL');
      return;
    }

    setAddingBlog(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('blogs')
        .insert([{
          name: newBlogName.trim(),
          url: newBlogUrl.trim(),
          user_id: user.id
        }]);

      if (error) throw error;

      // Reset form and refresh blogs
      setNewBlogName('');
      setNewBlogUrl('');
      setShowAddForm(false);
      await fetchBlogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add blog');
    } finally {
      setAddingBlog(false);
    }
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
          <div className="flex gap-2">
            {blogs.length > 0 && (
              <Button onClick={openAllBlogs} variant="soft">
                Open All Blogs
              </Button>
            )}
            <Button 
              onClick={() => setShowAddForm(!showAddForm)} 
              variant="soft"
              color="blue"
            >
              Add Blog
            </Button>
          </div>
        </div>

        {showAddForm && (
          <div className="mb-6 p-4 border border-[#262626] rounded-lg bg-[#1a1a1a]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Blog Name
                </label>
                <input
                  type="text"
                  value={newBlogName}
                  onChange={(e) => setNewBlogName(e.target.value)}
                  placeholder="Enter blog name..."
                  className="w-full bg-[#141414] border border-[#262626] rounded-lg p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Blog URL
                </label>
                <input
                  type="url"
                  value={newBlogUrl}
                  onChange={(e) => setNewBlogUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#141414] border border-[#262626] rounded-lg p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="soft" 
                  color="gray" 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewBlogName('');
                    setNewBlogUrl('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddBlog}
                  disabled={addingBlog || !newBlogName.trim() || !newBlogUrl.trim()}
                >
                  {addingBlog ? 'Adding...' : 'Add Blog'}
                </Button>
              </div>
            </div>
          </div>
        )}

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
                  <div className="flex gap-2">
                    <Button 
                      variant="soft" 
                      onClick={() => {
                        setSelectedBlog(blog);
                        setShowingArticles(false);
                      }}
                    >
                      Take Notes
                    </Button>
                    <Button 
                      variant="soft" 
                      onClick={() => {
                        setSelectedBlog(blog);
                        setShowingArticles(true);
                      }}
                    >
                      View Articles
                    </Button>
                  </div>
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

      {selectedBlog && !showingArticles && (
        <BlogNotes
          blogId={selectedBlog.id}
          blogName={selectedBlog.name}
          onClose={() => setSelectedBlog(null)}
        />
      )}

      {selectedBlog && showingArticles && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#141414] border border-[#262626] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#262626]">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-100">
                  Articles from {selectedBlog.name}
                </h2>
                <Button 
                  variant="soft" 
                  color="gray" 
                  onClick={() => {
                    setSelectedBlog(null);
                    setShowingArticles(false);
                  }}
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="p-6">
              <Articles blogId={selectedBlog.id} blogName={selectedBlog.name} />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 