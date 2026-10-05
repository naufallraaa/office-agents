import OpenAI from 'openai';

const baseURL = process.env.LLM_BASE_URL || 'http://localhost:20128/v1';
const apiKey = process.env.LLM_API_KEY || 'dummy';
const model = process.env.LLM_MODEL || 'tier1';

export const llm = new OpenAI({
  baseURL,
  apiKey,
});

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await llm.chat.completions.create({
      model,
      messages: [{ role: 'user', content: 'Hi, respond with OK' }],
      max_tokens: 10,
    });
    const content = response.choices[0]?.message?.content || '';
    console.log('✓ LLM health check:', content.trim());
    return true;
  } catch (error: any) {
    console.error('✗ LLM health check failed:', error.message);
    return false;
  }
}

export { model };
