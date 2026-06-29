export interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  twitter: string | null;
  instagram: string | null;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  is_favorited?: boolean;
}

export interface Community {
  id: string;
  name: string;
  description: string;
  category: string;
  banner_url: string | null;
  avatar_url: string | null;
  rules: string | null;
  status: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
  members_count?: number;
  is_member?: boolean;
  creator?: Profile;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  category: string;
  deadline: string | null;
  status: string;
  creator_id: string;
  created_at: string;
  updated_at: string;
  participants_count?: number;
  is_participating?: boolean;
  creator?: Profile;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
  replies?: Comment[];
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

export interface Conversation {
  id: string;
  participant_one_id: string;
  participant_two_id: string;
  created_at: string;
  updated_at: string;
  participant_one?: Profile;
  participant_two?: Profile;
  last_message?: Message;
  unread_count?: number;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'like' | 'comment' | 'follow' | 'message' | 'community' | 'challenge';
  content: string;
  reference_id: string | null;
  read: boolean;
  created_at: string;
  actor?: Profile | null;
}
