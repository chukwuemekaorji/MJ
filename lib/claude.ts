import Anthropic from '@anthropic-ai/sdk';

type OnDemandContentRequest = {
  prompt: string;
  context?: string;
};

const fallbackResponse = (request: OnDemandContentRequest) => {
  const contextLine = request.context ? ` Context: ${request.context}.` : '';
  return `Draft response for "${request.prompt}".${contextLine} Expand this into the final version with examples, structure, and a clear conclusion.`;
};

export async function generateOnDemandContent(request: OnDemandContentRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return fallbackResponse(request);
  }

  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: 'claude-3-5-sonnet-latest',
    max_tokens: 800,
    system: 'You generate concise, high-signal content for the MJ app.',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: request.context
              ? `Prompt: ${request.prompt}\nContext: ${request.context}`
              : `Prompt: ${request.prompt}`
          }
        ]
      }
    ]
  });

  return message.content
    .map((block) => ('text' in block ? block.text : ''))
    .join('\n')
    .trim();
}