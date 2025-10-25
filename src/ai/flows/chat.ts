
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema).describe('The conversation history.'),
  message: z.string().describe('The latest user message.'),
  sentiment: z.string().optional().describe('The sentiment of the user\'s message.'),
  knowledge: z.string().optional().describe('Aditional knowledge for the AI agent to use.'),
});
type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The AI\'s response.'),
});
type ChatOutput = z.infer<typeof ChatOutputSchema>;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  const prompt = ai.definePrompt({
    name: 'chatPrompt',
    input: { schema: ChatInputSchema },
    output: { schema: ChatOutputSchema },
    prompt: `Eres un agente de IA experto llamado PLib_IA. Tu propósito es ayudar a los usuarios con sus consultas.

  Responde basándote únicamente en el siguiente contexto y base de conocimiento:
  {{{knowledge}}}

  Analiza el sentimiento del usuario para entender mejor su estado emocional y adaptar tu respuesta.
  Sentimiento del último mensaje: {{{sentiment}}}

  Aquí está el historial de la conversación:
  {{#each history}}
  **{{role}}**: {{content}}
  {{/each}}

  Nuevo mensaje del usuario:
  **user**: {{{message}}}

  Responde al usuario en español. Mantén tus respuestas concisas y útiles.
  `,
  });

  const chatFlow = ai.defineFlow(
    {
      name: 'chatFlow',
      inputSchema: ChatInputSchema,
      outputSchema: ChatOutputSchema,
    },
    async (input) => {
      const { output } = await prompt(input);
      
      // Update session's last message after getting a response.
      if (ai.internal.state().flow?.context?.firebase?.sessionDocRef) {
        const sessionRef = ai.internal.state().flow!.context.firebase.sessionDocRef;
        const userMessage = input.message.length > 40 ? input.message.substring(0, 40) + '...' : input.message;
        await sessionRef.update({ lastMessage: userMessage });
      }

      return output!;
    }
  );
  return chatFlow(input);
}
