# Infrastructure Overview

This document explains the full infrastructure architecture for RapidPhotoFlow, including the AWS services used, deployment workflow, and operational considerations.

---

## Architecture Diagram

```
                         +---------------------+
                         |    User Browser     |
                         +----------+----------+
                                    |
                                    v
                    +---------------+---------------+
                    |          CloudFront           |
                    |    (CDN + SSL + Routing)      |
                    +---------------+---------------+
                                    |
               +--------------------+--------------------+
               |                                         |
               v                                         v
    +----------+----------+                   +----------+----------+
    |   S3 (Frontend)     |                   |    API Gateway      |
    |   Static Assets     |                   |    /api/* routing   |
    +---------------------+                   +----------+----------+
                                                         |
                                                         v
                                              +----------+----------+
                                              | Application Load    |
                                              | Balancer (ALB)      |
                                              +----------+----------+
                                                         |
                                    +--------------------+--------------------+
                                    |                                         |
                                    v                                         v
                         +----------+----------+                   +----------+----------+
                         |   ECS Fargate       |                   |   ECS Fargate       |
                         |   Backend (Java)    |                   |   AI Service (Node) |
                         +----------+----------+                   +----------+----------+
                                    |                                         |
                                    v                                         v
                         +----------+----------+                   +----------+----------+
                         |   RDS PostgreSQL    |                   |   OpenAI API        |
                         +---------------------+                   +---------------------+
                                    |
                                    v
                         +----------+----------+
                         |   S3 (Photos)       |
                         |   Image Storage     |
                         +---------------------+

                         +---------------------+
                         |   AWS Cognito       |
                         |   User Auth Pool    |
                         +---------------------+
```

---

## AWS Services

### CloudFront (CDN)

**Purpose:** Global content delivery and SSL termination

**Configuration:**
- Custom domain: `photos.basedsecurity.net`
- SSL certificate from ACM
- Origin behaviors:
  - Default (`/*`) → S3 Frontend bucket
  - `/api/*` → API Gateway
  - `/ai/*` → AI Service (via API Gateway)
  - `/s/*` → API Gateway (public shares)

**Benefits:**
- Low-latency global access
- HTTPS everywhere
- DDoS protection
- Caching for static assets

### S3 (Storage)

**Frontend Bucket:**
- Hosts compiled React application
- Static website hosting enabled
- Accessed only via CloudFront (OAI)

**Photos Bucket:**
- Stores uploaded images
- Private access only
- Lifecycle policies for cost management
- Versioning disabled (to reduce costs)

### API Gateway

**Purpose:** API routing and management

**Configuration:**
- HTTP API (v2) for cost efficiency
- Routes:
  - `ANY /api/{proxy+}` → ALB
  - `ANY /ai/{proxy+}` → ALB
  - `ANY /s/{proxy+}` → ALB

**Benefits:**
- Centralized API management
- Request throttling
- CloudWatch integration

### Application Load Balancer (ALB)

**Purpose:** Load balancing for ECS services

**Configuration:**
- Internal load balancer
- Target groups:
  - Backend (port 8080)
  - AI Service (port 3001)
- Health checks every 30 seconds
- Path-based routing

### ECS Fargate

**Backend Service:**
- Java 21 Spring Boot application
- Task definition:
  - CPU: 512 units
  - Memory: 1024 MB
- Health check: `GET /actuator/health`
- Auto-scaling: disabled (demo mode)

**AI Service:**
- Node.js Express application
- Task definition:
  - CPU: 256 units
  - Memory: 512 MB
- Health check: `GET /health`
- Auto-scaling: disabled (demo mode)

### RDS PostgreSQL

**Purpose:** Relational database for application data

**Configuration:**
- Engine: PostgreSQL 15
- Instance: db.t3.micro
- Storage: 20 GB gp3
- Multi-AZ: disabled (demo mode)
- Automated backups: 7 days
- Private subnet only

**Data Stored:**
- User accounts
- Photo metadata
- Tags
- Folders and albums
- Share links
- Event logs
- Audit trail

### Cognito

**Purpose:** User authentication

**Configuration:**
- User pool with email verification
- App client (public, no secret)
- Password policy:
  - Minimum 8 characters
  - Uppercase, lowercase, numbers required
- MFA: optional
- Email verification required

**Flows:**
- Sign up → Email verification → Login
- Forgot password → Email code → Reset
- JWT tokens for API authentication

### VPC & Networking

**VPC Configuration:**
- CIDR: 10.0.0.0/16
- 2 Availability Zones

**Subnets:**
- Public subnets (10.0.1.0/24, 10.0.2.0/24)
  - NAT Gateway
  - ALB
- Private subnets (10.0.3.0/24, 10.0.4.0/24)
  - ECS tasks
  - RDS instance

**Security Groups:**
- ALB: 80, 443 from anywhere
- ECS Backend: 8080 from ALB
- ECS AI: 3001 from ALB
- RDS: 5432 from ECS security group

---

## Request Flow

### Photo Upload

```
1. User selects files in browser
2. Frontend uploads to /api/photos (POST)
3. CloudFront → API Gateway → ALB → Backend
4. Backend stores metadata in RDS
5. Backend uploads file to S3
6. Response returns to frontend
7. (If auto-tag enabled) Frontend calls AI service
```

### AI Tagging

```
1. Frontend calls /ai/analyze-and-apply
2. CloudFront → API Gateway → ALB → AI Service
3. AI Service fetches image from Backend (/api/photos/{id}/content)
4. AI Service sends to OpenAI Vision API
5. AI Service POSTs tags to Backend (/api/internal/photos/{id}/tags)
6. Backend stores tags in RDS
7. Response returns to frontend
```

### Photo Sharing

```
1. User creates share link
2. Backend generates unique token
3. Backend stores share in RDS
4. Share URL: /s/{token}
5. Public user accesses /s/{token}
6. CloudFront → API Gateway → ALB → Backend
7. Backend validates share (password, expiry, views)
8. Backend returns photo from S3
```

---

## Terraform Structure

```
terraform/
├── main.tf              # Main configuration
├── variables.tf         # Input variables
├── outputs.tf           # Output values
├── terraform.tfvars     # Variable values (gitignored)
├── providers.tf         # AWS provider config
├── vpc.tf               # VPC, subnets, security groups
├── ecs.tf               # ECS cluster, services, tasks
├── rds.tf               # RDS instance
├── s3.tf                # S3 buckets
├── cloudfront.tf        # CloudFront distribution
├── api-gateway.tf       # API Gateway
├── cognito.tf           # Cognito user pool
├── iam.tf               # IAM roles and policies
└── secrets.tf           # Secrets Manager
```

### Key Variables

```hcl
variable "aws_region" {
  default = "us-east-1"
}

variable "environment" {
  default = "production"
}

variable "domain_name" {
  default = "photos.basedsecurity.net"
}

variable "db_password" {
  sensitive = true
}

variable "openai_api_key" {
  sensitive = true
}
```

---

## Deployment Workflow

### Initial Setup

```bash
# 1. Initialize Terraform
cd terraform
terraform init

# 2. Create tfvars file
cp terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values

# 3. Plan and apply
terraform plan
terraform apply
```

### Backend Deployment

```bash
# 1. Build Docker image
cd backend
docker build -t rpf-backend .

# 2. Tag for ECR
docker tag rpf-backend:latest \
  ${AWS_ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com/rpf-backend:latest

# 3. Push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin ${ECR_URL}
docker push ${ECR_URL}/rpf-backend:latest

# 4. Update ECS service
aws ecs update-service \
  --cluster rpf-cluster \
  --service rpf-backend \
  --force-new-deployment
```

### Frontend Deployment

```bash
# 1. Build frontend
cd frontend
npm run build

# 2. Sync to S3
aws s3 sync dist/ s3://rpf-frontend-bucket --delete

# 3. Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id ${CF_DIST_ID} \
  --paths "/*"
```

### AI Service Deployment

```bash
# 1. Build Docker image
cd ai-service
docker build -t rpf-ai .

# 2. Push to ECR
docker tag rpf-ai:latest ${ECR_URL}/rpf-ai:latest
docker push ${ECR_URL}/rpf-ai:latest

# 3. Update ECS service
aws ecs update-service \
  --cluster rpf-cluster \
  --service rpf-ai \
  --force-new-deployment
```

---

## Environment Configuration

### Backend Environment Variables

```
SPRING_PROFILES_ACTIVE=production
SPRING_DATASOURCE_URL=jdbc:postgresql://rds-host:5432/rapidphotoflow
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=${from_secrets}
AWS_S3_BUCKET_PHOTOS=rpf-photos-bucket
SPRING_SECURITY_OAUTH2_RESOURCESERVER_JWT_ISSUER_URI=https://cognito-idp.{region}.amazonaws.com/{pool-id}
```

### AI Service Environment Variables

```
OPENAI_API_KEY=${from_secrets}
BACKEND_URL=http://backend.internal:8080
PORT=3001
```

### Frontend Environment Variables (Build Time)

```
VITE_COGNITO_USER_POOL_ID=us-east-1_xxxxx
VITE_COGNITO_CLIENT_ID=xxxxx
VITE_API_BASE_URL=https://photos.basedsecurity.net
```

---

## Monitoring & Logging

### CloudWatch Logs

Log groups:
- `/ecs/rpf-backend` - Backend application logs
- `/ecs/rpf-ai` - AI service logs
- `/aws/rds/instance/rpf-db/postgresql` - Database logs

### Health Checks

| Service | Endpoint | Interval |
|---------|----------|----------|
| Backend | `/actuator/health` | 30s |
| AI Service | `/health` | 30s |
| RDS | TCP 5432 | 30s |

### Alarms (Recommended)

```hcl
# Example: Backend high CPU
resource "aws_cloudwatch_metric_alarm" "backend_cpu_high" {
  alarm_name          = "rpf-backend-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_actions       = [aws_sns_topic.alerts.arn]
}
```

---

## Cost Optimization

### Current Configuration (Demo Mode)

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| ECS (Backend) | 512 CPU, 1GB RAM | ~$15 |
| ECS (AI) | 256 CPU, 512MB RAM | ~$8 |
| RDS | db.t3.micro, 20GB | ~$15 |
| S3 | Pay per use | ~$1 |
| CloudFront | Pay per request | ~$1 |
| NAT Gateway | Per hour + data | ~$35 |
| **Total** | | **~$75/month** |

### Cost Reduction Options

1. **Remove NAT Gateway** - Use VPC endpoints instead (~$35 savings)
2. **Smaller RDS** - Use db.t3.micro with less storage
3. **Reserved Instances** - 1-year commitment for RDS
4. **S3 Intelligent Tiering** - Auto-archive infrequently accessed photos

### Production Scaling

For production workloads:
- Enable RDS Multi-AZ
- Add ECS auto-scaling
- Use larger instance types
- Enable CloudFront caching policies
- Add read replicas for RDS

---

## Security

### Network Security

- Private subnets for ECS and RDS
- Security groups with minimal permissions
- No public IPs on backend services
- ALB in public subnet as single entry point

### Application Security

- JWT validation on all API endpoints
- CORS configured for allowed origins
- Input validation on all endpoints
- SQL injection prevention via JPA

### Data Security

- RDS encryption at rest
- S3 encryption at rest
- HTTPS everywhere (CloudFront SSL)
- Secrets in AWS Secrets Manager

### IAM Policies

- Least privilege principle
- Separate roles for each service
- No wildcard permissions

---

## Disaster Recovery

### Backup Strategy

| Component | Backup Method | Retention |
|-----------|---------------|-----------|
| RDS | Automated snapshots | 7 days |
| S3 Photos | Cross-region replication (optional) | N/A |
| S3 Frontend | Rebuilt from source | N/A |
| Terraform State | S3 + DynamoDB locking | Versioned |

### Recovery Procedures

**Database Recovery:**
```bash
# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier rpf-db-restored \
  --db-snapshot-identifier rpf-db-snapshot-xxxx
```

**Full Infrastructure Recovery:**
```bash
# Terraform will recreate from state
terraform apply
```

---

## Local Development vs Production

| Aspect | Local | Production |
|--------|-------|------------|
| Database | Docker PostgreSQL | AWS RDS |
| Storage | LocalStack S3 | AWS S3 |
| Auth | Disabled | Cognito JWT |
| AI Service | localhost:3001 | ECS Fargate |
| SSL | None | CloudFront ACM |
| Domain | localhost | photos.basedsecurity.net |

See [README.md](./readme.md) for local development setup instructions.
