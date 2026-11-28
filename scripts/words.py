"""Word timestamps for an episode: Whisper timings mapped onto the script's own words.

    python -I words.py SERIES/EPISODE

Captions then show the script's spelling ("seatbelt", "kids") rather than Whisper's
guesses, and any word Whisper missed is interpolated between its neighbours.
"""
import difflib
import json
import re
import sys
import wave
from pathlib import Path

import numpy as np
from faster_whisper import WhisperModel

ep = Path(__file__).resolve().parent / sys.argv[1]
script = (ep / "script.txt").read_text()
kept = []                                         # drop [pause]/[act]/[shot] lines and "NAME:" speaker labels
for ln in script.splitlines():
    ln = ln.strip()
    if not ln or ln.startswith("["):
        continue
    kept.append(re.sub(r"^[A-Z][A-Z ]{1,20}:\s+", "", ln))
script = re.sub(r"\{([^|{}]+)\|[^}]+\}", r"\1", " ".join(kept))
ref = script.split()


def norm(s):
    return re.sub(r"[^a-z0-9']", "", s.lower().replace("-", ""))


with wave.open(str(ep / "voice.wav")) as w:
    sr = w.getframerate()
    raw = w.readframes(w.getnframes())
    width = w.getsampwidth()
a = np.frombuffer(raw, dtype=np.int16 if width == 2 else np.int32).astype(np.float32)
a /= 32768 if width == 2 else 2 ** 31
a = a[np.round(np.arange(0, len(a), sr / 16000)).astype(int).clip(0, len(a) - 1)]

m = WhisperModel("small.en", device="cpu", compute_type="int8")
segs, _ = m.transcribe(a, word_timestamps=True, beam_size=5)
heard = [(x.word.strip(), x.start, x.end) for s in segs for x in s.words]

R = [norm(x) for x in ref]
Hn = [norm(x[0]) for x in heard]
times = [None] * len(ref)
for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, R, Hn, autojunk=False).get_opcodes():
    if op == "equal" or (op == "replace" and i2 - i1 == j2 - j1):
        for k in range(i2 - i1):
            times[i1 + k] = heard[j1 + k][1:]
    elif op == "replace" and j2 > j1:             # e.g. "seatbelt" heard as "seat belt"
        s0, e0 = heard[j1][1], heard[j2 - 1][2]
        n = i2 - i1
        for k in range(n):
            times[i1 + k] = (s0 + (e0 - s0) * k / n, s0 + (e0 - s0) * (k + 1) / n)

missing = [ref[i] for i, t in enumerate(times) if t is None]
for i, t in enumerate(times):                     # interpolate anything still missing
    if t is None:
        prev = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), 0.0)
        nxt = next((times[j][0] for j in range(i + 1, len(times)) if times[j]), prev + 0.3)
        times[i] = (prev, max(prev + 0.05, nxt))

out = [{"text": w, "start": round(t[0], 3), "end": round(t[1], 3)} for w, t in zip(ref, times)]
(ep / "words.json").write_text(json.dumps(out, indent=0))
print(f"{len(out)} words, last ends {out[-1]['end']:.2f}s; interpolated: {missing or 'none'}")
