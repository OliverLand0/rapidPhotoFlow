# RapidPhotoFlow AWS Infrastructure
# Main Terraform configuration

terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }

  # Uncomment to use S3 backend for state storage
  # backend "s3" {
  #   bucket         = "rapidphotoflow-terraform-state"
  #   key            = "terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "rapidphotoflow-terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "RapidPhotoFlow"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Random suffix for globally unique names
resource "random_id" "suffix" {
  byte_length = 4
}

locals {
  name_prefix = "rpf-${var.environment}"
  common_tags = {
    Project     = "RapidPhotoFlow"
    Environment = var.environment
  }
}
