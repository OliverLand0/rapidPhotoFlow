# 📸 RapidPhotoFlow

**Live Application:** https://photos.basedsecurity.net

### AI-Powered Photo Ingestion, Tagging & Review Platform

**Domain-Driven Design • Modern Frontend • Distributed Services • AWS Cloud-Native**

RapidPhotoFlow is a complete end-to-end photo ingestion and classification workflow built for the TeamFront AI Hackathon (November 2025). Users can upload batches of images, automatically tag them using AI, review & curate them with fast navigation, and track all actions through a domain event log.

This project demonstrates:
- Strict **Domain-Driven Design (DDD)** applied to a real product
- A cleanly separated **knowledge graph** of domains: Ingestion, Processing, Review, Audit
- A modern **React + TypeScript** frontend
- A modular **Java Spring Boot backend**
- A dedicated **Node.js AI tagging service**
- Full **AWS cloud deployment** with Terraform Infrastructure-as-Code
- **AI-first development methodology** - entire codebase generated through AI prompting

---

## 🧠 Core Features

### 🚀 Upload & Ingestion
- Drag-and-drop or file picker upload
- Live previews with progress + speed tracking
- Client-side validation (types, size)
- Optional automatic AI tagging toggle
- Large upload safety dialog (upload with AI / without AI / cancel)
- Queued upload logic with retry/cancel support
- Batch processing (30 files at a time)

### 🤖 AI Auto-Tagging (OpenAI Vision)
- Automatic content tagging on upload or manually per photo
- AI service fetches image data from backend → sends to OpenAI GPT-4o-mini Vision API → posts back tags
- Supports suggested tags + manual tags
- Re-run AI tagging without overwriting user-added tags
- Graceful rate-limit and failure handling

### 🔎 Powerful Search & Filters
- Search by filename, text, or tags
- Tag autocomplete with suggestions
- Status filtering (`PENDING`, `PROCESSING`, `FAILED`, `APPROVED`, `REJECTED`, etc.)
- Sorting options (Newest/Oldest/Status)
- Saved filters & views (user-defined + presets)
- Powerful query engine inside `usePhotoFilters`
- URL-sync planned for shareable views

### 🖼️ Review Workflow
- Photo grid with status chips & tags
- Click-to-preview modal with keyboard navigation
- Selection system:
  - Select individual photos
  - Select all on page
  - Shift-range support

### ⚡ Bulk Actions
- Bulk approve
- Bulk reject
- Bulk delete
- Bulk auto-tag
- Bulk retry failed photos
- Confirmation dialogs
- Bulk action summary and feedback

### 🎛️ Keyboard Shortcuts (Power-User Ready)
- `J/K` or `←/→` navigate photos
- `Enter` open preview
- `A`, `R`, `D` for approve/reject/delete
- `Space` to select/deselect
- `Shift` + click to multiselect
- `?` opens keyboard shortcuts modal
- Shortcut hints in UI

### 📑 Event Log & Observability
- Complete event history for every action
- Includes: upload, tagging, status changes, bulk actions
- Live-updating event panel
- Event click-through → navigate to photo
- Filtering by event type (planned)

### 🔄 Smart Polling / Data Freshness
- Centralized polling in `PhotosProvider`
- Polling adapts based on system state:
  - Faster when processing is active
  - Slower when stable
- Manual refresh + "Last updated Xs ago" indicator

### 🔐 Authentication & Security
- AWS Cognito integration with email verification
- Secure JWT token-based authentication
- Password reset flow
- User profile management
- Photo ownership tracking (uploadedByUserId)

---

## 🏛️ Architecture Overview (DDD-Focused)

RapidPhotoFlow is structured using **Domain-Driven Design** principles.

### Project Structure

```
rapidPhotoFlow/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── contexts/         # React contexts (Auth, Photos)
│   │   ├── features/         # Feature modules (photos, events)
│   │   ├── lib/              # Utilities, API client, hooks
│   │   └── pages/            # Route pages
│   └── index.html
├── backend/                  # Spring Boot
│   └── src/main/java/com/rapidphotoflow/
│       ├── config/           # Security, AWS configs
│       ├── controller/       # REST endpoints
│       ├── domain/           # Entities, aggregates
│       ├── repository/       # Data access (JPA)
│       └── service/          # Business logic
├── ai-service/               # Node.js + OpenAI
│   └── src/index.js          # Express server
├── terraform/                # AWS infrastructure
├── plans/                    # Design documents
├── docker-compose.yml        # Local development
└── localstack-init/          # S3 bucket initialization
```

### 🔷 Bounded Contexts
1. **Ingestion** — upload, creation
2. **Processing** — AI tagging, status transitions
3. **Review** — approval, tagging, bulk ops
4. **Audit/Events** — full event sourcing layer

### 🔶 Backend (Java Spring Boot)
- Domain aggregates:
  - `Photo` (root aggregate)
  - `EventLog`
- Strong domain events:
  - `PHOTO_UPLOADED`, `TAG_ADDED`, `PHOTO_APPROVED`, `PHOTO_REJECTED`, etc.
- Repository interfaces (DDD):
  - `PhotoRepository` (JPA)
  - `EventRepository` (JPA)
- Application services orchestrate domain workflow
- Controllers are thin and API-only
- AWS S3 integration for photo storage
- AWS Cognito JWT validation

### 🔷 AI Service (Node.js)
- Stateless worker service
- Pulls binary from backend
- Uses OpenAI GPT-4o-mini Vision API
- Posts tags back to backend
- Retry + safety logic
- Deployed on ECS Fargate

### 🟦 Frontend (React + TypeScript)
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
- AWS Cognito authentication integration

---

## 🛠️ Technology Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type safety throughout
- **Vite 7** - Fast build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Production-ready component library
- **React Router 7** - Client-side routing
- **Amazon Cognito Identity JS** - Authentication

### Backend
- **Java 21** - Latest LTS version
- **Spring Boot 3.2** - Enterprise framework
- **Spring Data JPA** - Database abstraction
- **PostgreSQL** - Relational database (RDS in production)
- **AWS SDK for Java** - S3 integration
- **Spring Security** - OAuth2 Resource Server (JWT)
- **TwelveMonkeys ImageIO** - Extended image format support

### AI Tagging Service
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **OpenAI SDK** - GPT-4o-mini Vision API integration

### Infrastructure & DevOps
- **AWS ECS Fargate** - Container orchestration
- **AWS RDS PostgreSQL** - Managed database
- **AWS S3** - Object storage
- **AWS CloudFront** - CDN
- **AWS API Gateway** - API routing
- **AWS Cognito** - User authentication
- **AWS ALB** - Load balancing
- **Terraform** - Infrastructure-as-Code
- **Docker** - Containerization
- **Docker Compose** - Local development

---

## 📦 Setup & Installation

### Prerequisites
- **Java 21+** (for backend)
- **Node.js 20+** (for frontend and AI service)
- **Docker & Docker Compose** (for local development)
- **PostgreSQL** (or use Docker Compose)
- **OpenAI API Key** (for AI tagging)

### Local Development (Full Stack)

Run the entire stack locally without AWS dependencies using Docker Compose.

#### 1. Start Local Infrastructure
```bash
docker-compose up -d
```
This starts:
- **PostgreSQL** on port 5433
- **LocalStack (S3)** on port 4566

#### 2. Run Backend (Local Profile)
```bash
cd backend
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run
```
Or on Windows:
```bash
cd backend
set SPRING_PROFILES_ACTIVE=local && mvn spring-boot:run
```

The backend will run on `http://localhost:8080`

#### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```

The frontend will run on `http://localhost:5173`

#### 4. (Optional) Run AI Service
```bash
cd ai-service
npm install
OPENAI_API_KEY=your-key npm start
```

The AI service will run on `http://localhost:3001`

### Local vs Production

| Feature | Local | Production |
|---------|-------|------------|
| Database | Docker PostgreSQL | AWS RDS PostgreSQL |
| Storage | LocalStack S3 | AWS S3 |
| Auth | Disabled (permitAll) | AWS Cognito JWT |
| AI Service | Optional (localhost) | AWS ECS Fargate |
| Frontend | Vite dev server | S3 + CloudFront |
| Backend | Spring Boot dev | ECS Fargate |

### Stopping Local Services
```bash
docker-compose down
# To also remove data volumes:
docker-compose down -v
```

---

## ☁️ AWS Deployment

The application is fully deployed on AWS using Terraform for Infrastructure-as-Code.

### Architecture Overview

```
User Browser
    ↓
CloudFront (CDN)
    ↓
┌───────────┬───────────┐
│           │           │
S3 Frontend  API Gateway
             │
             ↓
          ALB (Load Balancer)
             │
    ┌────────┴────────┐
    │                 │
ECS Backend    ECS AI Service
    │                 │
    └────────┬────────┘
             ↓
      RDS PostgreSQL
             │
             ↓
         S3 (Photos)
```

### Deployment Steps

1. **Configure Terraform Variables**
   ```bash
   cd terraform
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your values
   ```

2. **Initialize and Apply**
   ```bash
   terraform init
   terraform plan
   terraform apply
   ```

3. **Deploy Services**
   - Build and push Docker images to ECR
   - Update ECS services with new images
   - Deploy frontend to S3 bucket

See [infrastructure.md](./infastructure.md) for detailed architecture documentation.

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
./mvnw test
```

### Frontend Tests
```bash
cd frontend
npm test
```

Tests include:
- Component tests (React Testing Library)
- Domain rule tests
- Service orchestration tests
- API integration tests

---

## 📚 Documentation

- **[Infrastructure Documentation](./infastructure.md)** - Complete AWS architecture overview
- **[Development Log](./DEVELOPMENT_LOG.md)** - Full development journey and technical decisions
- **[Disclaimer](./disclaimer.md)** - Known limitations and architectural compromises

---

## 🎯 Project Highlights

- **AI-First Development**: Entire codebase generated through AI prompting (Claude Code)
- **Production-Ready**: Deployed on AWS with proper security, authentication, and scalability
- **Domain-Driven Design**: Clean architecture with bounded contexts and event sourcing
- **Modern Stack**: Latest versions of React, Spring Boot, and TypeScript
- **Full-Stack**: Complete frontend, backend, AI service, and infrastructure
- **Well-Tested**: Comprehensive test coverage across all layers
- **Local Development**: Full Docker Compose setup for offline development

---

## 📝 License

This project was built for the TeamFront AI Hackathon (November 2025).

---

## 🤝 Contributing

This is a demonstration project. For questions or feedback, please open an issue.
