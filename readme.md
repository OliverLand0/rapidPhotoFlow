# 📸 RapidPhotoFlow  
## https://photos.basedsecurity.net
### AI-Powered Photo Ingestion, Tagging & Review Platform  
**Domain-Driven Design • Modern Frontend • Distributed Services**

RapidPhotoFlow is a complete end-to-end photo ingestion and classification workflow.  
Users can upload batches of images, automatically tag them using AI, review & curate them with fast navigation, and track all actions through a domain event log.

This project demonstrates:
- Strict **Domain-Driven Design (DDD)** applied to a real product  
- A cleanly separated **knowledge graph** of domains: Ingestion, Processing, Review, Audit  
- A modern **React + TypeScript** frontend  
- A modular **Java Spring backend**  
- A dedicated **Node.js AI tagging service**  

---

# 🧠 Core Features

## 🚀 Upload & Ingestion
- Drag-and-drop or file picker upload  
- Live previews with progress + speed  
- Client-side validation (types, size)  
- Optional automatic AI tagging toggle  
- Large upload safety dialog (upload with AI / without AI / cancel)  
- Queued upload logic with retry/cancel support  

## 🤖 AI Auto-Tagging (OpenAI Vision)
- Automatic content tagging on upload or manually per photo  
- AI service fetches image data from backend → sends to OpenAI Vision → posts back tags  
- Supports suggested tags + manual tags  
- Re-run AI tagging without overwriting user-added tags  
- Graceful rate-limit and failure handling  

## 🔎 Powerful Search & Filters
- Search by filename, text, or tags  
- Tag autocomplete with suggestions  
- Status filtering (`PENDING`, `PROCESSING`, `FAILED`, `APPROVED`, etc.)  
- Sorting options (Newest/Oldest/Status)  
- Saved filters & views (user-defined + presets)  
- Powerful query engine inside `usePhotoFilters`  
- URL-sync planned for shareable views  

## 🖼️ Review Workflow
- Photo grid with status chips & tags  
- Click-to-preview modal with keyboard navigation  
- Selection system:
  - Select individual photos  
  - Select all on page  
  - Shift-range support (planned)  

## ⚡ Bulk Actions
- Bulk approve  
- Bulk reject  
- Bulk delete  
- Bulk auto-tag  
- Bulk retry failed photos  
- Confirmation dialogs  
- Bulk action summary and feedback  

## 🎛️ Keyboard Shortcuts (Power-User Ready)
- `←/→` navigate photos  
- `Enter` open preview  
- `A`, `R`, `D`, etc. for approve/reject/delete  
- `Shift` + click to multiselect  
- `?` opens keyboard shortcuts modal  
- Shortcut hints in UI  

## 📑 Event Log & Observability
- Complete event history for every action  
- Includes: upload, tagging, status changes, bulk actions  
- Live-updating event panel  
- Event click-through → navigate to photo  
- Filtering by event type (planned)  

## 🔄 Smart Polling / Data Freshness
- Centralized polling in `PhotosProvider`  
- Polling adapts based on system state:
  - Faster when processing is active  
  - Slower when stable  
- Manual refresh + "Last updated Xs ago" indicator  

---

# 🏛️ Architecture Overview (DDD-Focused)

RapidPhotoFlow is structured using **Domain-Driven Design** principles.

```/backend
/photo
/domain
/application
/infrastructure
/events
/domain
/application
/infrastructure
/ai
/application
/seed
/frontend
/models
/components
/hooks
/context
/ai-service
```

### 🔷 Bounded Contexts
1. **Ingestion** — upload, creation  
2. **Processing** — AI tagging, status transitions  
3. **Review** — approval, tagging, bulk ops  
4. **Audit/Events** — full event sourcing layer  

### 🔶 Backend (Java)
- Domain aggregates:
  - `Photo` (root)
  - `EventLog`  
- Strong domain events:
  - `PHOTO_UPLOADED`, `TAG_ADDED`, `PHOTO_APPROVED`, etc.  
- Repository interfaces (DDD):
  - `PhotoRepository`
  - `EventRepository`  
- Application services orchestrate domain workflow  
- Controllers are thin and API-only  

### 🔷 AI Service (Node.js)
- Stateless worker  
- Pulls binary from backend  
- Uses OpenAI Vision API  
- Posts tags back to backend  
- Retry + safety logic  

### 🟦 Frontend (React + TS)
- Strong typed models matching backend domain  
- Feature modules:
  - Upload
  - Review
  - Filters
  - Event Log  
- Hooks provide domain operations:
  - `usePhotoActions`
  - `usePhotoFilters`
  - `usePhotos`
  - `usePhotoSelection`  
- Global context for photo data + polling  

---

# 🛠️ Technology Stack

## Frontend
- React 18  
- TypeScript  
- Vite  
- TailwindCSS  
- Zustand / Context APIs  
- React Query (optional future)  

## Backend
- Java 17+  
- Spring Boot  
- In-memory repositories (pluggable storage boundary)  
- Scheduled workers  
- Event log / event sourcing patterns  

## AI Tagging Service
- Node.js  
- Axios / fetch  
- OpenAI Vision API  

---

# 📦 Setup & Installation

## 1. Clone the Repository
```bash
git clone https://github.com/your/repo.git
cd rapid-photo-flow
```

## 2. Backend (Java)
```
cd backend
./mvnw spring-boot:run
```

## 3. Frontend (React)
```
cd frontend
npm install
npm run dev
```

## 4. AI Service
```
cd ai-service
npm install
npm start
```

---

# 🖥️ Local Development (Full Stack)

Run the entire stack locally without AWS dependencies using Docker Compose.

## Prerequisites
- Docker & Docker Compose
- Java 17+
- Node.js 20+

## 1. Start Local Services
```bash
docker-compose up -d
```
This starts:
- **PostgreSQL** on port 5432
- **LocalStack (S3)** on port 4566

## 2. Run Backend (Local Profile)
```bash
cd backend
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run
```
Or on Windows:
```bash
set SPRING_PROFILES_ACTIVE=local && mvn spring-boot:run
```

## 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

## 4. (Optional) Run AI Service
```bash
cd ai-service
OPENAI_API_KEY=your-key npm start
```

## Local vs Production

| Feature | Local | Production |
|---------|-------|------------|
| Database | Docker PostgreSQL | AWS RDS |
| Storage | LocalStack S3 | AWS S3 |
| Auth | Disabled (permitAll) | AWS Cognito JWT |
| AI Service | Optional | AWS ECS |

## Stopping Local Services
```bash
docker-compose down
# To also remove data volumes:
docker-compose down -v
```

---

# 🧪 Testing

## Backend
```
./mvnw test
```
## Frontend
```
npm test
```

Tests include:
	•	Component tests
	•	Domain rule tests
	•	Service orchestration tests
