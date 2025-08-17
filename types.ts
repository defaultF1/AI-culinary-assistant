
export interface User {
  name: string;
  email?: string;
  picture?: string;
  authMethod: 'Apple' | 'Google' | 'Guest';
}

export interface Recipe {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  youtubeUrl: string;
  imageUrl: string;
}

export interface ChatMessage {
    sender: 'user' | 'ai';
    text: string;
}

export interface HistoryItem extends Recipe {
    generatedAt: string;
}