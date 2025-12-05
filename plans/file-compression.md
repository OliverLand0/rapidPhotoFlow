Here is a clean, production-ready plan_image_conversion.md you can give directly to Claude.

⸻

Image Conversion & AI Tagging Compatibility Plan

Overview

This document defines the architecture and workflow for integrating image format conversion into the upload pipeline to ensure compatibility with the ChatGPT API for AI-based tagging.

The feature introduces a pre-upload toggle that controls whether incompatible image formats should be automatically converted. If conversion is disabled and the uploaded file is not compatible with the ChatGPT API, the system must disable AI tagging for that image both on the upload page and in the image preview.

⸻

Goals
	1.	Allow users to toggle “Convert to ChatGPT-compatible format” before uploading images.
	2.	Automatically convert unsupported filetypes (e.g., HEIC/HEIF/TIFF/BMP) into a ChatGPT-compatible format (JPEG/PNG/WebP) when toggle is ON.
	3.	If toggle is OFF and file is incompatible:
	•	Disable AI tagging for that file on the upload UI.
	•	Disable AI tagging in image preview.
	4.	Maintain clear metadata so the frontend can properly show/hide or enable/disable AI tagging actions.

⸻

Supported & Unsupported Formats

ChatGPT-Compatible Formats
	•	image/jpeg
	•	image/png
	•	image/webp

Formats Requiring Conversion (initial list)
	•	image/heic
	•	image/heif
	•	image/tiff
	•	image/bmp
	•	image/gif (if animation is not required)
	•	Others as determined by backend inspection

⸻

User Flow

Step 1 — Toggle Before Upload
	•	UI shows a switch:
“Convert images to ChatGPT-compatible format for AI tagging”
	•	Recommended default: ON
	•	Toggle value sent to backend as convertToCompatible: boolean.

Step 2 — User Uploads Images

For each file:
	1.	Detect MIME type.
	2.	Check if file is ChatGPT-compatible.

Step 3 — Backend Behavior

If convertToCompatible = true:
	•	If file is compatible → store normally.
	•	If file is incompatible → convert it (e.g., using Sharp/ImageMagick/Pillow).
	•	After conversion:
	•	Store as JPEG/PNG/WebP.
	•	Set metadata to allow AI tagging.

If convertToCompatible = false:
	•	If compatible → store normally and enable AI tagging.
	•	If incompatible:
	•	Store as-is.
	•	Mark AI tagging as disabled.
	•	Frontend must remove tagging UI.

⸻

Backend Requirements

Upload Endpoint Modifications

Request should include:

{
  "convertToCompatible": true | false
}

Backend logic:
	1.	Detect file type.
	2.	Evaluate isCompatible based on MIME type.
	3.	Branch:

Conversion Path
	•	Convert using image processing library.
	•	Store converted file.
	•	Save metadata:
	•	isChatGptCompatible = true
	•	wasConverted = true
	•	aiTaggingEnabled = true

No-Conversion Path
	•	Store original file.
	•	If compatible:
	•	aiTaggingEnabled = true
	•	If incompatible:
	•	aiTaggingEnabled = false
	•	isChatGptCompatible = false

Metadata Model Requirements

Each uploaded image must track:

Field	Description
id	Unique ID
originalFileName	Name uploaded by user
originalMimeType	Mime type of original file
storedMimeType	Mime type of stored image
isChatGptCompatible	True if stored image works with ChatGPT API
wasConverted	True if conversion occurred
aiTaggingEnabled	True/False for allowing tagging
conversionEnabledAtUpload	Whether toggle was ON


⸻

Frontend Requirements

Upload Page UI
	•	Toggle component controlling conversion.
	•	On file selection:
	•	Determine compatibility on the frontend for UI hints.
	•	Display:
	•	Tagging enabled or disabled.
	•	Warning for incompatible files if toggle is OFF.

Upload Response Handling
	•	Backend returns metadata including:
	•	aiTaggingEnabled
	•	isChatGptCompatible
	•	wasConverted
	•	Store these in front-end state for each image.

Preview Component Behavior
	•	If aiTaggingEnabled == true:
	•	Show normal AI tagging controls.
	•	Else:
	•	Hide or disable AI tagging interactions.
	•	Tooltip:
“AI tagging unavailable: the image format is not compatible with ChatGPT. Re-upload with conversion enabled.”

⸻

AI Tagging Integration Requirements

Server-Side Guardrails

Never allow the AI tagging process to execute if:
	•	aiTaggingEnabled == false, OR
	•	isChatGptCompatible == false

The backend must block tagging requests regardless of frontend state.

Error Handling

If a non-compatible image is passed to tagging:
	•	Reject request.
	•	Respond with a useful error:
“AI tagging unavailable: image not stored in a ChatGPT-compatible format.”

⸻

Conversion Service Requirements

Create a dedicated module/class:
	•	Accepts binary file or path.
	•	Converts to image/jpeg or image/png.
	•	Handles:
	•	Invalid or corrupted images
	•	Unsupported formats
	•	Max file size validation
	•	Returns:
	•	Converted buffer / file
	•	New mime type
	•	New file extension

⸻

Edge Cases

Claude should explicitly handle:
	•	Mixed-format multi-file uploads.
	•	Conversion failures (fallback strategy? reject file?).
	•	Extremely large images (timeout or auto-resize).
	•	Re-uploading same file with different toggle settings.
	•	Users navigating away mid-conversion.

⸻

Testing Requirements

Unit Tests
	•	Compatibility detection.
	•	Conversion service (success + failure).
	•	AI-tagging guard rails.
	•	Metadata logic for toggle ON/OFF.

Integration Tests
	•	Toggle ON + incompatible → converted + tagging enabled.
	•	Toggle OFF + incompatible → stored as-is + tagging disabled.
	•	Toggle OFF + compatible → tagging enabled.
	•	Toggle ON + compatible → no conversion + tagging enabled.

Frontend Tests
	•	Toggle behavior visually updated.
	•	Upload UI hiding/showing AI tagging actions.
	•	Preview component disabling tagging when needed.

⸻

Deliverables

Claude should provide:
	1.	Updated API route(s) with conversion logic.
	2.	Conversion service/module.
	3.	Updated frontend (upload + preview).
	4.	New/updated image metadata model.
	5.	Tests (unit + integration).
	6.	A short IMAGE_CONVERSION.md explaining the feature for developers.

⸻

If you’d like, I can also generate a diagram, API contract, or a sample implementation stub to go with this.