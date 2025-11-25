/**
 * AI Chat API Route
 *
 * Handles streaming chat requests using Vercel AI SDK
 * Requires authentication and organization context
 */

import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { generateChatResponse, type ChatMessage } from '@/lib/features/ai/chat/assistant';

export const runtime = 'nodejs';
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const headersList = await headers();
    const session = await auth.api.getSession({
      headers: headersList,
    });

    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Parse request body
    const body = await req.json();
    const { messages, context } = body as {
      messages: ChatMessage[];
      context?: {
        organizationName?: string;
        recentLeads?: Array<{
          name?: string | null;
          company?: string | null;
          status?: string | null;
        }>;
      };
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Generate streaming response
    return await generateChatResponse(messages, context);
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
