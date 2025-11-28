Below is a clean, DDD-aligned product feature plan for adding Photo Tagging to your existing project.
It’s written as if you’re proposing it to a tech lead or PM—clear, structured, and actionable.
All steps assume your current Spring Boot + React architecture and domain-driven layout.

⸻

✅ PRODUCT FEATURE PLAN – Photo Tagging System (DDD Aligned)

1. Feature Overview

Goal

Enable users to assign descriptive tags to photos (e.g., “tree”, “portrait”, “night-shot”) and allow searching/filtering by those tags.

Primary user value
	•	Easier discovery and organization of photos.
	•	Faster review workflow (“show me all landscape photos that failed processing”).
	•	Future-ready for semantic search or auto-tagging.

Secondary value
	•	Enables features like:
	•	Saved views (“All nature photos”)
	•	ML/AI tagging pipeline later
	•	Bulk tag updates

⸻

2. Requirements

Functional Requirements

Tag management
	•	Users can add tags to a photo.
	•	Users can remove tags from a photo.
	•	Users can edit tags via Photo Preview or Photo Card.
	•	Tags auto-normalize:
	•	Lowercase
	•	Trim
	•	No duplicates

Search
	•	Search bar should match:
	•	filename
	•	tags
	•	Filters should support:
	•	“Tag contains…”
	•	Multi-tag filters
	•	Bulk actions must NOT remove or override tags unless explicitly told.

Events
	•	Tag changes generate events:
	•	TAG_ADDED
	•	TAG_REMOVED

Persistence
	•	Tags must persist across app restarts (in your in-memory → DB-ready structure).

⸻

3. Architecture (DDD)

This fits naturally into your existing DDD domain without major changes.

Below is the strict DDD breakdown:

⸻

4. Domain Layer Changes (Core)

4.1. Update Aggregate: Photo

Add:

private Set<String> tags;

Add domain behaviors (NO setters):

public void addTag(String tag);
public void removeTag(String tag);
public void clearTags();

Rules inside the aggregate:
	•	Normalize tag (lowercase + trim).
	•	Reject empty string.
	•	Prevent duplicates.
	•	Raise domain events:
	•	new TagAddedEvent(this.id, tag)
	•	new TagRemovedEvent(this.id, tag)

4.2. Domain Events

Create new events:

public class TagAddedEvent extends DomainEvent { ... }
public class TagRemovedEvent extends DomainEvent { ... }

These will be persisted as EventLog entries by an application service.

⸻

5. Application Layer Changes

Create explicit use cases, not handled by controllers directly.

5.1. AddTagToPhotoService

public class AddTagToPhotoService {
   private final PhotoRepository photos;
   private final EventPublisher eventPublisher;

   public void handle(AddTagCommand cmd) {
       Photo photo = photos.getById(cmd.photoId());
       photo.addTag(cmd.tag());
       photos.save(photo);
       eventPublisher.publish(photo.pullDomainEvents());
   }
}

5.2. RemoveTagFromPhotoService

Same shape but removing a tag.

5.3. Commands

public record AddTagCommand(UUID photoId, String tag) {}
public record RemoveTagCommand(UUID photoId, String tag) {}

These decouple transport from domain.

⸻

6. Infrastructure Layer Changes

6.1. Repository

Your current in-memory repo already stores a Photo.
Just update the model to include tags.

When you later move to a DB, this becomes a join table.

6.2. Event Handling

Map domain events → EventLog records:
	•	TAG_ADDED
	•	TAG_REMOVED

This plugs perfectly into your existing EventController and UI event log.

⸻

7. API Layer (Controllers)

Add new endpoints under PhotoController:

7.1. Add a tag

POST /api/photos/{id}/tags
BODY: { "tag": "tree" }

7.2. Remove a tag

DELETE /api/photos/{id}/tags/{tag}

7.3. Filter by tag

Extend your existing list endpoint:

GET /api/photos?tag=tree

Supports combined filters:

GET /api/photos?tag=night&status=FAILED&sort=newest


⸻

8. DTO Changes

PhotoDTO

Add:

List<String> tags;

Update request DTOs
	•	AddTagRequest { String tag }

No need for a RemoveTagRequest.

⸻

9. Frontend Implementation Plan (React + TS + shadcn)

9.1. Update global Types

Photo model → add:

tags: string[];

9.2. Create TagEditor Component

Fits in PhotoPreviewModal and PhotoCard.

UI proposed:
	•	Tag chips (shadcn badge components)
	•	Small “x” to remove
	•	Input to add

Example behavior:
	•	User types a tag → presses Enter → sends API request → updates context state.
	•	Removing tag triggers DELETE call.

9.3. Extend API Client

addTag(photoId: string, tag: string)
removeTag(photoId: string, tag: string)

9.4. Add filtering to usePhotoFilters

Extend search logic:

matchesTags = photo.tags.some(t => t.includes(search.toLowerCase()));
matchesFilename = photo.filename.includes(search);

return matchesTags || matchesFilename;

Add advanced filter:

tagFilter: string | null;

Allow UI:
	•	A dropdown of existing tags (auto-aggregated from photos).
	•	Multi-select support (future).

9.5. Show tags in PhotoCard

Use small badges below the filename.

9.6. EventLog Integration

When a tag is added/removed, show events:
	•	“Tag ‘tree’ added to IMG_4912.jpg”
	•	“Tag ‘night’ removed from DSC1001.png”

Events should click through to that photo and highlight it.

⸻

10. Testing & Validation

Backend Tests
	•	Photo aggregate tests:
	•	addTag normalizes inputs
	•	rejects empty tags
	•	removes correctly
	•	raises events
	•	Use-case tests:
	•	AddTagService.handle correctly persists + publishes events
	•	Reject removing nonexistent tags (optional)
	•	Controller tests for endpoints

Frontend Tests
	•	TagEditor:
	•	Adding tag updates UI + backend call
	•	Removing tag works
	•	usePhotoFilters:
	•	Searching by tag works
	•	PhotoCard:
	•	Chips render consistently

⸻

11. Deliverables

Backend
	•	Updated Photo aggregate
	•	Tag domain events
	•	Application services (add/remove)
	•	Updated repositories & controllers
	•	EventLog integration
	•	Tests

Frontend
	•	TagEditor UI
	•	Updated Photo models
	•	Extended filters
	•	Updated gallery components
	•	Tests

⸻

12. Rollout Plan

Phase 1 – Backend foundation (DDD)
	•	Add tags to domain model
	•	Add domain events, commands, services
	•	Add API endpoints
	•	Add tests

Phase 2 – Frontend UI
	•	Update models + clients
	•	TagEditor component
	•	Display tags on cards and modal

Phase 3 – Search & filter integration
	•	Add tag search logic
	•	Update ReviewPage filter components

Phase 4 – Event log polish
	•	Display tag events
	•	Click-through highlight

Phase 5 – QA & documentation
	•	Update README (feature usage + architecture)
	•	Add example screenshots
	•	Run full test suite

⸻

If you’d like, I can generate:

✅ Complete backend code (entities, services, repo changes)
✅ Frontend TagEditor component (shadcn-based)
✅ API interface updates
✅ Updated README documentation
✅ Architecture diagrams

Just tell me: “Generate the DDD backend code” or “Generate the frontend tagging UI” and I’ll build it.