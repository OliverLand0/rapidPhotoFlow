# RapidPhotoFlow Frontend

A modern React application for photo management with AI-powered tagging, built with TypeScript and Tailwind CSS.

## Technology Stack

- **React 19** - Latest React with concurrent features
- **TypeScript** - Full type safety
- **Vite 7** - Fast build tool and dev server
- **Tailwind CSS 4** - Utility-first styling
- **shadcn/ui** - Production-ready component library
- **React Router 7** - Client-side routing
- **Amazon Cognito Identity JS** - Authentication

---

## Pages

### Upload Page (`/upload`)

The main upload interface for adding photos to the system.

**Features:**
- Drag-and-drop upload zone
- File picker alternative
- Multi-file batch upload (30 files at a time)
- Real-time upload progress with speed tracking
- Live file preview grid
- AI auto-tagging toggle
- Format conversion toggle (TIFF/BMP to JPEG/PNG)
- Large upload warning dialog (100+ files)
- Quick stats panel (Processed, Approved, Failed, Total)
- Storage usage tracker
- Recently completed photos list
- Status legend/guide

**Supported Formats:**
- Native: JPEG, PNG, GIF, WebP, BMP, SVG
- Extended: RAW (CR2, NEF, DNG, ARW, etc.), HEIC/HEIF, TIFF

### Review Page (`/review`)

The main photo review and management interface.

**Photo Gallery:**
- Responsive grid layout (1-3 columns)
- Photo cards with status badges
- Tag display on cards
- Selection checkboxes
- Click-to-preview functionality
- Keyboard navigation (J/K or arrow keys)

**Filtering & Search:**
- Status tabs (All, Ready to Review, Approved, Rejected, Failed)
- Text search by filename
- Tag-based filtering with autocomplete
- Multiple tag selection
- Sort options (Newest, Oldest, Status)
- Clear filters button

**Saved Views:**
- Save custom filter combinations
- Built-in preset views
- User-created views
- Load/delete saved views

**Bulk Actions:**
- Select multiple photos
- Select all on page
- Bulk approve
- Bulk reject
- Bulk delete (with confirmation)
- Bulk action summary

**Folder Management:**
- Folder tree sidebar (desktop)
- Create folder modal
- Move photos to folder
- Folder breadcrumbs
- Hierarchical navigation

**Event Log Panel:**
- Action history sidebar
- Event filtering
- Click-through to photo
- Real-time updates

**Pagination:**
- Configurable page size
- Page navigation
- Total count display

### Photo Preview Modal

Full-screen photo viewer accessible from the review page.

**Features:**
- Full-resolution photo display
- Photo metadata panel
- Tags display with add/remove
- Keyboard navigation (arrows for next/previous)
- Close with Escape key
- Action buttons (Approve, Reject, Delete)
- Retry button for failed photos
- Failure reason display
- AI tagging button

### Shares Page (`/shares`)

Manage all share links created by the user.

**Share List:**
- Thumbnail previews
- Target info (photo/album/folder name)
- Status badges (Active, Expired, Disabled)
- Creation date
- Analytics (views, downloads)

**Filtering:**
- Filter by status (All, Active, Expired, Disabled)
- Sort by (Newest, Oldest, Most Views, Most Downloads)

**Stats Summary:**
- Total shares count
- Active count
- Total views
- Total downloads

**Actions:**
- Copy link to clipboard
- Open in new tab
- Toggle active/inactive
- Delete share

### Admin Dashboard (`/admin`)

System overview for administrators.

**Statistics:**
- Total registered users
- Active users / Suspended users
- Total photos in system
- Total storage used
- Upload activity (today, week, month)

**Quick Links:**
- Manage Users
- View Audit Log

### User Management (`/admin/users`)

Admin interface for managing users.

**User List:**
- Search by email or username
- Display: email, username, status, role
- Status badges (Active, Suspended, Pending, Deleted)
- Role badges (Admin, User)
- Per-user statistics (photos, storage, AI events)

**User Actions:**
- Suspend user (with reason)
- Reactivate suspended user
- View detailed user info

### Audit Log (`/admin/audit`)

Complete history of admin actions.

**Features:**
- Action type and description
- Admin who performed action
- Target user (if applicable)
- Timestamp
- Reason (for suspensions)
- Search by action type, admin, or user
- Pagination (50 per page)

### Authentication Pages

- **Login** (`/login`) - Email/password login
- **Signup** (`/signup`) - New user registration
- **Confirm Email** (`/confirm-email`) - Email verification
- **Forgot Password** (`/forgot-password`) - Password reset request
- **Reset Password** (`/reset-password`) - Set new password

### Profile Page (`/profile`)

User profile management.

**Features:**
- View user information
- Edit profile (username)
- AI tagging preferences
- Account settings

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `J` / `K` | Navigate to next/previous photo |
| `←` / `→` | Navigate to next/previous photo |
| `Enter` | Open photo preview |
| `A` | Approve selected/viewed photo |
| `R` | Reject selected/viewed photo |
| `D` | Delete selected/viewed photo |
| `Space` | Toggle selection on current photo |
| `Shift + Click` | Multi-select range |
| `?` | Show keyboard shortcuts modal |
| `Escape` | Close modal/preview |

---

## Components

### Shared Components (`/src/components/shared/`)

- **PhotoCard** - Photo thumbnail with status and tags
- **PhotoPreviewModal** - Full-screen photo viewer
- **StatusBadge** - Status indicator chips
- **TagEditor** - Add/remove tags interface
- **TagList** - Display tag chips
- **KeyboardShortcutsModal** - Shortcuts reference
- **SavedViewsPanel** - Saved filter management
- **FolderTree** - Hierarchical folder navigation
- **TaggingProgressPanel** - AI tagging queue status

### Admin Components (`/src/components/admin/`)

- **AdminDashboard** - System statistics
- **UserList** - User management table
- **UserDetails** - Detailed user view
- **AuditLogTable** - Admin action history

### Layout Components

- **Layout** - Main app layout with navigation
- **AdminLayout** - Admin panel layout
- **Sidebar** - Navigation sidebar

### UI Components (`/src/components/ui/`)

shadcn/ui based components:
- Button, Card, Dialog, Input, Select
- Badge, Toast, Skeleton
- Table, Tabs, Tooltip

---

## State Management

### Contexts

**AuthContext** (`/src/contexts/AuthContext.tsx`)
- User authentication state
- Login/logout functions
- Token management
- Cognito integration

**PhotosContext** (`/src/lib/PhotosContext.tsx`)
- Central photo data store
- Photo CRUD operations
- Smart polling (faster when processing active)
- Photo selection state

**FoldersContext** (`/src/contexts/FoldersContext.tsx`)
- Folder tree state
- Folder CRUD operations
- Current folder tracking

**AIServiceContext** (`/src/contexts/AIServiceContext.tsx`)
- AI service health status
- Tagging queue management
- Progress tracking

### Custom Hooks

**usePhotoFilters** (`/src/lib/hooks/usePhotoFilters.ts`)
- Advanced filtering logic
- Search, tag, status filters
- Sort options
- Filter URL sync (planned)

**usePhotoSelection** (`/src/lib/hooks/usePhotoSelection.ts`)
- Multi-select state
- Shift-range selection
- Select all functionality

**usePhotoActions** (`/src/lib/hooks/usePhotoActions.ts`)
- Approve/reject/delete operations
- Bulk action support
- Error handling

**useKeyboardShortcuts** (`/src/lib/hooks/useKeyboardShortcuts.ts`)
- Keyboard event handling
- Shortcut registration
- Modal awareness

**useSavedViews** (`/src/lib/hooks/useSavedViews.ts`)
- Saved filter persistence
- Create/delete views
- Local storage sync

**useEventLog** (`/src/lib/hooks/useEventLog.ts`)
- Event history fetching
- Filtering by photo/type
- Real-time updates

---

## API Client

### Structure (`/src/lib/api/`)

**client.ts** - Main API client
- Photo operations
- Folder operations
- Album operations
- Share operations
- Event queries

**authApi.ts** - Authentication API
- User sync
- Profile updates

**types.ts** - TypeScript interfaces
- Photo, Folder, Album, Share types
- API response types
- Event types

### Environment Detection

The API client automatically detects the environment:

```typescript
const isDev = import.meta.env.DEV;
const API_BASE = isDev ? "http://localhost:8080/api" : "/api";
const AI_SERVICE_BASE = isDev ? "http://localhost:3001/ai" : "/ai";
```

---

## Routing

```typescript
// Main routes
/                    → Redirect to /upload
/upload              → Upload page
/review              → Review page
/shares              → Shares management
/profile             → User profile

// Auth routes
/login               → Login page
/signup              → Registration
/confirm-email       → Email verification
/forgot-password     → Password reset request
/reset-password      → New password form

// Admin routes (protected)
/admin               → Admin dashboard
/admin/users         → User management
/admin/audit         → Audit log

// Public routes
/s/:token            → Public share view
```

---

## Local Development

### Prerequisites

- Node.js 20+
- npm or yarn

### Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Create `.env.local` for local development:

```env
VITE_COGNITO_USER_POOL_ID=your-pool-id
VITE_COGNITO_CLIENT_ID=your-client-id
VITE_API_BASE_URL=http://localhost:8080
```

For local development without Cognito, authentication is bypassed when these variables are not set.

### Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build
npm run lint      # Run ESLint
npm run test      # Run tests
npm run test:run  # Run tests once (CI)
```

---

## Styling

### Tailwind CSS 4

The project uses Tailwind CSS with the following configuration:

- Custom color palette (primary, secondary, muted, accent)
- Dark mode support (class-based)
- Custom animations
- Responsive breakpoints

### CSS Variables

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --border: 214.3 31.8% 91.4%;
  /* ... */
}
```

---

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── admin/           # Admin-specific components
│   │   ├── shared/          # Shared components
│   │   └── ui/              # shadcn/ui components
│   ├── contexts/            # React contexts
│   ├── lib/
│   │   ├── api/             # API client and types
│   │   ├── hooks/           # Custom hooks
│   │   └── utils.ts         # Utility functions
│   ├── pages/               # Route pages
│   ├── App.tsx              # Root component with routing
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
```

---

## Testing

### Test Setup

Tests use Vitest and React Testing Library:

```bash
npm run test        # Watch mode
npm run test:run    # Single run (CI)
```

### Test Structure

```
src/
├── __tests__/
│   ├── components/   # Component tests
│   ├── hooks/        # Hook tests
│   └── pages/        # Page tests
```

---

## Build & Deployment

### Production Build

```bash
npm run build
```

Output is generated in `dist/` directory.

### Deployment

The frontend is deployed to AWS S3 with CloudFront CDN:

1. Build the production bundle
2. Sync to S3 bucket
3. Invalidate CloudFront cache

```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id XXXXX --paths "/*"
```
