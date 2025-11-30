# DISCLAIMER

This document outlines known issues, architectural compromises, and development constraints that affected the final version of this project. These items represent areas I would have improved or refined if more time were available. They are included for transparency and to demonstrate an understanding of proper software engineering principles, even where the current implementation falls short.

## 1. Infrastructure Responsiveness (AWS Free-Tier Constraints)

The application is fully deployed on AWS using the lowest-cost configuration possible.
This introduced several performance limitations:

- Slower-than-expected responsiveness in environments like CloudFront → API Gateway → ECS → RDS.
- Lower provisioned compute for ECS tasks results in occasional delays during AI tagging and photo processing.
- Minimal RDS instance class was chosen to reduce cost, affecting query throughput.
- No autoscaling—the system is intentionally static to remain within free/near-free AWS limits.

Given more time and budget, I would have:

- Enabled autoscaling policies,
- Moved the AI service to a more performant Fargate configuration, and
- Added caching at the CloudFront and API layer.

## 2. Focus on Functionality Over Design

The project prioritizes reliability, correct behavior, and feature completeness over UI/UX flashiness.

- My strength is engineering workflows and backend/frontend integration—not visual design.
- I chose a clean, minimal UI instead of attempting "fancy" animations or complex layouts.
- I also found AI tools challenging to use effectively for UI generation.

Because of that, I focused on function first, ensuring every feature in the spec was implemented and stable.

Future improvement: I would work with a UI/UX designer or use a more structured design system to elevate the visual polish and overall user experience.

## 3. AI-Only Development Strategy

Throughout the project, I committed to a rule: I did not look at a single line of code myself.
All implementation was performed through prompting AI tools and validating outputs through behavior and tests.

As a result:

- Some issues introduced by AI were difficult for me to manually trace or adjust.
- Refactoring large chunks of code could be risky because I was 100% dependent on LLM-guided changes.
- There may be sections of code that are structurally correct but would have been improved if I personally reviewed or hand-edited them.

Despite this, I remained consistent in:

- Architecture-level decision-making,
- Prompting precision,
- Maintaining the project's conceptual integrity.

## 4. Incremental Feature-Building & Evolving Structure

I followed an "add features as I go" process.

- Early on, I built a strong framework with a detailed design document.
- After that, I expanded feature-by-feature in a very iterative (sometimes reactive) manner.
- This occasionally drifted away from strict Domain-Driven Design principles.
- Some architecture patterns—especially in the backend—could be more rigorously separated and refined.

With more time, I would:

- Revisit all domain boundaries,
- Reconfirm aggregate roots,
- Extract a cleaner application layer,
- Reduce any accidental duplication introduced during iterative growth.

## 5. Known Minor Issues Identified in Final Code Review

These are items I'm aware of that didn't make the final release cut:

### 5.1 Unimplemented or Partial Features

- A status-count endpoint (`/api/photos/counts`) exists in DTO/client form but is not fully implemented on the backend.
- Semantic/AI search (ex: searching "tree" to find images containing trees) was discussed but not completed.

### 5.2 Small Redundancies / Dead Code

There may be:

- Small leftover utilities,
- Unused DTOs or test stubs,
- Minor architectural inconsistencies from early iterations.

These were deprioritized to avoid destabilizing the final build.

### 5.3 Event Log "Click-Through" UX Could Be Better

The event log works, but:

- Clicking an event could more clearly highlight and scroll to the related photo.
- This was planned but not fully polished.

### 5.4 "My Uploads Only" Filter

User-ID-based filtering is implemented at the data layer, but a UI toggle for "Show only my photos" was not fully built out.

## 6. Scope vs. Time Constraints

Given the project's timeline and complexity:

- Full semantic AI-based search
- Heavier image processing pipelines
- More advanced caching or queueing infrastructure
- UI transitions and animations
- Additional backend refactoring for domain purity

…were intentionally not included to de-risk final delivery.

## 7. Final Thoughts

Even with these limitations, the project delivers:

- A full AI-driven photo ingestion and review workflow
- Authentication with email confirmation
- Tagging, filters, saved views, keyboard shortcuts
- A functioning event log system
- Real AWS deployment, Terraform-managed
- Strong test coverage across frontend & backend components
- A DDD-inspired structure, even if not perfectly strict

This disclaimer exists to acknowledge areas where more polish, optimization, and architectural rigor could be added if the timeline and constraints allowed.
