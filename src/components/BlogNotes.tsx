import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Select } from '@radix-ui/themes';

interface Note {
  id: string;
  blog_id: string;
  article_id: string | null;
  article_title: string | null;
  article_url: string | null;
  excerpt: string;
  personal_note: string;
  created_at: string;
}

interface BlogNotesProps {
  blogId: string;
  blogName: string;
  onClose: () => void;
}

interface GroupedNotes {
  [articleId: string]: {
    article_title: string | null;
    article_url: string | null;
    notes: Note[];
  };
}

type SortOption = 'newest' | 'oldest' | 'article';
type FilterOption = 'all' | 'with-article' | 'without-article';

export default function BlogNotes({ blogId, blogName, onClose }: BlogNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [excerpt, setExcerpt] = useState('');
  const [personalNote, setPersonalNote] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [articleUrl, setArticleUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [currentArticleId, setCurrentArticleId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reset all state when modal is closed
  const handleClose = () => {
    setExcerpt('');
    setPersonalNote('');
    setArticleTitle('');
    setArticleUrl('');
    setCurrentArticleId(null);
    onClose();
  };

  // Handle article info changes
  const handleArticleInfoChange = () => {
    // Reset article ID when article info changes
    setCurrentArticleId(null);
  };

  const fetchNotes = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('notes')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setNotes(data || []);
    } catch (err) {
      console.error('Error fetching notes:', err);
    }
  }, [blogId]);

  useEffect(() => {
    const fetchAndSetNotes = async () => {
      await fetchNotes();
    };
    fetchAndSetNotes();
  }, [blogId, fetchNotes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      // Only create article if we don't have one or if article info changed
      let articleId = currentArticleId;
      if (!articleId && articleUrl && articleTitle) {
        console.log('Creating new article...');
        const { data: articleData, error: articleError } = await supabase
          .from('articles')
          .insert({
            blog_id: blogId,
            user_id: user.id,
            title: articleTitle,
            url: articleUrl,
          })
          .select()
          .single();

        if (articleError) {
          console.error('Article creation error details:', {
            error: articleError,
            code: articleError.code,
            message: articleError.message,
            details: articleError.details,
            hint: articleError.hint
          });
          throw new Error(`Failed to create article: ${articleError.message}`);
        }
        
        if (!articleData) {
          throw new Error('No article data returned after creation');
        }

        console.log('Article created successfully:', articleData);
        articleId = articleData.id;
        setCurrentArticleId(articleId);
      }

      // Create the note
      const newNoteData = {
        blog_id: blogId,
        user_id: user.id,
        article_id: articleId,
        article_title: articleTitle || null,
        article_url: articleUrl || null,
        excerpt,
        personal_note: personalNote,
      };

      const { data: createdNote, error: insertError } = await supabase
        .from('notes')
        .insert(newNoteData)
        .select()
        .single();

      if (insertError) {
        console.error('Note creation error details:', {
          error: insertError,
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint
        });
        throw new Error(`Failed to create note: ${insertError.message}`);
      }

      if (!createdNote) {
        throw new Error('No note data returned after creation');
      }

      console.log('Note created successfully:', createdNote);
      setNotes([createdNote, ...notes]);
      // Only clear excerpt and personal note, keep article info
      setExcerpt('');
      setPersonalNote('');
    } catch (err) {
      console.error('Full error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined
      });
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setLoading(false);
    }
  };

  const groupNotesByArticle = (notes: Note[]): GroupedNotes => {
    return notes.reduce((groups: GroupedNotes, note) => {
      const key = note.article_id || 'uncategorized';
      if (!groups[key]) {
        groups[key] = {
          article_title: note.article_title,
          article_url: note.article_url,
          notes: []
        };
      }
      groups[key].notes.push(note);
      return groups;
    }, {});
  };

  const filterAndSortNotes = (notes: Note[]) => {
    let filteredNotes = [...notes];

    // Apply filters
    if (filterBy === 'with-article') {
      filteredNotes = filteredNotes.filter(note => note.article_title);
    } else if (filterBy === 'without-article') {
      filteredNotes = filteredNotes.filter(note => !note.article_title);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(note => 
        note.excerpt.toLowerCase().includes(query) ||
        note.personal_note.toLowerCase().includes(query) ||
        (note.article_title && note.article_title.toLowerCase().includes(query))
      );
    }

    // Apply sorting
    if (sortBy === 'newest') {
      filteredNotes.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'oldest') {
      filteredNotes.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'article') {
      filteredNotes.sort((a, b) => {
        const titleA = a.article_title || '';
        const titleB = b.article_title || '';
        return titleA.localeCompare(titleB);
      });
    }

    return filteredNotes;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#262626] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#262626]">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-gray-100">
                Notes for {blogName}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {notes.length} note{notes.length !== 1 ? 's' : ''} total
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="soft" 
                onClick={() => setShowHistory(!showHistory)}
              >
                {showHistory ? 'Add Note' : 'View History'}
              </Button>
              <Button variant="soft" color="gray" onClick={handleClose}>
                Close
              </Button>
            </div>
          </div>
        </div>

        {!showHistory ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Article Title (optional)
                </label>
                <input
                  type="text"
                  value={articleTitle}
                  onChange={(e) => {
                    setArticleTitle(e.target.value);
                    handleArticleInfoChange();
                  }}
                  placeholder="Enter article title..."
                  className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">
                  Article URL (optional)
                </label>
                <input
                  type="url"
                  value={articleUrl}
                  onChange={(e) => {
                    setArticleUrl(e.target.value);
                    handleArticleInfoChange();
                  }}
                  placeholder="https://..."
                  className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Excerpt from Article
              </label>
              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Paste interesting excerpt from the article..."
                className="w-full min-h-[100px] bg-[#1a1a1a] border border-[#262626] rounded-lg p-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">
                Your Notes
              </label>
              <textarea
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                placeholder="Add your thoughts and notes..."
                className="w-full min-h-[100px] bg-[#1a1a1a] border border-[#262626] rounded-lg p-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Note'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="p-6">
            <div className="mb-6 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes..."
                    className="w-full bg-[#1a1a1a] border border-[#262626] rounded-lg p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Select.Root value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <Select.Trigger className="w-40" />
                  <Select.Content>
                    <Select.Item value="newest">Newest First</Select.Item>
                    <Select.Item value="oldest">Oldest First</Select.Item>
                    <Select.Item value="article">By Article</Select.Item>
                  </Select.Content>
                </Select.Root>
                <Select.Root value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
                  <Select.Trigger className="w-40" />
                  <Select.Content>
                    <Select.Item value="all">All Notes</Select.Item>
                    <Select.Item value="with-article">With Article</Select.Item>
                    <Select.Item value="without-article">Without Article</Select.Item>
                  </Select.Content>
                </Select.Root>
              </div>
            </div>

            <div className="space-y-8">
              {Object.entries(groupNotesByArticle(filterAndSortNotes(notes))).map(([articleId, group]) => (
                <div key={articleId} className="space-y-4">
                  {group.article_title && (
                    <div className="border-b border-[#262626] pb-2">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-100">
                          {group.article_title}
                        </h3>
                        {group.article_url && (
                          <a
                            href={group.article_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300"
                          >
                            View Article →
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {group.notes.length} note{group.notes.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4 pl-4">
                    {group.notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-4 border border-[#262626] rounded-lg bg-[#1a1a1a]"
                      >
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-400 mb-2">
                            Excerpt
                          </h4>
                          <blockquote className="text-gray-300 italic border-l-2 border-blue-500 pl-3">
                            {note.excerpt}
                          </blockquote>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">
                            Your Notes
                          </h4>
                          <p className="text-gray-300">{note.personal_note}</p>
                        </div>

                        <div className="mt-2 text-xs text-gray-500">
                          Added on {new Date(note.created_at).toLocaleDateString()} at{' '}
                          {new Date(note.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {notes.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No notes added yet. Add your first note!
                </p>
              )}

              {notes.length > 0 && filterAndSortNotes(notes).length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No notes match your search or filters.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 