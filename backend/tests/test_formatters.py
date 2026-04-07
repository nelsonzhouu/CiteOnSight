"""
Unit tests for citation formatting logic.
These test the formatters directly — no HTTP involved.
"""

import pytest
from app.models.citation import CitationRequest
from app.services.formatters import (
    _parse_date,
    _parse_name,
    _to_initials,
    _authors_apa,
    _authors_mla,
    _authors_mla_website,
    _authors_chicago,
    _authors_chicago_website,
    _authors_ieee,
    _authors_harvard,
    _clean_journal_title,
    format_apa_website,
    format_apa_journal,
    format_mla_website,
    format_mla_journal,
    format_chicago_website,
    format_chicago_journal,
    format_ieee_website,
    format_ieee_journal,
    format_harvard_website,
    format_harvard_journal,
    format_citation,
)


# Helper: build a CitationRequest without repeating boilerplate
def make_request(**kwargs) -> CitationRequest:
    defaults = {"source_type": "website", "format": "APA", "title": "Test Title"}
    return CitationRequest(**{**defaults, **kwargs})


class TestParseDatel:
    def test_iso_full(self):
        d = _parse_date("2024-03-15")
        assert d == {"year": 2024, "month": 3, "day": 15}

    def test_iso_year_month(self):
        d = _parse_date("2024-03")
        assert d == {"year": 2024, "month": 3, "day": None}

    def test_year_only(self):
        d = _parse_date("2017")
        assert d == {"year": 2017, "month": None, "day": None}

    def test_slash_format(self):
        d = _parse_date("2024/03/15")
        assert d == {"year": 2024, "month": 3, "day": 15}

    def test_none_input(self):
        d = _parse_date(None)
        assert d == {"year": None, "month": None, "day": None}

    def test_year_embedded_in_string(self):
        # Should extract year even from an irregular string
        d = _parse_date("Published 2022")
        assert d["year"] == 2022

    def test_no_recognizable_date(self):
        d = _parse_date("no date here")
        assert d == {"year": None, "month": None, "day": None}


class TestParseName:
    def test_first_last(self):
        assert _parse_name("Jane Smith") == ("Smith", "Jane")

    def test_first_middle_last(self):
        assert _parse_name("Jane Marie Smith") == ("Smith", "Jane Marie")

    def test_single_name(self):
        assert _parse_name("Smith") == ("Smith", "")

    def test_whitespace_trimmed(self):
        assert _parse_name("  Jane Smith  ") == ("Smith", "Jane")

    def test_last_comma_first_initial(self):
        # "Last, F." format used by Highwire Press / citation_author tags
        assert _parse_name("Maurer, P. C.") == ("Maurer", "P. C.")

    def test_last_comma_first_full(self):
        assert _parse_name("Smith, Jane") == ("Smith", "Jane")

    def test_last_comma_first_multiple_initials(self):
        assert _parse_name("Jones, A. B. C.") == ("Jones", "A. B. C.")


class TestToInitials:
    def test_single_first_name(self):
        assert _to_initials("Jane") == "J."

    def test_first_and_middle(self):
        assert _to_initials("Jane Marie") == "J. M."


class TestAuthorsApa:
    def test_none_returns_none(self):
        assert _authors_apa(None) is None

    def test_empty_list_returns_none(self):
        assert _authors_apa([]) is None

    def test_single_author(self):
        assert _authors_apa(["Jane Smith"]) == "Smith, J."

    def test_single_author_middle_name(self):
        assert _authors_apa(["Jane Marie Smith"]) == "Smith, J. M."

    def test_two_authors(self):
        result = _authors_apa(["Jane Smith", "Bob Jones"])
        assert result == "Smith, J., & Jones, B."

    def test_three_authors(self):
        result = _authors_apa(["Jane Smith", "Bob Jones", "Carol Williams"])
        assert result == "Smith, J., Jones, B., & Williams, C."

    def test_twenty_authors_listed_fully(self):
        authors = [f"Author{i} Last{i}" for i in range(20)]
        result = _authors_apa(authors)
        assert "& Last19" in result
        assert "..." not in result

    def test_twentyone_or_more_truncates(self):
        # APA 7: first 19, "...", last — no ampersand
        authors = [f"Author{i} Last{i}" for i in range(21)]
        result = _authors_apa(authors)
        assert "..." in result
        assert "Last20" in result   # last author shown
        assert "& " not in result   # no ampersand before last
        # Exactly 19 listed before the ellipsis
        assert "Last18," in result
        assert "Last19," not in result  # 20th skipped


class TestAuthorsMla:
    def test_single_author(self):
        assert _authors_mla(["Jane Smith"]) == "Smith, Jane"

    def test_two_authors(self):
        result = _authors_mla(["Jane Smith", "Bob Jones"])
        assert result == "Smith, Jane, and Bob Jones"

    def test_three_or_more_uses_et_al(self):
        result = _authors_mla(["Jane Smith", "Bob Jones", "Carol Williams"])
        assert result == "Smith, Jane, et al."

    def test_none_returns_none(self):
        assert _authors_mla(None) is None


class TestAuthorsMlaWebsite:
    def test_single_author(self):
        assert _authors_mla_website(["Jane Smith"]) == "Smith, Jane"

    def test_two_authors(self):
        result = _authors_mla_website(["Jane Smith", "Bob Jones"])
        assert result == "Smith, Jane, and Bob Jones"

    def test_three_authors_all_listed(self):
        # Website: no et al. threshold — list all
        result = _authors_mla_website(["Jane Smith", "Bob Jones", "Carol Williams"])
        assert result == "Smith, Jane, Bob Jones, and Carol Williams"

    def test_none_returns_none(self):
        assert _authors_mla_website(None) is None


class TestAuthorsChicago:
    def test_single_author(self):
        assert _authors_chicago(["Jane Smith"]) == "Smith, Jane"

    def test_two_authors(self):
        result = _authors_chicago(["Jane Smith", "Bob Jones"])
        assert result == "Smith, Jane, and Bob Jones"

    def test_three_authors(self):
        result = _authors_chicago(["Jane Smith", "Bob Jones", "Carol Williams"])
        assert result == "Smith, Jane, Bob Jones, and Carol Williams"

    def test_four_authors_listed_fully(self):
        # Threshold is 11+, so 4 authors should all be listed
        result = _authors_chicago(["A Smith", "B Jones", "C Williams", "D Brown"])
        assert result == "Smith, A, B Jones, C Williams, and D Brown"

    def test_ten_authors_listed_fully(self):
        authors = [f"Author{i} Last{i}" for i in range(10)]
        result = _authors_chicago(authors)
        assert "et al." not in result
        assert "Last9" in result

    def test_eleven_or_more_shows_seven(self):
        authors = [f"Author{i} Last{i}" for i in range(11)]
        result = _authors_chicago(authors)
        assert "et al." in result
        # First author + 6 more = 7 total shown
        assert "Last6" in result
        assert "Last7" not in result

    def test_none_returns_none(self):
        assert _authors_chicago(None) is None


class TestAuthorsChicagoWebsite:
    def test_single_author(self):
        assert _authors_chicago_website(["Jane Smith"]) == "Smith, Jane"

    def test_ten_authors_listed_fully(self):
        authors = [f"Author{i} Last{i}" for i in range(10)]
        result = _authors_chicago_website(authors)
        assert "et al." not in result
        assert "Last9" in result

    def test_eleven_or_more_shows_ten(self):
        authors = [f"Author{i} Last{i}" for i in range(11)]
        result = _authors_chicago_website(authors)
        assert "et al." in result
        # First author + 9 more = 10 total shown
        assert "Last9" in result
        assert "Last10" not in result

    def test_none_returns_none(self):
        assert _authors_chicago_website(None) is None


class TestCleanJournalTitle:
    def test_strips_exact_journal_suffix(self):
        result = _clean_journal_title("Thermometry in a Cell - Nature", "Nature")
        assert result == "Thermometry in a Cell"

    def test_strips_generic_dash_suffix(self):
        result = _clean_journal_title("Some Study - PLOS ONE", None)
        assert result == "Some Study"

    def test_no_suffix_unchanged(self):
        result = _clean_journal_title("Attention Is All You Need", "NeurIPS")
        assert result == "Attention Is All You Need"

    def test_empty_title_unchanged(self):
        # Should not crash on edge cases
        result = _clean_journal_title("", "Nature")
        assert result == ""


class TestApaWebsite:
    def test_complete(self):
        req = make_request(
            format="APA",
            source_type="website",
            authors=["Jane Smith"],
            date="2024-03-15",
            publisher="Example Site",
            url="https://example.com",
        )
        result = format_apa_website(req)
        assert result == (
            "Smith, J. (2024, March 15). Test Title. Example Site. https://example.com"
        )

    def test_no_author(self):
        req = make_request(
            format="APA",
            source_type="website",
            date="2024-03-15",
            publisher="Example Site",
            url="https://example.com",
        )
        result = format_apa_website(req)
        # Title leads when no author
        assert result.startswith("Test Title.")
        assert "(2024, March 15)" in result

    def test_no_date(self):
        req = make_request(
            format="APA",
            source_type="website",
            authors=["Jane Smith"],
        )
        result = format_apa_website(req)
        assert "(n.d.)" in result

    def test_year_only_date(self):
        req = make_request(
            format="APA",
            source_type="website",
            authors=["Jane Smith"],
            date="2024",
        )
        result = format_apa_website(req)
        assert "(2024)" in result

    def test_no_url_no_publisher(self):
        req = make_request(format="APA", source_type="website", authors=["Jane Smith"], date="2024")
        result = format_apa_website(req)
        # Should not crash; just omits missing parts
        assert "Smith, J." in result

    def test_url_has_no_trailing_period(self):
        req = make_request(
            format="APA",
            source_type="website",
            url="https://example.com",
        )
        result = format_apa_website(req)
        assert result.endswith("https://example.com")


class TestApaJournal:
    def test_complete(self):
        req = make_request(
            format="APA",
            source_type="journal_article",
            authors=["Ashish Vaswani", "Noam Shazeer"],
            date="2017",
            title="Attention Is All You Need",
            journal_name="NeurIPS",
            volume="30",
            issue="1",
            pages="5998-6008",
            doi="10.48550/arXiv.1706.03762",
        )
        result = format_apa_journal(req)
        assert "Vaswani, A., & Shazeer, N." in result
        assert "(2017)" in result
        assert "NeurIPS" in result
        assert "30(1)" in result
        assert "5998-6008" in result
        assert "https://doi.org/10.48550/arXiv.1706.03762" in result

    def test_no_issue(self):
        req = make_request(
            format="APA",
            source_type="journal_article",
            authors=["Jane Smith"],
            date="2020",
            journal_name="Science",
            volume="368",
        )
        result = format_apa_journal(req)
        # Volume without parentheses when no issue
        assert "368" in result
        assert "368(" not in result

    def test_no_author(self):
        req = make_request(
            format="APA",
            source_type="journal_article",
            date="2020",
            journal_name="Nature",
        )
        result = format_apa_journal(req)
        assert result.startswith("Test Title.")

    def test_doi_already_a_url(self):
        req = make_request(
            format="APA",
            source_type="journal_article",
            doi="https://doi.org/10.1234/test",
        )
        result = format_apa_journal(req)
        # Should not double-prepend the domain
        assert "https://doi.org/https://" not in result
        assert "https://doi.org/10.1234/test" in result

    def test_title_suffix_stripped(self):
        req = make_request(
            format="APA",
            source_type="journal_article",
            title="Thermometry in a Cell - Nature",
            journal_name="Nature",
        )
        result = format_apa_journal(req)
        assert "Thermometry in a Cell - Nature" not in result
        assert "Thermometry in a Cell." in result


class TestMlaWebsite:
    def test_complete(self):
        req = make_request(
            format="MLA",
            source_type="website",
            authors=["Jane Smith"],
            date="2024-03-15",
            publisher="Example Site",
            url="https://example.com",
        )
        result = format_mla_website(req)
        assert 'Smith, Jane.' in result
        assert '"Test Title."' in result
        assert "15 Mar. 2024" in result
        assert "Example Site" in result

    def test_no_author(self):
        req = make_request(format="MLA", source_type="website", date="2024-03-15")
        result = format_mla_website(req)
        assert result.startswith('"Test Title."')

    def test_two_authors(self):
        req = make_request(
            format="MLA",
            source_type="website",
            authors=["Jane Smith", "Bob Jones"],
        )
        result = format_mla_website(req)
        assert "Smith, Jane, and Bob Jones" in result


class TestMlaJournal:
    def test_complete(self):
        req = make_request(
            format="MLA",
            source_type="journal_article",
            authors=["Ashish Vaswani", "Noam Shazeer"],
            date="2017",
            title="Attention Is All You Need",
            journal_name="NeurIPS",
            volume="30",
            issue="1",
            pages="5998-6008",
        )
        result = format_mla_journal(req)
        assert "Vaswani, Ashish, and Noam Shazeer" in result
        assert '"Attention Is All You Need."' in result
        assert "vol. 30" in result
        assert "no. 1" in result
        assert "pp. 5998-6008" in result
        assert "2017" in result

    def test_no_author(self):
        req = make_request(format="MLA", source_type="journal_article")
        result = format_mla_journal(req)
        assert result.startswith('"Test Title."')

    def test_et_al_no_double_period(self):
        req = make_request(
            format="MLA",
            source_type="journal_article",
            authors=["Jane Smith", "Bob Jones", "Carol Williams"],
        )
        result = format_mla_journal(req)
        assert "et al.." not in result
        assert "et al." in result


class TestChicagoWebsite:
    def test_complete(self):
        req = make_request(
            format="Chicago",
            source_type="website",
            authors=["Jane Smith"],
            date="2024-03-15",
            publisher="Example Site",
            url="https://example.com",
        )
        result = format_chicago_website(req)
        assert "Smith, Jane." in result
        assert '"Test Title."' in result
        assert "Example Site." in result
        assert "March 15, 2024." in result
        assert "https://example.com." in result

    def test_no_author(self):
        req = make_request(format="Chicago", source_type="website")
        result = format_chicago_website(req)
        assert result.startswith('"Test Title."')

    def test_access_date_appended_to_url(self):
        req = make_request(
            format="Chicago",
            source_type="website",
            url="https://example.com",
            access_date="2026-04-03",
        )
        result = format_chicago_website(req)
        assert "https://example.com (accessed April 3, 2026)." in result

    def test_no_access_date_leaves_url_plain(self):
        req = make_request(
            format="Chicago",
            source_type="website",
            url="https://example.com",
        )
        result = format_chicago_website(req)
        assert "accessed" not in result
        assert "https://example.com." in result

    def test_three_authors(self):
        req = make_request(
            format="Chicago",
            source_type="website",
            authors=["Jane Smith", "Bob Jones", "Carol Williams"],
        )
        result = format_chicago_website(req)
        assert "Smith, Jane, Bob Jones, and Carol Williams" in result

    def test_eleven_website_authors_shows_ten_et_al(self):
        # Website uses _authors_chicago_website (11+ threshold, shows 10)
        authors = [f"Author{i} Last{i}" for i in range(11)]
        req = make_request(format="Chicago", source_type="website", authors=authors)
        result = format_chicago_website(req)
        assert "et al." in result
        assert "Last9" in result
        assert "Last10" not in result

    def test_et_al_no_double_period(self):
        authors = [f"Author{i} Last{i}" for i in range(11)]
        req = make_request(format="Chicago", source_type="website", authors=authors)
        result = format_chicago_website(req)
        assert "et al.." not in result


class TestChicagoJournal:
    def test_complete(self):
        req = make_request(
            format="Chicago",
            source_type="journal_article",
            authors=["Ashish Vaswani", "Noam Shazeer"],
            date="2017",
            title="Attention Is All You Need",
            journal_name="NeurIPS",
            volume="30",
            issue="1",
            pages="5998-6008",
            doi="10.48550/arXiv.1706.03762",
        )
        result = format_chicago_journal(req)
        assert "Vaswani, Ashish, and Noam Shazeer" in result
        assert '"Attention Is All You Need."' in result
        assert "NeurIPS 30, no. 1 (2017): 5998-6008" in result
        assert "https://doi.org/10.48550/arXiv.1706.03762" in result

    def test_no_author(self):
        req = make_request(format="Chicago", source_type="journal_article")
        result = format_chicago_journal(req)
        assert result.startswith('"Test Title."')

    def test_et_al_no_double_period(self):
        authors = [f"Author{i} Last{i}" for i in range(11)]
        req = make_request(format="Chicago", source_type="journal_article", authors=authors)
        result = format_chicago_journal(req)
        assert "et al.." not in result

    def test_last_comma_first_format_parsed_correctly(self):
        # "Last, F." format from citation_author tags must not reverse initials
        req = make_request(
            format="Chicago",
            source_type="journal_article",
            authors=["Maurer, P. C.", "Smith, J."],
        )
        result = format_chicago_journal(req)
        assert "Maurer, P. C." in result
        assert "C., P." not in result


class TestAuthorsIeee:
    def test_single_author(self):
        assert _authors_ieee(["Jane Smith"]) == "J. Smith"

    def test_single_author_middle_name(self):
        assert _authors_ieee(["Jane Marie Smith"]) == "J. M. Smith"

    def test_two_authors(self):
        assert _authors_ieee(["Jane Smith", "Bob Jones"]) == "J. Smith and B. Jones"

    def test_three_authors(self):
        result = _authors_ieee(["Jane Smith", "Bob Jones", "Carol Williams"])
        assert result == "J. Smith, B. Jones, and C. Williams"

    def test_seven_or_more_uses_et_al(self):
        authors = [f"Author{i} Last{i}" for i in range(7)]
        result = _authors_ieee(authors)
        assert result == "A. Last0 et al."

    def test_none_returns_none(self):
        assert _authors_ieee(None) is None


class TestAuthorsHarvard:
    def test_single_author(self):
        assert _authors_harvard(["Jane Smith"]) == "Smith, J."

    def test_two_authors(self):
        assert _authors_harvard(["Jane Smith", "Bob Jones"]) == "Smith, J. and Jones, B."

    def test_three_authors(self):
        result = _authors_harvard(["Jane Smith", "Bob Jones", "Carol Williams"])
        assert result == "Smith, J., Jones, B. and Williams, C."

    def test_four_or_more_uses_et_al(self):
        result = _authors_harvard(["Jane Smith", "Bob Jones", "Carol Williams", "Dan Brown"])
        assert result == "Smith, J. et al."

    def test_none_returns_none(self):
        assert _authors_harvard(None) is None


class TestIeeeWebsite:
    def test_complete(self):
        req = make_request(
            format="IEEE",
            source_type="website",
            authors=["Jane Smith"],
            date="2024-03-15",
            publisher="Example Site",
            url="https://example.com",
        )
        result = format_ieee_website(req)
        assert result.startswith("[1]")
        assert "J. Smith," in result
        assert '"Test Title,"' in result
        assert "Example Site," in result
        assert "15 Mar. 2024" in result
        assert "[Online]. Available: https://example.com." in result

    def test_no_author(self):
        req = make_request(format="IEEE", source_type="website")
        result = format_ieee_website(req)
        assert result.startswith('[1] "Test Title,"')

    def test_year_only_date(self):
        req = make_request(format="IEEE", source_type="website", date="2024")
        result = format_ieee_website(req)
        assert "2024." in result

    def test_no_url(self):
        req = make_request(
            format="IEEE", source_type="website",
            authors=["Jane Smith"], publisher="Example"
        )
        result = format_ieee_website(req)
        assert "[Online]" not in result

    def test_two_authors(self):
        req = make_request(
            format="IEEE",
            source_type="website",
            authors=["Jane Smith", "Bob Jones"],
        )
        result = format_ieee_website(req)
        assert "J. Smith and B. Jones," in result


class TestIeeeJournal:
    def test_complete(self):
        req = make_request(
            format="IEEE",
            source_type="journal_article",
            authors=["Ashish Vaswani", "Noam Shazeer"],
            date="2017",
            title="Attention Is All You Need",
            journal_name="NeurIPS",
            volume="30",
            issue="1",
            pages="5998-6008",
        )
        result = format_ieee_journal(req)
        assert result.startswith("[1]")
        assert "A. Vaswani and N. Shazeer," in result
        assert '"Attention Is All You Need,"' in result
        assert "vol. 30," in result
        assert "no. 1," in result
        assert "pp. 5998-6008," in result
        assert "2017." in result

    def test_with_doi(self):
        req = make_request(
            format="IEEE",
            source_type="journal_article",
            date="2020",
            doi="10.1234/test",
        )
        result = format_ieee_journal(req)
        assert "doi: 10.1234/test." in result

    def test_no_author(self):
        req = make_request(format="IEEE", source_type="journal_article", date="2020")
        result = format_ieee_journal(req)
        assert result.startswith('[1] "Test Title,"')


class TestHarvardWebsite:
    def test_complete(self):
        req = make_request(
            format="Harvard",
            source_type="website",
            authors=["Jane Smith"],
            date="2024-03-15",
            publisher="Example Site",
            url="https://example.com",
        )
        result = format_harvard_website(req)
        assert "Smith, J. (2024)" in result
        assert "'Test Title'," in result
        assert "Example Site" in result
        assert "15 March" in result
        assert "Available at: https://example.com." in result

    def test_no_author(self):
        req = make_request(format="Harvard", source_type="website", date="2024")
        result = format_harvard_website(req)
        assert result.startswith("(2024)")

    def test_no_date(self):
        req = make_request(format="Harvard", source_type="website", authors=["Jane Smith"])
        result = format_harvard_website(req)
        assert "(n.d.)" in result

    def test_year_only_omits_body_date(self):
        req = make_request(
            format="Harvard",
            source_type="website",
            authors=["Jane Smith"],
            date="2024",
            publisher="Example",
        )
        result = format_harvard_website(req)
        # Year-only date should not produce a spurious "None" or month in the body
        assert "None" not in result
        assert "January" not in result

    def test_comma_after_year(self):
        req = make_request(
            format="Harvard",
            source_type="website",
            authors=["Jane Smith"],
            date="2024",
        )
        result = format_harvard_website(req)
        assert "Smith, J. (2024), " in result

    def test_access_date_day_before_month(self):
        req = make_request(
            format="Harvard",
            source_type="website",
            url="https://example.com",
            access_date="2026-04-03",
        )
        result = format_harvard_website(req)
        assert "(Accessed: 3 April 2026)" in result

    def test_no_access_date_omits_accessed(self):
        req = make_request(
            format="Harvard",
            source_type="website",
            url="https://example.com",
        )
        result = format_harvard_website(req)
        assert "Accessed" not in result


class TestHarvardJournal:
    def test_complete(self):
        req = make_request(
            format="Harvard",
            source_type="journal_article",
            authors=["Ashish Vaswani", "Noam Shazeer"],
            date="2017",
            title="Attention Is All You Need",
            journal_name="NeurIPS",
            volume="30",
            issue="1",
            pages="5998-6008",
        )
        result = format_harvard_journal(req)
        assert "Vaswani, A. and Shazeer, N. (2017)" in result
        assert "'Attention Is All You Need'," in result
        assert "NeurIPS" in result
        assert "30(1)" in result
        assert "pp. 5998-6008" in result

    def test_comma_after_year(self):
        req = make_request(
            format="Harvard",
            source_type="journal_article",
            authors=["Jane Smith"],
            date="2024",
        )
        result = format_harvard_journal(req)
        assert "Smith, J. (2024), " in result

    def test_no_author(self):
        req = make_request(format="Harvard", source_type="journal_article", date="2020")
        result = format_harvard_journal(req)
        assert result.startswith("(2020)")

    def test_with_doi(self):
        req = make_request(
            format="Harvard",
            source_type="journal_article",
            doi="10.1234/test",
        )
        result = format_harvard_journal(req)
        assert "doi:" in result
        assert "10.1234/test" in result

    def test_volume_without_issue(self):
        req = make_request(
            format="Harvard",
            source_type="journal_article",
            journal_name="Science",
            volume="368",
        )
        result = format_harvard_journal(req)
        assert "368" in result
        assert "368(" not in result


class TestFormatCitationDispatch:
    def test_routes_correctly(self):
        req = make_request(format="MLA", source_type="website", authors=["Jane Smith"])
        result = format_citation(req)
        # Should produce MLA format, not APA
        assert "Smith, Jane" in result
        assert "J." not in result

    def test_ieee_dispatches(self):
        req = make_request(format="IEEE", source_type="journal_article", date="2020")
        result = format_citation(req)
        assert result.startswith("[1]")

    def test_harvard_dispatches(self):
        req = make_request(format="Harvard", source_type="website", date="2020")
        result = format_citation(req)
        assert "(2020)" in result
