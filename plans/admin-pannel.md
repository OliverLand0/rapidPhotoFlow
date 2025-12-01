Here’s a design plan you can hand to Claude (or drop into your repo) for a User Management & Admin Tools feature.

You can save this as user-management.md:

# User Management Portal & Admin Tools

## 1. Goals

- Provide admins with a centralized portal to manage users of the image upload/tagging platform.
- Surface key usage metrics for each user (e.g., last access, total photos, storage, etc.).
- Enable common admin actions (reset password, deactivate user, adjust quotas) in a safe, auditable way.
- Maintain a clear separation of concerns that fits into the existing DDD-style architecture.

---

## 2. Roles & Permissions

### Roles

- **User**
  - Can upload photos, view their own library, manage their own profile.
- **Admin**
  - Can access the **Admin Portal**.
  - Can view and manage all users.
  - Can view aggregated usage stats.
  - Can manage system-level settings related to accounts and quotas.

### Authorization Requirements

- Admin endpoints must require:
  - Authenticated session (e.g., JWT / cookie session).
  - Role claim: `role = "admin"` (or equivalent permission model).
- UI routes under `/admin` must check the user’s role and redirect if unauthorized.

---

## 3. Data Model

> Note: Adjust naming and mapping to match your current domain model and DB schema.

### 3.1 Domain Entities / Aggregates

#### `User`

- `id: string`
- `email: string`
- `username: string`
- `role: "user" | "admin"`
- `status: "active" | "suspended" | "pending" | "deleted"`
- `createdAt: Date`
- `lastLoginAt: Date | null`
- `emailVerified: boolean`
- `profile` (optional nested object):
  - `displayName?: string`
  - `avatarUrl?: string`

#### `UserUsageStats` (Value Object or separate projection)

- `userId: string`
- `totalPhotosUploaded: number`
- `totalStorageBytes: number`
- `lastUploadAt: Date | null`
- `aiTaggingUsageCount: number`
- `failedUploadsCount: number`

#### `UserSettings` (Value Object or aggregate depending on complexity)

- `maxStorageBytes: number`
- `maxPhotos: number`
- `aiTaggingEnabled: boolean`
- `accountNotes?: string` (admin-visible notes about the account)

---

## 4. Core Features

### 4.1 Admin User List View

**Purpose:** Provide a table/grid of users with key info and quick actions.

**Key Columns:**
- Email
- Username
- Role
- Status
- Last Accessed (lastLoginAt)
- Total Photos Uploaded
- Storage Used (formatted: MB/GB)
- AI Tagging Enabled (yes/no)
- Created At

**Actions (per row):**
- View details (opens User Detail page)
- Reset password
- Toggle account status: Activate / Suspend
- Toggle AI Tagging for this user
- Edit quotas (maxStorage, maxPhotos)
- Impersonate / “Login as” (optional, careful with auditing)

**Filters & Sorting:**
- Filter by role (user/admin)
- Filter by status (active, suspended, pending, deleted)
- Filter by AI tagging enabled/disabled
- Search by email or username
- Sort by:
  - Last Accessed
  - Created At
  - Storage Used
  - Total Photos

---

### 4.2 User Detail Page

**Route:** `/admin/users/:userId`

**Sections:**

1. **Profile Summary**
   - Avatar (if any)
   - Email
   - Username
   - Role
   - Status
   - Created At
   - Last Login At
   - Email verified

2. **Usage Overview**
   - Total Photos Uploaded
   - Storage Used
   - Last Upload At
   - AI Tagging usage (e.g., number of conversions or tags generated)
   - Upload error rate (optional metric)

3. **Account Settings**
   - AI Tagging Enabled: toggle
   - Max Storage: input (e.g., GB)
   - Max Photos: input
   - Account Notes: multi-line text for admins (not visible to user)

   Actions:
   - Save settings (with optimistic UI or inline loading state)

4. **Security & Access**
   - Reset password (trigger email or admin-set temporary password)
   - Force logout from all sessions
   - Change role (user/admin)
   - Change status (active/suspended/deleted)

5. **Activity Logs (optional / nice-to-have)**
   - Table of recent actions:
     - Timestamp
     - Type (login, upload, failed upload, tag generation, password reset, etc.)
     - Summary

---

### 4.3 Bulk Admin Actions (Optional / Nice-to-have)

- Select multiple users in the list and:
  - Bulk change status (e.g., suspend many accounts).
  - Bulk enable/disable AI Tagging.
  - Bulk adjust quotas (e.g., bump everyone to 10GB).

---

### 4.4 System-Level Admin Dashboard (Optional / Nice-to-have)

**Route:** `/admin/overview`

- Total users (by status)
- Total storage used vs. global limits
- Total photos uploaded
- Number of active users in last 24h / 7d / 30d
- Top N users by storage or photo count
- Graphs over time (user growth, storage growth, upload volume)

---

## 5. API Design

> Adjust naming & routes to match your existing backend patterns. Example assumes REST-style endpoints under `/api/admin/users`.

### 5.1 Admin User List

**GET** `/api/admin/users`

Query params:
- `page: number`
- `pageSize: number`
- `role?: string`
- `status?: string`
- `search?: string`
- `sortBy?: "lastLoginAt" | "createdAt" | "storageBytes" | "totalPhotos"`
- `sortDir?: "asc" | "desc"`

Response:
```json
{
  "items": [
    {
      "id": "string",
      "email": "string",
      "username": "string",
      "role": "user",
      "status": "active",
      "createdAt": "2025-01-01T00:00:00Z",
      "lastLoginAt": "2025-01-10T12:00:00Z",
      "usage": {
        "totalPhotosUploaded": 123,
        "totalStorageBytes": 456789012,
        "lastUploadAt": "2025-01-09T11:00:00Z"
      },
      "settings": {
        "aiTaggingEnabled": true,
        "maxStorageBytes": 10737418240,
        "maxPhotos": 10000
      }
    }
  ],
  "total": 1000,
  "page": 1,
  "pageSize": 25
}


⸻

5.2 User Detail

GET /api/admin/users/:id

Returns full user + usage + settings and optionally activity logs (or logs via a separate endpoint).

⸻

5.3 Update User Settings

PATCH /api/admin/users/:id/settings

Body (partial updates allowed):

{
  "aiTaggingEnabled": true,
  "maxStorageBytes": 21474836480,
  "maxPhotos": 20000,
  "accountNotes": "High usage, on promo plan"
}


⸻

5.4 Change Status

POST /api/admin/users/:id/status

Body:

{
  "status": "suspended"
}


⸻

5.5 Change Role

POST /api/admin/users/:id/role

Body:

{
  "role": "admin"
}


⸻

5.6 Reset Password

POST /api/admin/users/:id/reset-password
	•	Option A: Sends a password reset email to the user.
	•	Option B: Generates a temporary password returned in the response (more dangerous, must be guarded & audited).

⸻

5.7 Force Logout

POST /api/admin/users/:id/force-logout
	•	Invalidates all sessions / tokens for that user.

⸻

5.8 Activity Logs (Optional)

GET /api/admin/users/:id/activity

Query params:
	•	page, pageSize, from, to, type

⸻

6. Frontend UX & Components

Tailor to your stack (e.g., React / Next.js, Angular, etc.). Below is stack-agnostic.

6.1 Routes
	•	/admin
	•	Redirects to /admin/users.
	•	/admin/users
	•	Lists all users.
	•	/admin/users/:userId
	•	User detail & management.
	•	/admin/overview (optional)
	•	Global stats dashboard.

6.2 Components
	•	AdminLayout
	•	Sidebar: Users, Overview, Settings.
	•	Top bar: current admin info, logout, environment indicator.
	•	UserListTable
	•	Columns, sorting, pagination, search, filters.
	•	Row actions dropdown (View, Reset Password, Suspend, etc.).
	•	UserFilters
	•	Role/status/tag filters & search bar.
	•	UserDetailHeader
	•	UserUsageCard
	•	UserSettingsForm
	•	UserSecurityActions
	•	ActivityLogTable

⸻

7. DDD / Layering Considerations
	•	Domain layer
	•	Aggregates: User, UserSettings, UserUsageStats.
	•	Domain services:
	•	UserAdminService (or equivalent) for operations like:
	•	suspendUser(userId)
	•	resetUserPassword(userId)
	•	updateUserSettings(userId, settingsPatch)
	•	toggleAiTagging(userId, enabled)
	•	Domain events:
	•	UserSuspended
	•	UserRoleChanged
	•	UserSettingsUpdated
	•	UserPasswordResetRequested
	•	Application layer
	•	Use cases / handlers:
	•	GetAdminUserList
	•	GetAdminUserDetail
	•	UpdateUserSettings
	•	ChangeUserStatus
	•	ChangeUserRole
	•	ResetUserPassword
	•	Each use case coordinates repositories, domain services, and external services (e.g., email).
	•	Infrastructure layer
	•	Repositories for User, UserUsageStats, UserSettings.
	•	Integration with:
	•	Auth provider (JWT, Cognito, etc.).
	•	Email service for password reset.
	•	Logging / metrics.

⸻

8. Cool / Optional Extras
	•	Impersonation (“Login as user”)
	•	Admin can temporarily act as the user to debug issues.
	•	Must be heavily audited and visible in logs.
	•	“Power users” badge
	•	Highlight users in the list with unusually high usage.
	•	Account health score
	•	Derived metric showing if user is overshooting quotas, frequently failing uploads, etc.
	•	CSV export
	•	Export user list with usage stats for external reporting.
	•	Per-user feature flags
	•	Turn beta features on/off for specific users.

⸻

9. Non-Functional Requirements
	•	Security
	•	All admin endpoints behind role-checked auth.
	•	Rate limiting on sensitive actions (reset password, role changes).
	•	Audit logs for all admin actions.
	•	Performance
	•	Pagination on user list.
	•	Pre-computed usage stats (don’t calculate from raw uploads on every request).
	•	Indexes on user table for email, status, role.
	•	Observability
	•	Log every admin action with:
	•	Admin user ID
	•	Target user ID
	•	Action type
	•	Timestamp
	•	Testing
	•	Unit tests for use cases / domain services.
	•	Integration tests for admin APIs.
	•	E2E tests for key flows (view user list, modify settings, reset password).

⸻

10. Implementation Steps (High-Level)
	1.	Add / update domain models for User, UserUsageStats, UserSettings.
	2.	Implement repositories and projections needed to fetch usage stats efficiently.
	3.	Add application use cases for admin operations.
	4.	Expose REST/HTTP endpoints under /api/admin/users.
	5.	Wire up auth middleware to enforce admin role.
	6.	Build frontend routes & components:
	•	Admin layout
	•	User list page
	•	User detail page
	7.	Add logging & auditing for admin actions.
	8.	Add tests (unit + integration + E2E).

If you tell me what your current stack is (React, Angular, etc.), I can turn this into concrete API interface definitions + page/component skeletons tailored to your codebase.