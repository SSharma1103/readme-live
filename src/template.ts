/**
 * Generates the HTML shell with GitHub styling and WebSocket logic
 */
export const getTemplate = (html: string, wsPort: number): string => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Readme Live Preview</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/github-markdown-css/5.2.0/github-markdown-dark.min.css">
    <style>
        body { 
            background-color: #0d1117; 
            margin: 0;
            display: flex; 
            justify-content: center; 
        }
        .markdown-body { 
            box-sizing: border-box;
            width: 100%; 
            max-width: 850px; 
            margin: 2rem;
            padding: 3rem; 
            border: 1px solid #30363d; 
            border-radius: 8px; 
        }
        @media (max-width: 767px) {
            .markdown-body { padding: 15px; }
        }
    </style>
</head>
<body class="markdown-body">
    <div id="root">${html}</div>
    <script>
        const ws = new WebSocket('ws://localhost:${wsPort}');
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.html) {
                document.getElementById('root').innerHTML = data.html;
            }
        };
        ws.onclose = () => console.log('Live-reload connection closed.');
    </script>
</body>
</html>
`;