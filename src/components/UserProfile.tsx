import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button, Card, Select } from '@radix-ui/themes';

interface UserProfile {
  interests: string[];
  expertise_areas: {
    [key: string]: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
  reading_preferences: {
    preferred_length?: 'short' | 'medium' | 'long';
    content_depth?: 'overview' | 'detailed' | 'technical';
    reading_time?: 'under_5min' | '5_15min' | 'over_15min';
  };
  learning_goals: string[];
  preferred_content_types: string[];
}

const PREDEFINED_INTERESTS = [
  'Artificial Intelligence',
  'Machine Learning',
  'Natural Language Processing',
  'Computer Vision',
  'Robotics',
  'Data Science',
  'Deep Learning',
  'Neural Networks',
  'Reinforcement Learning',
  'AI Ethics',
  'AI Applications',
  'AI Research'
];

const EXPERTISE_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

export default function UserProfile() {
  const [profile, setProfile] = useState<UserProfile>({
    interests: [],
    expertise_areas: {},
    reading_preferences: {},
    learning_goals: [],
    preferred_content_types: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error('Failed to get user information');
      }
      if (!user) {
        console.error('No user found');
        throw new Error('Please sign in to access your profile');
      }

      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      if (!data) {
        console.log('No profile data found for user:', user.id);
        setError('Please set up your AI profile');
        setLoading(false);
        return;
      }

      console.log('Fetched profile data:', data);
      setProfile(data);
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          ...profile
        });

      if (error) throw error;
    } catch (err) {
      console.error('Error saving profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setProfile(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const updateExpertise = (area: string, level: string) => {
    setProfile(prev => ({
      ...prev,
      expertise_areas: {
        ...prev.expertise_areas,
        [area]: level as 'beginner' | 'intermediate' | 'advanced' | 'expert'
      }
    }));
  };

  const addLearningGoal = () => {
    if (newGoal.trim()) {
      setProfile(prev => ({
        ...prev,
        learning_goals: [...prev.learning_goals, newGoal.trim()]
      }));
      setNewGoal('');
    }
  };

  const removeLearningGoal = (goal: string) => {
    setProfile(prev => ({
      ...prev,
      learning_goals: prev.learning_goals.filter(g => g !== goal)
    }));
  };

  if (loading) return <div className="text-gray-300">Loading profile...</div>;

  return (
    <Card className="max-w-4xl mx-auto p-6 bg-[#141414] border border-[#262626]">
      <h2 className="text-xl font-semibold text-gray-100 mb-6">AI Learning Profile</h2>
      
      <div className="space-y-8">
        {/* Interests */}
        <div>
          <h3 className="text-lg font-medium text-gray-200 mb-4">Areas of Interest</h3>
          <div className="flex flex-wrap gap-2">
            {PREDEFINED_INTERESTS.map(interest => (
              <Button
                key={interest}
                variant="soft"
                color={profile.interests.includes(interest) ? 'blue' : 'gray'}
                onClick={() => toggleInterest(interest)}
              >
                {interest}
              </Button>
            ))}
          </div>
        </div>

        {/* Expertise Areas */}
        <div>
          <h3 className="text-lg font-medium text-gray-200 mb-4">Expertise Levels</h3>
          <div className="grid gap-4">
            {profile.interests.map(area => (
              <div key={area} className="flex items-center gap-4">
                <span className="text-gray-300 w-48">{area}</span>
                <Select.Root
                  value={profile.expertise_areas[area] || 'beginner'}
                  onValueChange={(value) => updateExpertise(area, value)}
                >
                  <Select.Trigger className="w-40" />
                  <Select.Content>
                    {EXPERTISE_LEVELS.map(level => (
                      <Select.Item key={level} value={level}>
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </div>
            ))}
          </div>
        </div>

        {/* Reading Preferences */}
        <div>
          <h3 className="text-lg font-medium text-gray-200 mb-4">Reading Preferences</h3>
          <div className="grid gap-4">
            <div className="flex items-center gap-4">
              <span className="text-gray-300 w-48">Preferred Length</span>
              <Select.Root
                value={profile.reading_preferences.preferred_length || 'medium'}
                onValueChange={(value) => setProfile(prev => ({
                  ...prev,
                  reading_preferences: {
                    ...prev.reading_preferences,
                    preferred_length: value as 'short' | 'medium' | 'long'
                  }
                }))}
              >
                <Select.Trigger className="w-40" />
                <Select.Content>
                  <Select.Item value="short">Short</Select.Item>
                  <Select.Item value="medium">Medium</Select.Item>
                  <Select.Item value="long">Long</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-gray-300 w-48">Content Depth</span>
              <Select.Root
                value={profile.reading_preferences.content_depth || 'detailed'}
                onValueChange={(value) => setProfile(prev => ({
                  ...prev,
                  reading_preferences: {
                    ...prev.reading_preferences,
                    content_depth: value as 'overview' | 'detailed' | 'technical'
                  }
                }))}
              >
                <Select.Trigger className="w-40" />
                <Select.Content>
                  <Select.Item value="overview">Overview</Select.Item>
                  <Select.Item value="detailed">Detailed</Select.Item>
                  <Select.Item value="technical">Technical</Select.Item>
                </Select.Content>
              </Select.Root>
            </div>
          </div>
        </div>

        {/* Learning Goals */}
        <div>
          <h3 className="text-lg font-medium text-gray-200 mb-4">Learning Goals</h3>
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newGoal}
                onChange={(e) => setNewGoal(e.target.value)}
                placeholder="Add a learning goal..."
                className="flex-1 bg-[#1a1a1a] border border-[#262626] rounded-lg p-2 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && addLearningGoal()}
              />
              <Button onClick={addLearningGoal}>Add Goal</Button>
            </div>
            <div className="space-y-2">
              {profile.learning_goals.map(goal => (
                <div key={goal} className="flex items-center justify-between p-2 bg-[#1a1a1a] border border-[#262626] rounded-lg">
                  <span className="text-gray-300">{goal}</span>
                  <Button
                    variant="soft"
                    color="red"
                    onClick={() => removeLearningGoal(goal)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </div>
    </Card>
  );
} 