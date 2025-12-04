# User Management & Admin Panel Implementation Plan

## Overview

Implement a full-featured admin panel for user management with dashboard, user list, detail pages, bulk actions, and activity logging. First registered user automatically becomes admin.

## User's Design Decisions

1. **Scope**: Full feature set (list, detail, bulk actions, dashboard, activity logs)
2. **Role Assignment**: First registered user automatically becomes admin

---

## Phase 1: Backend - Database & Entity Changes

### 1.1 Database Migration
Create new migration: `V{next}__add_user_role_and_settings.sql`

```sql
-- Add role enum
CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');

-- Add role column to users table
ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'USER';

-- Add user settings columns
ALTER TABLE users ADD COLUMN max_storage_bytes BIGINT DEFAULT 10737418240; -- 10GB
ALTER TABLE users ADD COLUMN max_photos INT DEFAULT 10000;
ALTER TABLE users ADD COLUMN ai_tagging_enabled BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN account_notes TEXT;
ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE';

-- Make first user admin (backfill)
UPDATE users SET role = 'ADMIN'
WHERE id = (SELECT id FROM users ORDER BY created_at ASC LIMIT 1);

-- Create admin action audit log table
CREATE TABLE admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL REFERENCES users(id),
    target_user_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_admin ON admin_audit_log(admin_user_id);
CREATE INDEX idx_audit_target ON admin_audit_log(target_user_id);
CREATE INDEX idx_audit_created ON admin_audit_log(created_at DESC);
```

### 1.2 Create UserRole Enum
Location: `backend/src/main/java/com/rapidphotoflow/domain/UserRole.java`

```java
public enum UserRole {
    USER,
    ADMIN
}
```

### 1.3 Create UserStatus Enum
Location: `backend/src/main/java/com/rapidphotoflow/domain/UserStatus.java`

```java
public enum UserStatus {
    ACTIVE,
    SUSPENDED,
    PENDING,
    DELETED
}
```

### 1.4 Update UserEntity.java
Add new fields:
- `role` (UserRole, default USER)
- `status` (UserStatus, default ACTIVE)
- `maxStorageBytes` (Long, default 10GB)
- `maxPhotos` (Integer, default 10000)
- `aiTaggingEnabled` (Boolean, default true)
- `accountNotes` (String)
- `lastLoginAt` (Instant)

### 1.5 Create AdminAuditLogEntity
Location: `backend/src/main/java/com/rapidphotoflow/entity/AdminAuditLogEntity.java`

Fields: id, adminUserId, targetUserId, actionType, actionDetails (JSON), createdAt

---

## Phase 2: Backend - Services & Security

### 2.1 Update UserService.java

Add "first user is admin" logic to `syncUser()`:

```java
@Transactional
public UserDTO syncUser() {
    // ... existing code to get/create user ...

    if (isNewUser) {
        // Check if this is the first user
        long userCount = userRepository.count();
        if (userCount == 1) {
            user.setRole(UserRole.ADMIN);
        }
    }

    // Update last login
    user.setLastLoginAt(Instant.now());
    userRepository.save(user);

    return toDTO(user);
}
```

### 2.2 Create AdminService.java
Location: `backend/src/main/java/com/rapidphotoflow/service/AdminService.java`

Methods:
- `getAllUsers(page, size, filters, sort)` - Paginated user list with filtering
- `getUserById(userId)` - Get user with usage stats
- `updateUserSettings(userId, settings)` - Update user settings
- `updateUserStatus(userId, status)` - Change user status
- `updateUserRole(userId, role)` - Change user role
- `resetUserPassword(userId)` - Trigger password reset (Cognito)
- `forceLogout(userId)` - Invalidate sessions (Cognito)
- `bulkUpdateStatus(userIds, status)` - Bulk status change
- `bulkToggleAiTagging(userIds, enabled)` - Bulk AI toggle
- `getSystemStats()` - Dashboard statistics
- `getUserActivityLog(userId, page)` - Activity for specific user

### 2.3 Create AdminAuditService.java
Location: `backend/src/main/java/com/rapidphotoflow/service/AdminAuditService.java`

Methods:
- `logAction(adminId, targetId, actionType, details)` - Log admin action
- `getAuditLog(page, filters)` - Get audit entries

### 2.4 Create UserUsageStatsService.java
Location: `backend/src/main/java/com/rapidphotoflow/service/UserUsageStatsService.java`

Methods:
- `getUsageStatsForUser(userId)` - Get stats for single user
- `getUsageStatsForUsers(userIds)` - Batch stats for user list

Returns:
- totalPhotosUploaded
- totalStorageBytes
- lastUploadAt
- aiTaggingUsageCount (from events)

### 2.5 Update SecurityConfig.java

Enable method-level security and add admin endpoint protection:

```java
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // ... existing config ...

        .authorizeHttpRequests(auth -> auth
            // ... existing rules ...
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            // ...
        )
    }
}
```

### 2.6 Create Custom @AdminOnly Annotation (Optional)
For cleaner controller methods:

```java
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@PreAuthorize("hasRole('ADMIN')")
public @interface AdminOnly {}
```

---

## Phase 3: Backend - Controllers & DTOs

### 3.1 Create AdminController.java
Location: `backend/src/main/java/com/rapidphotoflow/controller/AdminController.java`

Endpoints:
```
GET    /api/admin/users                 - List users (paginated, filterable)
GET    /api/admin/users/{id}            - Get user detail with stats
PATCH  /api/admin/users/{id}/settings   - Update user settings
POST   /api/admin/users/{id}/status     - Change user status
POST   /api/admin/users/{id}/role       - Change user role
POST   /api/admin/users/{id}/reset-password   - Trigger password reset
POST   /api/admin/users/{id}/force-logout     - Force logout
POST   /api/admin/users/bulk/status     - Bulk status change
POST   /api/admin/users/bulk/ai-tagging - Bulk AI tagging toggle
GET    /api/admin/dashboard             - System overview stats
GET    /api/admin/users/{id}/activity   - User activity log
GET    /api/admin/audit                 - Admin action audit log
```

### 3.2 Create DTOs

**AdminUserListDTO** - For user list response:
- id, email, username, role, status
- createdAt, lastLoginAt
- usage: { totalPhotos, totalStorageBytes, lastUploadAt }
- settings: { aiTaggingEnabled, maxStorageBytes, maxPhotos }

**AdminUserDetailDTO** - For user detail response:
- All fields from AdminUserListDTO
- accountNotes
- Extended usage stats

**UpdateUserSettingsRequest**:
- aiTaggingEnabled, maxStorageBytes, maxPhotos, accountNotes

**ChangeStatusRequest**: { status }
**ChangeRoleRequest**: { role }
**BulkStatusRequest**: { userIds[], status }
**BulkAiTaggingRequest**: { userIds[], enabled }

**SystemDashboardDTO**:
- totalUsers, activeUsers, suspendedUsers
- totalPhotos, totalStorageBytes
- usersLast24h, usersLast7d, usersLast30d
- topUsersByStorage[], topUsersByPhotos[]

### 3.3 Update UserDTO
Add new fields: role, status, lastLoginAt

---

## Phase 4: Frontend - Auth & Routing

### 4.1 Update AuthContext.tsx

Add role to user state:

```tsx
interface User {
  id: string;
  email: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

// Add helper
const isAdmin = user?.role === 'ADMIN';
```

### 4.2 Create AdminRoute.tsx
Location: `frontend/src/components/auth/AdminRoute.tsx`

```tsx
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
```

### 4.3 Update App.tsx Routes

Add admin routes:

```tsx
<Route path="/admin" element={
  <ProtectedRoute>
    <AdminRoute>
      <AdminLayout />
    </AdminRoute>
  </ProtectedRoute>
}>
  <Route index element={<Navigate to="/admin/dashboard" replace />} />
  <Route path="dashboard" element={<AdminDashboard />} />
  <Route path="users" element={<AdminUsersPage />} />
  <Route path="users/:userId" element={<AdminUserDetailPage />} />
  <Route path="audit" element={<AdminAuditPage />} />
</Route>
```

### 4.4 Update Layout.tsx

Add conditional admin nav item:

```tsx
const navItems = [
  { to: "/", icon: Upload, label: "Upload" },
  { to: "/review", icon: Grid3X3, label: "Review" },
  { to: "/shares", icon: Share2, label: "Shares" },
  // Add admin link conditionally
  ...(user?.role === 'ADMIN' ? [
    { to: "/admin", icon: Shield, label: "Admin" }
  ] : [])
];
```

---

## Phase 5: Frontend - Admin Pages

### 5.1 Create AdminLayout.tsx
Location: `frontend/src/components/admin/AdminLayout.tsx`

Sidebar navigation for admin section:
- Dashboard
- Users
- Audit Log

### 5.2 Create AdminDashboard.tsx
Location: `frontend/src/pages/admin/AdminDashboard.tsx`

Cards showing:
- Total users, active users
- Total photos, storage used
- User activity charts (last 7/30 days)
- Top users by storage/photos

### 5.3 Create AdminUsersPage.tsx
Location: `frontend/src/pages/admin/AdminUsersPage.tsx`

Features:
- Data table with columns: email, username, role, status, last login, photos, storage, AI enabled
- Search by email/username
- Filters: role, status, AI enabled
- Sorting by all columns
- Row actions: View, Suspend, Reset Password
- Bulk selection + bulk actions
- Pagination

### 5.4 Create AdminUserDetailPage.tsx
Location: `frontend/src/pages/admin/AdminUserDetailPage.tsx`

Sections:
- Profile summary card
- Usage statistics card
- Settings form (quotas, AI toggle, notes)
- Security actions (reset password, force logout, change status/role)
- Activity log table

### 5.5 Create AdminAuditPage.tsx
Location: `frontend/src/pages/admin/AdminAuditPage.tsx`

Table of admin actions:
- Timestamp, admin, target user, action type, details
- Filters by date range, action type, admin user

---

## Phase 6: Frontend - API Client & Types

### 6.1 Update types.ts

```typescript
// Add to existing types
export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'DELETED';

export interface AdminUser {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  usage: UserUsageStats;
  settings: UserSettings;
}

export interface UserUsageStats {
  totalPhotosUploaded: number;
  totalStorageBytes: number;
  lastUploadAt: string | null;
  aiTaggingUsageCount: number;
}

export interface UserSettings {
  maxStorageBytes: number;
  maxPhotos: number;
  aiTaggingEnabled: boolean;
  accountNotes?: string;
}

export interface SystemDashboard {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalPhotos: number;
  totalStorageBytes: number;
  usersLast24h: number;
  usersLast7d: number;
  usersLast30d: number;
  topUsersByStorage: TopUser[];
  topUsersByPhotos: TopUser[];
}
```

### 6.2 Create adminClient in client.ts

```typescript
export const adminClient = {
  getUsers: (params) => fetchJson<PagedResponse<AdminUser>>(`/api/admin/users?${qs}`),
  getUserById: (id) => fetchJson<AdminUserDetail>(`/api/admin/users/${id}`),
  updateUserSettings: (id, settings) => fetchJson(`/api/admin/users/${id}/settings`, { method: 'PATCH', body }),
  changeUserStatus: (id, status) => fetchJson(`/api/admin/users/${id}/status`, { method: 'POST', body }),
  changeUserRole: (id, role) => fetchJson(`/api/admin/users/${id}/role`, { method: 'POST', body }),
  resetPassword: (id) => fetchJson(`/api/admin/users/${id}/reset-password`, { method: 'POST' }),
  forceLogout: (id) => fetchJson(`/api/admin/users/${id}/force-logout`, { method: 'POST' }),
  bulkUpdateStatus: (userIds, status) => fetchJson(`/api/admin/users/bulk/status`, { method: 'POST', body }),
  bulkToggleAiTagging: (userIds, enabled) => fetchJson(`/api/admin/users/bulk/ai-tagging`, { method: 'POST', body }),
  getDashboard: () => fetchJson<SystemDashboard>(`/api/admin/dashboard`),
  getUserActivity: (id, page) => fetchJson(`/api/admin/users/${id}/activity?page=${page}`),
  getAuditLog: (params) => fetchJson(`/api/admin/audit?${qs}`),
};
```

---

## Critical Files to Modify/Create

### Backend (New Files)
1. `db/migration/V{next}__add_user_role_and_settings.sql`
2. `domain/UserRole.java`
3. `domain/UserStatus.java`
4. `entity/AdminAuditLogEntity.java`
5. `repository/AdminAuditLogRepository.java`
6. `service/AdminService.java`
7. `service/AdminAuditService.java`
8. `service/UserUsageStatsService.java`
9. `controller/AdminController.java`
10. `dto/admin/*.java` (multiple DTOs)

### Backend (Modify)
1. `entity/UserEntity.java` - Add new fields
2. `dto/UserDTO.java` - Add role, status
3. `service/UserService.java` - First user is admin logic
4. `config/SecurityConfig.java` - Admin endpoint protection

### Frontend (New Files)
1. `components/auth/AdminRoute.tsx`
2. `components/admin/AdminLayout.tsx`
3. `pages/admin/AdminDashboard.tsx`
4. `pages/admin/AdminUsersPage.tsx`
5. `pages/admin/AdminUserDetailPage.tsx`
6. `pages/admin/AdminAuditPage.tsx`

### Frontend (Modify)
1. `App.tsx` - Add admin routes
2. `components/Layout.tsx` - Conditional admin nav
3. `contexts/AuthContext.tsx` - Add role to user
4. `lib/api/types.ts` - Admin types
5. `lib/api/client.ts` - Admin client

---

## Implementation Order

### Phase A: Foundation (Backend)
1. Database migration with role, status, settings columns
2. Create enums (UserRole, UserStatus)
3. Update UserEntity with new fields
4. Update UserService with first-user-is-admin logic
5. Update SecurityConfig for admin endpoints

### Phase B: Admin Services (Backend)
6. Create AdminAuditLogEntity and repository
7. Create AdminAuditService
8. Create UserUsageStatsService
9. Create AdminService with all methods
10. Create AdminController with all endpoints
11. Create all DTOs

### Phase C: Frontend Auth
12. Update AuthContext with role
13. Create AdminRoute component
14. Update App.tsx with admin routes
15. Update Layout.tsx with admin nav item

### Phase D: Admin Pages (Frontend)
16. Create AdminLayout
17. Create AdminDashboard
18. Create AdminUsersPage with table
19. Create AdminUserDetailPage
20. Create AdminAuditPage

### Phase E: Testing & Polish
21. Write backend unit tests
22. Write backend integration tests
23. Manual end-to-end testing
24. Deploy and verify

---

## Testing Requirements

### Unit Tests
- AdminService methods
- UserUsageStatsService calculations
- First-user-is-admin logic
- Role/permission checks

### Integration Tests
- Admin endpoints return 403 for non-admins
- Admin endpoints work for admins
- Bulk operations
- Audit logging

### Manual Tests
- First user registration becomes admin
- Admin nav item visibility
- All admin pages load correctly
- Bulk actions work
- Activity logs populate

---

## Security Considerations

1. **All admin endpoints** must be protected with `@PreAuthorize("hasRole('ADMIN')")`
2. **Audit all admin actions** - every change must be logged
3. **Prevent self-demotion** - admin cannot change their own role
4. **Prevent last admin deletion** - system must have at least one admin
5. **Rate limit** password reset and force logout actions
6. **Validate status transitions** - can't activate a deleted user
