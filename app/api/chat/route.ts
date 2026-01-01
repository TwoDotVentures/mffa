import { streamText, type ModelMessage } from 'ai';
import { createClient } from '@/lib/supabase/server';
import { getModel, type AIProvider } from '@/lib/ai/providers';
import { SYSTEM_PROMPT } from '@/lib/ai/system-prompt';
import { allTools } from '@/lib/ai/tools';

interface ChatMessage {
  role: string;
  content: string;
}

// Convert chat messages to model-compatible format
function convertMessages(messages: ChatMessage[]): ModelMessage[] {
  return messages.map((msg): ModelMessage => {
    if (msg.role === 'user') {
      return { role: 'user', content: msg.content };
    } else if (msg.role === 'assistant') {
      return { role: 'assistant', content: msg.content };
    }
    return { role: 'user', content: msg.content };
  });
}

export const maxDuration = 60; // Allow up to 60 seconds for complex queries

export async function POST(req: Request) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get request body
    const { messages, conversationId } = await req.json() as {
      messages: ChatMessage[];
      conversationId?: string;
    };

    // Get user's AI settings
    const { data: settings } = await supabase
      .from('ai_settings')
      .select('provider, model, api_key_encrypted, temperature')
      .eq('user_id', user.id)
      .single();

    // Use default settings if none configured
    const provider = (settings?.provider || 'anthropic') as AIProvider;
    const modelId = settings?.model || 'claude-sonnet-4-20250514';
    const temperature = settings?.temperature || 0.7;
    const apiKey = settings?.api_key_encrypted; // TODO: Decrypt in production

    // Get the model instance
    let model;
    try {
      model = getModel({
        provider,
        modelId,
        apiKey: apiKey || undefined,
        temperature,
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: `AI model not configured. Please add your ${provider} API key in settings.`,
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Convert messages to model format and stream
    const modelMessages = convertMessages(messages);

    const result = streamText({
      model,
      system: SYSTEM_PROMPT,
      messages: modelMessages,
      tools: allTools,
      onFinish: async ({ text }) => {
        // Save conversation to database
        try {
          const updatedMessages = [
            ...messages,
            { role: 'assistant', content: text },
          ];

          if (conversationId) {
            // Update existing conversation
            await supabase
              .from('ai_conversations')
              .update({
                messages: updatedMessages,
                model_used: `${provider}/${modelId}`,
              })
              .eq('id', conversationId)
              .eq('user_id', user.id);
          } else {
            // Create new conversation
            const title = messages[0]?.content?.toString().slice(0, 100) || 'New conversation';
            await supabase
              .from('ai_conversations')
              .insert({
                user_id: user.id,
                title,
                messages: updatedMessages,
                model_used: `${provider}/${modelId}`,
              });
          }
        } catch (saveError) {
          console.error('Error saving conversation:', saveError);
        }
      },
    });

    // Return streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred processing your request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Get conversation history
export async function GET(req: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('id');

    if (conversationId) {
      // Get specific conversation
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: 'Conversation not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return Response.json(data);
    } else {
      // Get all conversations
      const { data, error } = await supabase
        .from('ai_conversations')
        .select('id, title, model_used, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(50);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }

      return Response.json({ conversations: data });
    }
  } catch (error) {
    console.error('Get conversations error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// Delete conversation
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return new Response(
        JSON.stringify({ error: 'Conversation ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error } = await supabase
      .from('ai_conversations')
      .delete()
      .eq('id', conversationId)
      .eq('user_id', user.id);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Delete conversation error:', error);
    return new Response(
      JSON.stringify({ error: 'An error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
