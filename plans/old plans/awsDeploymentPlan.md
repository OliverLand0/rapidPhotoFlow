# AWS Deployment Plan for RapidPhotoFlow

## Project Overview

RapidPhotoFlow is a photo workflow management system with three services:
- **Backend**: Spring Boot 3.2.0 (Java 21) - REST API on port 8080
- **Frontend**: React 19.2.0 + Vite - Static SPA on port 5173
- **AI Service**: Node.js + Express + OpenAI - AI tagging on port 3001

## Current Architecture Limitations

The application currently uses **in-memory storage** (ConcurrentHashMap) which means:
- All data is lost on restart
- Cannot scale horizontally
- Photo binary data stored in memory (not sustainable for production)

## Proposed AWS Architecture

```
                                    ┌─────────────────┐
                                    │   CloudFront    │
                                    │   (CDN + SSL)   │
                                    └────────┬────────┘
                                             │
                    ┌────────────────────────┼────────────────────────┐
                    │                        │                        │
                    ▼                        ▼                        ▼
           ┌───────────────┐      ┌───────────────────┐    ┌─────────────────┐
           │  S3 Bucket    │      │  Application      │    │  S3 Bucket      │
           │  (Frontend)   │      │  Load Balancer    │    │  (Photos)       │
           └───────────────┘      └─────────┬─────────┘    └─────────────────┘
                                            │
                         ┌──────────────────┼──────────────────┐
                         │                  │                  │
                         ▼                  ▼                  ▼
                  ┌────────────┐     ┌────────────┐     ┌────────────┐
                  │ ECS Fargate│     │ ECS Fargate│     │ ECS Fargate│
                  │  Backend   │     │  Backend   │     │ AI Service │
                  └──────┬─────┘     └──────┬─────┘     └────────────┘
                         │                  │
                         └────────┬─────────┘
                                  │
                         ┌────────▼────────┐
                         │  RDS PostgreSQL │
                         │   (db.t3.micro) │
                         └─────────────────┘
```

## Implementation Steps

### Phase 1: Infrastructure Setup

1. **Create VPC and Networking**
   - VPC with public/private subnets across 2 AZs
   - Internet Gateway for public access
   - NAT Gateway for private subnet outbound traffic
   - Security groups for each service tier

2. **Create S3 Buckets**
   - `rapidphotoflow-frontend-{env}` - Static frontend hosting
   - `rapidphotoflow-photos-{env}` - Photo storage with lifecycle policies

3. **Create RDS PostgreSQL**
   - db.t3.micro for development (free tier eligible)
   - db.t3.small or db.t3.medium for production
   - Multi-AZ optional for production

4. **Create ECR Repositories**
   - `rapidphotoflow-backend`
   - `rapidphotoflow-ai-service`

### Phase 2: Application Migration

5. **Backend Code Changes**
   - Replace InMemoryPhotoRepository with JPA/PostgreSQL
   - Replace InMemoryEventRepository with JPA/PostgreSQL
   - Store photo binaries in S3 instead of in-memory
   - Add S3 client for photo upload/download
   - Update application.yml with environment variables

6. **Dockerize Services**
   - Create Dockerfile for backend (Java 21 + Spring Boot)
   - Create Dockerfile for AI service (Node.js 20)
   - Build and push images to ECR

7. **Frontend Updates**
   - Update API base URL to use CloudFront/ALB
   - Build production bundle
   - Deploy to S3 bucket

### Phase 3: AWS Deployment

8. **Create ECS Cluster**
   - Fargate launch type (serverless containers)
   - Task definitions for backend and AI service
   - Service auto-scaling based on CPU/memory

9. **Create Application Load Balancer**
   - HTTPS listener with ACM certificate
   - Path-based routing:
     - `/api/*` → Backend service
     - `/ai/*` → AI service

10. **Create CloudFront Distribution**
    - Origin 1: S3 (frontend static files)
    - Origin 2: ALB (API requests)
    - HTTPS with custom domain (optional)

11. **Secrets Management**
    - Store OpenAI API key in Secrets Manager
    - Store database credentials in Secrets Manager
    - Configure ECS tasks to retrieve secrets

### Phase 4: Operations

12. **Monitoring & Logging**
    - CloudWatch Logs for all containers
    - CloudWatch Alarms for errors and latency
    - X-Ray tracing (optional)

13. **CI/CD Pipeline** (optional)
    - CodePipeline + CodeBuild
    - Or GitHub Actions with AWS credentials

---

## Cost Estimate

### Development/Testing Environment (Minimal)

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| ECS Fargate (Backend) | 0.25 vCPU, 0.5GB, 1 task | ~$9 |
| ECS Fargate (AI Service) | 0.25 vCPU, 0.5GB, 1 task | ~$9 |
| RDS PostgreSQL | db.t3.micro (free tier) | $0 (first year) |
| S3 (Photos) | 10GB storage, 1000 requests | ~$1 |
| S3 (Frontend) | 100MB static files | ~$0.10 |
| CloudFront | 10GB transfer | ~$1 |
| ALB | 1 ALB, minimal traffic | ~$16 |
| NAT Gateway | 1 NAT, minimal traffic | ~$32 |
| Secrets Manager | 2 secrets | ~$1 |
| **Total** | | **~$69/month** |

### Cost-Optimized Development (No NAT Gateway)

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| ECS Fargate (Backend) | 0.25 vCPU, 0.5GB, 1 task | ~$9 |
| ECS Fargate (AI Service) | 0.25 vCPU, 0.5GB, 1 task | ~$9 |
| RDS PostgreSQL | db.t3.micro (free tier) | $0 |
| S3 (Photos + Frontend) | 10GB | ~$1 |
| CloudFront | 10GB transfer | ~$1 |
| ALB | 1 ALB | ~$16 |
| Secrets Manager | 2 secrets | ~$1 |
| **Total** | | **~$37/month** |

*Note: NAT Gateway can be avoided by placing ECS tasks in public subnets with public IPs*

### Production Environment (Small Scale)

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| ECS Fargate (Backend) | 0.5 vCPU, 1GB, 2 tasks | ~$36 |
| ECS Fargate (AI Service) | 0.5 vCPU, 1GB, 1 task | ~$18 |
| RDS PostgreSQL | db.t3.small, Multi-AZ | ~$50 |
| S3 (Photos) | 100GB storage | ~$2.50 |
| S3 (Frontend) | 100MB static | ~$0.10 |
| CloudFront | 100GB transfer | ~$9 |
| ALB | 1 ALB, moderate traffic | ~$20 |
| NAT Gateway | 2 NATs (HA) | ~$65 |
| Secrets Manager | 2 secrets | ~$1 |
| Route 53 | Hosted zone + queries | ~$1 |
| **Total** | | **~$200/month** |

### Production Environment (Medium Scale)

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| ECS Fargate (Backend) | 1 vCPU, 2GB, 3-5 tasks (auto-scaling) | ~$100-150 |
| ECS Fargate (AI Service) | 1 vCPU, 2GB, 2 tasks | ~$72 |
| RDS PostgreSQL | db.t3.medium, Multi-AZ | ~$100 |
| S3 (Photos) | 500GB storage | ~$12 |
| CloudFront | 500GB transfer | ~$45 |
| ALB | 1 ALB, high traffic | ~$30 |
| NAT Gateway | 2 NATs | ~$65 |
| ElastiCache (optional) | cache.t3.micro | ~$13 |
| **Total** | | **~$450-500/month** |

---

## Alternative: Serverless Architecture

For potentially lower costs at low traffic, consider:

| Service | Replaces | Notes |
|---------|----------|-------|
| Lambda + API Gateway | ECS + ALB | Pay per request |
| Aurora Serverless v2 | RDS | Scales to zero |
| S3 + CloudFront | Same | Same |

**Serverless estimate (low traffic)**: ~$20-50/month
**Serverless estimate (medium traffic)**: ~$100-200/month

*Requires significant code refactoring for Lambda*

---

## Additional Costs to Consider

1. **OpenAI API**: ~$0.01-0.03 per photo tagged (depends on model)
2. **Data Transfer**: AWS charges for outbound data
3. **Custom Domain**: ~$12/year for .com domain
4. **ACM Certificate**: Free (for AWS resources)
5. **WAF** (optional): ~$5/month + request charges

---

## Recommended Starting Point

For initial deployment, I recommend the **Cost-Optimized Development** setup at ~$37/month:

1. Single ECS task per service
2. RDS db.t3.micro (free tier)
3. Public subnets for ECS (no NAT Gateway)
4. Single AZ (no high availability)
5. CloudFront for CDN and HTTPS

This provides a functional production environment that can be upgraded as traffic grows.

---

## Required Code Changes Summary

### Backend (Critical)
- [ ] Add Spring Data JPA + PostgreSQL driver dependencies
- [ ] Create JPA entities for Photo and EventLog
- [ ] Replace InMemoryPhotoRepository with JpaRepository
- [ ] Replace InMemoryEventRepository with JpaRepository
- [ ] Add AWS SDK for S3 photo storage
- [ ] Create PhotoStorageService for S3 operations
- [ ] Update Photo entity to store S3 key instead of byte[]
- [ ] Add environment variable configuration (database URL, S3 bucket, etc.)
- [ ] Create Dockerfile

### AI Service (Minor)
- [ ] Update CORS configuration for production domain
- [ ] Add health check endpoint
- [ ] Create Dockerfile

### Frontend (Minor)
- [ ] Configure environment-based API URL
- [ ] Build production bundle
- [ ] No Dockerfile needed (static S3 hosting)
