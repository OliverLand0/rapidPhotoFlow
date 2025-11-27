# RapidPhotoFlow — AI-First Design Document (v1.0)

**Author:** Your Team  
**Date:** November 26, 2025  
**Timeline:** 2 days (Wed 10 AM ET → Fri 10 AM ET)  
**Architecture Philosophy:** AI-generated, event-driven, production SaaS aesthetic

---

## 1. Executive Summary

RapidPhotoFlow is a lightweight photo management workflow demonstrating AI-first full-stack engineering with **intentional, modern design**. The system enables concurrent photo uploads, simulates async processing with realistic state transitions, and provides a **sleek, minimal review interface** with comprehensive event logging.

**Core Principle:** This is not a production-grade image processor—it's an architectural demonstration of how AI tooling (Cursor, Claude, component generators) can rapidly scaffold clean, maintainable full-stack applications with **production SaaS-quality UI** and proper separation of concerns.

**Design Philosophy:** Think Linear meets Vercel meets Stripe Dashboard—minimal, purposeful, with every element earning its place on the screen.

---

## 2. Business Problem & Goals

### Problem Statement
Teams need rapid prototyping capabilities for photo-based workflows (insurance claims, field inspections, damage assessment) without building heavy infrastructure. Current solutions either over-engineer with S3/CDN/thumbnailing or under-deliver with basic CRUD **and ugly interfaces**.

### Goals
✅ Upload multiple photos concurrently with modern drag-and-drop  
✅ Simulate realistic async processing (2-5 seconds per photo)  
✅ Display live status updates with intentional, clear UI states  
✅ Provide clean review workflow (Approve/Reject/Retry)  
✅ Maintain comprehensive event audit log  
✅ **Deliver production-quality SaaS aesthetic** with zero custom CSS beyond Tailwind  

### Non-Goals
❌ Real image processing (OCR, AI analysis, compression)  
❌ Authentication/authorization  
❌ Multi-tenant RLS  
❌ Cloud storage (S3/CDN)  
❌ Production-grade observability  
❌ Database persistence (using in-memory for speed)

---

## 3. AI-Accelerated Engineering Strategy

### Development Toolchain

**Backend: Cursor AI as Code Factory**
- Generate complete vertical slices (Controller → Service → Repository)
- Scaffold Spring Boot with proper layering automatically
- Create DTOs, enums, and state machines via prompts
- Auto-generate OpenAPI spec for type safety

**Frontend: Cursor AI + shadcn/ui Component Generation**
- Use Cursor with **intentional design system prompts**
- Generate React components with **Linear/Vercel/Stripe aesthetic**
- Leverage shadcn/ui primitives (no div soup)
- Auto-wire API clients from OpenAPI spec
- Create polling hooks with clear loading/error/empty states

**Design System Strategy**
- **Vibe:** Minimal, modern, production SaaS
- **Palette:** Neutral gray/stone base + single accent color (blue/indigo)
- **Spacing:** Generous whitespace, consistent padding hierarchy
- **Typography:** Clear hierarchy, readable sizes
- **Components:** shadcn/ui only (Button, Card, Badge, Table, Dialog, Tabs)
- **States:** Every component has intentional loading/error/empty states

### Why AI-First Works Here
- **Consistency:** Every component follows the same design system
- **Speed:** Generate 30+ components in minutes vs. days of handwriting
- **Standards Compliance:** AI enforces design patterns automatically
- **Professional Polish:** No "hackathon UI"—production-ready from the start

---

## 4. System Architecture

### High-Level Flow
```
[Browser]
   ↓ Upload (multipart/form-data)
[Spring Boot REST API]
   ↓ Create Photo + Event
[In-Memory Photo Store]
   ↓ Polling (every 3s)
[Background Processor]
   ↓ Simulate Work + Update Status
[Event Log]
   ↓ Poll (every 5s)
[React Frontend] → Sleek Gallery + Statuses
```

### Architecture Layers

**Presentation Layer (React)**
- `UploadScreen`: Prominent drag-drop Card with dashed border
- `ProcessingQueue`: Clean table with status chips and auto-poll indicator
- `ReviewGallery`: Two-column (photo grid + event panel)
- `EventLogPanel`: Scrollable timeline with timestamps

**API Layer (Spring Boot Controllers)**
- `PhotoController`: CRUD + bulk upload
- `PhotoActionController`: Approve/reject/retry operations
- `EventController`: Query event history

**Application Layer (Services)**
- `PhotoService`: Business logic for photo lifecycle
- `ProcessorService`: Background job orchestration
- `EventService`: Event creation and querying

**Domain Layer**
- `Photo`: Aggregate root with status machine
- `PhotoStatus`: Enum (PENDING → PROCESSING → PROCESSED/FAILED → APPROVED/REJECTED)
- `EventLog`: Immutable audit trail

**Infrastructure Layer**
- `InMemoryPhotoRepository`: Thread-safe concurrent map
- `InMemoryEventRepository`: Append-only event store

---

## 5. Data Model

### Photo Entity
```java
class Photo {
    UUID id;
    String filename;
    String mimeType;
    long sizeBytes;
    byte[] content;          // In-memory for demo
    PhotoStatus status;
    String failureReason;    // Populated on FAILED
    Instant uploadedAt;
    Instant updatedAt;
}
```

### PhotoStatus State Machine
```
PENDING → PROCESSING → PROCESSED → APPROVED
                   ↓
                 FAILED → (retry) → PENDING
                             ↓
                          REJECTED
```

**Transition Rules:**
- `PENDING` → `PROCESSING`: Automatic via background job
- `PROCESSING` → `PROCESSED`: 85% success rate simulation
- `PROCESSING` → `FAILED`: 15% failure rate with random error message
- `PROCESSED` → `APPROVED/REJECTED`: Manual user action
- `FAILED` → `PENDING`: Manual retry action

### EventLog Entity
```java
class EventLog {
    UUID id;
    UUID photoId;
    EventType type;
    String message;
    Instant timestamp;
}
```

**Event Types:**
- `PHOTO_CREATED`, `PROCESSING_STARTED`, `PROCESSING_COMPLETED`, `PROCESSING_FAILED`, `APPROVED`, `REJECTED`, `RETRY_REQUESTED`

---

## 6. API Design (REST)

### Photo Endpoints

**POST /api/photos**
```json
Request: multipart/form-data with multiple files
Response: { items: Photo[] }
```

**GET /api/photos**
```json
Query: status?, page?, size?
Response: {
  items: Photo[],
  total: number,
  hasMore: boolean
}
```

**GET /api/photos/{id}**
```json
Response: Photo
```

### Action Endpoints

**POST /api/photos/{id}/action**
```json
Request: { action: "approve" | "reject" | "retry" }
Response: Photo
```

### Event Endpoints

**GET /api/events**
```json
Query: photoId?, type?, limit?
Response: { items: EventLog[] }
```

---

## 7. Background Processing

### Processor Service Design

**Strategy:** Spring `@Scheduled` task running every 3 seconds

```java
@Scheduled(fixedDelay = 3000)
void processNextBatch() {
    List<Photo> pending = photoRepo.findByStatus(PENDING);
    
    pending.parallelStream()
        .limit(5)  // Process max 5 concurrently
        .forEach(photo -> {
            updateStatus(photo, PROCESSING);
            logEvent(PROCESSING_STARTED);
            
            simulateWork();  // Sleep 1-3 seconds
            
            if (random() < 0.85) {
                updateStatus(photo, PROCESSED);
                logEvent(PROCESSING_COMPLETED);
            } else {
                updateStatus(photo, FAILED);
                logEvent(PROCESSING_FAILED, generateError());
            }
        });
}
```

### Simulated Failure Scenarios
- "Image format not supported"
- "File corrupted during upload"
- "Processing timeout exceeded"
- "Insufficient processing resources"

---

## 8. Frontend Architecture (Production SaaS Design)

### Design System

**Visual Target:** Linear + Vercel + Stripe Dashboard

**Color Palette:**
```css
/* Neutral Base */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--muted: 210 40% 96.1%;
--border: 214.3 31.8% 91.4%;

/* Accent (Primary Actions) */
--primary: 221.2 83.2% 53.3%;  /* Indigo */
--primary-foreground: 210 40% 98%;

/* Status Colors */
--success: 142.1 76.2% 36.3%;  /* Green */
--warning: 47.9 95.8% 53.1%;   /* Amber */
--destructive: 0 84.2% 60.2%;  /* Red */
```

**Typography Scale:**
```css
text-xs:  0.75rem (12px)  /* Labels, timestamps */
text-sm:  0.875rem (14px) /* Body, table cells */
text-base: 1rem (16px)    /* Default */
text-lg:  1.125rem (18px) /* Section headers */
text-2xl: 1.5rem (24px)   /* Page titles */
```

**Spacing System:**
```
p-2:  0.5rem (8px)   /* Tight spacing */
p-4:  1rem (16px)    /* Standard padding */
p-6:  1.5rem (24px)  /* Section padding */
p-8:  2rem (32px)    /* Page margins */
gap-4: 1rem (16px)   /* Grid gaps */
```

### Component Architecture

```
src/
  app/
    layout.tsx              # Root layout with navigation
    upload/page.tsx         # Upload route
    queue/page.tsx          # Processing queue route
    review/page.tsx         # Review gallery route
    
  components/
    ui/                     # shadcn/ui primitives
      button.tsx
      card.tsx
      badge.tsx
      table.tsx
      dialog.tsx
      tabs.tsx
      separator.tsx
      toast.tsx
      
    shared/
      StatusBadge.tsx       # Unified status chip component
      EmptyState.tsx        # Consistent empty states
      LoadingSkeleton.tsx   # Skeleton loaders
      
  features/
    photos/
      components/
        UploadDropzone.tsx
        PhotoTable.tsx
        PhotoGrid.tsx
        PhotoCard.tsx
        ActionButtons.tsx
        FilterChips.tsx
        
      hooks/
        usePhotoPolling.ts
        usePhotoActions.ts
        
      api/
        photoClient.ts
        
    events/
      components/
        EventLogPanel.tsx
        EventItem.tsx
        
      hooks/
        useEventLog.ts
        
  lib/
    api/
      client.ts             # Typed fetch wrapper
      types.ts              # Generated from OpenAPI
```

---

## 9. Screen Designs (Detailed Specs)

### Screen 1: Upload Screen

**Layout:**
```
┌─────────────────────────────────────────┐
│  RapidPhotoFlow                    Queue│ ← Nav bar
├─────────────────────────────────────────┤
│                                         │
│  ┌───────────────────────────────────┐ │
│  │     📤                            │ │
│  │  Drop photos here or click        │ │ ← Card with dashed border
│  │                                   │ │
│  │  [Choose Files]                   │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Recent Uploads                         │
│  ┌───────────────────────────────────┐ │
│  │ photo1.jpg    ● Pending    just now│ │
│  │ photo2.jpg    ● Pending    just now│ │ ← Simple table
│  └───────────────────────────────────┘ │
│                                         │
│              [Go to Queue →]            │ ← Primary button
│                                         │
└─────────────────────────────────────────┘
```

**Components:**
- **UploadDropzone** (Card with dashed border, hover state)
  - Large drag target area
  - File input hidden, triggered by click
  - Shows "Uploading..." state with progress
  
- **Recent uploads table** (simple list, not full Table component)
  - Filename, Status badge, Timestamp
  - Optimistic UI updates
  
**UX Details:**
- Toast on successful upload: "3 photos queued"
- Toast on error: "Failed to upload photo1.jpg"
- Disable dropzone during upload
- Show subtle upload animation

### Screen 2: Processing Queue

**Layout:**
```
┌─────────────────────────────────────────┐
│  Queue              Upload | Review     │ ← Nav
├─────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │ All Pending Processing Failed ... │  │ ← Filter chips
│  └──────────────────────────────────┘  │
│                                         │
│  Last updated 5s ago ⟳                  │ ← Auto-poll indicator
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Filename     Status    Updated    │ │
│  ├───────────────────────────────────┤ │
│  │ photo1.jpg   ⚙️ Processing  2s ago│ │ ← Table rows
│  │ photo2.jpg   ✓ Processed   10s ago│ │
│  │ photo3.jpg   ⚠️ Failed     1m ago │ │
│  └───────────────────────────────────┘ │
│                                         │
│  Status Legend:                         │
│  ● Pending  ⚙️ Processing  ✓ Processed │ ← Inline legend
│  ⚠️ Failed  ✅ Approved  ❌ Rejected    │
│                                         │
└─────────────────────────────────────────┘
```

**Components:**
- **FilterChips** (Tabs or Badge buttons)
  - Active state with primary color
  - Count badges (e.g., "Processing (3)")
  
- **PhotoTable** (shadcn Table)
  - Responsive columns
  - Status badges with icons and colors
  - Hover states for rows
  
- **StatusBadge** (unified component)
  ```tsx
  <Badge variant={statusVariant} className="gap-1">
    {statusIcon}
    {status}
  </Badge>
  ```

**Status Badge Styling:**
```tsx
PENDING:     gray, outline, ● icon
PROCESSING:  blue, default, ⚙️ icon + spinner
PROCESSED:   green, default, ✓ icon
FAILED:      red, destructive, ⚠️ icon
APPROVED:    green, default, ✅ icon
REJECTED:    red, secondary, ❌ icon
```

**UX Details:**
- Loading skeleton for initial fetch
- Smooth row transitions on status change
- Pulse animation on "Last updated" text
- Empty state: "No photos in queue. Upload photos to get started."

### Screen 3: Review Gallery

**Layout (Two-Column):**
```
┌─────────────────────────────────────────┐
│  Review             Upload | Queue      │ ← Nav
├─────────────────────────────────────────┤
│  ┌──────────────────────────────────┐  │
│  │ Processed Failed Approved ...    │  │ ← Filter tabs
│  └──────────────────────────────────┘  │
├──────────────────────┬──────────────────┤
│ Photo Gallery        │  Event Log       │
│                      │                  │
│ ┌────┐ ┌────┐ ┌────┐│ ○ 2m ago         │
│ │img │ │img │ │img ││   photo1.jpg     │
│ │    │ │    │ │    ││   Processing...  │
│ │✓|✕ │ │✓|✕ │ │✓|✕ ││                  │
│ └────┘ └────┘ └────┘│ ● 1m ago         │
│                      │   photo1.jpg     │
│ ┌────┐ ┌────┐       │   Processed ✓    │
│ │img │ │img │       │                  │
│ │    │ │    │       │ ○ 30s ago        │
│ │✓|✕ │ │✓|✕ │       │   photo1.jpg     │
│ └────┘ └────┘       │   Approved       │
│                      │                  │
└──────────────────────┴──────────────────┘
```

**Components:**

**PhotoGrid** (Left panel)
- Grid layout (3 columns on desktop, 1 on mobile)
- PhotoCard components with:
  - Thumbnail (object-fit cover)
  - Status badge overlay
  - Action buttons on hover
  
**PhotoCard:**
```tsx
<Card className="group relative overflow-hidden">
  <img src={thumbnail} className="aspect-square object-cover" />
  
  <div className="absolute top-2 right-2">
    <StatusBadge status={photo.status} />
  </div>
  
  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t 
                  from-black/60 p-4 opacity-0 group-hover:opacity-100
                  transition-opacity">
    <div className="flex gap-2">
      <Button size="sm" variant="secondary">Approve</Button>
      <Button size="sm" variant="outline">Reject</Button>
      {status === 'FAILED' && (
        <Button size="sm" variant="ghost">Retry</Button>
      )}
    </div>
  </div>
</Card>
```

**EventLogPanel** (Right panel)
- Fixed width (300-400px)
- Scrollable
- Timeline style with dots
- Real-time updates (polling)

**EventItem:**
```tsx
<div className="flex gap-3 py-3 border-b last:border-0">
  <div className="flex-shrink-0">
    <div className={cn(
      "w-2 h-2 rounded-full mt-1",
      isLatest ? "bg-primary" : "bg-muted-foreground"
    )} />
  </div>
  
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium truncate">
      {event.message}
    </p>
    <p className="text-xs text-muted-foreground">
      {formatRelativeTime(event.timestamp)}
    </p>
  </div>
</div>
```

**UX Details:**
- Toast on action: "Photo approved" / "Photo rejected"
- Optimistic UI: update card immediately
- Loading spinner on action buttons
- Empty state: "No photos to review yet"
- Error state with retry button

---

## 10. State Management & Data Fetching

### Polling Hook Pattern

```tsx
function usePhotoPolling(intervalMs = 5000) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await photoClient.getPhotos();
        setPhotos(data.items);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    poll(); // Initial fetch
    const interval = setInterval(poll, intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);

  return { photos, isLoading, error, lastUpdated };
}
```

### Action Hook Pattern

```tsx
function usePhotoActions() {
  const [isLoading, setIsLoading] = useState(false);

  const approve = async (photoId: string) => {
    setIsLoading(true);
    try {
      await photoClient.performAction(photoId, 'approve');
      toast.success('Photo approved');
    } catch (err) {
      toast.error('Failed to approve photo');
    } finally {
      setIsLoading(false);
    }
  };

  return { approve, reject, retry, isLoading };
}
```

### Optimistic Updates

```tsx
async function handleUpload(files: File[]) {
  // Optimistic: show immediately as PENDING
  const optimistic = files.map(file => ({
    id: crypto.randomUUID(),
    filename: file.name,
    status: 'PENDING',
    uploadedAt: new Date(),
    // ... other fields
  }));
  
  setPhotos(prev => [...prev, ...optimistic]);

  // Background: actual upload
  try {
    const uploaded = await photoClient.upload(files);
    
    // Replace optimistic with real data
    setPhotos(prev => 
      prev.map(p => 
        uploaded.find(u => u.filename === p.filename) || p
      )
    );
    
    toast.success(`${files.length} photos uploaded`);
  } catch (err) {
    // Remove optimistic entries on error
    setPhotos(prev => 
      prev.filter(p => !optimistic.includes(p))
    );
    toast.error('Upload failed');
  }
}
```

---

## 11. Implementation Plan (AI-Generated)

### Phase 1: Backend Scaffolding (2-3 hours)

**Cursor Prompts:**

```
Prompt 1: Project Setup
"Create a Spring Boot 3.2 project with:
- Web, H2, Lombok dependencies
- Package structure: controller, service, domain, repository
- application.yml with H2 console enabled
- CORS configuration for localhost:5173"

Prompt 2: Domain Layer
"Generate Photo entity with:
- UUID id, filename, mimeType, sizeBytes, byte[] content
- PhotoStatus enum (PENDING, PROCESSING, PROCESSED, FAILED, APPROVED, REJECTED)
- State transition methods with validation
- Timestamps (uploadedAt, updatedAt)
- Generate EventLog entity for audit trail"

Prompt 3: Repository Layer
"Create InMemoryPhotoRepository using ConcurrentHashMap with:
- Thread-safe CRUD operations
- findByStatus method
- findAll with pagination support
- Generate InMemoryEventRepository similarly"

Prompt 4: Service Layer
"Generate PhotoService with:
- upload(List<MultipartFile>) method
- updateStatus method with event logging
- State transition validation
- Generate ProcessorService with @Scheduled background job
- Simulate 85% success rate with random failures"

Prompt 5: Controller Layer
"Create PhotoController REST endpoints:
- POST /api/photos (multipart upload)
- GET /api/photos (with status filter, pagination)
- GET /api/photos/{id}
- POST /api/photos/{id}/action
- Include proper DTO mapping and validation
- Add PhotoActionController for approve/reject/retry
- Generate EventController for event history"

Prompt 6: OpenAPI Documentation
"Add Springdoc OpenAPI dependency and generate:
- API documentation at /api-docs
- Swagger UI at /swagger-ui.html
- Proper schemas for all DTOs"
```

**Deliverables:**
- ✅ Full Spring Boot backend with REST API
- ✅ In-memory storage with thread safety
- ✅ Background processor with realistic simulation
- ✅ Event logging infrastructure
- ✅ OpenAPI spec for frontend type generation

### Phase 2: Frontend Scaffolding (3-4 hours)

**Cursor Prompt (Complete Frontend Plan):**

```markdown
You are a senior frontend engineer and product designer in one.
Build a modern, sleek, intentional React + TypeScript frontend for RapidPhotoFlow.
The app is a dashboard for managing a photo upload → processing → review workflow.

Tech + Architecture:
• Stack: React + TypeScript + Vite
• Styling: Tailwind CSS
• UI Library: shadcn/ui (Button, Card, Badge, Table, Dialog, Tabs, Toast, Separator)
• Folder structure:
  - src/app – route shells / layout
  - src/components – shared components
  - src/features/photos – feature-specific screens, hooks, API
  - src/lib/api – typed fetch client

Design Principles:
• Overall vibe: minimal, modern, production SaaS (Linear / Vercel / Stripe)
• Color palette: neutral gray/stone with indigo accent for primary actions
• Generous whitespace, consistent padding hierarchy
• Everything on screen must earn its place
• Use shadcn primitives instead of custom div soup
• Make states obvious: loading, empty, error states all friendly and purposeful

Screens to Implement:

1. Upload Screen
   - Prominent drag-and-drop Card with dashed border
   - Small table beneath showing newly queued photos (filename, status, time)
   - Primary button: "Go to Queue"
   - Toast notifications for upload success/failure

2. Processing Queue Screen
   - Top nav with route links
   - Filter chips for status (All, Pending, Processing, Failed, etc.)
   - Responsive Table with columns: filename, status badge, last updated
   - Status badges with clear colors and icons:
     * PENDING: gray outline, ● icon
     * PROCESSING: blue, ⚙️ icon + spinner
     * PROCESSED: green, ✓ icon
     * FAILED: red destructive, ⚠️ icon
     * APPROVED: green, ✅ icon
     * REJECTED: red secondary, ❌ icon
   - Auto-polling indicator: "Last updated 5s ago ⟳"
   - Status legend at bottom
   - Loading skeletons for initial load
   - Empty state: "No photos in queue"

3. Review Gallery Screen
   - Two-column layout:
     * Left: Photo grid (3 cols desktop, 1 mobile) with PhotoCard components
     * Right: EventLogPanel (300-400px fixed width, scrollable)
   - Filter Tabs at top (Processed, Failed, Approved, Rejected)
   - PhotoCard design:
     * Thumbnail with object-fit cover
     * Status badge overlay (top-right)
     * Action buttons on hover (Approve, Reject, Retry if failed)
     * Gradient overlay on hover showing actions
   - EventLogPanel:
     * Timeline style with dots
     * Real-time updates via polling
     * Relative timestamps ("2m ago")
     * Latest event highlighted

UX Details & Interaction:
• Toast notifications for all actions
• Loading skeletons for tables and grids
• Simple loading state (no over-animation)
• Subtle transitions (hover states, fade-in for new items)
• Keyboard focus states for accessibility
• Optimistic UI updates on upload

API Integration:
• Define TypeScript types matching:
  - GET /api/photos → { items: Photo[], total: number, hasMore: boolean }
  - POST /api/photos (multipart) → { items: Photo[] }
  - POST /api/photos/{id}/action → Photo
  - GET /api/events → { items: EventLog[] }
• Create hooks:
  - usePhotoPolling(intervalMs) – polls every 5s with lastUpdated state
  - usePhotoActions() – approve/reject/retry with loading states
  - useEventLog(photoId?) – real-time event stream
• Use typed fetch client with error handling

Code Quality:
• Strongly type all components and hooks
• Keep components small and composable
• Extract reusable UI: StatusBadge, EmptyState, LoadingSkeleton
• Use consistent naming conventions
• No prop drilling – group related components

Deliverables:
1. Fully navigable frontend with Upload, Queue, Review routes
2. Intentional layouts using shadcn/ui primitives
3. Types + hooks for API with polling
4. Clear empty/error/loading states everywhere
5. Production SaaS aesthetic throughout

Implement step-by-step and show me the file plan before large changes.
Prioritize visual clarity, consistency, and professional feel.
```

**Additional Cursor Prompts for Iteration:**

```
Prompt: Generate Types from OpenAPI
"Install openapi-typescript and generate TypeScript types from 
http://localhost:8080/api-docs. Create src/lib/api/types.ts with 
all Photo, EventLog, and response schemas."

Prompt: Setup shadcn/ui
"Initialize shadcn/ui in this Vite project. Install and configure:
- button, card, badge, table, dialog, tabs, toast, separator
- Setup Tailwind config with shadcn theme
- Create components/ui/ folder with all primitives"

Prompt: Create Reusable Components
"Generate these shared components with TypeScript:
1. StatusBadge – takes PhotoStatus, returns Badge with icon and color
2. EmptyState – takes icon, title, description, optional action button
3. LoadingSkeleton – variants for table rows and photo cards"

Prompt: Build Upload Screen
"Create src/app/upload/page.tsx with:
- UploadDropzone component using react-dropzone
- Recent uploads table (simple, not full Table component)
- Optimistic UI on file drop
- Integration with usePhotoUpload hook
- Toast notifications
- Loading state during upload"

Prompt: Build Queue Screen
"Create src/app/queue/page.tsx with:
- FilterChips component for status filtering
- PhotoTable using shadcn Table component
- Auto-polling with usePhotoPolling hook
- 'Last updated Xs ago' indicator
- Status legend at bottom
- Loading skeleton on initial load
- Empty state when filtered results empty"

Prompt: Build Review Screen
"Create src/app/review/page.tsx with:
- Two-column layout (photo grid left, event panel right)
- Filter Tabs at top
- PhotoGrid with PhotoCard components
- PhotoCard with hover actions overlay
- EventLogPanel with timeline design
- Wire up usePhotoActions and useEventLog hooks
- Responsive: stack columns on mobile"
```

**Deliverables:**
- ✅ Modern React UI with TypeScript and Tailwind
- ✅ Three main screens (Upload, Queue, Review)
- ✅ Polling hooks for live updates
- ✅ Type-safe API integration from OpenAPI spec
- ✅ Production SaaS aesthetic with intentional design

### Phase 3: Integration & Polish (1-2 hours)

```
1. Connect frontend to backend (proxy in vite.config.ts)
2. Test complete flow: upload → process → review
3. Add seed data endpoint (/api/seed) for instant demo
4. Polish loading states and transitions
5. Test responsive design on mobile
6. Add error boundaries for graceful failures
```

### Phase 4: Demo Preparation (1 hour)

```
1. Record 3-minute walkthrough video
2. Write README with:
   - Architecture diagram (Mermaid)
   - Setup instructions
   - AI tooling breakdown
   - Design decisions
3. Prepare judging criteria alignment doc
4. Clean up code and add comments where needed
```

---

## 12. Testing Strategy

### Unit Tests (Backend - AI-Generated)

```java
@Test
void shouldTransitionFromPendingToProcessing() {
    Photo photo = Photo.createPending("test.jpg");
    photo.startProcessing();
    assertEquals(PROCESSING, photo.getStatus());
}

@Test
void shouldOnlyAllowApprovalWhenProcessed() {
    Photo photo = Photo.createPending("test.jpg");
    assertThrows(IllegalStateException.class, () -> photo.approve());
}

@Test
void shouldRecordEventOnStatusChange() {
    Photo photo = Photo.createPending("test.jpg");
    photo.startProcessing();
    
    List<EventLog> events = eventService.findByPhotoId(photo.getId());
    assertTrue(events.stream()
        .anyMatch(e -> e.getType() == PROCESSING_STARTED));
}
```

### Integration Tests (Backend)

```java
@Test
void shouldUploadMultiplePhotosAndCreateEvents() {
    MockMultipartFile file1 = new MockMultipartFile(...);
    MockMultipartFile file2 = new MockMultipartFile(...);
    
    List<Photo> photos = photoService.upload(List.of(file1, file2));
    
    assertEquals(2, photos.size());
    assertEquals(2, eventService.findByType(PHOTO_CREATED).size());
}

@Test
void shouldProcessPhotosInBackground() throws InterruptedException {
    photoService.upload(createMockFiles(3));
    
    Thread.sleep(5000); // Wait for processor
    
    List<Photo> processed = photoRepo.findByStatus(PROCESSED);
    assertFalse(processed.isEmpty());
}
```

### Component Tests (Frontend - Optional)

```tsx
describe('StatusBadge', () => {
  it('renders correct icon and color for PROCESSING', () => {
    render(<StatusBadge status="PROCESSING" />);
    expect(screen.getByText('Processing')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveClass('animate-spin');
  });
});

describe('PhotoCard', () => {
  it('shows action buttons on hover', async () => {
    render(<PhotoCard photo={mockPhoto} />);
    
    const card = screen.getByRole('article');
    await userEvent.hover(card);
    
    expect(screen.getByText('Approve')).toBeVisible();
  });
});
```

### Smoke Test Flow (Manual)

1. **Upload:** Drag 6 photos → verify immediate PENDING status
2. **Processing:** Wait 15-20 seconds → verify ~5 succeed, ~1 fails
3. **Review:** Approve 2 photos → verify toast and status update
4. **Retry:** Retry failed photo → verify back to PENDING
5. **Events:** Check event log → verify complete audit trail
6. **UI States:** Test empty states, loading states, error states

---

## 13. Demo Script (3 minutes)

### Setup (Pre-Demo)
- Backend running on `:8080`
- Frontend running on `:5173`
- Seed data loaded (3-5 photos in various states)
- Browser window sized appropriately

### Act 1: Upload (30 seconds)
**Action:** Open Upload screen, drag 6 photos into dropzone  
**Show:** 
- Smooth drag-and-drop animation
- Instant optimistic PENDING badges
- Toast: "6 photos queued successfully"
- Clean, modern upload Card

**Narrate:**  
*"Notice the intentional design—no clutter, just what you need. Photos appear instantly with optimistic UI, giving immediate feedback."*

### Act 2: Processing Queue (60 seconds)
**Action:** Click "Go to Queue", watch statuses update live  
**Show:**
- Filter chips at top
- Table with clear status badges and icons
- "Last updated 5s ago" auto-polling indicator
- Statuses transitioning: PENDING → PROCESSING (spinner) → PROCESSED/FAILED
- Status legend at bottom

**Narrate:**  
*"The queue auto-polls every 5 seconds—no refresh needed. Status badges use clear icons and colors inspired by Linear and Vercel. The processor runs in the background with realistic simulation: 85% success rate, 15% failure with error messages."*

### Act 3: Review Gallery (60 seconds)
**Action:** Navigate to Review screen  
**Show:**
- Two-column layout: photo grid + event panel
- Filter by "Processed" status
- Hover over photo card → action buttons appear with gradient overlay
- Click "Approve" → toast + instant status update
- Filter by "Failed" → show retry action

**Narrate:**  
*"The review interface is production-ready. Photos display in a masonry grid, actions appear on hover, and every state change is logged in the event timeline. Everything updates in real-time."*

### Act 4: Event Log Deep Dive (30 seconds)
**Action:** Scroll through event panel, filter to single photo  
**Show:**
- Complete audit trail from upload → processing → approval
- Relative timestamps ("2m ago")
- Timeline style with colored dots
- Latest events highlighted

**Narrate:**  
*"The event log is immutable and comprehensive—perfect for debugging or compliance. Every state transition, every action is recorded with timestamps."*

### Conclusion (15 seconds)
**Key Points:**
- ✅ Built in 48 hours using AI tooling (Cursor + Claude)
- ✅ Zero handwritten boilerplate—all generated and refined
- ✅ Production SaaS aesthetic from day one
- ✅ Clean architecture ready for real-world extension

**Final Line:**  
*"This demonstrates how AI-first engineering can deliver professional-quality applications in days, not months. The architecture is extensible, the code is maintainable, and the UI doesn't look like a hackathon project."*

---

## 14. Non-Functional Requirements

### Performance
- **Target:** Handle 100 concurrent uploads without degradation
- **Strategy:** 
  - Parallel stream processing (max 5 concurrent)
  - In-memory storage with O(1) lookups
  - Frontend: Virtual scrolling for large photo lists (if time)
- **Metrics:** 95th percentile processing time < 3 seconds

### Resilience
- **Error Handling:**
  - All API errors caught and displayed as toasts
  - Backend exceptions logged with context
  - Failed photos retryable by user
- **Thread Safety:**
  - ConcurrentHashMap with synchronized writes
  - Atomic status transitions
- **Graceful Degradation:**
  - Polling continues on API errors
  - Optimistic UI reverts on failure

### Accessibility
- **Keyboard Navigation:**
  - Tab through all interactive elements
  - Enter to trigger actions
  - Escape to close dialogs
- **Screen Readers:**
  - Semantic HTML (Table, heading hierarchy)
  - Proper ARIA labels on buttons
  - Status announcements via live regions
- **Contrast:**
  - WCAG AA compliant color palette
  - Text legible on all backgrounds

### Observability (Minimal)
- **Backend Logging:**
  - Structured JSON with SLF4J
  - Request/response logging
  - Error stack traces with context
- **Frontend Logging:**
  - Console errors for API failures
  - User action tracking (optional analytics)
- **Health Check:**
  - `/actuator/health` endpoint
  - Frontend: displays API connection status

---

## 15. Stretch Goals (Time-Boxed)

### High Priority (If Time Allows)

**1. Real-Time Updates via Server-Sent Events (2 hours)**
```java
@GetMapping(value = "/api/photos/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
public Flux<Photo> streamPhotoUpdates() {
    return photoService.getPhotoUpdateStream();
}
```
- Replace polling with SSE
- More efficient, truly real-time
- Fallback to polling if SSE fails

**2. Thumbnail Generation (1-2 hours)**
- Generate 200px thumbnails on upload using ImageIO
- Store alongside full image
- Display in gallery for faster loading
- Lazy load full images on modal open

**3. Photo Details Modal (1 hour)**
- Click photo card → open Dialog
- Show full-size image
- Display metadata (size, mime type, upload time)
- Show event timeline for that photo
- Quick actions (Approve, Reject, Delete)

### Medium Priority

**4. Batch Actions (1 hour)**
- Checkboxes on photo cards/rows
- "Select All" functionality
- Bulk approve/reject selected photos
- Confirmation dialog for bulk actions

**5. Search & Advanced Filters (1-2 hours)**
- Search by filename
- Date range picker
- Combine filters (e.g., "Failed photos from last hour")
- Clear all filters button

**6. Persistent Storage (1 hour)**
- Replace in-memory with H2 file-based database
- Data survives server restarts
- Add Liquibase migrations

### Low Priority (Bonus)

**7. Docker Compose Setup (30 min)**
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ['8080:8080']
  frontend:
    build: ./frontend
    ports: ['5173:5173']
```

**8. Analytics Dashboard (1-2 hours)**
- Success rate chart (recharts)
- Average processing time
- Photos per status breakdown
- Upload volume over time

**9. Export Functionality (1 hour)**
- Export event log as CSV
- Download processed photos as ZIP
- Generate PDF report

### Explicitly Out of Scope
- ❌ Real image analysis (OCR, ML, face detection)
- ❌ Cloud storage integration (S3/GCS/Azure)
- ❌ Authentication (OAuth, JWT, sessions)
- ❌ Multi-tenant RLS
- ❌ Email notifications
- ❌ Production monitoring (Sentry, Datadog)
- ❌ Horizontal scaling (Kubernetes, load balancing)

---

## 16. Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|-----------|
| **Over-engineering UI** | High | High | Stick to shadcn/ui defaults; resist custom CSS |
| **Backend complexity** | Medium | High | Use in-memory storage; skip database setup |
| **Time overrun on design** | Medium | High | AI-generate all components first, polish later |
| **File upload edge cases** | Low | Medium | Cap at 10MB, validate mime types, show errors |
| **Polling performance** | Low | Low | 5s interval is safe; add debounce if needed |
| **AI-generated bugs** | Medium | Medium | Review all generated code; add basic tests |
| **Responsive design issues** | Low | Medium | Use Tailwind breakpoints; test mobile early |

### Contingency Plan
**If Behind Schedule (6 hours before deadline):**
1. Cut Review Gallery → simplify to list view
2. Cut Event Log Panel → inline in table
3. Cut all stretch goals
4. Focus on: Upload working + Queue with polling + basic review actions
5. Polish README and demo script

**If Ahead of Schedule:**
1. Add SSE for real-time updates
2. Implement thumbnail generation
3. Build analytics dashboard
4. Create Docker Compose setup

---

## 17. Judging Criteria Alignment

### Architecture (30%)

**What We'll Demonstrate:**
- ✅ **Clean Layering:** Controller → Service → Repository → Domain
- ✅ **Event-Driven Design:** Immutable audit log, state machine
- ✅ **Separation of Concerns:** UI components, business logic, data access all separated
- ✅ **Vertical Slice Architecture:** Each feature self-contained
- ✅ **Type Safety:** OpenAPI → TypeScript types, no `any` types
- ✅ **Scalability Patterns:** Background processing, concurrent uploads, polling strategy

**Talking Points:**
- "The backend follows DDD principles with clear aggregate roots"
- "Event sourcing enables complete auditability"
- "Frontend architecture mirrors Linear/Vercel—production-quality from day one"

### AI Usage (25%)

**What We'll Document:**
- ✅ **Backend:** 100% Cursor-generated (controllers, services, DTOs, repos)
- ✅ **Frontend:** Component generation via Cursor with design system prompts
- ✅ **Type Generation:** Automated from OpenAPI spec
- ✅ **Prompt Engineering:** Detailed prompts for each phase documented
- ✅ **Iteration:** Show AI-driven refactoring and improvements

**Artifacts to Include:**
- Screenshots of Cursor prompts
- Before/after of AI-generated code
- Documentation of "zero handwritten boilerplate" claim
- Breakdown: X% AI-generated, Y% manual integration/polish

**Talking Points:**
- "Everything except business logic rules was AI-generated"
- "We used Cursor as a senior engineer—not just autocomplete"
- "OpenAPI → TypeScript pipeline ensures type safety across stack"

### Creativity/Ownership (20%)

**What Makes This Unique:**
- ✅ **Production SaaS Aesthetic:** Not a typical hackathon UI
- ✅ **Intentional Design System:** Linear/Vercel-inspired, every pixel purposeful
- ✅ **Event-Driven Audit Trail:** More sophisticated than typical CRUD
- ✅ **State Machine:** Proper status transitions with validation
- ✅ **Optimistic UI:** Instant feedback, smooth interactions
- ✅ **Real-Time Polling:** Live updates without page refresh

**Talking Points:**
- "We didn't just build features—we designed an experience"
- "The UI proves AI can generate production-quality design"
- "Event sourcing is overkill for a demo—but demonstrates thinking ahead"

### End-to-End Execution (25%)

**What We'll Deliver:**
- ✅ **Working Demo:** Upload → Process → Review flow fully functional
- ✅ **Live Updates:** No manual refresh, real-time status changes
- ✅ **Error Handling:** Graceful failures, retry functionality
- ✅ **Professional Polish:** Loading states, empty states, toasts, animations
- ✅ **Documentation:** Clear README, architecture diagrams, setup instructions
- ✅ **Reproducible:** One-command startup, seed data pre-loaded

**Demo Flow:**
1. Show architecture diagram (30s)
2. Walk through upload flow (60s)
3. Demonstrate live processing (60s)
4. Show review and approval (45s)
5. Dive into event log (30s)
6. Highlight AI usage (45s)

**Talking Points:**
- "This isn't a prototype—it's production-ready architecture"
- "Every interaction is intentional and polished"
- "The demo runs smoothly because we focused on fundamentals"

---

## 18. Submission Deliverables

### GitHub Repository Structure
```
rapidphotoflow/
├── backend/
│   ├── src/main/java/com/rapidphotoflow/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── domain/
│   │   ├── repository/
│   │   └── RapidPhotoFlowApplication.java
│   ├── pom.xml
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── features/
│   │   └── lib/
│   ├── package.json
│   └── README.md
├── docs/
│   ├── design-doc.md (this file)
│   ├── architecture-diagram.png
│   ├── ai-usage-report.md
│   └── screenshots/
├── docker-compose.yml (optional)
└── README.md (root)
```

### Root README.md Content
```markdown
# RapidPhotoFlow

A lightweight photo upload → processing → review workflow built with AI-first engineering.

## 🎯 Quick Start

**Backend:**
cd backend && mvn spring-boot:run

**Frontend:**
cd frontend && npm install && npm run dev

**Access:** http://localhost:5173

## 🏗 Architecture

[Include Mermaid diagram here]

## 🤖 AI Tooling Usage

- **Backend:** 100% Cursor-generated (Spring Boot, controllers, services, repos)
- **Frontend:** 90% Cursor-generated (React components, hooks, API client)
- **Types:** Auto-generated from OpenAPI spec via openapi-typescript
- **Total AI Generation:** ~85% of codebase

See [docs/ai-usage-report.md](docs/ai-usage-report.md) for detailed breakdown.

## ✨ Features

- ✅ Concurrent multi-photo upload with drag-and-drop
- ✅ Real-time status updates (auto-polling every 5s)
- ✅ Background processing with 85/15 success simulation
- ✅ Review workflow (Approve/Reject/Retry)
- ✅ Complete event audit trail
- ✅ Production SaaS aesthetic (Linear/Vercel-inspired)

## 🧪 Demo Flow

1. Upload 6 photos → instant PENDING status
2. Watch Processing Queue → live status transitions
3. Review Gallery → approve/reject photos
4. Event Log → complete audit trail

## 🛠 Tech Stack

**Backend:** Java 21, Spring Boot 3.2, H2 (in-memory)  
**Frontend:** React 18, TypeScript 5, Vite, Tailwind, shadcn/ui  
**AI Tooling:** Cursor AI, Claude Sonnet 3.5

## 📊 Judging Criteria Alignment

- **Architecture (30%)**: Clean layering, event-driven, type-safe
- **AI Usage (25%)**: 85% AI-generated with documented prompts
- **Creativity (20%)**: Production SaaS UI, intentional design system
- **Execution (25%)**: Complete end-to-end flow with polish

## 📸 Screenshots

[Include 3-4 key screenshots]

## 🎥 Demo Video

[Link to 3-minute walkthrough]

## 👥 Team

[Your team members]
```

### AI Usage Report (docs/ai-usage-report.md)
```markdown
# AI Tooling Usage Report

## Summary
- **Total Files:** 47
- **AI-Generated:** 40 (85%)
- **Manual:** 7 (15% - business logic, integration glue)
- **Primary Tool:** Cursor AI
- **LLM:** Claude Sonnet 3.5

## Backend (100% AI-Generated)
- Controllers: 4 files (PhotoController, ActionController, EventController, SeedController)
- Services: 3 files (PhotoService, ProcessorService, EventService)
- Domain: 3 files (Photo, EventLog, PhotoStatus enum)
- Repositories: 2 files (InMemoryPhotoRepo, InMemoryEventRepo)
- DTOs: 6 files (PhotoDTO, ActionRequest, EventDTO, PagedResponse, etc.)
- Config: 2 files (CorsConfig, OpenAPIConfig)

**Key Prompts Used:** [Include 5-6 major prompts verbatim]

## Frontend (90% AI-Generated)
- Components: 18 files (UI primitives + feature components)
- Hooks: 4 files (usePhotoPolling, usePhotoActions, useEventLog, useUpload)
- API Client: 2 files (client.ts, types.ts - auto-generated from OpenAPI)
- Pages: 3 files (Upload, Queue, Review)

**Key Prompts Used:** [Include frontend design system prompt]

## Manual Code (15%)
- Photo state transition logic (business rules)
- Processor simulation algorithm
- API client error handling
- Route layout composition
- Demo seed data generation

## Metrics
- **Time Saved:** ~8-10 hours of boilerplate writing
- **Consistency:** 100% - all DTOs follow same pattern
- **Type Safety:** 100% - no `any` types in TypeScript
- **Bugs from AI:** 2-3 minor issues (fixed in 15 minutes)
```

### Architecture Diagram (Mermaid)
```mermaid
graph TB
    UI[React Frontend] -->|HTTP POST/GET| API[Spring Boot REST API]
    API --> PS[PhotoService]
    API --> ES[EventService]
    PS --> PR[InMemoryPhotoRepository]
    ES --> ER[InMemoryEventRepository]
    PROC[ProcessorService<br/>@Scheduled 3s] -->|Poll PENDING| PR
    PROC -->|Update Status| PR
    PROC -->|Log Events| ER
    UI -->|Poll 5s| API
    
    style UI fill:#e1f5fe
    style API fill:#fff3e0
    style PROC fill:#f3e5f5
    style PR fill:#e8f5e9
    style ER fill:#e8f5e9
```

### Submission Form Data
```
Project Name: RapidPhotoFlow
Team Members: [Your names]
GitHub Repo: https://github.com/your-team/rapidphotoflow
Demo Video: [YouTube/Loom link]
Live Demo: [Optional - Render/Fly.io URL]

Architecture Highlights:
- Clean layering (Controller → Service → Repository)
- Event-driven audit log
- Production SaaS UI design system
- Type-safe API integration via OpenAPI

AI Usage:
- 85% AI-generated codebase
- Cursor AI for all scaffolding
- Design system prompts for intentional UI
- OpenAPI → TypeScript type generation

Key Innovations:
- Linear/Vercel-inspired design system
- Optimistic UI with graceful error handling
- Complete event sourcing for auditability
- Real-time polling with "last updated" indicator
```

---

## 19. Post-Hackathon: Production Path

### If This Becomes Real

**Phase 1: Storage & Persistence (Week 1)**
- Replace in-memory with PostgreSQL
- Add S3/CloudFront for photo storage
- Implement signed URLs for secure access
- Add Liquibase migrations

**Phase 2: Authentication & Multi-Tenancy (Week 2)**
- Integrate Auth0 or Clerk
- Add RLS policies in Postgres
- Implement tenant isolation
- Add user roles (Admin, Reviewer, Uploader)

**Phase 3: Real Processing (Week 3-4)**
- Image compression (ImageMagick/Sharp)
- Thumbnail generation (multiple sizes)
- Metadata extraction (EXIF)
- Optional: OCR, AI analysis

**Phase 4: Observability & Reliability (Week 5)**
- Add Sentry for error tracking
- Implement structured logging (ELK/Datadog)
- Add metrics (Prometheus/Grafana)
- Set up health checks and alerting
- Rate limiting and quotas

**Phase 5: Scale & Deploy (Week 6)**
- Kubernetes deployment
- Horizontal autoscaling
- CDN configuration
- Database replication
- Load testing

---

## 20. Success Metrics

### Internal KPIs (During Hackathon)
- ✅ All features working end-to-end
- ✅ Zero critical bugs in demo
- ✅ UI looks professional (not "hackathon-y")
- ✅ Code is clean and documented
- ✅ Demo runs smoothly without hiccups

### Judge Perception Goals
- ✅ "This looks production-ready"
- ✅ "The AI usage is sophisticated, not just autocomplete"
- ✅ "The architecture shows real engineering thinking"
- ✅ "The design system is intentional and cohesive"
- ✅ "This team clearly understands modern full-stack development"

### Technical Excellence Indicators
- ✅ Type safety across entire stack
- ✅ No runtime errors in demo
- ✅ Consistent code patterns (AI-enforced)
- ✅ Proper error handling everywhere
- ✅ Graceful degradation on failures

---

## Appendix A: Technology Stack (Detailed)

### Backend
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Language | Java | 21 | Modern language features |
| Framework | Spring Boot | 3.2.x | REST API, dependency injection |
| Build Tool | Maven | 3.9.x | Dependency management |
| Database | H2 | 2.x | In-memory for speed |
| API Docs | SpringDoc OpenAPI | 2.x | Auto-generated API spec |
| Validation | Jakarta Validation | 3.0.x | DTO validation |
| Scheduler | Spring @Scheduled | - | Background processor |

### Frontend
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Language | TypeScript | 5.3.x | Type safety |
| Framework | React | 18.2.x | UI library |
| Build Tool | Vite | 5.x | Fast dev server, HMR |
| Styling | Tailwind CSS | 3.4.x | Utility-first CSS |
| UI Library | shadcn/ui | Latest | Production-ready components |
| Icons | Lucide React | Latest | Consistent icon set |
| HTTP Client | Native fetch | - | Simple, no deps |
| Type Gen | openapi-typescript | Latest | API → TS types |

### DevOps (Optional)
| Tool | Purpose |
|------|---------|
| Docker | Containerization |
| Docker Compose | Local orchestration |
| GitHub Actions | CI/CD (if time) |

### AI Tooling
| Tool | Purpose |
|------|---------|
| Cursor AI | Code generation, refactoring |
| Claude Sonnet 3.5 | LLM for generation |
| openapi-typescript | Type generation |

---

## Appendix B: Color Palette (Exact Values)

### Neutral Colors
```css
--background: hsl(0 0% 100%);           /* #FFFFFF */
--foreground: hsl(222.2 84% 4.9%);     /* #020817 */
--muted: hsl(210 40% 96.1%);           /* #F1F5F9 */
--muted-foreground: hsl(215.4 16.3% 46.9%); /* #64748B */
--border: hsl(214.3 31.8% 91.4%);      /* #E2E8F0 */
--input: hsl(214.3 31.8% 91.4%);       /* #E2E8F0 */
```

### Brand/Primary Colors
```css
--primary: hsl(221.2 83.2% 53.3%);     /* #3B82F6 - Blue */
--primary-foreground: hsl(210 40% 98%); /* #F8FAFC */
```

### Status Colors
```css
--success: hsl(142.1 76.2% 36.3%);     /* #10B981 - Green */
--warning: hsl(47.9 95.8% 53.1%);      /* #F59E0B - Amber */
--destructive: hsl(0 84.2% 60.2%);     /* #EF4444 - Red */
```

### Status Badge Mapping
```tsx
const statusStyles = {
  PENDING: {
    variant: 'outline',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    icon: '●'
  },
  PROCESSING: {
    variant: 'default',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    icon: '⚙️' // with spinner animation
  },
  PROCESSED: {
    variant: 'default',
    color: 'bg-green-100 text-green-700 border-green-300',
    icon: '✓'
  },
  FAILED: {
    variant: 'destructive',
    color: 'bg-red-100 text-red-700 border-red-300',
    icon: '⚠️'
  },
  APPROVED: {
    variant: 'default',
    color: 'bg-green-100 text-green-700 border-green-300',
    icon: '✅'
  },
  REJECTED: {
    variant: 'secondary',
    color: 'bg-red-100 text-red-700 border-red-300',
    icon: '❌'
  }
};
```

---

## Appendix C: Sample Cursor Prompts (Verbatim)

### Backend Prompt 1: Entity Generation
```
Create a Photo domain entity in Java with the following requirements:

Fields:
- UUID id (primary key)
- String filename
- String mimeType
- long sizeBytes
- byte[] content
- PhotoStatus status (enum: PENDING, PROCESSING, PROCESSED, FAILED, APPROVED, REJECTED)
- String failureReason (nullable)
- Instant uploadedAt
- Instant updatedAt

Requirements:
- Use Lombok annotations (@Data, @Builder)
- Add validation annotations (@NotNull, @Size)
- Include state transition methods:
  * startProcessing() - PENDING → PROCESSING
  * markProcessed() - PROCESSING → PROCESSED
  * markFailed(String reason) - PROCESSING → FAILED
  * approve() - PROCESSED → APPROVED
  * reject() - PROCESSED → REJECTED
  * retry() - FAILED → PENDING
- Throw IllegalStateException if invalid transition
- Auto-set updatedAt on status change
- Add static factory method: createPending(String filename, ...)

Generate the complete class with proper encapsulation.
```

### Frontend Prompt 1: Component Generation
```
Create a StatusBadge React component with TypeScript:

Props:
- status: PhotoStatus (PENDING | PROCESSING | PROCESSED | FAILED | APPROVED | REJECTED)
- className?: string (optional)

Requirements:
- Use shadcn/ui Badge component
- Map status to variant and color:
  * PENDING: outline, gray
  * PROCESSING: default, blue with spinner icon
  * PROCESSED: default, green with checkmark
  * FAILED: destructive, red with warning icon
  * APPROVED: default, green with checkmark
  * REJECTED: secondary, red with X icon
- Include Lucide React icon for each status
- Add smooth transitions on status change
- Fully type-safe with TypeScript
- Export as default

Use Tailwind classes and keep it clean and composable.
```

---

## Appendix D: Timeline Breakdown (Hour-by-Hour)

### Day 1: Wednesday (10 AM - 6 PM) - 8 hours

**10:00 - 11:00 AM: Backend Setup**
- Generate Spring Boot project structure
- Configure H2, CORS, OpenAPI
- Create domain entities (Photo, EventLog, PhotoStatus)

**11:00 AM - 12:30 PM: Backend Core**
- Generate repositories (in-memory)
- Create PhotoService with upload and status management
- Build ProcessorService with @Scheduled task
- Add EventService for audit logging

**12:30 - 1:30 PM: Lunch Break**

**1:30 - 3:00 PM: Backend API Layer**
- Generate controllers (PhotoController, ActionController, EventController)
- Create DTOs and validation
- Test endpoints with Postman/curl
- Verify processor runs and updates statuses

**3:00 - 4:30 PM: Frontend Setup**
- Initialize Vite + React + TypeScript project
- Install and configure Tailwind CSS
- Setup shadcn/ui components
- Generate TypeScript types from OpenAPI spec

**4:30 - 6:00 PM: Frontend Core Components**
- Create shared components (StatusBadge, EmptyState, LoadingSkeleton)
- Build UploadDropzone component
- Create PhotoTable component
- Setup routing (React Router)

**End of Day 1 Deliverable:**
✅ Backend API fully functional  
✅ Frontend project structure complete  
✅ Core UI components generated

---

### Day 2: Thursday (9 AM - 6 PM) - 9 hours

**9:00 - 10:30 AM: Upload Screen**
- Build Upload page layout
- Integrate UploadDropzone with backend API
- Add optimistic UI updates
- Implement toast notifications
- Test concurrent uploads

**10:30 AM - 12:00 PM: Processing Queue Screen**
- Build Queue page layout
- Create FilterChips component
- Implement PhotoTable with polling hook
- Add "Last updated" indicator
- Test live status updates

**12:00 - 1:00 PM: Lunch Break**

**1:00 - 3:00 PM: Review Gallery Screen**
- Build two-column layout
- Create PhotoGrid with PhotoCard components
- Implement hover actions (Approve/Reject/Retry)
- Build EventLogPanel with timeline
- Wire up actions to backend API

**3:00 - 4:00 PM: Integration & Testing**
- End-to-end flow testing
- Fix any bugs or edge cases
- Add loading states where missing
- Polish transitions and animations

**4:00 - 5:00 PM: Demo Preparation**
- Add seed data endpoint for instant demo
- Create demo script
- Test demo flow multiple times
- Prepare talking points

**5:00 - 6:00 PM: Documentation**
- Write README with setup instructions
- Create architecture diagram (Mermaid)
- Document AI usage with screenshots
- Prepare submission materials

**End of Day 2 Deliverable:**
✅ Complete working application  
✅ Professional demo-ready UI  
✅ Documentation complete  
✅ Submission package ready

---

### Day 3: Friday (9 AM - 10 AM) - Buffer Time

**9:00 - 9:30 AM: Final Polish**