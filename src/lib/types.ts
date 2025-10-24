export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export type ChatInput = {
  history: Message[];
  message: string;
  sentiment?: string;
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
