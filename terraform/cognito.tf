# AWS Cognito User Pool for Authentication

# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${local.name_prefix}-users"

  # Username configuration - allow both email and username
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  # Username case sensitivity
  username_configuration {
    case_sensitive = false
  }

  # Password policy
  password_policy {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                  = false
    require_uppercase                = true
    temporary_password_validity_days = 7
  }

  # Account recovery options
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
  }

  # Email configuration (use Cognito default email)
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # Verification message template
  verification_message_template {
    default_email_option = "CONFIRM_WITH_CODE"
    email_subject        = "RapidPhotoFlow - Verify your email"
    email_message        = "Your verification code is {####}. This code expires in 24 hours."
  }

  # User attribute schema
  schema {
    name                     = "email"
    attribute_data_type      = "String"
    required                 = true
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 5
      max_length = 256
    }
  }

  schema {
    name                     = "preferred_username"
    attribute_data_type      = "String"
    required                 = false
    mutable                  = true
    developer_only_attribute = false

    string_attribute_constraints {
      min_length = 3
      max_length = 50
    }
  }

  # MFA configuration (optional, disabled for simplicity)
  mfa_configuration = "OFF"

  # User pool add-ons
  user_pool_add_ons {
    advanced_security_mode = "OFF" # Set to "ENFORCED" for production with additional cost
  }

  # Admin create user config
  admin_create_user_config {
    allow_admin_create_user_only = false
  }

  tags = {
    Name = "${local.name_prefix}-user-pool"
  }
}

# Cognito User Pool Client (for frontend SPA)
resource "aws_cognito_user_pool_client" "frontend" {
  name         = "${local.name_prefix}-frontend-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # No client secret for SPA (public client)
  generate_secret = false

  # Explicit auth flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_USER_SRP_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH"
  ]

  # Supported identity providers
  supported_identity_providers = ["COGNITO"]

  # Token validity
  access_token_validity  = 1  # hours
  id_token_validity      = 1  # hours
  refresh_token_validity = 30 # days

  token_validity_units {
    access_token  = "hours"
    id_token      = "hours"
    refresh_token = "days"
  }

  # Prevent user existence errors (security best practice)
  prevent_user_existence_errors = "ENABLED"

  # Read/write attributes
  read_attributes = [
    "email",
    "email_verified",
    "preferred_username",
    "sub"
  ]

  write_attributes = [
    "email",
    "preferred_username"
  ]
}

# Cognito User Pool Domain (for hosted UI, optional but useful)
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${local.name_prefix}-${random_id.suffix.hex}"
  user_pool_id = aws_cognito_user_pool.main.id
}
