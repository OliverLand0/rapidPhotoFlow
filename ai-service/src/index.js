import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Fetch an image from the backend and convert to base64
 * @param {string} photoId - The photo ID to fetch
 * @returns {Promise<{base64: string, mimeType: string}>}
 */
async function fetchImageAsBase64(photoId) {
  const url = `${BACKEND_URL}/api/photos/${photoId}/content`;
  console.log(`Fetching image from: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  return {
    base64,
    mimeType: contentType,
  };
}

/**
 * Generate tags for an image using GPT-4 Vision
 * @param {string} base64Image - Base64 encoded image
 * @param {string} mimeType - MIME type of the image
 * @returns {Promise<string[]>} - Array of generated tags
 */
async function generateTagsForImage(base64Image, mimeType) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this image and generate descriptive tags for it.
Return ONLY a JSON array of lowercase tags (3-8 tags), no other text.
Focus on:
- Main subjects (people, animals, objects)
- Scene type (landscape, portrait, indoor, outdoor)
- Colors and mood
- Activities or actions
- Time of day if apparent

Example response: ["sunset", "beach", "silhouette", "orange", "peaceful", "ocean"]`,
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: 'low', // Use low detail to reduce tokens/cost
            },
          },
        ],
      },
    ],
    max_tokens: 150,
  });

  const content = response.choices[0]?.message?.content || '[]';

  // Parse the JSON array from the response
  try {
    // Handle potential markdown code blocks
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      const tags = JSON.parse(jsonMatch[0]);
      // Normalize and filter tags
      return tags
        .map(tag => String(tag).toLowerCase().trim())
        .filter(tag => tag.length > 0 && tag.length < 30);
    }
  } catch (parseError) {
    console.error('Failed to parse tags from response:', content);
  }

  return [];
}

// Health check endpoints (both paths for compatibility)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-tagging' });
});

app.get('/ai/health', (req, res) => {
  res.json({ status: 'ok', service: 'ai-tagging' });
});

/**
 * POST /ai/analyze
 * Analyze an image and return suggested tags
 *
 * Body: { photoId: string }
 * Response: { tags: string[], success: boolean }
 */
app.post('/ai/analyze', async (req, res) => {
  try {
    const { photoId } = req.body;

    if (!photoId) {
      return res.status(400).json({
        success: false,
        error: 'photoId is required'
      });
    }

    console.log(`Analyzing image for photo: ${photoId}`);

    // Fetch image from backend and convert to base64
    const { base64, mimeType } = await fetchImageAsBase64(photoId);

    const tags = await generateTagsForImage(base64, mimeType);

    console.log(`Generated tags: ${tags.join(', ')}`);

    res.json({
      success: true,
      tags,
      photoId,
    });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze image',
    });
  }
});

/**
 * POST /ai/analyze-and-apply
 * Analyze an image and automatically apply tags to it via the backend
 *
 * Body: { photoId: string }
 * Response: { tags: string[], applied: boolean, success: boolean }
 */
app.post('/ai/analyze-and-apply', async (req, res) => {
  try {
    const { photoId } = req.body;

    if (!photoId) {
      return res.status(400).json({
        success: false,
        error: 'photoId is required'
      });
    }

    console.log(`Analyzing and applying tags for photo: ${photoId}`);

    // Fetch image from backend and convert to base64
    const { base64, mimeType } = await fetchImageAsBase64(photoId);

    const tags = await generateTagsForImage(base64, mimeType);

    if (tags.length === 0) {
      return res.json({
        success: true,
        tags: [],
        applied: false,
        message: 'No tags could be generated for this image',
      });
    }

    // Apply each tag to the photo via the backend API
    const appliedTags = [];
    const failedTags = [];

    for (const tag of tags) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/photos/${photoId}/tags`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tag }),
        });

        if (response.ok) {
          appliedTags.push(tag);
        } else {
          failedTags.push(tag);
        }
      } catch (tagError) {
        console.error(`Failed to apply tag "${tag}":`, tagError);
        failedTags.push(tag);
      }
    }

    console.log(`Applied ${appliedTags.length} tags, ${failedTags.length} failed`);

    res.json({
      success: true,
      tags: appliedTags,
      failedTags,
      applied: appliedTags.length > 0,
    });
  } catch (error) {
    console.error('Error in analyze-and-apply:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze and apply tags',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`AI Tagging Service running on port ${PORT}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'configured' : 'MISSING!'}`);
});
