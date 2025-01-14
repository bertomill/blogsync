import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Select } from '@radix-ui/themes';
import { DownloadIcon } from '@radix-ui/react-icons';

type ExportFormat = 'markdown' | 'json' | 'csv';

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

interface Blog {
  id: string;
  name: string;
}

export default function ExportNotes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [format, setFormat] = useState<ExportFormat>('markdown');

  const fetchAllNotes = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    // First fetch all blogs to get their names
    const { data: blogs } = await supabase
      .from('blogs')
      .select('id, name')
      .eq('user_id', user.id);

    // Then fetch all notes
    const { data: notes, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return { notes, blogs: blogs || [] };
  };

  const formatNotesAsMarkdown = (notes: Note[], blogs: Blog[]) => {
    const blogMap = new Map(blogs.map(blog => [blog.id, blog.name]));
    let markdown = '# My Notes\n\n';

    // Group notes by blog
    const notesByBlog = notes.reduce((acc, note) => {
      const blogName = blogMap.get(note.blog_id) || 'Unknown Blog';
      if (!acc[blogName]) acc[blogName] = [];
      acc[blogName].push(note);
      return acc;
    }, {} as Record<string, Note[]>);

    // Generate markdown for each blog
    Object.entries(notesByBlog).forEach(([blogName, blogNotes]) => {
      markdown += `## ${blogName}\n\n`;
      blogNotes.forEach(note => {
        if (note.article_title) {
          markdown += `### ${note.article_title}\n`;
          if (note.article_url) markdown += `[View Article](${note.article_url})\n`;
        }
        markdown += `\n#### Excerpt\n${note.excerpt}\n\n`;
        markdown += `#### Personal Note\n${note.personal_note}\n\n`;
        markdown += `_Added on ${new Date(note.created_at).toLocaleString()}_\n\n---\n\n`;
      });
    });

    return markdown;
  };

  const formatNotesAsJSON = (notes: Note[], blogs: Blog[]) => {
    const blogMap = new Map(blogs.map(blog => [blog.id, blog.name]));
    return JSON.stringify(
      notes.map(note => ({
        ...note,
        blog_name: blogMap.get(note.blog_id) || 'Unknown Blog',
      })),
      null,
      2
    );
  };

  const formatNotesAsCSV = (notes: Note[], blogs: Blog[]) => {
    const blogMap = new Map(blogs.map(blog => [blog.id, blog.name]));
    const headers = ['Blog', 'Article Title', 'Article URL', 'Excerpt', 'Personal Note', 'Created At'];
    const rows = notes.map(note => [
      blogMap.get(note.blog_id) || 'Unknown Blog',
      note.article_title || '',
      note.article_url || '',
      note.excerpt,
      note.personal_note,
      new Date(note.created_at).toLocaleString(),
    ]);
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
  };

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);

      const { notes, blogs } = await fetchAllNotes();
      if (!notes || notes.length === 0) {
        throw new Error('No notes found to export');
      }

      let content: string;
      let fileExtension: string;
      let mimeType: string;

      switch (format) {
        case 'markdown':
          content = formatNotesAsMarkdown(notes, blogs);
          fileExtension = 'md';
          mimeType = 'text/markdown';
          break;
        case 'json':
          content = formatNotesAsJSON(notes, blogs);
          fileExtension = 'json';
          mimeType = 'application/json';
          break;
        case 'csv':
          content = formatNotesAsCSV(notes, blogs);
          fileExtension = 'csv';
          mimeType = 'text/csv';
          break;
        default:
          throw new Error('Invalid format selected');
      }

      // Create and download the file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `my-notes.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Error exporting notes:', err);
      setError(err instanceof Error ? err.message : 'Failed to export notes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Select.Root value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
        <Select.Trigger className="w-40" />
        <Select.Content>
          <Select.Item value="markdown">Markdown</Select.Item>
          <Select.Item value="json">JSON</Select.Item>
          <Select.Item value="csv">CSV</Select.Item>
        </Select.Content>
      </Select.Root>

      <Button
        onClick={handleExport}
        disabled={loading}
        variant="soft"
      >
        <DownloadIcon className="mr-2" />
        {loading ? 'Exporting...' : 'Export Notes'}
      </Button>

      {error && (
        <span className="text-red-400 text-sm">{error}</span>
      )}
    </div>
  );
} 