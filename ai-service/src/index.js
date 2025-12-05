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
 * Generate tags for a single image using GPT-4 Vision
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

/**
 * Generate tags for multiple images in a single API call (cost optimization)
 * @param {Array<{photoId: string, base64: string, mimeType: string}>} images - Array of images
 * @returns {Promise<Array<{photoId: string, tags: string[]}>>} - Array of results
 */
async function generateTagsForMultipleImages(images) {
  if (images.length === 0) return [];
  if (images.length === 1) {
    // Single image - use simpler format
    const tags = await generateTagsForImage(images[0].base64, images[0].mimeType);
    return [{ photoId: images[0].photoId, tags }];
  }

  // Build content array with all images
  const content = [
    {
      type: 'text',
      text: `Analyze these ${images.length} images and generate descriptive tags for each.
Return a JSON object where keys are image numbers (1, 2, 3, etc.) and values are arrays of 3-8 lowercase tags.
Focus on: subjects, scene type, colors, mood, activities, time of day.

Example response for 3 images:
{"1": ["sunset", "beach", "orange"], "2": ["portrait", "woman", "indoor"], "3": ["forest", "green", "nature"]}

Return ONLY the JSON object, no other text.`,
    },
  ];

  // Add each image
  images.forEach((img, index) => {
    content.push({
      type: 'image_url',
      image_url: {
        url: `data:${img.mimeType};base64,${img.base64}`,
        detail: 'low',
      },
    });
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content }],
    max_tokens: 100 * images.length, // Scale tokens with image count
  });

  const responseContent = response.choices[0]?.message?.content || '{}';

  // Parse the JSON response
  try {
    // Handle potential markdown code blocks
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);

      // Map results back to photo IDs
      return images.map((img, index) => {
        const key = String(index + 1);
        const tags = parsed[key] || [];
        return {
          photoId: img.photoId,
          tags: Array.isArray(tags)
            ? tags.map(t => String(t).toLowerCase().trim()).filter(t => t.length > 0 && t.length < 30)
            : [],
        };
      });
    }
  } catch (parseError) {
    console.error('Failed to parse multi-image tags from response:', responseContent);
  }

  // Fallback: return empty tags for all
  return images.map(img => ({ photoId: img.photoId, tags: [] }));
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
 * Process a single photo: analyze and apply tags
 * @param {string} photoId - The photo ID to process
 * @returns {Promise<{photoId: string, success: boolean, tags?: string[], failedTags?: string[], error?: string}>}
 */
async function processPhotoTagging(photoId) {
  try {
    // Fetch image from backend and convert to base64
    const { base64, mimeType } = await fetchImageAsBase64(photoId);

    const tags = await generateTagsForImage(base64, mimeType);

    if (tags.length === 0) {
      return {
        photoId,
        success: true,
        tags: [],
        applied: false,
        message: 'No tags could be generated for this image',
      };
    }

    // Apply each tag to the photo via the backend internal API (no auth required)
    const appliedTags = [];
    const failedTags = [];

    for (const tag of tags) {
      try {
        const response = await fetch(`${BACKEND_URL}/api/internal/photos/${photoId}/tags`, {
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

    return {
      photoId,
      success: true,
      tags: appliedTags,
      failedTags,
      applied: appliedTags.length > 0,
    };
  } catch (error) {
    return {
      photoId,
      success: false,
      error: error.message || 'Failed to analyze and apply tags',
    };
  }
}

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

    const result = await processPhotoTagging(photoId);

    if (result.success) {
      console.log(`Applied ${result.tags?.length || 0} tags, ${result.failedTags?.length || 0} failed`);
    } else {
      console.error(`Error processing photo ${photoId}:`, result.error);
    }

    res.json(result);
  } catch (error) {
    console.error('Error in analyze-and-apply:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze and apply tags',
    });
  }
});

/**
 * Apply tags to a photo via backend API
 * @param {string} photoId - Photo ID
 * @param {string[]} tags - Tags to apply
 * @returns {Promise<{appliedTags: string[], failedTags: string[]}>}
 */
async function applyTagsToPhoto(photoId, tags) {
  const appliedTags = [];
  const failedTags = [];

  for (const tag of tags) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/internal/photos/${photoId}/tags`, {
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

  return { appliedTags, failedTags };
}

/**
 * Process photos in batches - OPTIMIZED: combines multiple images per API call
 * @param {string[]} photoIds - Array of photo IDs to process
 * @param {number} imagesPerRequest - Number of images to combine in each API call (default 5)
 * @returns {Promise<Array>} - Results for each photo
 */
async function processBatch(photoIds, imagesPerRequest = 5) {
  const results = [];

  // Process in chunks of imagesPerRequest (combine multiple images per API call)
  for (let i = 0; i < photoIds.length; i += imagesPerRequest) {
    const chunk = photoIds.slice(i, i + imagesPerRequest);
    console.log(`Processing images ${i + 1}-${Math.min(i + imagesPerRequest, photoIds.length)} of ${photoIds.length} (${chunk.length} images in 1 API call)...`);

    try {
      // Fetch all images in this chunk
      const images = [];
      for (const photoId of chunk) {
        try {
          const { base64, mimeType } = await fetchImageAsBase64(photoId);
          images.push({ photoId, base64, mimeType });
        } catch (fetchError) {
          console.error(`Failed to fetch image ${photoId}:`, fetchError);
          results.push({
            photoId,
            success: false,
            error: fetchError.message || 'Failed to fetch image',
          });
        }
      }

      if (images.length === 0) continue;

      // Generate tags for all images in a single API call
      const tagResults = await generateTagsForMultipleImages(images);

      // Apply tags to each photo
      for (const { photoId, tags } of tagResults) {
        if (tags.length === 0) {
          results.push({
            photoId,
            success: true,
            tags: [],
            applied: false,
            message: 'No tags could be generated for this image',
          });
          continue;
        }

        const { appliedTags, failedTags } = await applyTagsToPhoto(photoId, tags);
        results.push({
          photoId,
          success: true,
          tags: appliedTags,
          failedTags,
          applied: appliedTags.length > 0,
        });
      }
    } catch (error) {
      console.error(`Error processing chunk:`, error);
      // Mark all photos in this chunk as failed
      for (const photoId of chunk) {
        if (!results.find(r => r.photoId === photoId)) {
          results.push({
            photoId,
            success: false,
            error: error.message || 'Failed to process batch',
          });
        }
      }
    }

    console.log(`Batch progress: ${results.length}/${photoIds.length} photos processed`);
  }

  return results;
}

/**
 * POST /ai/batch-analyze-and-apply
 * Analyze multiple images and automatically apply tags to them
 * OPTIMIZED: Combines multiple images per API call to reduce costs
 *
 * Body: { photoIds: string[], imagesPerRequest?: number }
 * Response: {
 *   success: boolean,
 *   total: number,
 *   processed: number,
 *   succeeded: number,
 *   failed: number,
 *   results: Array<{photoId, success, tags?, failedTags?, error?}>
 * }
 */
app.post('/ai/batch-analyze-and-apply', async (req, res) => {
  try {
    const { photoIds, imagesPerRequest = 5 } = req.body;

    if (!photoIds || !Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'photoIds must be a non-empty array'
      });
    }

    // Limit batch size to prevent abuse
    const MAX_BATCH_SIZE = 100;
    if (photoIds.length > MAX_BATCH_SIZE) {
      return res.status(400).json({
        success: false,
        error: `Batch size exceeds maximum of ${MAX_BATCH_SIZE} photos`
      });
    }

    // Limit images per request (more images = potentially lower quality tags)
    const MAX_IMAGES_PER_REQUEST = 10;
    const effectiveImagesPerRequest = Math.min(Math.max(1, imagesPerRequest), MAX_IMAGES_PER_REQUEST);
    const apiCallsNeeded = Math.ceil(photoIds.length / effectiveImagesPerRequest);

    console.log(`Starting batch tagging for ${photoIds.length} photos (${effectiveImagesPerRequest} images/API call = ${apiCallsNeeded} API calls)`);

    const results = await processBatch(photoIds, effectiveImagesPerRequest);

    const succeeded = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Batch complete: ${succeeded} succeeded, ${failed} failed out of ${photoIds.length} total`);

    res.json({
      success: true,
      total: photoIds.length,
      processed: results.length,
      succeeded,
      failed,
      results,
    });
  } catch (error) {
    console.error('Error in batch-analyze-and-apply:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process batch',
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`AI Tagging Service running on port ${PORT}`);
  console.log(`Backend URL: ${BACKEND_URL}`);
  console.log(`OpenAI API Key: ${process.env.OPENAI_API_KEY ? 'configured' : 'MISSING!'}`);
});
