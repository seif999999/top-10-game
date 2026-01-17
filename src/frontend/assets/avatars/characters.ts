// Character Avatar Data - Low MB character designs
// Using simple geometric shapes and colors to create distinctive characters

export interface CharacterAvatar {
  id: string;
  name: string;
  description: string;
  color: string;
  backgroundColor: string;
  emoji: string;
  style: 'human' | 'animal' | 'fantasy' | 'robot';
}

export const CHARACTER_AVATARS: CharacterAvatar[] = [
  // Human Characters
  {
    id: 'char-1',
    name: 'Alex',
    description: 'A friendly adventurer with a warm smile',
    color: '#2E86AB', // Blue
    backgroundColor: '#A8DADC',
    emoji: '🧑‍💼',
    style: 'human'
  },
  {
    id: 'char-2', 
    name: 'Sam',
    description: 'A cheerful explorer with bright eyes',
    color: '#E63946', // Red
    backgroundColor: '#F1FAEE',
    emoji: '👩‍🚀',
    style: 'human'
  },
  {
    id: 'char-3',
    name: 'Jordan',
    description: 'A creative artist with colorful style',
    color: '#F77F00', // Orange
    backgroundColor: '#FDF0D5',
    emoji: '👨‍🎨',
    style: 'human'
  },
  {
    id: 'char-4',
    name: 'Casey',
    description: 'A tech-savvy developer with cool gadgets',
    color: '#7209B7', // Purple
    backgroundColor: '#E8D5F2',
    emoji: '👩‍💻',
    style: 'human'
  },
  {
    id: 'char-5',
    name: 'Riley',
    description: 'A nature lover with green vibes',
    color: '#06D6A0', // Green
    backgroundColor: '#D4F1D4',
    emoji: '🧑‍🌾',
    style: 'human'
  },
  {
    id: 'char-6',
    name: 'Morgan',
    description: 'A wise scholar with bookish charm',
    color: '#8B4513', // Brown
    backgroundColor: '#F5E6D3',
    emoji: '👨‍🏫',
    style: 'human'
  },

  // Animal Characters
  {
    id: 'char-7',
    name: 'Whiskers',
    description: 'A playful orange cat with green eyes',
    color: '#FF6B35', // Orange
    backgroundColor: '#FFE5D9',
    emoji: '🐱',
    style: 'animal'
  },
  {
    id: 'char-8',
    name: 'Buddy',
    description: 'A loyal golden retriever with a wagging tail',
    color: '#F4A261', // Golden
    backgroundColor: '#FEF3E2',
    emoji: '🐕',
    style: 'animal'
  },
  {
    id: 'char-9',
    name: 'Sage',
    description: 'A wise brown owl with golden eyes',
    color: '#6F4E37', // Brown
    backgroundColor: '#F0E6D2',
    emoji: '🦉',
    style: 'animal'
  },
  {
    id: 'char-10',
    name: 'Bubbles',
    description: 'A friendly dolphin with a big smile',
    color: '#0077B6', // Blue
    backgroundColor: '#B8E6E6',
    emoji: '🐬',
    style: 'animal'
  },
  {
    id: 'char-11',
    name: 'Panda',
    description: 'A cute panda with black and white fur',
    color: '#000000', // Black
    backgroundColor: '#F0F0F0',
    emoji: '🐼',
    style: 'animal'
  },
  {
    id: 'char-12',
    name: 'Luna',
    description: 'A mystical wolf with silver fur',
    color: '#6C757D', // Gray
    backgroundColor: '#E9ECEF',
    emoji: '🐺',
    style: 'animal'
  },

  // Fantasy Characters
  {
    id: 'char-13',
    name: 'Aria',
    description: 'A magical fairy with sparkling wings',
    color: '#E91E63', // Pink
    backgroundColor: '#FCE4EC',
    emoji: '🧚‍♀️',
    style: 'fantasy'
  },
  {
    id: 'char-14',
    name: 'Dragon',
    description: 'A friendly dragon with rainbow scales',
    color: '#9C27B0', // Purple
    backgroundColor: '#F3E5F5',
    emoji: '🐉',
    style: 'fantasy'
  },
  {
    id: 'char-15',
    name: 'Phoenix',
    description: 'A legendary phoenix with fiery feathers',
    color: '#FF5722', // Red-Orange
    backgroundColor: '#FFEBEE',
    emoji: '🔥',
    style: 'fantasy'
  },
  {
    id: 'char-16',
    name: 'Mystic',
    description: 'A wise wizard with a glowing staff',
    color: '#673AB7', // Deep Purple
    backgroundColor: '#EDE7F6',
    emoji: '🧙‍♂️',
    style: 'fantasy'
  },

  // Robot Characters
  {
    id: 'char-17',
    name: 'Robo',
    description: 'A friendly robot with LED eyes',
    color: '#607D8B', // Blue-Gray
    backgroundColor: '#ECEFF1',
    emoji: '🤖',
    style: 'robot'
  },
  {
    id: 'char-18',
    name: 'Cyber',
    description: 'A futuristic android with neon highlights',
    color: '#00BCD4', // Cyan
    backgroundColor: '#E0F2F1',
    emoji: '👾',
    style: 'robot'
  },
  {
    id: 'char-19',
    name: 'Nexus',
    description: 'An AI assistant with a holographic display',
    color: '#3F51B5', // Indigo
    backgroundColor: '#E8EAF6',
    emoji: '💻',
    style: 'robot'
  },
  {
    id: 'char-20',
    name: 'Vector',
    description: 'A sleek robot with geometric patterns',
    color: '#795548', // Brown
    backgroundColor: '#EFEBE9',
    emoji: '⚙️',
    style: 'robot'
  }
];

// Character avatar categories for filtering
export const CHARACTER_CATEGORIES = {
  human: CHARACTER_AVATARS.filter(char => char.style === 'human'),
  animal: CHARACTER_AVATARS.filter(char => char.style === 'animal'),
  fantasy: CHARACTER_AVATARS.filter(char => char.style === 'fantasy'),
  robot: CHARACTER_AVATARS.filter(char => char.style === 'robot'),
  all: CHARACTER_AVATARS
};

// Helper function to get character by ID
export const getCharacterById = (id: string): CharacterAvatar | null => {
  return CHARACTER_AVATARS.find(char => char.id === id) || null;
};

// Helper function to get characters by style
export const getCharactersByStyle = (style: CharacterAvatar['style']): CharacterAvatar[] => {
  return CHARACTER_AVATARS.filter(char => char.style === style);
};
