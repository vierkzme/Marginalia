from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from .routers.nlp_router import router as nlp_router

app = FastAPI(
    title="CRIV NLP Microservice",
    description="Sentence Boundary Detection, POS Tagging, and Lemmatization Service",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(nlp_router)

@app.get("/nlp/v1/health")
def health_check():
    return {
        "status": "healthy",
        "service": "nlp-microservice",
        "spacy_model": os.getenv("SPACY_MODEL", "en_core_web_sm"),
    }
