'use client'

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Card } from '@radix-ui/themes';
import { ArrowRightIcon } from '@radix-ui/react-icons';

interface Article {
  id: string;
  title: string;
  url: string;
  blog_id: string;
  author: string | null;
  date_published: string | null;
  is_read: boolean;
}

interface UserProfile {
  interests: string[];
  expertise_areas: {
    [key: string]: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
  reading_preferences: {
    preferred_length?: 'short' | 'medium' | 'long';
    content_depth?: 'overview' | 'detailed' | 'technical';
  };
}

export default function ArticleRecommendations() {
  const [recommendations, setRecommendations] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [clientLoaded, setClientLoaded] = useState(false);

  useEffect(() => {
    setClientLoaded(true);
    fetchUserProfileAndRecommendations();
  }, []);

  const fetchUserProfileAndRecommendations = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error('Failed to get user information');
      }
      if (!user) {
        console.error('No user found');
        throw new Error('Please sign in to see recommendations');
      }

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Handle the case where profile doesn't exist yet
      if (profileError && profileError.code === 'PGRST116') {
        console.log('No profile exists yet - user needs to set up their AI profile');
        setError('Please set up your AI profile to see personalized recommendations');
        setLoading(false);
        return;
      }

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      if (!profile) {
        setError('Please set up your AI profile to see personalized recommendations');
        setLoading(false);
        return;
      }

      setUserProfile(profile);

      // Fetch all articles
      const { data: articles, error: articlesError } = await supabase
        .from('articles')
        .select('*, blogs!inner(name)')
        .eq('user_id', user.id)
        .order('date_published', { ascending: false });

      if (articlesError) {
        console.error('Error fetching articles:', articlesError);
        throw new Error('Failed to fetch articles');
      }

      if (!articles || articles.length === 0) {
        setRecommendations([]);
        setLoading(false);
        return;
      }

      // Filter and rank articles based on user preferences
      const rankedArticles = articles
        .filter(article => !article.is_read)
        .map(article => {
          let score = 0;
          
          if (profile.interests && profile.interests.length > 0) {
            profile.interests.forEach(interest => {
              if (article.title?.toLowerCase().includes(interest.toLowerCase()) ||
                  article.blogs?.name.toLowerCase().includes(interest.toLowerCase())) {
                score += 2;
              }
            });
          }

          const expertiseLevel = getExpertiseScore(profile.expertise_areas || {});
          if (article.title?.toLowerCase().includes('advanced') && expertiseLevel >= 3) score += 1;
          if (article.title?.toLowerCase().includes('beginner') && expertiseLevel <= 2) score += 1;

          return { ...article, score };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      setRecommendations(rankedArticles);
    } catch (err) {
      console.error('Error in fetchUserProfileAndRecommendations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch recommendations');
    } finally {
      setLoading(false);
    }
  };

  const getExpertiseScore = (expertise: UserProfile['expertise_areas']) => {
    const levels = {
      'beginner': 1,
      'intermediate': 2,
      'advanced': 3,
      'expert': 4
    };
    
    const scores = Object.values(expertise).map(level => levels[level]);
    return scores.reduce((sum, score) => sum + score, 0) / scores.length;
  };

  const handleReadArticle = async (article: Article) => {
    try {
      const { error } = await supabase
        .from('articles')
        .update({ is_read: true })
        .eq('id', article.id);

      if (error) throw error;

      // Refresh recommendations
      fetchUserProfileAndRecommendations();
    } catch (err) {
      console.error('Error marking article as read:', err);
    }
  };

  if (loading) return (
    <Card className="max-w-4xl mx-auto p-6 bg-[#141414] border border-[#262626]">
      <div className="text-gray-300">Loading recommendations...</div>
    </Card>
  );

  if (error) return (
    <Card className="max-w-4xl mx-auto p-6 bg-[#141414] border border-[#262626]">
      <div className="text-gray-300">
        {error}
        {error.includes('AI profile') && (
          <div className="mt-2 text-blue-400">
            Click the "Setup AI Profile" button above to get started!
          </div>
        )}
      </div>
    </Card>
  );

  if (!userProfile) return (
    <Card className="max-w-4xl mx-auto p-6 bg-[#141414] border border-[#262626]">
      <div className="text-gray-300">
        Please set up your AI profile to see personalized recommendations
        <div className="mt-2 text-blue-400">
          Click the "Setup AI Profile" button above to get started!
        </div>
      </div>
    </Card>
  );

  if (recommendations.length === 0) return <div className="text-gray-300">No recommendations available.</div>;

  return (
    <Card className="max-w-4xl mx-auto p-6 bg-[#141414] border border-[#262626]">
      <h2 className="text-xl font-semibold text-gray-100 mb-6">Recommended Articles</h2>
      <div className="space-y-4">
        {recommendations.map(article => (
          <div
            key={article.id}
            className="p-4 border border-[#262626] rounded-lg bg-[#1a1a1a] hover:bg-[#1e2436] transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-medium text-gray-100">{article.title}</h3>
                <div className="text-sm text-gray-500 mt-1">
                  {article.author && <span className="mr-3">By {article.author}</span>}
                  {article.date_published && clientLoaded && (
                    <span>
                      Published on {new Date(article.date_published).toLocaleDateString('en-US')}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="soft"
                onClick={() => {
                  window.open(article.url, '_blank', 'width=1200,height=800');
                  handleReadArticle(article);
                }}
              >
                Read Article <ArrowRightIcon className="ml-2" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
} 