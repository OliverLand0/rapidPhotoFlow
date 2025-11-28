# API Gateway HTTP API (Cost-effective alternative to ALB)
# Pay per request instead of hourly ALB charges

# HTTP API
resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"
  description   = "RapidPhotoFlow API Gateway"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    allow_headers = ["*"]
    max_age       = 3600
  }

  tags = {
    Name = "${local.name_prefix}-api"
  }
}

# VPC Link for private integration with ECS
resource "aws_apigatewayv2_vpc_link" "main" {
  name               = "${local.name_prefix}-vpc-link"
  security_group_ids = [aws_security_group.ecs_tasks.id]
  subnet_ids         = aws_subnet.public[*].id

  tags = {
    Name = "${local.name_prefix}-vpc-link"
  }
}

# Direct HTTP integration to public ALB for Backend
resource "aws_apigatewayv2_integration" "backend" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = "http://${aws_lb.main.dns_name}"
  connection_type    = "INTERNET"

  # Pass through the original path (e.g., /api/photos -> /api/photos)
  request_parameters = {
    "overwrite:path" = "$request.path"
  }
}

# Direct HTTP integration to public ALB for AI Service
resource "aws_apigatewayv2_integration" "ai_service" {
  api_id             = aws_apigatewayv2_api.main.id
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri    = "http://${aws_lb.main.dns_name}"
  connection_type    = "INTERNET"

  # Pass through the original path (e.g., /ai/process -> /ai/process)
  request_parameters = {
    "overwrite:path" = "$request.path"
  }
}

# Route for Backend API
resource "aws_apigatewayv2_route" "backend" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /api/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.backend.id}"
}

# Route for AI Service
resource "aws_apigatewayv2_route" "ai_service" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /ai/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.ai_service.id}"
}

# Default stage with auto-deploy
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }

  tags = {
    Name = "${local.name_prefix}-api-stage"
  }
}
