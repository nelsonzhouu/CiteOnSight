# CiteOnSight

CiteOnSight is a Chrome extension that instantly generates formatted citations from any webpage. Instead of manually copying URLs, publication dates, and author names into a citation generator, CiteOnSight extracts metadata from the page you're already on and formats it for you in one click.

## The Problem

Academic researchers, students, and writers spend significant time manually building citations — finding the author, publication date, and site name, then formatting them correctly for APA, MLA, or Chicago style. CiteOnSight eliminates that friction by reading the page's metadata automatically and formatting the citation on demand.

## Key Features

- Auto-extract metadata from any webpage (title, author, date, publisher)
- Generate citations in APA, MLA, and Chicago formats
- Manual entry fallback for pages with missing metadata
- Save citations to organized project folders
- User accounts with citation history
- Copy-to-clipboard with one click

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | React, Vite, Tailwind CSS |
| Backend API | FastAPI (Python) |
| Database & Auth | Supabase (PostgreSQL + Auth) |
| Testing | Vitest (extension), pytest (backend) |
| CI/CD | GitHub Actions |

## Project Structure

```
CiteOnSight/
├── extension/
│   ├── src/
│   │   ├── popup/          # React UI rendered in the extension popup
│   │   ├── content/        # Content scripts — run inside the webpage
│   │   ├── background/     # Service worker — handles background tasks
│   │   └── utils/          # Shared helpers (metadata parsing, formatting)
│   ├── tests/
│   │   ├── unit/           # Unit tests for utilities and components
│   │   └── integration/    # Integration tests for content script behavior
│   └── public/
│       └── manifest.json   # Chrome extension manifest (Manifest V3)
├── backend/
│   ├── app/
│   │   ├── routers/        # FastAPI route handlers
│   │   ├── models/         # Pydantic request/response models
│   │   ├── services/       # Business logic (citation formatting)
│   │   └── middleware/     # Auth validation, rate limiting
│   └── tests/              # pytest test suite
└── .github/
    └── workflows/          # GitHub Actions CI/CD pipelines
```

## Installation

> Installation instructions will be added when the extension reaches a stable release.

## Development Phases

Each phase follows the same pattern: build the feature, manually verify it works, write tests for it, then commit. Testing is not deferred to the end — each phase ships with its own tests.

### Phase 1: Metadata Extraction
Build the content script that runs inside the active browser tab and extracts structured metadata (title, author, date, URL, publisher) from the page's HTML and meta tags. Write unit tests for the extraction logic.

### Phase 2: Citation Formatting
Build the FastAPI backend with endpoints that accept metadata and return properly formatted citations in APA, MLA, and Chicago styles. Write unit tests for all three formatters.

### Phase 3: Extension UI
Build the React popup interface — displays extracted metadata, lets users choose a citation format, shows the formatted result, and handles error/loading states. Write component tests for the UI.

### Phase 4: Connect Extension to Backend
Wire the extension to the live backend API. Handle network errors, loading states, and deploy the backend to a hosting provider. Write tests for the API client and error handling paths.

### Phase 5: Supabase Integration & Auth
Add user accounts via Supabase Auth. Users can sign in from the extension popup and their citations are saved to their account. Write tests for auth flows and citation persistence.

### Phase 6: Projects/Folders Feature
Let users organize saved citations into named project folders (e.g., "Research Paper", "Thesis Chapter 2"). Write tests for folder creation and citation assignment.

### Phase 7: CI/CD & Test Coverage Review
This phase is not "write all the tests" — each phase already has tests. Phase 7 is about raising the bar:
- Set up GitHub Actions to run tests and lint on every push
- Review coverage across all phases and fill gaps
- Add integration tests for full end-to-end user flows
- Reach 80%+ code coverage across both codebases

## Features Checklist

### Phase 1: Metadata Extraction
- [ ] Extract title from `<title>` and `og:title`
- [ ] Extract author from meta tags and byline selectors
- [ ] Extract publication date from meta tags and structured data
- [ ] Extract publisher/site name
- [ ] Extract canonical URL
- [ ] Handle pages with missing metadata gracefully
- [ ] Unit tests for extraction logic

### Phase 2: Citation Formatting
- [ ] APA format endpoint
- [ ] MLA format endpoint
- [ ] Chicago format endpoint
- [ ] Input validation with Pydantic
- [ ] Error handling for malformed input
- [ ] Unit tests for all three formats

### Phase 3: Extension UI
- [ ] Popup shell with Tailwind styling
- [ ] Display extracted metadata fields
- [ ] Format selector (APA / MLA / Chicago)
- [ ] Formatted citation display
- [ ] Copy-to-clipboard button
- [ ] Loading state while fetching citation
- [ ] Error state for failed requests

### Phase 4: Connect Extension to Backend
- [ ] API client utility in extension
- [ ] Wire format selector to backend endpoint
- [ ] Handle network errors gracefully
- [ ] Deploy backend

### Phase 5: Supabase Integration & Auth
- [ ] Sign in / sign up flow in popup
- [ ] JWT passed with citation requests
- [ ] Save citation to user's history
- [ ] View saved citations

### Phase 6: Projects/Folders Feature
- [ ] Create and name project folders
- [ ] Assign citations to a folder on save
- [ ] Browse citations by folder

### Phase 7: Testing & CI/CD
- [ ] Full unit test coverage for extraction utils
- [ ] Full unit test coverage for citation formatters
- [ ] Integration tests for API endpoints
- [ ] GitHub Actions workflow for extension
- [ ] GitHub Actions workflow for backend

## Current Status

![Status](https://img.shields.io/badge/status-in%20development-yellow)

Phase 1 in progress.
