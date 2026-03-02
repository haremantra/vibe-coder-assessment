import 'dotenv/config';

const url = (process.env.BUILT_IN_FORGE_API_URL || 'https://forge.manus.im').replace(/\/$/, '') + '/v1/chat/completions';
const key = process.env.BUILT_IN_FORGE_API_KEY;

if (!key) {
  console.log('No API key found');
  process.exit(1);
}

const resp = await fetch(url, {
  method: 'POST',
  headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
  body: JSON.stringify({
    model: 'gemini-2.5-flash',
    messages: [
      { role: 'user', content: 'Say hello in one sentence.' }
    ],
    max_tokens: 100,
    thinking: { budget_tokens: 128 }
  })
});

const data = await resp.json();
console.log('Full response:', JSON.stringify(data, null, 2));
console.log('\n--- Key fields ---');
console.log('choices type:', typeof data.choices);
console.log('choices is array:', Array.isArray(data.choices));
if (data.choices && data.choices[0]) {
  console.log('message:', JSON.stringify(data.choices[0].message, null, 2));
  console.log('content type:', typeof data.choices[0].message?.content);
  console.log('content is array:', Array.isArray(data.choices[0].message?.content));
}
