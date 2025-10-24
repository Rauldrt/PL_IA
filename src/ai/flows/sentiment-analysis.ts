'use server';
/**
 * @fileOverview A sentiment analysis AI agent.
 *
 * - analyzeSentiment - A function that handles the sentiment analysis process.
 * - SentimentAnalysisInput - The input type for the analyzeSentiment function.
 * - SentimentAnalysisOutput - The return type for the analyzeSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SentimentAnalysisInputSchema = z.object({
  text: z.string().describe('The text to analyze for sentiment.'),
});
export type SentimentAnalysisInput = z.infer<typeof SentimentAnalysisInputSchema>;

const SentimentAnalysisOutputSchema = z.object({
  sentiment: z
    .string()
    .describe(
      'The sentiment of the text, can be positive, negative, or neutral.'
    ),
  score: z.number().describe('The sentiment score of the text from -1 to 1.'),
});
export type SentimentAnalysisOutput = z.infer<typeof SentimentAnalysisOutputSchema>;

export async function analyzeSentiment(
  input: SentimentAnalysisInput
): Promise<SentimentAnalysisOutput> {
  const prompt = ai.definePrompt({
    name: 'sentimentAnalysisPrompt',
    input: {schema: SentimentAnalysisInputSchema},
    output: {schema: SentimentAnalysisOutputSchema},
    prompt: `You are a sentiment analysis expert.

Analyze the sentiment of the following text and provide a sentiment and a score.

Text: {{{text}}}

Respond with a JSON object with a "sentiment" key and a "score" key.
The sentiment should be one of "positive", "negative", or "neutral".
The score should be a number from -1 to 1, where -1 is very negative and 1 is very positive.
`,
  });
  
  const analyzeSentimentFlow = ai.defineFlow(
    {
      name: 'analyzeSentimentFlow',
      inputSchema: SentimentAnalysisInputSchema,
      outputSchema: SentimentAnalysisOutputSchema,
    },
    async input => {
      const {output} = await prompt(input);
      return output!;
    }
  );
  return analyzeSentimentFlow(input);
}