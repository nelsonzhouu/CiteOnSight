# CiteOnSight

CiteOnSight is a Chrome extension that generates formatted academic citations from any webpage. Open the extension on any article or journal page — it reads the page's metadata automatically and formats the citation in APA, MLA, Chicago, IEEE, or Harvard style in one click. For books and pages with missing metadata, a manual entry form lets you type the fields directly.

## Citation Formats

| Format | Version | Common Use |
|--------|---------|------------|
| APA | 7th Edition | Social sciences, psychology, education |
| MLA | 9th Edition | Humanities, literature, languages |
| Chicago | 17th Edition (Notes and Bibliography) | History, arts, humanities |
| IEEE | Current standard | Engineering, computer science |
| Harvard | Standard author-date (Cite Them Right, 12th ed.) | Sciences, UK universities |

## What It Does

CiteOnSight supports two ways to create citations:

**Auto-extraction** — open the extension on any page and it reads the metadata automatically. Detects two source types:
- **Websites** — news articles, blog posts, Wikipedia, general web pages
- **Journal articles** — pages with DOIs or Highwire Press metadata (Nature, PubMed, etc.)

**Manual entry** — open the menu (☰) and select Manual Citation. Type the fields directly. Covers three source types:
- **Websites** — when auto-extraction returns incomplete data
- **Journal articles** — same fields as auto-extraction, manually entered
- **Books** — not auto-detectable (no webpage to extract from)

For each source type, the formatter applies the correct per-style rules — author list thresholds (APA lists up to 20; Chicago journal up to 10; et al. rules differ by format and source type), date formatting, title italics, and journal name italics.

## Current Status

![Status](https://img.shields.io/badge/status-Phase%203%20complete-blue)

Phases 1–3 are complete and tested. The extension popup is fully functional using a local mock citation service. Phase 4 will connect it to the live backend API.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Extension | React 18, Vite, Tailwind CSS v3 |
| Backend API | FastAPI (Python 3.12) |
| Database & Auth | Supabase (PostgreSQL + Auth) — Phase 5 |
| Testing | Vitest + Testing Library (extension), pytest (backend) |
| CI/CD | GitHub Actions — Phase 7 |

## Project Structure

```
CiteOnSight/
├── extension/
│   ├── src/
│   │   ├── popup/
│   │   │   ├── components/     # CitationBox, FormatTabs, MetadataCard,
│   │   │   │                   #   ErrorMessage, LoadingSpinner, ManualEntryForm
│   │   │   ├── hooks/          # useMetadata — Chrome message passing hook
│   │   │   ├── services/       # mockCitationService (swapped for real API in Phase 4)
│   │   │   │                   #   storage — chrome.storage.local wrappers
│   │   │   ├── App.jsx
│   │   │   ├── index.jsx
│   │   │   └── index.css
│   │   ├── content/            # Content script — runs inside the active tab
│   │   └── utils/              # extractMetadata — DOM metadata extraction
│   ├── tests/
│   │   └── unit/               # 154 tests across all components and utilities
│   └── public/
│       ├── manifest.json       # Chrome Manifest V3
│       └── popup.html
├── backend/
│   ├── app/
│   │   ├── routers/            # FastAPI route handlers
│   │   ├── models/             # Pydantic request/response models
│   │   ├── services/           # Citation formatting logic (5 styles × 2 source types)
│   │   └── middleware/         # Auth validation, rate limiting (Phase 5)
│   └── tests/                  # 109 pytest tests for citation formatters
└── CLAUDE.md                   # Architecture decisions and code conventions
```

## Development Phases

Each phase follows the same pattern: build the feature, manually verify it works, write tests, commit. Tests are not deferred to the end — each phase ships with its own tests.

### Phase 1: Metadata Extraction — Complete

Content script that runs inside the active browser tab and extracts structured metadata from the page's HTML, meta tags, Open Graph tags, Highwire Press tags, and JSON-LD structured data.

- Extracts title, author, publication date, publisher, canonical URL, and access date
- Auto-detects **website** vs. **journal article** from DOI presence, `citation_journal_title`, and `ScholarlyArticle` JSON-LD
- Handles multiple `citation_author` tags (Highwire Press format) joined with ` | ` to avoid ambiguity with "Last, F." name format
- Normalizes dates from multiple formats (ISO 8601, natural language) to YYYY-MM-DD
- Graceful fallbacks for all fields when metadata is absent

### Phase 2: Citation Formatting Backend — Complete

FastAPI backend that accepts metadata and returns formatted citations. All formatting logic lives in the backend so fixes apply everywhere — the extension just sends metadata and receives a string.

- All five formats implemented for both websites and journal articles (10 formatters total)
- Per-style author list rules: APA (1–20 all, 21+ truncate to 19 + last), MLA journal (1–2 all, 3+ et al.), MLA website (all, no threshold), Chicago journal (1–10 all, 11+ show 7), Chicago website (1–10 all, 11+ show 10), IEEE (1–6 all, 7+ et al.), Harvard (1–3 all, 4+ et al.)
- Handles "Last, F." author name format from `citation_author` tags
- Strips " — Journal Name" suffixes injected into article titles by publishers
- Input validation and HTML sanitization via Pydantic + bleach

### Phase 3: Extension UI — Complete

React popup that connects metadata extraction to citation display.

**Auto-extraction view:**
- `MetadataCard` — shows extracted title, author, date, source type badge
- `FormatTabs` — tab strip for switching between 5 citation styles
- `CitationBox` — displays formatted citation with:
  - Format-specific italics rendered as `<em>` elements (APA: title for websites, journal name for articles; MLA: publisher for websites, journal name for articles; Chicago/IEEE/Harvard: journal name for articles only)
  - Hanging indent (CSS `text-indent: -2em; padding-left: 2em`)
  - Rich clipboard copy via `ClipboardItem` — writes both `text/plain` (no markup) and `text/html` (with `<i>` tags and hanging indent) so pasting into Word or Google Docs preserves formatting
  - `overflow-wrap: break-word` so long URLs don't overflow the 380px popup width
- `ErrorMessage` — three distinct error states: browser page (can't cite `chrome://` URLs), timeout (content script didn't respond), unknown
- `LoadingSpinner` — shown while the citation is being formatted

**Manual entry view (`ManualEntryForm`):**
- Accessed via hamburger menu (☰) in the popup header; "My Projects" in the same menu is disabled pending Phase 6
- Source type selector — Website, Journal Article, Book; switching resets all fields
- Dynamic author inputs — one input per author, add/remove buttons; accepts any name format
- Live citation preview — updates as fields are filled; gated on the title field so the preview only appears once there's something to format
- Field sets per source type:
  - **Website** — Title, Authors, Date, Access Date (defaults to today if blank), Publisher, URL
  - **Journal article** — Title, Authors, Journal Name, Date, Volume, Issue, Pages, DOI, URL
  - **Book** — Title, Authors, Year, Publisher, Publisher Location, Edition (ordinal suffix added automatically: "4" → "4th ed.")
- Chicago and IEEE book citations use `Location: Publisher, Year` when a publisher location is provided
- APA, MLA, and Harvard book citations use publisher name only (location not required in current editions)
- `chrome.storage.local` persistence — view state and all form fields survive popup close/reopen, so users can close the popup to copy a title from the page and reopen with their work intact
- "Clear Form" button clears all fields and removes the saved state

**Architecture:**
- `useMetadata` hook sends `GET_METADATA` to the content script via `chrome.tabs.sendMessage` with a 3-second timeout; handles browser pages before attempting message passing
- `mockCitationService` implements the same async interface as the real backend API — swapping to the real service in Phase 4 is a one-line import change in `App.jsx`
- `storage.js` wraps `chrome.storage.local` with a `typeof chrome` guard so the same code runs in tests (jsdom) without mocking the chrome global

### Phase 4: Connect Extension to Backend — Upcoming

Wire the extension to the live API. Replace the mock citation service with a real HTTP client. Handle network errors and deploy the backend.

### Phase 5: Supabase Integration & Auth — Upcoming

Add user accounts via Supabase Auth. Users sign in from the popup and citations are saved to their history. The Supabase `anon` key lives in the extension (safe — limited by Row Level Security policies); the `service_role` key stays on the backend only.

### Phase 6: Projects/Folders — Upcoming

Let users organize saved citations into named folders (e.g., "Research Paper", "Thesis Chapter 2").

### Phase 7: CI/CD & Coverage Review — Upcoming

Set up GitHub Actions for both codebases, review coverage across all phases, add integration tests for end-to-end flows, reach 80%+ coverage.

## Features Checklist

### Phase 1: Metadata Extraction
- [x] Extract title from `og:title`, `twitter:title`, JSON-LD, `document.title`
- [x] Extract author from `citation_author`, `author`, `article:author`, JSON-LD, `rel="author"`, `itemprop="author"`
- [x] Multi-author names joined with ` | ` to preserve "Last, F." format unambiguously
- [x] Extract publication date with normalization to YYYY-MM-DD
- [x] Extract publisher from `og:site_name` and JSON-LD
- [x] Extract canonical URL
- [x] Auto-detect website vs. journal article (DOI, Highwire tags, ScholarlyArticle JSON-LD)
- [x] Graceful fallbacks for all fields when metadata is absent
- [x] Unit tests — 32 tests

### Phase 2: Citation Formatting
- [x] APA 7th edition (website + journal article)
- [x] MLA 9th edition (website + journal article)
- [x] Chicago 17th edition (website + journal article)
- [x] IEEE (website + journal article)
- [x] Harvard / Cite Them Right (website + journal article)
- [x] Per-style, per-source-type author list rules
- [x] "Last, F." name format handled correctly in both JS and Python
- [x] Publisher-injected title suffixes stripped (e.g., "Title — Nature" → "Title")
- [x] Input validation with Pydantic, HTML sanitization with bleach
- [x] Unit tests — 109 tests

### Phase 3: Extension UI
- [x] Popup shell with Tailwind CSS — minimal black/white/gray design, fixed 380px width
- [x] MetadataCard — title, author, date, source type badge
- [x] FormatTabs — 5-tab format selector with active underline indicator
- [x] CitationBox — formatted citation with italics, hanging indent, rich copy
- [x] Clipboard copy: `ClipboardItem` with `text/plain` + `text/html`; falls back to `writeText`
- [x] Italics preserved when pasting into Word and Google Docs
- [x] Long URL wrapping (`overflow-wrap: break-word`)
- [x] LoadingSpinner while citation is formatting
- [x] ErrorMessage — browser page / timeout / unknown error states
- [x] `useMetadata` hook with 3-second timeout and stale-result cancellation
- [x] Mock citation service with identical async interface to real API
- [x] Hamburger menu (☰) — Manual Citation and My Projects (disabled, Phase 6)
- [x] ManualEntryForm — Website, Journal Article, Book source types
- [x] Book citations in all 5 formats (mock service)
- [x] Dynamic author inputs — add/remove per-author fields
- [x] Live citation preview gated on title field
- [x] Access Date field for websites (defaults to today)
- [x] Publisher Location field for books (Chicago and IEEE: "City: Publisher, Year")
- [x] Edition ordinal suffix — "4" → "4th ed." automatically
- [x] `chrome.storage.local` persistence — form state and view survive popup close/reopen
- [x] "Clear Form" button clears fields and saved state
- [x] Component tests — 154 tests

### Phase 4: Connect Extension to Backend
- [ ] Real API client replacing the mock service
- [ ] Error handling for network failures
- [ ] Backend deployment

### Phase 5: Supabase Integration & Auth
- [ ] Sign-in / sign-up flow in popup
- [ ] JWT sent with citation requests
- [ ] Save citations to user history
- [ ] View saved citations

### Phase 6: Projects/Folders
- [ ] Create and name project folders
- [ ] Assign citations to a folder on save
- [ ] Browse citations by folder

### Phase 7: Testing & CI/CD
- [ ] GitHub Actions workflow for extension
- [ ] GitHub Actions workflow for backend
- [ ] Integration tests for full user flows
- [ ] 80%+ code coverage across both codebases
