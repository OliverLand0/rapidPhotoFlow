#!/bin/bash
# RapidPhotoFlow AWS Deployment Script (Minimal Architecture)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== RapidPhotoFlow AWS Deployment (Minimal) ===${NC}"

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"

    if ! command -v terraform &> /dev/null; then
        echo -e "${RED}Terraform is not installed. Please install it first.${NC}"
        exit 1
    fi

    if ! command -v aws &> /dev/null; then
        echo -e "${RED}AWS CLI is not installed. Please install it first.${NC}"
        exit 1
    fi

    if ! command -v docker &> /dev/null; then
        echo -e "${RED}Docker is not installed. Please install it first.${NC}"
        exit 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity &> /dev/null; then
        echo -e "${RED}AWS credentials not configured. Run 'aws configure' first.${NC}"
        exit 1
    fi

    echo -e "${GREEN}All prerequisites met!${NC}"
}

# Initialize Terraform
init_terraform() {
    echo -e "${YELLOW}Initializing Terraform...${NC}"
    terraform init
}

# Plan infrastructure
plan_infrastructure() {
    echo -e "${YELLOW}Planning infrastructure changes...${NC}"
    terraform plan -out=tfplan
}

# Apply infrastructure
apply_infrastructure() {
    echo -e "${YELLOW}Applying infrastructure changes...${NC}"
    terraform apply tfplan
}

# Get outputs
get_outputs() {
    echo -e "${YELLOW}Getting deployment outputs...${NC}"
    terraform output
}

# Build and push Docker images
build_and_push_images() {
    echo -e "${YELLOW}Building and pushing Docker images...${NC}"

    # Get ECR repository URLs
    BACKEND_ECR=$(terraform output -raw backend_ecr_repository_url)
    AI_SERVICE_ECR=$(terraform output -raw ai_service_ecr_repository_url)
    AWS_REGION=$(aws configure get region || echo "us-east-1")

    # Login to ECR
    aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $BACKEND_ECR

    # Build and push backend
    echo -e "${YELLOW}Building backend image...${NC}"
    cd ../backend
    docker build -t rapidphotoflow-backend .
    docker tag rapidphotoflow-backend:latest $BACKEND_ECR:latest
    docker push $BACKEND_ECR:latest

    # Build and push AI service
    echo -e "${YELLOW}Building AI service image...${NC}"
    cd ../ai-service
    docker build -t rapidphotoflow-ai-service .
    docker tag rapidphotoflow-ai-service:latest $AI_SERVICE_ECR:latest
    docker push $AI_SERVICE_ECR:latest

    cd ../terraform
    echo -e "${GREEN}Docker images pushed successfully!${NC}"
}

# Deploy frontend to S3
deploy_frontend() {
    echo -e "${YELLOW}Deploying frontend to S3...${NC}"

    FRONTEND_BUCKET=$(terraform output -raw frontend_bucket_name)
    CLOUDFRONT_ID=$(terraform output -raw cloudfront_distribution_id)

    # Build frontend
    cd ../frontend
    npm run build

    # Sync to S3
    aws s3 sync dist/ s3://$FRONTEND_BUCKET --delete

    # Invalidate CloudFront cache
    aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_ID --paths "/*"

    cd ../terraform
    echo -e "${GREEN}Frontend deployed successfully!${NC}"
}

# Force ECS service update
update_ecs_services() {
    echo -e "${YELLOW}Updating ECS services...${NC}"

    CLUSTER_NAME=$(terraform output -raw ecs_cluster_name)
    BACKEND_SERVICE=$(terraform output -raw backend_service_name)
    AI_SERVICE=$(terraform output -raw ai_service_name)

    aws ecs update-service --cluster $CLUSTER_NAME --service $BACKEND_SERVICE --force-new-deployment
    aws ecs update-service --cluster $CLUSTER_NAME --service $AI_SERVICE --force-new-deployment

    echo -e "${GREEN}ECS services updated!${NC}"
}

# Main menu
main() {
    check_prerequisites

    echo ""
    echo "Select an action:"
    echo "1) Full deployment (infrastructure + images + frontend)"
    echo "2) Infrastructure only (terraform apply)"
    echo "3) Build and push Docker images"
    echo "4) Deploy frontend only"
    echo "5) Update ECS services (force new deployment)"
    echo "6) Show outputs"
    echo "7) Destroy infrastructure"
    echo ""
    read -p "Enter choice [1-7]: " choice

    case $choice in
        1)
            init_terraform
            plan_infrastructure
            read -p "Apply changes? (yes/no): " confirm
            if [ "$confirm" == "yes" ]; then
                apply_infrastructure
                build_and_push_images
                deploy_frontend
                update_ecs_services
                get_outputs
            fi
            ;;
        2)
            init_terraform
            plan_infrastructure
            read -p "Apply changes? (yes/no): " confirm
            if [ "$confirm" == "yes" ]; then
                apply_infrastructure
                get_outputs
            fi
            ;;
        3)
            build_and_push_images
            update_ecs_services
            ;;
        4)
            deploy_frontend
            ;;
        5)
            update_ecs_services
            ;;
        6)
            get_outputs
            ;;
        7)
            echo -e "${RED}WARNING: This will destroy all infrastructure!${NC}"
            read -p "Are you sure? Type 'destroy' to confirm: " confirm
            if [ "$confirm" == "destroy" ]; then
                terraform destroy
            fi
            ;;
        *)
            echo "Invalid choice"
            exit 1
            ;;
    esac

    echo ""
    echo -e "${GREEN}=== Deployment complete! ===${NC}"
    echo ""
    echo "Application URL: $(terraform output -raw application_url 2>/dev/null || echo 'Run terraform apply first')"
}

main "$@"
