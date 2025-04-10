const express = require('express');
const axios = require('axios');
const { Readable } = require('stream');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());
app.post('/generate', async (req, res) => {
  const { prompt } = req.body;
console.log("request recieved")
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    const basePrompt =  "You are an AI that outputs ONLY raw HTML code for advertisements. Do not include any explanation, description, markdown, or commentary. Your response must start and end with a single complete HTML snippet. The HTML should include a headline, subheadline, and call-to-action, styled using minimal inline CSS. \n\nOnly return HTML.\n\nUser request: Create an ad for a new AI platform that helps professionals skill up faster."
    
//     `
// You are a world-class creative director and copywriter. Your job is to generate emotionally engaging and persuasive advertisements in clean HTML. 
// The response should be a single HTML snippet with headline, subheadline, and call-to-action, styled simply using inline CSS or class names. 
// Do not include any explanations, markdown, or commentary—just the HTML output.

// User request: `;
    const ollamaRes = await axios({
      method: 'post',
      url: 'http://20.5.232.184:11434/api/generate',
      data: {
        // prompt:`You are a world-class creative director and marketing expert. Your job is to generate compelling, persuasive advertising content that instantly grabs attention and emotionally connects with the target audience. Be imaginative, bold, and clear in your language. Avoid fluff. Stay focused on delivering a powerful message.\n\nUser request: ${prompt}`,
        prompt:basePrompt+  prompt,
        model: "qwen2.5-coder:32b",
        type: 'text',
        "stream":true,
        // parameters: {
        //   creativityLevel: 0.65,
        // },
      },
      responseType: 'stream',
    });

    res.setHeader('Content-Type', 'application/json');

    ollamaRes.data.on('data', (chunk) => {
      try {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (let line of lines) {
          const json = JSON.parse(line);
          const { response, done } = json;
          res.write(JSON.stringify({ response, done }) + '\n');
        }
      } catch (err) {
        // skip malformed JSON
      }
    });

    ollamaRes.data.on('end', () => res.end());
    ollamaRes.data.on('error', () => res.status(500).end());

  } catch (err) {
    console.error('Error forwarding to DeepSeek API:', err.message);
    res.status(500).json({ error: 'Failed to generate response' });
  }
});

app.listen(PORT, () => {
  console.log(`Wrapper API running on http://localhost:${PORT}`);
});
