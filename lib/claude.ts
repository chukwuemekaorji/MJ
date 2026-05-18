const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY!;
const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? 'claude-3-5-sonnet-20241022';

type ClaudeMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export async function callClaude(messages: ClaudeMessage[]) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': CLAUDE_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 512,
      messages
    })
  });

  if (!res.ok) {
    throw new Error(`Claude error: ${res.status}`);
  }

  const data = await res.json();
  const text = data.content?.[0]?.text ?? '';
  return text as string;
}
