import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
words = json.loads((ROOT / "sound/vo/words.json").read_text())
MAX_WORDS = 12
chunks = []
current = []

for word in words:
    current.append(word)
    ends_sentence = bool(re.search(r"[.!?]", word["w"]))
    if ends_sentence or len(current) >= MAX_WORDS:
        text = " ".join(w["w"] for w in current)
        chunks.append({
            "text": text,
            "start": round(current[0]["s"], 3),
            "end": round(current[-1]["e"], 3),
        })
        current = []

if current:
    chunks.append({
        "text": " ".join(w["w"] for w in current),
        "start": round(current[0]["s"], 3),
        "end": round(current[-1]["e"], 3),
    })

(ROOT / "src/data/captions.json").write_text(json.dumps(chunks, indent=2) + "\n")
print(json.dumps({"captions": len(chunks), "first": chunks[0]["text"], "last": chunks[-1]["text"]}))
