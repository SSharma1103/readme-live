#!/usr/bin/env node
import { program } from 'commander';
import express from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { renderMarkdown } from '../src/renderer.js';
import { getTemplate } from '../src/template.js';

interface CLIOptions {
  port: string;
  wsPort: string;
  token?: string;
}

program
  .name('readme-live')
  .description('GitHub-flavored live preview for your README')
  .argument('[file]', 'File to watch', 'README.md')
  .option('-p, --port <number>', 'Web server port', '3000')
  .option('-w, --ws-port <number>', 'WebSocket port', '8080')
  .option('-t, --token <string>', 'GitHub Personal Access Token')
  .action(async (file: string, options: CLIOptions) => {
    const filePath = path.resolve(process.cwd(), file);
    
    if (!fs.existsSync(filePath)) {
      console.error(`\x1b[31mError: File not found: ${filePath}\x1b[0m`);
      process.exit(1);
    }

    // Prioritize: CLI Flag > Environment Variable > Null
    const githubToken = options.token || process.env.GH_TOKEN || null;
    const webPort = parseInt(options.port);
    const wsPort = parseInt(options.wsPort);

    const app = express();
    const wss = new WebSocketServer({ port: wsPort });

    let currentHtml = await renderMarkdown(filePath, githubToken);

    app.get('/', (_, res) => {
      res.send(getTemplate(currentHtml, wsPort));
    });

    // Chokidar "Watchman" logic
    chokidar.watch(filePath).on('change', async () => {
      try {
        currentHtml = await renderMarkdown(filePath, githubToken);
        console.log(`\x1b[32m%s\x1b[0m`, `[${new Date().toLocaleTimeString()}] Re-rendered ${file}`);
        
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ html: currentHtml }));
          }
        });
      } catch (err) {
        console.error('\x1b[31mRender failed:\x1b[0m', err instanceof Error ? err.message : err);
      }
    });

    app.listen(webPort, () => {
      console.log('\n-------------------------------------------');
      console.log(`🚀 Preview: http://localhost:${webPort}`);
      console.log(`🛡️  Watchman guarding: ${file}`);
      if (githubToken) console.log(`🔑 Using GitHub Token for increased rate limits.`);
      console.log('-------------------------------------------\n');
    });
  });

program.parse();