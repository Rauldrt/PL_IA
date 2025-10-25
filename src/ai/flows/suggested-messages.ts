'use server';

/**
 * @fileOverview Generates suggested messages for the user to start a conversation with the Gemini agent,
 * based on the provided knowledge base.
 *
 * - getSuggestedMessages - A function that generates suggested messages.
 * - SuggestedMessagesOutput - The return type for the getSuggestedMessages function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestedMessagesInputSchema = z.object({
    knowledge: z.string().optional().describe('The knowledge base to generate suggestions from.'),
});
type SuggestedMessagesInput = z.infer<typeof SuggestedMessagesInputSchema>;

const SuggestedMessagesOutputSchema = z.object({
  messages: z.array(
    z.string().describe('A suggested message to start a conversation.')
  ).describe('An array of suggested messages.')
});
type SuggestedMessagesOutput = z.infer<typeof SuggestedMessagesOutputSchema>;

export async function getSuggestedMessages(input: SuggestedMessagesInput): Promise<SuggestedMessagesOutput> {
  const prompt = ai.definePrompt({
    name: 'suggestedMessagesPrompt',
    input: { schema: SuggestedMessagesInputSchema },
    output: { schema: SuggestedMessagesOutputSchema },
    prompt: `You are an AI assistant designed to help users start conversations with a Gemini agent.

  Generate a list of suggested messages that a user can use to begin interacting with the Gemini agent.
  The messages should be in Spanish.
  The messages should be diverse and showcase the different capabilities of the Gemini agent.
  Each message should be concise and to the point.

  Base your suggestions on the following knowledge base if provided:
  {{{knowledge}}}

  Format the output as a JSON object with a "messages" field containing an array of strings.
  `
  });

  const suggestedMessagesFlow = ai.defineFlow(
    {
      name: 'suggestedMessagesFlow',
      inputSchema: SuggestedMessagesInputSchema,
      outputSchema: SuggestedMessagesOutputSchema,
    },
    async (input) => {
      const { output } = await prompt(input);
      return output!;
    }
  );
  return suggestedMessagesFlow(input);
}
