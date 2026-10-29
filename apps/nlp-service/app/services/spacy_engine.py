import spacy
from spacy.tokens import Doc
from typing import Dict, Any, List

try:
    nlp = spacy.load("en_core_web_sm")
except Exception:
    nlp = spacy.blank("en")
    nlp.add_pipe("sentencizer")

def normalize_selection_to_lemma(selected_text: str, sentence_text: str | None = None) -> Dict[str, Any]:
    clean_selection = selected_text.strip()
    doc: Doc = nlp(clean_selection)
    tokens = [t for t in doc if not t.is_space]

    if not tokens:
        return {"lemma": clean_selection.lower(), "partOfSpeech": "UNKNOWN", "recommendedCategory": "Academic"}

    if len(tokens) == 1:
        tok = tokens[0]
        pos = getattr(tok, "pos_", "NOUN") or "NOUN"
        lemma = tok.lemma_.lower() if hasattr(tok, "lemma_") and tok.lemma_ else tok.text.lower()
        return {
            "lemma": lemma,
            "partOfSpeech": pos,
            "recommendedCategory": "Academic" if len(tok.text) >= 8 else "Academic",
        }

    first_pos = getattr(tokens[0], "pos_", "")
    second_pos = getattr(tokens[1], "pos_", "")
    if len(tokens) == 2 and first_pos in ("VERB", "AUX") and second_pos in ("ADP", "PART", "ADV"):
        first_lemma = tokens[0].lemma_.lower() if hasattr(tokens[0], "lemma_") and tokens[0].lemma_ else tokens[0].text.lower()
        lemma_phrase = f"{first_lemma} {tokens[1].text.lower()}"
        return {
            "lemma": lemma_phrase,
            "partOfSpeech": "PHRASAL_VERB",
            "recommendedCategory": "Phrasal Verb",
        }

    normalized_words: List[str] = []
    first_verb_lemmatized = False

    for idx, tok in enumerate(tokens):
        pos = getattr(tok, "pos_", "")
        if not first_verb_lemmatized and idx == 0 and pos in ("VERB", "AUX"):
            first_lemma = tok.lemma_.lower() if hasattr(tok, "lemma_") and tok.lemma_ else tok.text.lower()
            normalized_words.append(first_lemma)
            first_verb_lemmatized = True
        else:
            normalized_words.append(tok.text.lower())

    lemma_idiom = " ".join(normalized_words)
    return {
        "lemma": lemma_idiom,
        "partOfSpeech": "IDIOM",
        "recommendedCategory": "Idiom",
    }

def extract_sentence_from_paragraph(
    paragraph_text: str,
    selection_start: int,
    selection_end: int
) -> Dict[str, Any]:
    doc: Doc = nlp(paragraph_text)

    for sent in doc.sents:
        if sent.start_char <= selection_start and selection_end <= sent.end_char:
            rel_start = selection_start - sent.start_char
            rel_end = selection_end - sent.start_char
            surface_form = sent.text[rel_start:rel_end]
            lemma_info = normalize_selection_to_lemma(surface_form, sent.text)
            return {
                "sentenceText": sent.text.strip(),
                "surfaceForm": surface_form,
                "startOffsetInSentence": rel_start,
                "endOffsetInSentence": rel_end,
                **lemma_info,
            }

    overlapping_sents = [
        sent for sent in doc.sents
        if not (sent.end_char <= selection_start or sent.start_char >= selection_end)
    ]
    if overlapping_sents:
        combined_start = overlapping_sents[0].start_char
        combined_end = overlapping_sents[-1].end_char
        combined_text = paragraph_text[combined_start:combined_end].strip()
        rel_start = max(0, selection_start - combined_start)
        rel_end = min(len(combined_text), selection_end - combined_start)
        surface_form = combined_text[rel_start:rel_end]
        lemma_info = normalize_selection_to_lemma(surface_form, combined_text)
        return {
            "sentenceText": combined_text,
            "surfaceForm": surface_form,
            "startOffsetInSentence": rel_start,
            "endOffsetInSentence": rel_end,
            **lemma_info,
        }

    rel_start = max(0, selection_start)
    rel_end = min(len(paragraph_text), selection_end)
    surface_form = paragraph_text[rel_start:rel_end]
    lemma_info = normalize_selection_to_lemma(surface_form)
    return {
        "sentenceText": paragraph_text.strip(),
        "surfaceForm": surface_form,
        "startOffsetInSentence": rel_start,
        "endOffsetInSentence": rel_end,
        **lemma_info,
    }

def process_document_text(raw_text: str) -> Dict[str, Any]:
    paragraphs = [p.strip() for p in raw_text.splitlines() if p.strip()]
    if not paragraphs:
        paragraphs = [raw_text.strip()] if raw_text.strip() else []

    all_sentences_payload = []
    unique_content_lemmas = set()
    total_words = 0
    sentence_idx = 0

    for p_idx, p_text in enumerate(paragraphs):
        doc: Doc = nlp(p_text)
        for sent in doc.sents:
            sent_text = sent.text.strip()
            if not sent_text:
                continue

            tokens_payload = []
            phrasal_verbs = []

            sent_tokens = [t for t in sent if not t.is_space]
            total_words += len(sent_tokens)

            for i, tok in enumerate(sent_tokens):
                pos = getattr(tok, "pos_", "NOUN") or "NOUN"
                is_stop = getattr(tok, "is_stop", False)
                lemma = tok.lemma_.lower() if hasattr(tok, "lemma_") and tok.lemma_ else tok.text.lower()
                text = tok.text

                tokens_payload.append({
                    "text": text,
                    "lemma": lemma,
                    "pos": pos,
                    "isStop": is_stop,
                    "startChar": tok.idx - sent.start_char,
                    "endChar": (tok.idx + len(tok.text)) - sent.start_char,
                })

                if not is_stop and pos not in ("PUNCT", "SYM", "SPACE", "NUM"):
                    unique_content_lemmas.add(lemma)

                if i + 1 < len(sent_tokens):
                    next_tok = sent_tokens[i + 1]
                    next_pos = getattr(next_tok, "pos_", "")
                    if pos in ("VERB", "AUX") and next_pos in ("ADP", "PART", "ADV"):
                        pv_surface = f"{tok.text} {next_tok.text}"
                        pv_lemma = f"{lemma} {next_tok.text.lower()}"
                        phrasal_verbs.append({
                            "surfaceForm": pv_surface,
                            "lemma": pv_lemma,
                            "startChar": tok.idx - sent.start_char,
                            "endChar": (next_tok.idx + len(next_tok.text)) - sent.start_char,
                        })
                        unique_content_lemmas.add(pv_lemma)

            all_sentences_payload.append({
                "paragraphIndex": p_idx,
                "sentenceIndex": sentence_idx,
                "sentenceText": sent_text,
                "tokens": tokens_payload,
                "detectedPhrasalVerbs": phrasal_verbs,
            })
            sentence_idx += 1

    return {
        "totalWordCount": total_words,
        "uniqueContentLemmas": sorted(list(unique_content_lemmas)),
        "sentences": all_sentences_payload,
    }
