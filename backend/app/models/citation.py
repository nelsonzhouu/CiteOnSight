import bleach
from pydantic import BaseModel, Field, field_validator
from typing import Literal


def _sanitize(value: str | None) -> str | None:
    """Strip all HTML tags to prevent stored XSS before the value touches any logic."""
    if value is None:
        return None
    return bleach.clean(value, tags=[], strip=True).strip() or None


class CitationRequest(BaseModel):
    source_type: Literal["website", "journal_article"]
    format: Literal["APA", "MLA", "Chicago", "IEEE", "Harvard"] = Field(
        description="Citation style: APA 7th, MLA 9th, Chicago 17th, IEEE, or Harvard"
    )
    title: str = Field(min_length=1)
    authors: list[str] | None = None
    url: str | None = None
    publisher: str | None = None
    date: str | None = None
    # Journal-specific fields
    journal_name: str | None = None
    volume: str | None = None
    issue: str | None = None
    pages: str | None = None
    doi: str | None = None

    @field_validator("title", mode="before")
    @classmethod
    def sanitize_title(cls, v: str) -> str:
        cleaned = bleach.clean(str(v), tags=[], strip=True).strip()
        if not cleaned:
            raise ValueError("title cannot be empty after sanitization")
        return cleaned

    @field_validator(
        "publisher", "journal_name", "volume", "issue", "pages", "doi", "url", "date",
        mode="before",
    )
    @classmethod
    def sanitize_optional_string(cls, v: str | None) -> str | None:
        return _sanitize(v)

    @field_validator("authors", mode="before")
    @classmethod
    def sanitize_authors(cls, v: list | None) -> list[str] | None:
        if v is None:
            return None
        sanitized = [_sanitize(a) for a in v if a is not None]
        # Filter out any entries that became None after sanitization
        cleaned = [a for a in sanitized if a]
        return cleaned or None


class CitationResponse(BaseModel):
    citation: str
    format: str
    source_type: str
