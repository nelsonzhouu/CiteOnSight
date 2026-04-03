from fastapi import APIRouter
from app.models.citation import CitationRequest, CitationResponse
from app.services.formatters import format_citation

router = APIRouter(prefix="/citations", tags=["citations"])


@router.post("/generate", response_model=CitationResponse)
def generate_citation(request: CitationRequest) -> CitationResponse:
    """
    Generate a formatted citation string.
    Accepts metadata extracted from the extension and returns a ready-to-copy citation.
    """
    citation = format_citation(request)
    return CitationResponse(
        citation=citation,
        format=request.format,
        source_type=request.source_type,
    )
