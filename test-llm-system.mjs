import 'dotenv/config';
import { readFileSync } from 'fs';

const url = (process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.im').replace(/\/$/, '') + '/v1/chat/completions';
const key = process.env.BUILT_IN_FORGE_API_KEY;

// Extract the system prompt from assessment.ts
const src = readFileSync('server/assessment.ts', 'utf8');
const match = src.match(/const SYSTEM_PROMPT = `([\s\S]*?)`;/);
if (!match) { console.log('Could not extract system prompt'); process.exit(1); }
const systemPrompt = match[1];
console.log('System prompt length:', systemPrompt.length, 'chars');

const resp = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
  body: JSON.stringify({
    model: 'gemini-2.5-flash',
    messages: [
      { role: 'system', content: systemPrompt }
    ],
    max_tokens: 500,
    thinking: { budget_tokens: 128 }
  })
});

console.log('HTTP status:', resp.status, resp.statusText);
const data = await resp.json();

if (data.error) {
  console.log('ERROR:', JSON.stringify(data.error, null, 2));
} else {
  console.log('Success! Content:', data.choices?.[0]?.message?.content?.substring(0, 300));
}
