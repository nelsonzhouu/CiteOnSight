"""
Citation formatting for academic reference styles.
Each formatter is a pure function: CitationRequest in, formatted string out.
Pure functions make these trivial to unit test without any HTTP setup.

Supported styles and versions:
  APA      — 7th Edition (American Psychological Association)
  MLA      — 9th Edition (Modern Language Association)
  Chicago  — 17th Edition, Notes and Bibliography style
  IEEE     — Current standard (Institute of Electrical and Electronics Engineers)
  Harvard  — Standard author-date style (Cite Them Right, 12th Edition)
"""

import re
from app.models.citation import CitationRequest


_MONTH_FULL = {
    1: "January", 2: "February", 3: "March", 4: "April",
    5: "May", 6: "June", 7: "July", 8: "August",
    9: "September", 10: "October", 11: "November", 12: "December",
}

# MLA uses abbreviated month names (except May, June, July which are unabbreviated)
_MONTH_ABBREV = {
    1: "Jan.", 2: "Feb.", 3: "Mar.", 4: "Apr.",
    5: "May", 6: "June", 7: "July", 8: "Aug.",
    9: "Sep.", 10: "Oct.", 11: "Nov.", 12: "Dec.",
}


def _parse_date(date_str: str | None) -> dict:
    """
    Extract year, month, and day from a date string.
    Tries multiple formats since web pages are inconsistent (ISO, text, year-only, etc.).
    Returns a dict with integer keys 'year', 'month', 'day' — any can be None.
    """
    result = {"year": None, "month": None, "day": None}
    if not date_str:
        return result

    s = date_str.strip()

    # ISO: YYYY-MM-DD
    m = re.match(r"^(\d{4})-(\d{2})-(\d{2})$", s)
    if m:
        result.update(year=int(m.group(1)), month=int(m.group(2)), day=int(m.group(3)))
        return result

    # YYYY-MM (no day)
    m = re.match(r"^(\d{4})-(\d{2})$", s)
    if m:
        result.update(year=int(m.group(1)), month=int(m.group(2)))
        return result

    # YYYY only
    m = re.match(r"^(\d{4})$", s)
    if m:
        result["year"] = int(m.group(1))
        return result

    # YYYY/MM/DD
    m = re.match(r"^(\d{4})/(\d{2})/(\d{2})$", s)
    if m:
        result.update(year=int(m.group(1)), month=int(m.group(2)), day=int(m.group(3)))
        return result

    # Last resort: pull a 4-digit year from anywhere in the string
    m = re.search(r"\b(\d{4})\b", s)
    if m:
        result["year"] = int(m.group(1))

    return result


def _parse_name(full_name: str) -> tuple[str, str]:
    """
    Split 'Jane Marie Smith' into ('Smith', 'Jane Marie').
    Assumes Western name order: given names first, family name last.
    Single-word names are treated as family names.
    """
    parts = full_name.strip().split()
    if len(parts) == 1:
        return parts[0], ""
    return parts[-1], " ".join(parts[:-1])


def _to_initials(first_name: str) -> str:
    """Convert 'Jane Marie' → 'J. M.' for APA author format."""
    return " ".join(f"{p[0]}." for p in first_name.split() if p)


def _doi_url(doi: str) -> str:
    """Ensure a DOI is formatted as a full URL."""
    if doi.startswith("http"):
        return doi
    return f"https://doi.org/{doi}"


# Author formatting — each style has different rules for how authors are listed
# IEEE and Harvard are defined after APA/MLA/Chicago for readability.

def _authors_apa(authors: list[str] | None) -> str | None:
    """
    APA: Last, F. M. for each author; ampersand before final author.
    e.g. 'Smith, J., & Jones, B.'
    Returns None if authors list is empty or missing.
    """
    if not authors:
        return None

    def fmt(name: str) -> str:
        last, first = _parse_name(name)
        return f"{last}, {_to_initials(first)}" if first else last

    formatted = [fmt(a) for a in authors]
    if len(formatted) == 1:
        return formatted[0]
    return ", ".join(formatted[:-1]) + ", & " + formatted[-1]


def _authors_mla(authors: list[str] | None) -> str | None:
    """
    MLA: First author is Last, First. Second is First Last. 3+ → et al.
    e.g. 'Smith, Jane, and Bob Jones'
    """
    if not authors:
        return None

    last0, first0 = _parse_name(authors[0])
    first_author = f"{last0}, {first0}" if first0 else last0

    if len(authors) == 1:
        return first_author
    if len(authors) >= 3:
        return f"{first_author}, et al."

    last1, first1 = _parse_name(authors[1])
    second_author = f"{first1} {last1}" if first1 else last1
    return f"{first_author}, and {second_author}"


def _authors_chicago(authors: list[str] | None) -> str | None:
    """
    Chicago: First author is Last, First. Others are First Last. 4+ → et al.
    e.g. 'Smith, Jane, Bob Jones, and Carol Williams'
    """
    if not authors:
        return None

    last0, first0 = _parse_name(authors[0])
    first_author = f"{last0}, {first0}" if first0 else last0

    if len(authors) == 1:
        return first_author
    if len(authors) >= 4:
        return f"{first_author}, et al."

    rest = []
    for author in authors[1:]:
        last, first = _parse_name(author)
        rest.append(f"{first} {last}" if first else last)

    if len(rest) == 1:
        return f"{first_author}, and {rest[0]}"
    return f"{first_author}, " + ", ".join(rest[:-1]) + f", and {rest[-1]}"


def _authors_ieee(authors: list[str] | None) -> str | None:
    """
    IEEE: Initials-first format — 'A. Smith'. Up to 6 authors listed;
    7+ authors → first author 'et al.' (no comma before et al. in IEEE).
    e.g. 'A. Vaswani and N. Shazeer' or 'J. Smith, B. Jones, and C. Williams'
    """
    if not authors:
        return None

    def fmt(name: str) -> str:
        last, first = _parse_name(name)
        if not first:
            return last
        initials = " ".join(f"{p[0]}." for p in first.split() if p)
        return f"{initials} {last}"

    formatted = [fmt(a) for a in authors]
    if len(formatted) == 1:
        return formatted[0]
    if len(formatted) == 2:
        return f"{formatted[0]} and {formatted[1]}"
    if len(formatted) <= 6:
        return ", ".join(formatted[:-1]) + f", and {formatted[-1]}"
    # 7+ authors
    return f"{formatted[0]} et al."


def _authors_harvard(authors: list[str] | None) -> str | None:
    """
    Harvard: Last, F. for each author, 'and' separator (not ampersand).
    Up to 3 authors listed; 4+ → first author 'et al.'
    e.g. 'Smith, J. and Jones, B.' or 'Smith, J., Jones, B. and Williams, C.'
    """
    if not authors:
        return None

    def fmt(name: str) -> str:
        last, first = _parse_name(name)
        return f"{last}, {_to_initials(first)}" if first else last

    formatted = [fmt(a) for a in authors]
    if len(formatted) == 1:
        return formatted[0]
    if len(formatted) == 2:
        return f"{formatted[0]} and {formatted[1]}"
    if len(formatted) == 3:
        return f"{formatted[0]}, {formatted[1]} and {formatted[2]}"
    # 4+ authors
    return f"{formatted[0]} et al."


# Date helpers — each style displays dates differently

def _date_apa_website(date: str | None) -> str:
    """APA website: '(2024, March 15)' or '(n.d.)'"""
    d = _parse_date(date)
    if not d["year"]:
        return "(n.d.)"
    if d["month"] and d["day"]:
        return f"({d['year']}, {_MONTH_FULL[d['month']]} {d['day']})"
    if d["month"]:
        return f"({d['year']}, {_MONTH_FULL[d['month']]})"
    return f"({d['year']})"


def _date_apa_year(date: str | None) -> str:
    """APA journal: '(2017)' or '(n.d.)'"""
    d = _parse_date(date)
    return f"({d['year']})" if d["year"] else "(n.d.)"


def _date_mla(date: str | None) -> str | None:
    """MLA: '15 Mar. 2024'. Returns None if no date at all."""
    d = _parse_date(date)
    if not d["year"]:
        return None
    if d["month"] and d["day"]:
        return f"{d['day']} {_MONTH_ABBREV[d['month']]} {d['year']}"
    if d["month"]:
        return f"{_MONTH_ABBREV[d['month']]} {d['year']}"
    return str(d["year"])


def _date_chicago(date: str | None) -> str | None:
    """Chicago: 'March 15, 2024'. Returns None if no date at all."""
    d = _parse_date(date)
    if not d["year"]:
        return None
    if d["month"] and d["day"]:
        return f"{_MONTH_FULL[d['month']]} {d['day']}, {d['year']}"
    if d["month"]:
        return f"{_MONTH_FULL[d['month']]} {d['year']}"
    return str(d["year"])


# The 6 formatters — one per (style, source_type) combination

def format_apa_website(req: CitationRequest) -> str:
    """
    APA 7th edition website:
      Author, A. A. (Year, Month Day). Title. Publisher. URL
    When no author, title shifts to the lead position.
    """
    authors = _authors_apa(req.authors)
    date = _date_apa_website(req.date)

    parts = []
    if authors:
        parts.append(f"{authors} {date}. {req.title}.")
    else:
        # APA 7: no author → title leads, date follows
        parts.append(f"{req.title}. {date}.")

    if req.publisher:
        parts.append(f"{req.publisher}.")

    # APA 7 does not place a period after the URL
    if req.url:
        parts.append(req.url)

    return " ".join(parts)


def format_apa_journal(req: CitationRequest) -> str:
    """
    APA 7th edition journal article:
      Author, A. A., & Author, B. B. (Year). Article title. Journal Name, Volume(Issue), pages. DOI
    Article title is NOT italicized in APA; journal name and volume are.
    (Italics are a display concern handled by the UI — we output plain text.)
    """
    authors = _authors_apa(req.authors)
    year = _date_apa_year(req.date)

    if authors:
        base = f"{authors} {year}. {req.title}."
    else:
        base = f"{req.title}. {year}."

    # Build journal reference: Name, Volume(Issue), pages
    journal_parts = []
    if req.journal_name:
        journal_parts.append(req.journal_name)

    if req.volume and req.issue:
        journal_parts.append(f"{req.volume}({req.issue})")
    elif req.volume:
        journal_parts.append(req.volume)

    if req.pages:
        journal_parts.append(req.pages)

    citation = base
    if journal_parts:
        citation += " " + ", ".join(journal_parts) + "."

    if req.doi:
        citation += f" {_doi_url(req.doi)}"

    return citation


def format_mla_website(req: CitationRequest) -> str:
    """
    MLA 9th edition website:
      Last, First. "Title." Publisher, Day Mon. Year, URL.
    Publisher, date, and URL are comma-separated in one location element.
    """
    authors = _authors_mla(req.authors)
    date = _date_mla(req.date)

    parts = []
    if authors:
        parts.append(f"{authors}.")

    parts.append(f'"{req.title}."')

    # Location element: publisher, date, URL — comma-separated
    location = []
    if req.publisher:
        location.append(req.publisher)
    if date:
        location.append(date)
    if req.url:
        location.append(req.url)

    if location:
        parts.append(", ".join(location) + ".")

    return " ".join(parts)


def format_mla_journal(req: CitationRequest) -> str:
    """
    MLA 9th edition journal article:
      Last, First, and First Last. "Title." Journal Name, vol. Volume, no. Issue, Year, pp. Pages.
    """
    authors = _authors_mla(req.authors)
    d = _parse_date(req.date)

    parts = []
    if authors:
        parts.append(f"{authors}.")

    parts.append(f'"{req.title}."')

    journal_parts = []
    if req.journal_name:
        journal_parts.append(req.journal_name)
    if req.volume:
        journal_parts.append(f"vol. {req.volume}")
    if req.issue:
        journal_parts.append(f"no. {req.issue}")
    if d["year"]:
        journal_parts.append(str(d["year"]))
    if req.pages:
        journal_parts.append(f"pp. {req.pages}")

    if journal_parts:
        parts.append(", ".join(journal_parts) + ".")

    if req.doi:
        parts.append(f"{_doi_url(req.doi)}.")

    return " ".join(parts)


def format_chicago_website(req: CitationRequest) -> str:
    """
    Chicago 17th edition website (bibliography format):
      Last, First. "Title." Publisher. Month Day, Year. URL.
    Publisher, date, and URL are separate elements (periods between them).
    """
    authors = _authors_chicago(req.authors)
    date = _date_chicago(req.date)

    parts = []
    if authors:
        parts.append(f"{authors}.")

    parts.append(f'"{req.title}."')

    if req.publisher:
        parts.append(f"{req.publisher}.")
    if date:
        parts.append(f"{date}.")
    if req.url:
        parts.append(f"{req.url}.")

    return " ".join(parts)


def format_chicago_journal(req: CitationRequest) -> str:
    """
    Chicago 17th edition journal article (bibliography format):
      Last, First. "Title." Journal Name Volume, no. Issue (Year): Pages. DOI.
    """
    authors = _authors_chicago(req.authors)
    d = _parse_date(req.date)
    year_str = f"({d['year']})" if d["year"] else ""

    parts = []
    if authors:
        parts.append(f"{authors}.")

    parts.append(f'"{req.title}."')

    # Chicago journal info format: Name Volume, no. Issue (Year): pages
    if req.journal_name:
        info = req.journal_name
        if req.volume:
            info += f" {req.volume}"
        if req.issue:
            info += f", no. {req.issue}"
        if year_str:
            info += f" {year_str}"
        if req.pages:
            info += f": {req.pages}"
        parts.append(f"{info}.")

    if req.doi:
        parts.append(f"{_doi_url(req.doi)}.")

    return " ".join(parts)


def format_ieee_website(req: CitationRequest) -> str:
    """
    IEEE website:
      [1] A. Smith, "Title," Publisher, Day Mon. Year. [Online]. Available: URL.
    [1] is a placeholder — the caller renumbers when compiling a reference list.
    If no author, the title leads directly after the reference number.
    """
    authors = _authors_ieee(req.authors)
    d = _parse_date(req.date)

    date_str = None
    if d["year"]:
        if d["month"] and d["day"]:
            # _MONTH_ABBREV values already include a trailing period (e.g. "Mar.")
            date_str = f"{d['day']} {_MONTH_ABBREV[d['month']]} {d['year']}"
        elif d["month"]:
            date_str = f"{_MONTH_ABBREV[d['month']]} {d['year']}"
        else:
            date_str = str(d["year"])

    # Build the lead: [1] Author(s), "Title,"
    lead = "[1]"
    if authors:
        lead += f" {authors},"
    lead += f' "{req.title},"'

    parts = [lead]

    if req.publisher:
        parts.append(f"{req.publisher},")

    if date_str:
        parts.append(f"{date_str}.")

    if req.url:
        parts.append(f"[Online]. Available: {req.url}.")

    return " ".join(parts)


def format_ieee_journal(req: CitationRequest) -> str:
    """
    IEEE journal article:
      [1] A. Smith and B. Jones, "Title," Journal Name, vol. X, no. Y, pp. Z, Year.
    """
    authors = _authors_ieee(req.authors)
    d = _parse_date(req.date)

    lead = "[1]"
    if authors:
        lead += f" {authors},"
    lead += f' "{req.title},"'

    parts = [lead]

    if req.journal_name:
        parts.append(f"{req.journal_name},")

    if req.volume:
        parts.append(f"vol. {req.volume},")

    if req.issue:
        parts.append(f"no. {req.issue},")

    if req.pages:
        parts.append(f"pp. {req.pages},")

    if d["year"]:
        year_part = str(d["year"])
        if req.doi:
            year_part += f". doi: {req.doi}."
        else:
            year_part += "."
        parts.append(year_part)
    elif req.doi:
        parts.append(f"doi: {req.doi}.")

    return " ".join(parts)


def format_harvard_website(req: CitationRequest) -> str:
    """
    Harvard (Cite Them Right) website:
      Last, F. (Year) 'Title', Publisher, Day Month. Available at: URL.
    Year is in the author-date block; day and month appear after the publisher.
    """
    authors = _authors_harvard(req.authors)
    d = _parse_date(req.date)
    year_str = f"({d['year']})" if d["year"] else "(n.d.)"

    # Day Month only — year is already in the author-date block
    body_date = None
    if d["month"] and d["day"]:
        body_date = f"{d['day']} {_MONTH_FULL[d['month']]}"
    elif d["month"]:
        body_date = _MONTH_FULL[d["month"]]

    if authors:
        lead = f"{authors} {year_str}"
    else:
        lead = year_str

    parts = [lead, f"'{req.title}',"]

    location = []
    if req.publisher:
        location.append(req.publisher)
    if body_date:
        location.append(body_date)

    if location:
        parts.append(", ".join(location) + ".")

    if req.url:
        parts.append(f"Available at: {req.url}.")

    return " ".join(parts)


def format_harvard_journal(req: CitationRequest) -> str:
    """
    Harvard (Cite Them Right) journal article:
      Last, F. and Last, F. (Year) 'Title', Journal Name, Volume(Issue), pp. Pages.
    Volume and issue are combined without 'vol.'/'no.' prefixes (Harvard convention).
    """
    authors = _authors_harvard(req.authors)
    d = _parse_date(req.date)
    year_str = f"({d['year']})" if d["year"] else "(n.d.)"

    if authors:
        lead = f"{authors} {year_str}"
    else:
        lead = year_str

    parts = [lead, f"'{req.title}',"]

    journal_parts = []
    if req.journal_name:
        journal_parts.append(req.journal_name)

    if req.volume and req.issue:
        journal_parts.append(f"{req.volume}({req.issue})")
    elif req.volume:
        journal_parts.append(req.volume)

    if req.pages:
        journal_parts.append(f"pp. {req.pages}")

    if journal_parts:
        parts.append(", ".join(journal_parts) + ".")

    if req.doi:
        parts.append(f"doi: {_doi_url(req.doi)}.")

    return " ".join(parts)


# Dispatch table — maps (format, source_type) to the correct formatter
_FORMATTERS = {
    ("APA", "website"): format_apa_website,
    ("APA", "journal_article"): format_apa_journal,
    ("MLA", "website"): format_mla_website,
    ("MLA", "journal_article"): format_mla_journal,
    ("Chicago", "website"): format_chicago_website,
    ("Chicago", "journal_article"): format_chicago_journal,
    ("IEEE", "website"): format_ieee_website,
    ("IEEE", "journal_article"): format_ieee_journal,
    ("Harvard", "website"): format_harvard_website,
    ("Harvard", "journal_article"): format_harvard_journal,
}


def format_citation(req: CitationRequest) -> str:
    """Route a citation request to the appropriate formatter."""
    formatter = _FORMATTERS[(req.format, req.source_type)]
    return formatter(req)
