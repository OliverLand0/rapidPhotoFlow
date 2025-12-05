# RapidPhotoFlow

**Live Application:** https://photos.basedsecurity.net

### AI-Powered Photo Management, Tagging & Review Platform

**Domain-Driven Design | Modern Frontend | Distributed Services | AWS Cloud-Native**

RapidPhotoFlow is a production-ready photo management platform that enables batch uploads, AI-powered automatic tagging, review workflows, photo sharing, and comprehensive admin controls. Built for the TeamFront AI Hackathon (November 2025).

---

## Key Features

### Photo Management
- **Batch Upload** - Drag-and-drop or file picker with progress tracking
- **Format Support** - JPEG, PNG, GIF, WebP, BMP, TIFF, RAW (CR2, NEF, DNG, ARW, etc.), HEIC/HEIF
- **Preview Generation** - Automatic JPEG previews for RAW and HEIC formats
- **Folder Organization** - Hierarchical folder structure with drag-and-drop
- **Album Collections** - Group photos into albums with cover images
- **Duplicate Detection** - Content-hash based duplicate removal

### AI Auto-Tagging
- **GPT-4 Vision Integration** - Automatic content analysis using OpenAI GPT-4o-mini
- **Batch Processing** - Efficient multi-image analysis (5-10 images per API call)
- **Smart Tags** - Subject detection, scene type, colors, mood, activities
- **Manual Override** - Add/remove tags manually alongside AI suggestions
- **Per-User Controls** - Admin can enable/disable AI tagging per user

### Review Workflow
- **Status Management** - PENDING, PROCESSING, PROCESSED, FAILED, APPROVED, REJECTED
- **Bulk Actions** - Approve, reject, delete, or retry multiple photos
- **Advanced Filtering** - Search by filename, tags, status, folder
- **Saved Views** - Save custom filter combinations for quick access
- **Keyboard Shortcuts** - Power-user navigation (J/K, A/R/D, Enter, Space)

### Photo Sharing
- **Shareable Links** - Public access via unique tokens
- **Access Controls** - Password protection, expiration dates, view limits
- **Download Options** - Enable/disable downloads, original vs. converted
- **Analytics** - View counts, download counts, last access tracking
- **Multi-Target** - Share individual photos, albums, or entire folders

### Admin Panel
- **Dashboard** - System statistics, user counts, storage usage, upload activity
- **User Management** - View all users, suspend/reactivate accounts
- **Audit Logging** - Complete history of admin actions
- **Global Settings** - Per-user AI tagging controls

### Security & Authentication
- **AWS Cognito** - Secure JWT-based authentication
- **Email Verification** - Required for new accounts
- **Password Reset** - Self-service password recovery
- **Role-Based Access** - User and Admin roles

---

## Architecture

```
                         +-----------------+
                         |  User Browser   |
                         +--------+--------+
                                  |
                                  v
                          +-------+-------+
                          |  CloudFront   |
                          +-------+-------+
                                  |
               +------------------+------------------+
               |                                     |
               v                                     v
       +-------+-------+                     +-------+-------+
       | S3 (Frontend) |                     | API Gateway   |
       +---------------+                     +-------+-------+
                                                     |
                                                     v
                                             +-------+-------+
                                             |      ALB      |
                                             +-------+-------+
                                                     |
                                    +----------------+----------------+
                                    |                                 |
                                    v                                 v
                         +----------+----------+           +----------+----------+
                         | ECS Backend (Java)  |           | ECS AI Service (Node)|
                         +----------+----------+           +----------+----------+
                                    |                                 |
                                    v                                 v
                         +----------+----------+           +----------+----------+
                         | RDS PostgreSQL      |           | OpenAI API          |
                         +---------------------+           +---------------------+
                                    |
                                    v
                         +----------+----------+
                         | S3 (Photo Storage)  |
                         +---------------------+
```

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS 4, shadcn/ui |
| **Backend** | Java 21, Spring Boot 3.2, Spring Data JPA, Spring Security |
| **AI Service** | Node.js, Express, OpenAI SDK (GPT-4o-mini Vision) |
| **Database** | PostgreSQL (AWS RDS in production) |
| **Storage** | AWS S3 |
| **Auth** | AWS Cognito |
| **Infrastructure** | AWS ECS Fargate, CloudFront, API Gateway, ALB |
| **IaC** | Terraform |

---

## Project Structure

```
rapidPhotoFlow/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # UI components (shared, admin)
│   │   ├── contexts/         # React contexts (Auth, Photos, AI)
│   │   ├── lib/              # API client, hooks, utilities
│   │   └── pages/            # Route pages
│   └── index.html
├── backend/                  # Spring Boot
│   └── src/main/java/com/rapidphotoflow/
│       ├── config/           # Security, AWS, CORS configs
│       ├── controller/       # REST endpoints
│       ├── domain/           # Domain models
│       ├── dto/              # Data transfer objects
│       ├── entity/           # JPA entities
│       ├── repository/       # Data access (JPA)
│       └── service/          # Business logic
├── ai-service/               # Node.js + OpenAI
│   └── src/index.js          # Express server
├── terraform/                # AWS infrastructure
├── plans/                    # Design documents
├── docker-compose.yml        # Local development
└── localstack-init/          # S3 bucket initialization
```

---

## Local Development

### Prerequisites
- Java 21+
- Node.js 20+
- Docker & Docker Compose
- OpenAI API Key (for AI tagging)

### Quick Start

```bash
# 1. Start local infrastructure (PostgreSQL + LocalStack S3)
docker-compose up -d

# 2. Start backend (Spring Boot)
cd backend
SPRING_PROFILES_ACTIVE=local ./mvnw spring-boot:run

# 3. Start frontend (Vite dev server)
cd frontend
npm install
npm run dev

# 4. (Optional) Start AI service
cd ai-service
npm install
OPENAI_API_KEY=your-key npm run dev
```

### Access Points
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8080
- **AI Service:** http://localhost:3001

### Local vs Production

| Feature | Local | Production |
|---------|-------|------------|
| Database | Docker PostgreSQL (5433) | AWS RDS PostgreSQL |
| Storage | LocalStack S3 (4566) | AWS S3 |
| Auth | Disabled (permitAll) | AWS Cognito JWT |
| AI Service | Optional (localhost) | AWS ECS Fargate |
| Frontend | Vite dev server | S3 + CloudFront |

---

## API Reference

### Photo Endpoints (`/api/photos`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/photos` | Upload photos (multipart) |
| GET | `/api/photos` | List photos with filters |
| GET | `/api/photos/{id}` | Get photo metadata |
| GET | `/api/photos/{id}/content` | Get photo file |
| GET | `/api/photos/{id}/preview` | Get JPEG preview (RAW/HEIC) |
| DELETE | `/api/photos/{id}` | Delete photo |
| POST | `/api/photos/{id}/action` | Approve/reject/retry |
| POST | `/api/photos/bulk-action` | Bulk approve/reject/retry |
| POST | `/api/photos/bulk-delete` | Bulk delete |
| POST | `/api/photos/{id}/tags` | Add tag |
| DELETE | `/api/photos/{id}/tags/{tag}` | Remove tag |
| GET | `/api/photos/counts` | Get status counts |
| DELETE | `/api/photos/duplicates` | Remove duplicates |

### Folder Endpoints (`/api/folders`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/folders` | Get folder tree |
| POST | `/api/folders` | Create folder |
| GET | `/api/folders/{id}` | Get folder |
| PUT | `/api/folders/{id}` | Rename folder |
| PUT | `/api/folders/{id}/move` | Move folder |
| DELETE | `/api/folders/{id}` | Delete folder |
| POST | `/api/folders/{id}/photos` | Move photos to folder |

### Album Endpoints (`/api/albums`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/albums` | List albums |
| POST | `/api/albums` | Create album |
| GET | `/api/albums/{id}` | Get album |
| PUT | `/api/albums/{id}` | Update album |
| DELETE | `/api/albums/{id}` | Delete album |
| GET | `/api/albums/{id}/photos` | Get album photos |
| POST | `/api/albums/{id}/photos` | Add photos to album |
| DELETE | `/api/albums/{id}/photos` | Remove photos from album |

### Share Endpoints (`/api/shares`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shares` | List user's shares |
| POST | `/api/shares` | Create share link |
| GET | `/api/shares/{id}` | Get share details |
| PUT | `/api/shares/{id}` | Update share settings |
| DELETE | `/api/shares/{id}` | Delete share |
| PUT | `/api/shares/{id}/activate` | Activate share |
| PUT | `/api/shares/{id}/deactivate` | Deactivate share |

### Public Share Access (`/s`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/s/{token}` | Get share info |
| POST | `/s/{token}/verify` | Verify password |
| GET | `/s/{token}/photo` | Get shared photo |
| GET | `/s/{token}/thumbnail` | Get thumbnail |
| GET | `/s/{token}/download` | Download photo |

### Admin Endpoints (`/api/admin`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Dashboard statistics |
| GET | `/api/admin/users` | List all users |
| GET | `/api/admin/users/{id}` | Get user details |
| PUT | `/api/admin/users/{id}/settings` | Update user settings |
| POST | `/api/admin/users/{id}/suspend` | Suspend user |
| POST | `/api/admin/users/{id}/reactivate` | Reactivate user |
| GET | `/api/admin/audit-log` | Get audit log |

### AI Service Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/ai/health` | Health check |
| POST | `/ai/analyze` | Analyze single image |
| POST | `/ai/analyze-and-apply` | Analyze and apply tags |
| POST | `/ai/batch-analyze-and-apply` | Batch analyze (up to 100) |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `J` / `K` or `←` / `→` | Navigate photos |
| `Enter` | Open preview |
| `A` | Approve photo |
| `R` | Reject photo |
| `D` | Delete photo |
| `Space` | Select/deselect |
| `Shift + Click` | Multi-select range |
| `?` | Show shortcuts modal |
| `Escape` | Close modal |

---

## Supported Image Formats

### Native Browser Support
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WebP (.webp)
- BMP (.bmp)
- SVG (.svg)

### Extended Support (with preview generation)
- **RAW Formats:** CR2, NEF, DNG, RAW, RAF, ARW, ORF, RW2
- **Apple Formats:** HEIC, HEIF
- **Other:** TIFF (.tif, .tiff)

RAW and HEIC files are stored in original format with automatic JPEG preview generation for browser display.

---

## AWS Deployment

See [infrastructure.md](./infastructure.md) for detailed AWS architecture documentation.

### Quick Deploy

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values
terraform init
terraform plan
terraform apply
```

### Infrastructure Components
- **VPC** with public/private subnets
- **ECS Fargate** clusters for backend and AI service
- **RDS PostgreSQL** managed database
- **S3** buckets for frontend and photo storage
- **CloudFront** CDN distribution
- **API Gateway** for API routing
- **Cognito** user pool for authentication
- **ALB** for load balancing

---

## Documentation

- **[Infrastructure Documentation](./infastructure.md)** - AWS architecture overview
- **[Development Log](./DEVELOPMENT_LOG.md)** - Development journey and decisions
- **[API Documentation](./docs/API.md)** - Complete API reference
- **[Frontend Guide](./frontend/FEATURES.md)** - Frontend features and components

---

## Development Methodology

This project demonstrates **AI-first development** where the entire codebase was generated through AI prompting using Claude Code. Key principles:

- **Domain-Driven Design (DDD)** - Clean bounded contexts and aggregates
- **Event Sourcing** - Complete audit trail via EventLog
- **Infrastructure as Code** - Terraform for all AWS resources
- **Profile-Based Configuration** - Clean separation of local vs production

---

## License

This project was built for the TeamFront AI Hackathon (November 2025).

---

## Contributing

This is a demonstration project. For questions or feedback, please open an issue.
