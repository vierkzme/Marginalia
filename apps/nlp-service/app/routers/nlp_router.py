from fastapi import APIRouter, HTTPException
from ..schemas.payload_models import (
    ProcessDocumentRequest,
    ProcessDocumentResponse,
    ExtractMiningContextRequest,
    ExtractMiningContextResponse,
)
from ..services.spacy_engine import (
    process_document_text,
    extract_sentence_from_paragraph,
)

router = APIRouter(prefix="/nlp/v1", tags=["NLP"])

@router.post("/process-document", response_model=ProcessDocumentResponse)
def process_document(payload: ProcessDocumentRequest):
    if not payload.rawText.strip():
        raise HTTPException(status_code=400, detail="Document text cannot be empty.")
    result = process_document_text(payload.rawText)
    return result

@router.post("/extract-mining-context", response_model=ExtractMiningContextResponse)
def extract_mining_context(payload: ExtractMiningContextRequest):
    if not payload.paragraphText.strip() or not payload.selectedText.strip():
        raise HTTPException(status_code=400, detail="Paragraph text and selected text are required.")
    try:
        result = extract_sentence_from_paragraph(
            payload.paragraphText,
            payload.selectionStartInParagraph,
            payload.selectionEndInParagraph,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))
