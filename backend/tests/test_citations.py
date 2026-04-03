"""
Integration tests for the POST /citations/generate endpoint.
Uses FastAPI's TestClient — no real server needed.
"""


class TestGenerateEndpoint:
    def test_apa_website(self, client):
        response = client.post("/citations/generate", json={
            "source_type": "website",
            "format": "APA",
            "title": "How the Internet Works",
            "authors": ["Jane Smith"],
            "date": "2024-03-15",
            "publisher": "Example",
            "url": "https://example.com",
        })
        assert response.status_code == 200
        body = response.json()
        assert "citation" in body
        assert body["format"] == "APA"
        assert body["source_type"] == "website"
        assert "Smith, J." in body["citation"]

    def test_mla_journal(self, client):
        response = client.post("/citations/generate", json={
            "source_type": "journal_article",
            "format": "MLA",
            "title": "Attention Is All You Need",
            "authors": ["Ashish Vaswani", "Noam Shazeer"],
            "date": "2017",
            "journal_name": "NeurIPS",
            "volume": "30",
            "issue": "1",
            "pages": "5998-6008",
        })
        assert response.status_code == 200
        body = response.json()
        assert "Vaswani, Ashish" in body["citation"]
        assert "vol. 30" in body["citation"]

    def test_chicago_website(self, client):
        response = client.post("/citations/generate", json={
            "source_type": "website",
            "format": "Chicago",
            "title": "Test Article",
            "authors": ["Bob Jones"],
            "date": "2023-06-01",
            "url": "https://test.com",
        })
        assert response.status_code == 200
        assert "Jones, Bob" in response.json()["citation"]

    def test_missing_title_returns_422(self, client):
        response = client.post("/citations/generate", json={
            "source_type": "website",
            "format": "APA",
        })
        assert response.status_code == 422

    def test_invalid_format_returns_422(self, client):
        response = client.post("/citations/generate", json={
            "source_type": "website",
            "format": "Turabian",
            "title": "Test",
        })
        assert response.status_code == 422

    def test_invalid_source_type_returns_422(self, client):
        response = client.post("/citations/generate", json={
            "source_type": "book",
            "format": "APA",
            "title": "Test",
        })
        assert response.status_code == 422

    def test_null_optional_fields_accepted(self, client):
        """The backend should handle a minimal request with only required fields."""
        response = client.post("/citations/generate", json={
            "source_type": "website",
            "format": "APA",
            "title": "Minimal Page",
        })
        assert response.status_code == 200
        assert "Minimal Page" in response.json()["citation"]

    def test_html_in_title_is_stripped(self, client):
        """Bleach should strip HTML tags from title before formatting."""
        response = client.post("/citations/generate", json={
            "source_type": "website",
            "format": "APA",
            "title": "Clean <script>alert('xss')</script> Title",
        })
        assert response.status_code == 200
        citation = response.json()["citation"]
        assert "<script>" not in citation
        assert "Clean" in citation
        assert "Title" in citation

    def test_html_in_author_is_stripped(self, client):
        response = client.post("/citations/generate", json={
            "source_type": "website",
            "format": "APA",
            "title": "Test",
            "authors": ["<b>Jane</b> Smith"],
        })
        assert response.status_code == 200
        citation = response.json()["citation"]
        assert "<b>" not in citation
        assert "Smith" in citation

    def test_no_authors_uses_citation_convention(self, client):
        """When authors is null, title should lead the citation (APA convention)."""
        response = client.post("/citations/generate", json={
            "source_type": "website",
            "format": "APA",
            "title": "Some Page",
            "date": "2024",
        })
        assert response.status_code == 200
        citation = response.json()["citation"]
        assert citation.startswith("Some Page.")

    def test_health_endpoint(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
