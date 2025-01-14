import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Select } from '@radix-ui/themes';
import { DownloadIcon } from '@radix-ui/react-icons';

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
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [exportFormat, setExportFormat] = useState<'markdown' | 'json' | 'csv'>('markdown');
  const [exportLoading, setExportLoading] = useState(false);
  const [articleAuthor, setArticleAuthor] = useState('');
  const [articleDate, setArticleDate] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset all state when modal is closed
  const handleClose = () => {
    // Clear all fields when closing the modal
    setExcerpt('');
    setPersonalNote('');
    setArticleTitle('');
    setArticleUrl('');
    setArticleAuthor('');
    setArticleDate('');
    onClose();
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

      // Create article first if title and URL are provided
      let articleId = null;
      if (articleTitle.trim() && articleUrl.trim()) {
        const { data: article, error: articleError } = await supabase
          .from('articles')
          .insert([{
            title: articleTitle.trim(),
            url: articleUrl.trim(),
            blog_id: blogId,
            user_id: user.id,
            author: articleAuthor.trim() || null,
            date_published: articleDate || null
          }])
          .select()
          .single();

        if (articleError) throw articleError;
        articleId = article.id;
      }

      // Create the note
      const { error: noteError } = await supabase
        .from('notes')
        .insert([{
          blog_id: blogId,
          user_id: user.id,
          article_id: articleId,
          excerpt: excerpt.trim(),
          personal_note: personalNote.trim()
        }]);

      if (noteError) throw noteError;

      // Reset only the note content, preserve article details
      setExcerpt('');
      setPersonalNote('');
      
      // Show success notification
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);

      // Refresh notes
      await fetchNotes();
    } catch (err) {
      console.error('Error saving note:', err);
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

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .eq('blog_id', blogId)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      let content = '';
      const fileName = `${blogName.toLowerCase().replace(/\s+/g, '-')}-notes`;

      if (exportFormat === 'markdown') {
        content = `# Notes from ${blogName}\n\n`;
        notesData.forEach(note => {
          content += `## ${note.article_title || 'Untitled Article'}\n`;
          if (note.article_url) content += `[View Article](${note.article_url})\n\n`;
          content += `### Excerpt\n${note.excerpt}\n\n`;
          content += `### Your Notes\n${note.personal_note}\n\n`;
          content += `_Added on ${new Date(note.created_at).toLocaleString()}_\n\n---\n\n`;
        });
      } else if (exportFormat === 'json') {
        content = JSON.stringify(notesData, null, 2);
      } else {
        // CSV format
        const rows = [['Article Title', 'Article URL', 'Excerpt', 'Personal Note', 'Created At']];
        notesData.forEach(note => {
          rows.push([
            note.article_title || '',
            note.article_url || '',
            note.excerpt,
            note.personal_note,
            new Date(note.created_at).toLocaleString()
          ]);
        });
        content = rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
      }

      // Create and trigger download
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.${exportFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to export notes');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#141414] border border-[#262626] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#262626]">
          <div className="flex flex-col gap-4">
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
            
            {showHistory && notes.length > 0 && (
              <div className="flex justify-end items-center gap-2 pt-2">
                <Select.Root value={exportFormat} onValueChange={(value) => setExportFormat(value as typeof exportFormat)}>
                  <Select.Trigger className="w-32" />
                  <Select.Content>
                    <Select.Item value="markdown">Markdown</Select.Item>
                    <Select.Item value="json">JSON</Select.Item>
                    <Select.Item value="csv">CSV</Select.Item>
                  </Select.Content>
                </Select.Root>
                <Button
                  variant="soft"
                  onClick={handleExport}
                  disabled={exportLoading}
                >
                  <DownloadIcon className="mr-2" />
                  {exportLoading ? 'Exporting...' : 'Export Notes'}
                </Button>
              </div>
            )}
          </div>
        </div>

        {!showHistory ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Article URL (optional)
                </label>
                <input
                  type="url"
                  value={articleUrl}
                  onChange={(e) => setArticleUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-[#141414] border border-[#262626] rounded-lg p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Article Title (optional)
                </label>
                <input
                  type="text"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="Enter article title..."
                  className="w-full bg-[#141414] border border-[#262626] rounded-lg p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Author (optional)
                  </label>
                  <input
                    type="text"
                    value={articleAuthor}
                    onChange={(e) => setArticleAuthor(e.target.value)}
                    placeholder="Article author..."
                    className="w-full bg-[#141414] border border-[#262626] rounded-lg p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Publication Date (optional)
                  </label>
                  <input
                    type="date"
                    value={articleDate}
                    onChange={(e) => setArticleDate(e.target.value)}
                    className="w-full bg-[#141414] border border-[#262626] rounded-lg p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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

        {/* Success notification */}
        <div
          className={`fixed bottom-8 right-8 transform transition-all duration-300 ease-out ${
            showSuccess 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-4 opacity-0 pointer-events-none'
          }`}
        >
          <div className="bg-[#1a1f2c] border border-blue-500/30 rounded-lg px-4 py-2 shadow-lg">
            <div className="flex items-center gap-2 text-blue-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span className="text-sm">Note saved</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 