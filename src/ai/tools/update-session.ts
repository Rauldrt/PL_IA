'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeFirebaseAdmin } from '@/firebase/admin';
import { getFirestore } from 'firebase-admin/firestore';

const UpdateSessionInputSchema = z.object({
  sessionId: z.string().describe('The ID of the session to update.'),
  lastMessage: z.string().describe('The last message to set in the session.'),
});

type UpdateSessionInput = z.infer<typeof UpdateSessionInputSchema>;

export const updateSession = ai.defineTool(
    {
        name: 'updateSession',
        description: 'Updates the last message of a chat session.',
        inputSchema: UpdateSessionInputSchema,
        outputSchema: z.void(),
    },
    async (input) => {
        initializeFirebaseAdmin();
        const firestore = getFirestore();

        // This tool is meant to be called in the background, so we don't await it.
        // It's a "fire and forget" operation from the flow's perspective.
        // We handle errors internally but don't block the flow.
        try {
            const flowState = ai.internal.state()?.flow;
            if (!flowState?.context?.firebase?.uid || !input.sessionId) {
                console.warn('Cannot update session: UID or SessionID is missing.');
                return;
            }
            
            const userId = flowState.context.firebase.uid;
            const sessionRef = firestore.doc(`users/${userId}/sessions/${input.sessionId}`);

            await sessionRef.update({ lastMessage: input.lastMessage });
        } catch (error) {
            // Log the error but don't throw, to avoid crashing the main flow
            console.error('Error updating session in updateSession tool:', error);
        }
    }
);
