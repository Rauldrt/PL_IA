'use server';

import { z } from 'zod';
import { analyzeSentiment } from '@/ai/flows/sentiment-analysis';
import { chat } from '@/ai/flows/chat';
import { getSuggestedMessages as getSuggestions } from '@/ai/flows/suggested-messages';
import type { Message, ChatInput, SentimentAnalysisOutput, SuggestedMessagesOutput } from './types';


export async function sendMessage(history: Message[], newMessage: string) {
  if (!newMessage.trim()) {
    return { error: 'El mensaje no puede estar vacío.' };
  }

  try {
    const sentiment: SentimentAnalysisOutput = await analyzeSentiment({ text: newMessage });
    const chatInput: ChatInput = {
      history: history,
      message: newMessage,
      sentiment: `${sentiment.sentiment} (Puntuación: ${sentiment.score.toFixed(2)})`,
    };
    const aiResponse = await chat(chatInput);

    return { response: aiResponse.response };
  } catch (error) {
    console.error('Error processing message:', error);
    return { error: 'No se pudo obtener una respuesta de la IA.' };
  }
}

export async function getSuggestedMessages(): Promise<{messages?: string[], error?: string}> {
  try {
    const suggestions: SuggestedMessagesOutput = await getSuggestions();
    return { messages: suggestions.messages };
  } catch (error) {
    console.error('Error getting suggested messages:', error);
    return { error: 'No se pudieron cargar las sugerencias.' };
  }
}
