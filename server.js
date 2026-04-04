import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.static(__dirname));

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error('WARNING: ANTHROPIC_API_KEY is not set. Receipt OCR will not work.');
}
const client = new Anthropic({ apiKey: apiKey || 'missing' });

// Receipt OCR via Claude Vision
app.post('/api/receipt-ocr', async (req, res) => {
  const { image, mediaType } = req.body;

  if (!image) {
    return res.status(400).json({ error: 'No image provided' });
  }

  // Detect media type
  let detectedType = mediaType || 'image/jpeg';
  if (!mediaType || detectedType === 'image/jpeg') {
    if (image.startsWith('iVBOR')) detectedType = 'image/png';
    else if (image.startsWith('R0lGO')) detectedType = 'image/gif';
    else if (image.startsWith('UklGR')) detectedType = 'image/webp';
  }

  // Validate it's actual base64 (no data URI prefix)
  const cleanBase64 = image.replace(/^data:image\/[^;]+;base64,/, '');

  console.log('Receipt OCR: media_type=' + detectedType + ', base64_length=' + cleanBase64.length);

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: detectedType,
              data: cleanBase64,
            },
          },
          {
            type: 'text',
            text: `You are a receipt and invoice reading assistant. Look at this image carefully.

Extract the following fields:
- vendor: The business name or supplier name on the receipt/invoice
- amount: The total amount due or paid (numbers only, no currency symbol, no commas — e.g. 142.50)
- date: The date on the receipt or invoice in YYYY-MM-DD format
- category: Choose EXACTLY ONE from this list: Materials, Labour, Equipment, Subcontractor, Permits, Other
- notes: Any useful detail such as invoice number, PO number, or description of goods/services (max 100 chars, or empty string if none)

Rules:
- If the image is an invoice (not a retail receipt), still extract the same fields
- If you cannot read a field clearly, use an empty string — do not guess
- Return ONLY a valid JSON object with no explanation, no markdown, no backticks
- Format: {"vendor":"","amount":"","date":"","category":"","notes":""}`
          }
        ],
      }],
    });

    const rawText = message.content[0].text.trim();
    console.log('Receipt OCR raw response:', rawText);

    // Strip markdown fences if present
    const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

    // Try to extract JSON
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Receipt OCR: No JSON found in response:', rawText);
      return res.status(500).json({ error: 'Could not parse receipt data. AI response: ' + rawText.substring(0, 100) });
    }

    const json = JSON.parse(jsonMatch[0]);

    // Clean up amount — remove any remaining symbols
    if (json.amount) {
      json.amount = String(json.amount).replace(/[$,\s]/g, '');
    }

    console.log('Receipt OCR parsed:', json);
    res.json(json);
  } catch (err) {
    console.error('Receipt OCR error:', err.message || err);
    if (err.message && err.message.includes('Could not process image')) {
      res.status(400).json({ error: 'Image could not be read. Try a clearer photo.' });
    } else if (err.message && err.message.includes('rate_limit')) {
      res.status(429).json({ error: 'Too many requests. Wait a moment and try again.' });
    } else {
      res.status(500).json({ error: 'Failed to process receipt: ' + (err.message || 'Unknown error') });
    }
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    anthropic_key_set: !!process.env.ANTHROPIC_API_KEY,
    node_version: process.version,
  });
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
