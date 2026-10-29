import pytest
import sys
import os

# Add parent app directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.srt_parser import parse_srt_to_clean_text
from app.services.spacy_engine import (
    normalize_selection_to_lemma,
    extract_sentence_from_paragraph,
    process_document_text,
)

def test_srt_parser_cleans_timestamps_and_html():
    raw_srt = """1
00:01:15,200 --> 00:01:18,400
Despite the <i>tight</i> deadline,

2
00:01:18,500 --> 00:01:21,000
the team decided to <b>bite the bullet</b>.
"""
    clean = parse_srt_to_clean_text(raw_srt)
    assert "00:01:" not in clean
    assert "<i>" not in clean
    assert "<b>" not in clean
    assert "Despite the tight deadline, the team decided to bite the bullet." == clean

def test_normalize_single_word_lemma():
    res = normalize_selection_to_lemma("ubiquitous")
    assert res["lemma"] == "ubiquitous"
    assert res["partOfSpeech"] in ("ADJ", "NOUN")

def test_normalize_phrasal_verb():
    res = normalize_selection_to_lemma("ran into")
    assert "run" in res["lemma"]
    assert "into" in res["lemma"]
    assert res["partOfSpeech"] == "PHRASAL_VERB"

def test_normalize_multiword_idiom():
    res = normalize_selection_to_lemma("biting the bullet")
    assert "bite" in res["lemma"]
    assert "bullet" in res["lemma"]
    assert res["partOfSpeech"] == "IDIOM"

def test_extract_sentence_from_paragraph():
    paragraph = (
        "Dr. Smith visited the lab. Despite the deadline, they decided to bite the bullet and deploy. "
        "It was successful."
    )
    sel_start = paragraph.find("bite the bullet")
    sel_end = sel_start + len("bite the bullet")

    res = extract_sentence_from_paragraph(paragraph, sel_start, sel_end)
    assert res["sentenceText"] == "Despite the deadline, they decided to bite the bullet and deploy."
    assert res["surfaceForm"] == "bite the bullet"
    assert res["startOffsetInSentence"] >= 0

def test_process_document_text():
    text = "Despite the deadline, they decided to bite the bullet. Earlier, they ran into a bug."
    doc_res = process_document_text(text)

    assert doc_res["totalWordCount"] > 0
    assert len(doc_res["sentences"]) >= 2
    assert any("bullet" in lem for lem in doc_res["uniqueContentLemmas"])
