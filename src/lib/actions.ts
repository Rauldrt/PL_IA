'use server';

import { z } from 'zod';
import { analyzeSentiment } from '@/ai/flows/sentiment-analysis';
import { chat } from '@/ai/flows/chat';
import { getSuggestedMessages as getSuggestions } from '@/ai/flows/suggested-messages';
import type { Message } from './types';

const loginSchema = z.object({
  username: z.string().min(1, 'El usuario es requerido.'),
  password: z.string().min(1, 'La contraseña es requerida.'),
});

export async function login(
  prevState: { message: string },
  formData: FormData
) {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return { message: 'Entrada inválida.', success: false };
  }

  const { username, password } = parsed.data;

  // Hardcoded credentials for demonstration
  if (username === 'usuario' && password === 'contraseña') {
    return { message: 'Inicio de sesión exitoso.', success: true };
  }

  return { message: 'Usuario o contraseña incorrectos.', success: false };
}

export async function sendMessage(history: Message[], newMessage: string) {
  if (!newMessage.trim()) {
    return { error: 'El mensaje no puede estar vacío.' };
  }

  try {
    const sentiment = await analyzeSentiment({ text: newMessage });
    const aiResponse = await chat({
      history: history,
      message: newMessage,
      sentiment: `${sentiment.sentiment} (Puntuación: ${sentiment.score.toFixed(2)})`,
    });

    return { response: aiResponse.response };
  } catch (error) {
    console.error('Error processing message:', error);
    return { error: 'No se pudo obtener una respuesta de la IA.' };
  }
}

export async function getSuggestedMessages() {
  try {
    const suggestions = await getSuggestions();
    return { messages: suggestions.messages };
  } catch (error) {
    console.error('Error getting suggested messages:', error);
    return { error: 'No se pudieron cargar las sugerencias.' };
  }
}
