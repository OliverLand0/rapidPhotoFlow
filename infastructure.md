# Infrastructure Overview

This document explains the full infrastructure architecture for the RapidPhotoFlow application, including the workflow from upload → AI tagging → review, and the AWS services used to support the system. All infrastructure is defined using Terraform for repeatability and IaC best practices.

---

## 🏗️ High-Level Architecture

### System Flow

1. User uploads photos via the frontend (React application hosted on S3 + CloudFront).
2. Frontend calls Backend API through API Gateway → ALB → ECS service.
3. Backend stores photo metadata in RDS and files in S3.
4. Backend forwards image bytes to the AI Tagging Service (separate ECS task).
5. AI service calls OpenAI Vision/Embeddings to generate tags.
6. Tags are stored in RDS and returned to the user.
7. User reviews, filters, and manages photos in the Review UI.

This architecture separates concerns, isolates compute layers, and allows for cheap scaling using AWS's smallest configuration.

---

## 🌩️ AWS Services Used & Why

Below is a breakdown of each AWS service, why it was chosen, and what role it plays in the system.

---

### 1. CloudFront (CDN)

**Used for:**
- Global CDN distribution of the frontend application
- Caching of static assets to improve responsiveness
- Protection from direct S3 access

**Why CloudFront?**
- Faster load times
- Improved caching
- Hides S3 bucket from public access
- Cheap for static sites

---

### 2. S3 (Frontend Hosting + Image Storage)

**Frontend Hosting**
- The React app is built and deployed to an S3 bucket.
- CloudFront sits in front of S3 for faster delivery.

**Photo Storage**
- Uploaded photos are optionally stored here (if using direct upload or larger-scale storage).
- Works well for durable, scalable storage of binary objects.

**Why S3?**
- Nearly infinite scale
- Inexpensive
- Perfect for static hosting + image storage

---

### 3. API Gateway (REST Routing Layer)

**Used for:**
- Routing all API requests to the backend service
- Providing a clean, versioned API surface
- Acting as the public entry point instead of exposing ECS directly

**Why API Gateway?**
- Secure
- Centralized routing
- Easy authentication integration
- Good for future expansion (mobile app, etc.)

---

### 4. Application Load Balancer (ALB)

**Used for:**
- Load balancing traffic between ECS tasks running the backend API
- Health checks, path-based routing
- Providing internal load distribution before ECS services

**Why ALB?**
- ECS integrates tightly with ALB
- Cheap compared to other options
- Built-in health checks ensure zero-downtime deployments

---

### 5. ECS Fargate (Backend & AI Services)

You run two services on ECS:

**A. Backend API Service (Spring Boot)**
- Handles authentication, photo metadata, tagging logic orchestration
- Communicates with RDS and S3
- Exposed behind ALB → API Gateway

**B. AI Tagging Service (Node/OpenAI)**
- Receives raw image bytes from backend
- Calls OpenAI APIs to generate tags
- Returns tag suggestions via REST

**Why ECS Fargate?**
- No need to manage servers
- Simple deployments
- Works well for container-based apps
- Scalable, even with ultra-low resource settings
- Allows splitting AI and API workloads cleanly

---

### 6. RDS (PostgreSQL)

**Used for:**
- Storing photo metadata, tags, events, statuses
- Storing user records & authentication associations
- Durable relational data with ACID guarantees

**Why RDS?**
- Fully managed PostgreSQL
- Automated backups
- More reliable than self-hosted DB on EC2
- Supports complex filtering and relationships needed for the app

---

### 7. Cognito (User Auth + Email Confirmation)

**Used for:**
- Sign-up and login flows
- Email confirmation
- MFA-ready authentication
- Secure JWT issuance

**Why Cognito?**
- Out-of-the-box authentication
- Built-in user pool storage
- Works well with API Gateway
- Zero-maintenance compared to rolling your own auth

---

### 8. IAM (Identity & Permissions)

**Used for:**
- Enforcing least-privilege access to S3, ECS, RDS
- Secure service-to-service communication
- Protecting secrets (via SSM Parameter Store or Secrets Manager)

**Why IAM?**
- Required for secure AWS setup
- Ensures each service can only access necessary resources

---

### 9. VPC, Subnets & Security Groups

**Used for:**
- Isolating ECS tasks and RDS in private subnets
- Allowing public access only through ALB / CloudFront
- Securing traffic between backend and AI service

**Why custom VPC?**
- Better control over networking
- Ability to support scaling or new microservices later
- Mandatory for RDS and ECS deployments

---

### 10. Terraform (IaC)

**Used for:**
- Full infrastructure provisioning
- Managing networking, IAM, ECS, RDS, CloudFront, S3, and API Gateway
- Ensuring deterministic, repeatable deployments

**Why Terraform?**
- IaC best practices
- Easy rollback
- Version-controlled infrastructure
- Works across AWS services cleanly

---

## 🔄 End-to-End Request Lifecycle

### 1. User Uploads Photo
- React app → API Gateway → ALB → ECS Backend
- Backend stores metadata → sends raw bytes to AI Service
- AI service queries OpenAI → returns auto-generated tags

### 2. Photo Is Saved
- Stored metadata in RDS
- Optionally file stored in S3
- Status transitions: QUEUED → PROCESSING → COMPLETED

### 3. User Reviews & Tags
- Frontend fetches metadata from backend
- Searching, filtering, saved views, keyboard shortcuts
- Event log tracks all actions via EventService

### 4. Authentication Flow
- Signup/Login requests go to Cognito
- Cognito generates JWTs
- Backend validates tokens

---

## 💸 Cost Considerations

Your deployment intentionally uses:
- Lowest-tier RDS instance
- Smallest Fargate CPU/Mem configs
- Minimal autoscaling
- No redundant availability zones or multi-region failover
- Minimal AI service compute
- CloudFront caching for cost reduction

This keeps infrastructure cost-controlled for demo purposes while maintaining realistic architecture.

---

## 📌 Summary of AWS Usage

| Service | Purpose | Why It Was Chosen |
|---------|---------|-------------------|
| CloudFront | CDN + caching + static hosting | Speed + cost efficiency |
| S3 | Frontend hosting + photo storage | Cheap, scalable storage |
| API Gateway | Public API entry | Secure, scalable routing |
| ALB | Balancing ECS backend | Native ECS integration |
| ECS Fargate | Backend API + AI workers | Serverless, easy to operate |
| RDS PostgreSQL | Relational database | Reliable ACID storage |
| Cognito | Auth, email verification | Turnkey authentication |
| IAM | Permissions | Security best practices |
| VPC/Subnets | Networking isolation | Required for RDS/ECS |
| Terraform | Infrastructure-as-code | Repeatability + safety |

---

## Architecture Diagram

```
                    +--------------------+
                    |    User Browser    |
                    +---------+----------+
                              |
                              v
                      +-------+--------+
                      |   CloudFront   |
                      +-------+--------+
                              |
                Static Assets |  API Requests
                              |
                +-------------+-------------+
                |                           |
                v                           v
        +-------+--------+          +-------+--------+
        |   S3 Frontend  |          |   API Gateway  |
        +----------------+          +-------+--------+
                                            |
                                            v
                                    +-------+--------+
                                    |      ALB       |
                                    +-------+--------+
                                            |
                               +------------+-------------+
                               |                          |
                               v                          v
                    +----------+---------+      +---------+---------+
                    |  ECS - Backend API |      |  ECS - AI Service |
                    +----------+---------+      +---------+---------+
                               |                          |
                 Metadata/Tags |                          | OpenAI Calls
                               v                          v
                        +------+---------+        +-------+--------+
                        |   RDS (Postgres)        |    OpenAI      |
                        +----------------+        +----------------+
                               |
                               | (photo references, metadata)
                               v
                        +------+---------+
                        |   S3 (Images)  |
                        +----------------+

                +------------------+
                |  Cognito (Auth)  |
                +------------------+
                      ^       |
   Signup/Login/MFA   |       | JWTs
                      +-------+
                   User Browser
```
