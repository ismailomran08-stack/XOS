import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

const client = new Anthropic();

// Receipt OCR via Claude Vision
app.post('/api/receipt-ocr', async (req, res) => {
  const { image, mediaType } = req.body; // base64 encoded image + optional media type

  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  // Detect media type from base64 header or passed value
  let detectedType = mediaType || 'image/jpeg';
  if (!mediaType) {
    if (image.startsWith('iVBOR')) detectedType = 'image/png';
    else if (image.startsWith('R0lGO')) detectedType = 'image/gif';
    else if (image.startsWith('UklGR')) detectedType = 'image/webp';
  }

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: detectedType,
              data: image,
            },
          },
          {
            type: 'text',
            text: 'Look at this receipt image. Extract: vendor name, total amount (numbers only, no currency symbol), date (YYYY-MM-DD format), and suggest ONE category from: Materials, Labour, Equipment, Subcontractor, Permits, Other. Return ONLY valid JSON, no explanation: {"vendor", "amount", "date", "category", "notes"}'
          }
        ],
      }],
    });

    const text = message.content[0].text;
    // Try to extract JSON even if wrapped in markdown
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Could not parse receipt data.' });
    }
    const json = JSON.parse(jsonMatch[0]);
    res.json(json);
  } catch (err) {
    console.error('Receipt OCR error:', err);
    res.status(500).json({ error: 'Failed to process receipt. Please try again.' });
  }
});

// Serve index.html for all non-API routes (SPA)
app.get('/{*splat}', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3456;
app.listen(PORT, () => {
  console.log(`XOS server running at http://localhost:${PORT}`);
});
