from typing import List, Optional
from pydantic import BaseModel, Field

class TokenPayload(BaseModel):
    text: str
    lemma: str
    pos: str
    isStop: bool
    startChar: int
    endChar: int

class DetectedPhrasalVerb(BaseModel):
    surfaceForm: str
    lemma: str
    startChar: int
    endChar: int

class SentencePayload(BaseModel):
    paragraphIndex: int
    sentenceIndex: int
    sentenceText: str
    tokens: List[TokenPayload] = Field(default_factory=list)
    detectedPhrasalVerbs: List[DetectedPhrasalVerb] = Field(default_factory=list)

class ProcessDocumentRequest(BaseModel):
    rawText: str

class ProcessDocumentResponse(BaseModel):
    totalWordCount: int
    uniqueContentLemmas: List[str]
    sentences: List[SentencePayload]

class ExtractMiningContextRequest(BaseModel):
    paragraphText: str
    selectedText: str
    selectionStartInParagraph: int
    selectionEndInParagraph: int

class ExtractMiningContextResponse(BaseModel):
    surfaceForm: str
    lemma: str
    partOfSpeech: str
    extractedSentence: str
    startOffsetInSentence: int
    endOffsetInSentence: int
    recommendedCategory: str
