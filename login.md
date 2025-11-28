# Authentication & Profile Design Plan

## High-Level Goals

1. Add **user authentication** (signup, login, logout) with **email confirmation**.
2. Create a **basic user profile**:
   - Username
   - Email
   - (Hashed) Password (or external auth provider if using Cognito)
3. Associate each **uploaded photo** with the **authenticated user** so we can:
   - Track who uploaded what
   - Filter views by current user
4. Implement everything in a way that fits **DDD**, **clean boundaries**, and our **existing app architecture**.
5. Provision and configure cloud resources via **Terraform** using **AWS**.

---

## Domain & Requirements

### Domain Concepts

- **User**
  - Identity used for auth.
  - Has login credentials and profile info.
- **Profile**
  - Simple extension of User (username, email).
  - All photos must be linked to exactly one User.
- **Auth Session**
  - Represented by a JWT or session token.
  - Used by frontend to call backend APIs.
- **Photo**
  - Already exists in the system (from current app).
  - Must now include `uploadedByUserId`.

### Functional Requirements

1. **Signup**
   - User provides:
     - Email
     - Username
     - Password
   - System:
     - Validates input.
     - Creates a pending user record.
     - Sends **email confirmation link**.
   - User must click link before being allowed to log in.

2. **Email Confirmation**
   - Email contains a secure token in a URL.
   - When user clicks:
     - Backend validates token.
     - Marks user as `isEmailVerified = true`.

3. **Login**
   - Accepts:
     - Email (or username) + password.
   - Validates credentials.
   - Refuses login if `isEmailVerified = false`.
   - Returns a signed JWT/access token (or Cognito tokens).

4. **Logout**
   - Frontend simply clears local tokens.
   - (Optional) Backend token blacklist if needed.

5. **Profile**
   - Basic profile model:
     - `id`
     - `username`
     - `email`
     - `createdAt`
     - `updatedAt`
     - `isEmailVerified`
   - User can:
     - View profile.
     - Update username and (optionally) email.
     - If email changes, require re-verification.

6. **Photo Ownership**
   - Every photo creation/upload must:
     - Require a valid auth token.
     - Assign `uploadedByUserId = currentUserId`.
   - Photo listing endpoints should support:
     - "My photos" filter by `uploadedByUserId`.

7. **Security**
   - Passwords must be hashed using a strong algorithm (e.g., bcrypt, Argon2) if we manage them directly.
   - Tokens should expire and be signed with a strong secret/keys.
   - All auth endpoints must use HTTPS only.

---

## Domain-Driven Design (DDD) Structure

> Adjust package / folder names to match the existing DDD structure of the app.

### New / Updated Domains

1. **Domain: `IdentityAccess` (or `Auth`)**
   - **Entities**
     - `User`
   - **Value Objects**
     - `Email`
     - `Username`
     - `HashedPassword` (if not offloaded to Cognito)
     - `VerificationToken` (if managed in-house)
   - **Aggregates**
     - `UserAggregate` (User + verification state).
   - **Domain Services**
     - `UserRegistrationService`
     - `EmailVerificationService`
     - `AuthenticationService` (for login, token generation).
   - **Repositories**
     - `UserRepository` (interface — infra implementation in `infra/persistence`).

2. **Domain: `Photos`**
   - Update `Photo` entity to include:
     - `uploadedByUserId: UserId`.
   - Domain rule: a `Photo` must always have an owner.

### Application Layer

- **Use Cases / Application Services**
  - `RegisterUserUseCase`
  - `VerifyEmailUseCase`
  - `LoginUserUseCase`
  - `GetProfileUseCase`
  - `UpdateProfileUseCase`
  - `ListMyPhotosUseCase`
  - Possibly `ListAllPhotosUseCase` with permission checks.

- These use cases orchestrate:
  - Domain logic
  - Repositories
  - External services (email, Cognito)

### Infrastructure Layer

- **Persistence**
  - Add `users` table (e.g., in Postgres/DynamoDB) if app uses custom auth.
  - If using Cognito, still persist app-level `UserProfile` with `sub`/`cognitoUserId`.

- **Email**
  - Use AWS SES for sending confirmation email.
  - Infrastructure service `SesEmailSender` implementing `EmailSender` interface.

- **Auth Provider**
  - Option 1: **AWS Cognito** (recommended to reduce custom auth work).
  - Option 2: **Custom auth** (JWT + passwords stored in DB; more work).

---

## AWS Architecture (Recommended: Cognito + SES)

### AWS Services

1. **Amazon Cognito User Pools**
   - Handles:
     - User signup
     - Email confirmation
     - Login
     - Password reset
   - Benefits:
     - Built-in flows and security best practices.
     - Reduces custom auth code.

2. **AWS SES (Simple Email Service)**
   - For verification and notification emails (if not relying entirely on Cognito’s built-in email).
   - May need domain verification and sandbox removal for production.

3. **(Optional) API Gateway + Lambda or Existing Backend**
   - Add endpoints:
     - `/auth/login` (if we wrap Cognito)
     - `/auth/signup`
     - `/auth/refresh` (optional)
     - `/users/me`
     - `/users/me/profile`
     - `/photos` endpoints requiring auth.

4. **Existing Storage for Photos**
   - Likely S3; we only add `uploadedByUserId` to the metadata / DB row.

---

## Terraform Design

> Claude: Please generate Terraform modules in a clean, composable way consistent with the existing Terraform structure.

### High-level Terraform Modules

- `modules/cognito_user_pool`
  - Resources:
    - `aws_cognito_user_pool`
    - `aws_cognito_user_pool_client`
    - `aws_cognito_user_pool_domain` (optional)
  - Configuration:
    - Username: email
    - Auto-verified attributes: email
    - Password policy: strong requirements (length, complexity)
    - Email verification:
      - Use default Cognito email or SES configuration.

- `modules/ses`
  - Resources:
    - `aws_ses_domain_identity`
    - `aws_ses_domain_dkim`
    - `aws_ses_email_identity` (if needed)
  - Outputs:
    - Verified domain
    - Identity ARN

- `modules/backend_api` (if needed)
  - IAM roles to allow API to:
    - Verify Cognito tokens.
    - Access DB for profiles and photos.

### Terraform Inputs / Outputs

- Inputs:
  - `project_name`
  - `environment` (dev, staging, prod)
  - `email_sending_domain`
  - `cognito_callback_urls` (frontend app URLs)
- Outputs:
  - Cognito User Pool ID
  - Cognito App Client ID
  - Cognito domain
  - SES domain identity ARN (if using SES)

---

## Frontend UX & Flows

### Screens / Routes

1. **Login Page**
   - Fields:
     - Email
     - Password
   - Actions:
     - "Login" button
     - "Go to Signup" link
     - "Forgot Password" link (optional; can be v2)
   - Behavior:
     - On success:
       - Store tokens (e.g., localStorage).
       - Redirect to main app/dashboard.
     - On failure:
       - Show clear error messages.

2. **Signup Page**
   - Fields:
     - Email
     - Username
     - Password
     - Confirm Password
   - Behavior:
     - Validate client-side (password length, email format, etc.).
     - On submit, call signup endpoint (Cognito signUp or backend).
     - On success:
       - Show message: "Check your email to confirm your account."

3. **Email Confirmation Page**
   - Route with token (e.g., `/confirm-email?code=...` or `/confirm-email/:token`).
   - Behavior:
     - Call backend/ Cognito confirm endpoint.
     - Show success/failure states.
     - On success:
       - Provide "Go to Login" button.

4. **Profile Page**
   - Shows:
     - Username
     - Email
     - Email verified status
   - Allows edits:
     - Change username
     - Change email (restarts verification)
   - Buttons:
     - "Save"
     - "Logout"

5. **Photos Integration**
   - Photo upload flow:
     - Require user to be logged in.
     - When uploading, include auth token.
     - Backend uses `userId` from token to set `uploadedByUserId`.
   - Photo listing:
     - Add filter "My uploads" using `uploadedByUserId`.
     - Display `uploadedByUsername` in photo cards if available.

---

## API Contracts (Example)

> Claude: adapt field names to match existing backend & frontend naming conventions.

### Auth

- `POST /auth/signup`
  - Request:
    ```json
    {
      "email": "user@example.com",
      "username": "cooluser",
      "password": "StrongP@ssw0rd"
    }
    ```
  - Response:
    ```json
    {
      "message": "User created. Please check your email to confirm your account."
    }
    ```

- `POST /auth/confirm-email`
  - Request:
    ```json
    {
      "token": "verification-token-or-code"
    }
    ```
  - Response:
    ```json
    {
      "message": "Email successfully verified."
    }
    ```

- `POST /auth/login`
  - Request:
    ```json
    {
      "email": "user@example.com",
      "password": "StrongP@ssw0rd"
    }
    ```
  - Response:
    ```json
    {
      "accessToken": "jwt-token",
      "refreshToken": "refresh-token-optional",
      "expiresIn": 3600
    }
    ```

### Profile

- `GET /users/me`
  - Response:
    ```json
    {
      "id": "uuid",
      "username": "cooluser",
      "email": "user@example.com",
      "isEmailVerified": true,
      "createdAt": "2025-11-28T12:00:00Z"
    }
    ```

- `PUT /users/me`
  - Request:
    ```json
    {
      "username": "newusername",
      "email": "new@example.com"
    }
    ```
  - Response:
    ```json
    {
      "id": "uuid",
      "username": "newusername",
      "email": "new@example.com",
      "isEmailVerified": false
    }
    ```

### Photos (Example Change)

- `POST /photos`
  - Requires Authorization header with Bearer token.
  - Backend extracts `userId` from token and sets `uploadedByUserId`.

- `GET /photos?mine=true`
  - Returns only photos where `uploadedByUserId` equals current user.

---

## Rough Monthly Cost Estimate (AWS)

> These are **ballpark** numbers assuming a small dev/staging or low-traffic production environment in us-east-1.

### Cognito

- Cognito User Pools pricing is usage-based (Monthly Active Users).
- Rough estimate for **low usage** (e.g., < 1,000 MAUs):
  - **~$0–10/month** (often a few dollars or effectively negligible at hackathon scale).

### SES

- In many cases, if sending from EC2/Lambda in the same region:
  - First 62,000 emails/month are free (in-region from AWS).
- For a small app:
  - Email volume is tiny (signup confirmations, password resets).
  - Likely **$0–2/month** unless you send many other emails.

### Storage (S3 for photos) & DB

- These already exist for your app; auth features add tiny overhead.
- Expect near-zero incremental cost for adding `uploadedByUserId` fields.

### Total Estimate

For a small app / hackathon scale:

- **Cognito**: ~$0–10/month
- **SES**: ~$0–2/month
- **Extra infra** (API Gateway/Lambda if you add them purely for auth): maybe another **$3–10/month** in light usage.

**Ballpark combined additional cost** for auth-related stack:  
👉 **~$5–20/month** at low scale.

---

## Implementation Priorities

1. **Backend / Infra**
   - Add Cognito user pool + client via Terraform.
   - Configure SES (optional if relying on Cognito emails).
   - Implement `User` domain, repository, and profile endpoints.
   - Wire photos to `uploadedByUserId`.

2. **Frontend**
   - Implement login/signup/confirmation/profile pages.
   - Token storage and auth guard for protected routes.
   - Update photo upload & listing to use user context.

3. **Polish**
   - Validate forms, error handling, and copy.
   - Add “My uploads” filters.
   - Add tests around auth & profile flows.

---