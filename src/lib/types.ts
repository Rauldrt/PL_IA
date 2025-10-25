export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: any;
}

export type Session = {
  id: string;
  startTime: any;
  userId: string;
  lastMessage?: string;
}

export type ChatInput = {
  history: Omit<Message, 'id'>[];
  message: string;
  sentiment?: string;
  knowledge?: string;
};

export type ChatOutput = {
  response: string;
};

export type SentimentAnalysisInput = {
  text: string;
};

export type SentimentAnalysisOutput = {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
};

export type SuggestedMessagesOutput = {
  messages: string[];
};
