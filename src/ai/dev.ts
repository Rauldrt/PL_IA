import { config } from 'dotenv';
config();

import '@/ai/flows/sentiment-analysis.ts';
import '@/ai/flows/suggested-messages.ts';
import '@/ai/flows/chat.ts';
import '@/ai/tools/update-session.ts';
