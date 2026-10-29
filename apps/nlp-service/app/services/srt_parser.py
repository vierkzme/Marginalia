import re

TIMESTAMP_REGEX = re.compile(
    r"^\d{2}:\d{2}:\d{2}[,\.]\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}[,\.]\d{3}.*$"
)
SEQUENCE_NUMBER_REGEX = re.compile(r"^\d+\s*$")
HTML_TAG_REGEX = re.compile(r"<[^>]+>")

def parse_srt_to_clean_text(srt_content: str) -> str:
    cleaned_lines: list[str] = []
    for raw_line in srt_content.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if SEQUENCE_NUMBER_REGEX.match(line):
            continue
        if TIMESTAMP_REGEX.match(line):
            continue
        line = HTML_TAG_REGEX.sub("", line).strip()
        if line:
            cleaned_lines.append(line)

    merged_text = " ".join(cleaned_lines)
    merged_text = re.sub(r"\s+", " ", merged_text).strip()
    return merged_text
