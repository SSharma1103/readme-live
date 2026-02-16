import fetch from 'node-fetch';
import fs from 'fs';

const cache = new Map();

export async function renderMarkdown(filePath: string, token?: string | null) {
  const content = fs.readFileSync(filePath, 'utf8');
  const stats = fs.statSync(filePath);
  const cacheKey = `${filePath}-${stats.mtimeMs}`;

  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const headers: Record<string, string> = { 
    'Content-Type': 'application/json' 
};

if (token) {
    headers['Authorization'] = `token ${token}`; // Now this works!
}

  const response = await fetch('https://api.github.com/markdown', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text: content, mode: 'gfm' })
  });

  if (!response.ok) throw new Error(`GitHub API Error: ${response.status}`);

  const html = await response.text();
  cache.set(cacheKey, html);
  return html;
}