import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Card, TextField } from '@radix-ui/themes';

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

  useEffect(() => {
    fetchNotes();
  }, [blogId]);

  const fetchNotes = async () => {
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
  };

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
            <div className="space-y-8">
              {Object.entries(groupNotesByArticle(notes)).map(([articleId, group]) => (
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 