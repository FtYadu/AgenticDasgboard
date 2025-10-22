import OpenAI from 'openai';

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function gptAgent(command, payload) {
  if (!client) {
    return {
      output: `OPENAI_API_KEY missing. Simulated response for command: ${command}`,
    };
  }

  const prompt = payload.prompt || `Execute command: ${command}`;
  const response = await client.responses.create({
    model: process.env.OPENAI_MODEL || 'gpt-4.1-mini',
    input: prompt,
  });

  const output = response.output_text || 'No content returned.';

  return { output };
}
