# Variables for RapidPhotoFlow Infrastructure

variable "aws_region" {
  description = "AWS region to deploy resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# VPC Configuration
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of availability zones"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b"]
}

# RDS Configuration
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro" # Free tier eligible
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "rapidphotoflow"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "rpfadmin"
  sensitive   = true
}

# ECS Configuration
variable "backend_cpu" {
  description = "CPU units for backend task (256 = 0.25 vCPU)"
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Memory for backend task in MB"
  type        = number
  default     = 512
}

variable "ai_service_cpu" {
  description = "CPU units for AI service task"
  type        = number
  default     = 256
}

variable "ai_service_memory" {
  description = "Memory for AI service task in MB"
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Desired number of backend tasks"
  type        = number
  default     = 1
}

variable "ai_service_desired_count" {
  description = "Desired number of AI service tasks"
  type        = number
  default     = 1
}

# Container Images
variable "backend_image" {
  description = "Docker image for backend service"
  type        = string
  default     = "" # Will use ECR repository
}

variable "ai_service_image" {
  description = "Docker image for AI service"
  type        = string
  default     = "" # Will use ECR repository
}

# Domain Configuration (Optional)
variable "domain_name" {
  description = "Custom domain name (optional)"
  type        = string
  default     = ""
}

variable "create_dns_records" {
  description = "Create Route53 DNS records"
  type        = bool
  default     = false
}

# Cost Optimization
variable "enable_multi_az" {
  description = "Enable Multi-AZ for RDS (higher availability but ~2x cost)"
  type        = bool
  default     = false
}

# OpenAI Configuration
variable "openai_api_key" {
  description = "OpenAI API key for AI service"
  type        = string
  sensitive   = true
}
