4. Redundant / unused / inconsistent code

Here are the concrete things I can see as redundant, dead, or mismatched:

A. Unused “Queue” view
	•	QueuePage.tsx
	•	FilterChips.tsx (+ test)
	•	PhotoTable.tsx

These are only referenced by QueuePage, but QueuePage is not wired into the router (App.tsx only has / and /review routes).

👉 Options:
	•	If you still want the queue/table view:
	•	Add a /queue route and a nav item in Layout.
	•	Make sure QueuePage uses the same PhotosProvider state (once you add it) so it stays in sync.
	•	If you don’t:
	•	Delete QueuePage, FilterChips, PhotoTable and their tests to reduce noise.

B. Status counts DTO / API mismatch
	•	Backend:
	•	StatusCountDTO exists but there is no /api/photos/counts endpoint implemented.
	•	Frontend:
	•	StatusCount type and photoClient.getStatusCounts() function exist.
	•	StatusSummaryBar does not use getStatusCounts; it computes counts from photos props.

👉 This is currently dead/unnecessary code:
	•	If you want to use server-side counts:
	•	Implement GET /api/photos/counts in PhotoController returning List<StatusCountDTO>.
	•	Update StatusSummaryBar (or usePhotoPolling) to hit that endpoint.
	•	If not needed:
	•	Remove StatusCountDTO class.
	•	Remove StatusCount type and getStatusCounts() from the client.

C. Multiple polling sources (overkill)
	•	usePhotoPolling is invoked in:
	•	Layout
	•	UploadPage
	•	ReviewPage
	•	QueuePage (unused)
	•	Each instance independently polls /api/photos.

👉 This is not exactly “useless”, but wasteful and can cause subtle bugs:
	•	Replace them with a single shared source in a PhotosProvider.
	•	Consumers use usePhotos() instead of usePhotoPolling() directly.

D. Minor potential cleanups
	•	Check for any unused imports in components where you’ve refactored (e.g. if you stopped using a particular icon, utility, or hook).
	•	Ensure all tests correspond to active components:
	•	e.g. FilterChips.test.tsx, PhotoTable tests are pointless if the feature is dead.