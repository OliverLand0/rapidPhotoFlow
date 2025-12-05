# RapidPhotoFlow AI Service

A Node.js service that provides AI-powered image tagging using OpenAI's GPT-4 Vision API.

## Overview

The AI service is a stateless worker that:
1. Receives image tagging requests from the frontend or backend
2. Fetches image data from the backend API
3. Sends images to OpenAI GPT-4o-mini Vision for analysis
4. Returns descriptive tags for each image
5. Optionally applies tags directly to photos via the backend API

## Features

- **Single Image Analysis** - Analyze individual images
- **Batch Processing** - Efficiently analyze multiple images
- **Auto-Apply Tags** - Automatically save tags to backend
- **Cost Optimization** - Combine multiple images per API call
- **Error Resilience** - Per-photo error handling, graceful degradation

---

## API Endpoints

### Health Check

```http
GET /health
GET /ai/health
```

**Response:**
```json
{
  "status": "healthy",
  "openaiConfigured": true
}
```

### Analyze Single Image

Analyze an image and return suggested tags without applying them.

```http
POST /ai/analyze
Content-Type: application/json
```

**Request:**
```json
{
  "photoId": "uuid-of-photo"
}
```

**Response:**
```json
{
  "success": true,
  "photoId": "uuid-of-photo",
  "tags": ["landscape", "mountain", "sunset", "nature", "outdoor"]
}
```

### Analyze and Apply

Analyze an image and automatically apply tags to the photo.

```http
POST /ai/analyze-and-apply
Content-Type: application/json
```

**Request:**
```json
{
  "photoId": "uuid-of-photo"
}
```

**Response:**
```json
{
  "success": true,
  "photoId": "uuid-of-photo",
  "tags": ["landscape", "mountain", "sunset"],
  "applied": true,
  "failedTags": []
}
```

### Batch Analyze and Apply

Analyze multiple images efficiently by combining API calls.

```http
POST /ai/batch-analyze-and-apply
Content-Type: application/json
```

**Request:**
```json
{
  "photoIds": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"],
  "imagesPerRequest": 5
}
```

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `photoIds` | string[] | required | Array of photo UUIDs (max 100) |
| `imagesPerRequest` | number | 5 | Images to combine per API call (1-10) |

**Response:**
```json
{
  "success": true,
  "total": 5,
  "processed": 5,
  "succeeded": 5,
  "failed": 0,
  "results": [
    {
      "photoId": "uuid1",
      "success": true,
      "tags": ["portrait", "indoor", "person"]
    },
    {
      "photoId": "uuid2",
      "success": true,
      "tags": ["landscape", "outdoor", "mountains"]
    }
  ]
}
```

---

## Tag Generation

### What the AI Detects

The AI analyzes images and generates 3-8 descriptive tags covering:

- **Main subjects** - People, animals, objects
- **Scene type** - Landscape, portrait, indoor, outdoor
- **Colors and mood** - Warm, cool, vibrant, muted
- **Activities** - Running, eating, working, playing
- **Time of day** - Morning, sunset, night (if apparent)
- **Location type** - Beach, city, forest, home

### Tag Format

- Lowercase
- No special characters
- Maximum 30 characters per tag
- Duplicates removed
- 3-8 tags per image

### Example Tags

| Image Type | Example Tags |
|------------|--------------|
| Beach sunset | `beach`, `sunset`, `ocean`, `warm`, `vacation` |
| Portrait | `portrait`, `person`, `indoor`, `professional` |
| Food photo | `food`, `restaurant`, `meal`, `dinner`, `closeup` |
| Wildlife | `animal`, `bird`, `nature`, `wildlife`, `outdoor` |
| Architecture | `building`, `architecture`, `city`, `urban`, `modern` |

---

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `BACKEND_URL` | No | Backend API URL (default: `http://localhost:8080`) |
| `PORT` | No | Server port (default: `3001`) |

### OpenAI Settings

The service uses GPT-4o-mini for cost-effective image analysis:

```javascript
{
  model: 'gpt-4o-mini',
  max_tokens: 150,
  temperature: 0.3
}
```

---

## Local Development

### Prerequisites

- Node.js 18+ (required for native fetch)
- OpenAI API key
- Backend service running

### Setup

```bash
cd ai-service
npm install
```

### Running

```bash
# With environment variable
OPENAI_API_KEY=your-key npm run dev

# Or with .env file
echo "OPENAI_API_KEY=your-key" > .env
npm run dev
```

### Testing

```bash
# Health check
curl http://localhost:3001/health

# Analyze a photo (requires valid photoId from backend)
curl -X POST http://localhost:3001/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{"photoId": "your-photo-uuid"}'
```

---

## Architecture

### Request Flow

```
Frontend/Backend
       |
       v
 AI Service (Express)
       |
       v
 Fetch Image from Backend
       |
       v
 Convert to Base64
       |
       v
 OpenAI GPT-4o-mini Vision
       |
       v
 Parse Tags from Response
       |
       v
 (Optional) POST tags to Backend
       |
       v
 Return Results
```

### Batch Processing Flow

For batch requests, the service optimizes API calls:

```
5 photos requested, imagesPerRequest=5
       |
       v
 Fetch all 5 images
       |
       v
 Single OpenAI call with 5 images
       |
       v
 Parse tags for each image
       |
       v
 POST tags to backend for each photo
       |
       v
 Return combined results
```

### Cost Optimization

| Strategy | Description |
|----------|-------------|
| GPT-4o-mini | Cheaper than GPT-4 Vision, similar quality for tags |
| Batch combining | Multiple images per API call reduces overhead |
| Low max_tokens | 150 tokens sufficient for 3-8 tags |
| Cached images | Images fetched once per request |

---

## Error Handling

### Per-Photo Isolation

Errors for individual photos don't fail the entire batch:

```json
{
  "success": true,
  "total": 5,
  "processed": 5,
  "succeeded": 4,
  "failed": 1,
  "results": [
    { "photoId": "uuid1", "success": true, "tags": ["..."] },
    { "photoId": "uuid2", "success": false, "error": "Image fetch failed" },
    { "photoId": "uuid3", "success": true, "tags": ["..."] }
  ]
}
```

### Common Errors

| Error | Cause | Handling |
|-------|-------|----------|
| Image fetch failed | Backend unavailable or photo deleted | Skip photo, continue batch |
| OpenAI rate limit | Too many requests | Return error, retry logic in caller |
| Invalid image format | Unsupported format | Skip photo, log warning |
| Tag application failed | Backend error on POST | Report in `failedTags` array |

---

## Deployment

### Docker

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src ./src

ENV PORT=3001
EXPOSE 3001

CMD ["node", "src/index.js"]
```

### AWS ECS

The service runs on AWS ECS Fargate with minimal resources:

- **CPU:** 256 units
- **Memory:** 512 MB
- **Port:** 3001
- **Health check:** `GET /health`

### Environment

Production environment variables are stored in AWS Secrets Manager:

```
OPENAI_API_KEY  → from Secrets Manager
BACKEND_URL     → http://backend.internal:8080
PORT            → 3001
```

---

## File Structure

```
ai-service/
├── src/
│   └── index.js      # Main Express server
├── package.json      # Dependencies
├── Dockerfile        # Container definition
└── README.md         # This file
```

---

## Integration

### Frontend Integration

The frontend calls the AI service directly for tagging:

```typescript
// client.ts
const AI_SERVICE_BASE = isDev
  ? "http://localhost:3001/ai"
  : "/ai";

export const aiClient = {
  analyze: (photoId: string) =>
    post(`${AI_SERVICE_BASE}/analyze`, { photoId }),

  analyzeAndApply: (photoId: string) =>
    post(`${AI_SERVICE_BASE}/analyze-and-apply`, { photoId }),

  batchAnalyze: (photoIds: string[]) =>
    post(`${AI_SERVICE_BASE}/batch-analyze-and-apply`, { photoIds })
};
```

### Backend Integration

The AI service fetches images and posts tags to the backend:

```javascript
// Fetch image
const imageResponse = await fetch(
  `${BACKEND_URL}/api/photos/${photoId}/content`
);

// Apply tags
await fetch(
  `${BACKEND_URL}/api/internal/photos/${photoId}/tags`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tags })
  }
);
```

---

## Monitoring

### Health Checks

ECS performs health checks every 30 seconds:

```
GET /health → 200 OK
```

### Logging

The service logs key events:

```
[INFO] Server started on port 3001
[INFO] Analyzing photo uuid-123
[INFO] Generated 5 tags for photo uuid-123
[WARN] Failed to fetch image uuid-456: 404
[ERROR] OpenAI API error: Rate limit exceeded
```

### Metrics

Key metrics to monitor:

- Request count per endpoint
- Average response time
- OpenAI API error rate
- Tag application success rate
