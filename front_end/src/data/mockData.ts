export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio?: string;
  followers: number;
  following: number;
  postsCount: number;
  isVerified?: boolean;
  isPrivate?: boolean;
}

export interface Post {
  id: string;
  user: User;
  content: string;
  images?: string[];
  timestamp: Date;
  likes: number;
  comments: number;
  shares: number;
  isLiked?: boolean;
  isSaved?: boolean;
}

export interface Story {
  id: string;
  user: User;
  image: string;
  timestamp: Date;
  viewed: boolean;
}

export interface Comment {
  id: string;
  user: User;
  content: string;
  timestamp: Date;
  likes: number;
  isLiked?: boolean;
  replies?: Comment[];
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention';
  user: User;
  content?: string;
  timestamp: Date;
  read: boolean;
  post?: { id: string; preview: string };
}

export interface Message {
  id: string;
  user: User;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  online: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: Date;
  status: 'sent' | 'delivered' | 'read';
  image?: string;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    username: 'aminatou_k',
    displayName: 'Aminatou Kane',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    bio: 'Designer & Artist 🎨 | Dakar',
    followers: 2845,
    following: 432,
    postsCount: 127,
    isVerified: true,
  },
  {
    id: '2',
    username: 'ibrahima_s',
    displayName: 'Ibrahima Sow',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    bio: 'Entrepreneur | Tech Enthusiast',
    followers: 5234,
    following: 890,
    postsCount: 342,
    isVerified: true,
  },
  {
    id: '3',
    username: 'fatoumata_d',
    displayName: 'Fatoumata Diallo',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    bio: 'Photographer 📸',
    followers: 1523,
    following: 345,
    postsCount: 89,
  },
  {
    id: '4',
    username: 'youssef_m',
    displayName: 'Youssef Mansour',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    bio: 'Travel & Culture',
    followers: 8932,
    following: 1234,
    postsCount: 456,
    isVerified: true,
  },
  {
    id: '5',
    username: 'mariam_b',
    displayName: 'Mariam Bah',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    bio: 'Fashion & Lifestyle',
    followers: 12456,
    following: 789,
    postsCount: 678,
    isVerified: true,
  },
];

// Mock Posts
export const mockPosts: Post[] = [
  {
    id: '1',
    user: mockUsers[0],
    content: 'Beautiful sunset at the beach today! The colors were absolutely amazing. 🌅 #Dakar #Sunset',
    images: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800'],
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    likes: 234,
    comments: 18,
    shares: 5,
    isLiked: false,
  },
  {
    id: '2',
    user: mockUsers[1],
    content: 'Excited to announce our new project launching next week! Stay tuned for something amazing 🚀',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    likes: 542,
    comments: 67,
    shares: 23,
    isLiked: true,
  },
  {
    id: '3',
    user: mockUsers[2],
    content: 'Behind the scenes from today\'s photoshoot 📸✨',
    images: [
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800',
      'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800',
    ],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4),
    likes: 891,
    comments: 34,
    shares: 12,
    isLiked: false,
  },
  {
    id: '4',
    user: mockUsers[3],
    content: 'Exploring the markets of Marrakech. The colors, the smells, the energy - this place is incredible! 🇲🇦',
    images: ['https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800'],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6),
    likes: 1234,
    comments: 92,
    shares: 45,
    isLiked: true,
  },
  {
    id: '5',
    user: mockUsers[4],
    content: 'New collection dropping this Friday! Who\'s ready? 👗✨',
    images: ['https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800'],
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8),
    likes: 2156,
    comments: 156,
    shares: 78,
    isLiked: false,
  },
];

// Mock Stories
export const mockStories: Story[] = [
  {
    id: '1',
    user: mockUsers[0],
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    viewed: false,
  },
  {
    id: '2',
    user: mockUsers[1],
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    viewed: false,
  },
  {
    id: '3',
    user: mockUsers[2],
    image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400',
    timestamp: new Date(Date.now() - 1000 * 60 * 180),
    viewed: true,
  },
  {
    id: '4',
    user: mockUsers[3],
    image: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400',
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    viewed: true,
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'like',
    user: mockUsers[1],
    content: 'liked your post',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    read: false,
    post: { id: '1', preview: 'Beautiful sunset at the beach...' },
  },
  {
    id: '2',
    type: 'comment',
    user: mockUsers[2],
    content: 'commented: "This is amazing!"',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    read: false,
    post: { id: '1', preview: 'Beautiful sunset at the beach...' },
  },
  {
    id: '3',
    type: 'follow',
    user: mockUsers[3],
    content: 'started following you',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    read: true,
  },
  {
    id: '4',
    type: 'like',
    user: mockUsers[4],
    content: 'liked your post',
    timestamp: new Date(Date.now() - 1000 * 60 * 240),
    read: true,
    post: { id: '2', preview: 'Excited to announce...' },
  },
];

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: '1',
    user: mockUsers[1],
    lastMessage: 'Sounds great! Let\'s catch up tomorrow',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    unread: 2,
    online: true,
  },
  {
    id: '2',
    user: mockUsers[2],
    lastMessage: 'Thank you so much! 🙏',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    unread: 0,
    online: false,
  },
  {
    id: '3',
    user: mockUsers[3],
    lastMessage: 'Can you send me the details?',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    unread: 1,
    online: true,
  },
  {
    id: '4',
    user: mockUsers[4],
    lastMessage: 'Perfect timing!',
    timestamp: new Date(Date.now() - 1000 * 60 * 360),
    unread: 0,
    online: false,
  },
];

export const mockComments: Comment[] = [
  {
    id: '1',
    user: mockUsers[1],
    content: 'This is absolutely stunning! 😍',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    likes: 12,
    isLiked: false,
  },
  {
    id: '2',
    user: mockUsers[2],
    content: 'Where is this exactly? I need to visit!',
    timestamp: new Date(Date.now() - 1000 * 60 * 25),
    likes: 5,
    isLiked: true,
    replies: [
      {
        id: '2-1',
        user: mockUsers[0],
        content: 'It\'s at Ngor beach in Dakar!',
        timestamp: new Date(Date.now() - 1000 * 60 * 20),
        likes: 3,
        isLiked: false,
      },
    ],
  },
  {
    id: '3',
    user: mockUsers[3],
    content: 'The colors are amazing 🎨',
    timestamp: new Date(Date.now() - 1000 * 60 * 40),
    likes: 8,
    isLiked: false,
  },
];
