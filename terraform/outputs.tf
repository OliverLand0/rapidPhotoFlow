# Terraform Outputs (Minimal Architecture)

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

# S3 Outputs
output "frontend_bucket_name" {
  description = "Frontend S3 bucket name"
  value       = aws_s3_bucket.frontend.bucket
}

output "photos_bucket_name" {
  description = "Photos S3 bucket name"
  value       = aws_s3_bucket.photos.bucket
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.main.endpoint
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

# ECR Outputs
output "backend_ecr_repository_url" {
  description = "Backend ECR repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "ai_service_ecr_repository_url" {
  description = "AI Service ECR repository URL"
  value       = aws_ecr_repository.ai_service.repository_url
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.main.name
}

output "backend_service_name" {
  description = "Backend ECS service name"
  value       = aws_ecs_service.backend.name
}

output "ai_service_name" {
  description = "AI Service ECS service name"
  value       = aws_ecs_service.ai_service.name
}

# API Gateway Outputs
output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_apigatewayv2_api.main.id
}

# CloudFront Outputs
output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.main.id
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.main.domain_name
}

output "application_url" {
  description = "Main application URL"
  value       = "https://${aws_cloudfront_distribution.main.domain_name}"
}

# Service Discovery
output "service_discovery_namespace" {
  description = "Service Discovery namespace"
  value       = aws_service_discovery_private_dns_namespace.main.name
}

# Secrets ARNs (for reference)
output "db_credentials_secret_arn" {
  description = "Database credentials secret ARN"
  value       = aws_secretsmanager_secret.db_credentials.arn
}

output "openai_api_key_secret_arn" {
  description = "OpenAI API key secret ARN"
  value       = aws_secretsmanager_secret.openai_api_key.arn
}

# Cognito Outputs
output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  value       = aws_cognito_user_pool.main.arn
}

output "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.frontend.id
}

output "cognito_domain" {
  description = "Cognito User Pool Domain"
  value       = aws_cognito_user_pool_domain.main.domain
}

output "cognito_issuer_uri" {
  description = "Cognito Issuer URI for JWT validation"
  value       = "https://cognito-idp.${var.aws_region}.amazonaws.com/${aws_cognito_user_pool.main.id}"
}

# Cost Summary
output "estimated_monthly_cost" {
  description = "Estimated monthly cost breakdown"
  value       = <<-EOT
    Estimated Monthly Cost (Minimal Architecture):
    - ECS Fargate (2 tasks): ~$18
    - RDS db.t3.micro: $0 (free tier) or ~$15
    - S3 (10GB): ~$1
    - CloudFront (10GB): ~$1
    - API Gateway (pay per request): ~$0-3
    - Secrets Manager (2 secrets): ~$1
    - Cloud Map: ~$0.50
    ----------------------------------------
    Total: ~$20-40/month (vs ~$70 with ALB)
  EOT
}
