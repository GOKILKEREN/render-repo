"""Narration and character voices with Qwen3-TTS (free, offline, Apache 2.0).

    python -I voice.py SERIES/EPISODE/script.txt out.wav [--redo 6,9]

Script format:
  - one thought per line; a new line gets a breath
  - NAME: text      a character speaks (no NAME = the narrator)
  - [pause N]       hold N seconds before the next line
  - [act NOTE]      acting note for the next line
  - [shot NAME]     what the animation shows from the next line on (ignored for audio)
  - {written|spoken} changes what is said; captions get the written word.
    Use it for pronunciation AND phrasing: {bridge|bridge...} makes the speaker stop there.

Voices (SERIES/cast.json): every voice is designed from a description (the VoiceDesign model). The user
preferred these over the built-in Ryan/Aiden: Mom's design had the diction and tone they wanted.
A designed voice is re-imagined on every take, so each take's median pitch is measured and kept
close to that speaker's reference pitch (saved in voice_pitch.json next to the episode folders),
which keeps the narrator sounding like one person across lines and episodes.

Every line gets 3 takes (up to 7 if none pass). Whisper scores each take, and a take passes when
every word is heard as written, no word is mumbled (confidence >= 0.6), and narration is not a
drawl or a rush (160-270 words per minute while talking). Among passing takes, the one closest to
the speaker's reference pitch wins, then (for the narrator) the one closest to 210 wpm.
Takes and choices are cached per line, so a re-run only records lines that changed or --redo lines.
Writes out.wav, out.lines.json (start, end, speaker, shot, caption text per line) and out.captions.txt.
Uses about 4 GB of memory: other audio and video on the Mac can stutter while it runs.
"""
import argparse
import gc
import hashlib
import json
import re
import time
from pathlib import Path

import numpy as np
import soundfile as sf
import torch

FIX = re.compile(r"\{([^|{}]+)\|([^|{}]+)\}")
PAUSE = re.compile(r"^\[pause\s+([0-9.]+)\]$")
ACT = re.compile(r"^\[act\s+(.+)\]$")
SHOT = re.compile(r"^\[shot\s+(.+)\]$")
SPEAKER = re.compile(r"^([A-Z][A-Z ]{1,20}):\s+(.+)$")
CAST, NAMES = {}, ""          # filled from SERIES/cast.json by load_cast()


def load_cast(series: Path):
    """SERIES/cast.json: {"voices": {NAME: description}, "names": "proper nouns", "pitch_as": {NAME: NAME}}.
    NARRATOR must be in voices. Every voice is designed from its description by the VoiceDesign model."""
    global CAST, NAMES, PITCH_AS
    f = series / "cast.json"
    if not f.exists():
        raise SystemExit(f"No cast.json in {series}; see references/voice.md")
    cfg = json.loads(f.read_text())
    CAST = {k: ("design", d, "") for k, d in cfg["voices"].items()}
    NAMES = cfg.get("names", "")
    PITCH_AS = cfg.get("pitch_as", {})
    if "NARRATOR" not in CAST:
        raise SystemExit("cast.json needs a NARRATOR voice")


MODELS = {"custom": "Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice", "design": "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign"}
SR = 24000
ONES = ("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen "
        "sixteen seventeen eighteen nineteen").split()
TENS = "_ _ twenty thirty forty fifty sixty seventy eighty ninety".split()
NUMBER_WORDS = set(ONES) | set(TENS[2:]) | {"hundred", "thousand", "million"}
SAME = {"mr": "mister", "mrs": "missus", "dr": "doctor", "ok": "okay", "tv": "tv"}


def say_number(n: int) -> str:
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ("" if n % 10 == 0 else ONES[n % 10])
    if n < 1000:
        return ONES[n // 100] + "hundred" + ("" if n % 100 == 0 else say_number(n % 100))
    if n < 1_000_000:
        return say_number(n // 1000) + "thousand" + ("" if n % 1000 == 0 else say_number(n % 1000))
    return str(n)


def squash(text: str) -> str:
    """Words only, numbers spelled out, spaces removed: 'seat belt' == 'seatbelt', '60' == 'sixty'."""
    t = re.sub(r"(?<=\d)\s*,\s*(?=\d{3})", "", text.lower().replace("%", " percent"))   # "12,000" / "12 ,000"
    t = re.sub(r"\d+", lambda m: " " + say_number(int(m.group())) + " ", t)
    t = " ".join(SAME.get(w, w) for w in re.findall(r"[a-z]+", t))
    return t.replace(" ", "")


def script_lines(text: str) -> list[dict]:
    out, hold, act, shot = [], None, None, None
    for raw in text.splitlines():
        line = raw.strip()
        if not line:
            continue
        if m := PAUSE.match(line):
            hold = float(m.group(1))
        elif m := ACT.match(line):
            act = m.group(1)
        elif m := SHOT.match(line):
            shot = m.group(1).strip()
        else:
            who = "NARRATOR"
            if m := SPEAKER.match(line):
                who, line = m.group(1).strip(), m.group(2).strip()
            if who not in CAST:
                raise SystemExit(f"Unknown speaker {who!r}; add it to cast.json")
            out.append({"text": line, "spoken": FIX.sub(r"\2", line), "shown": FIX.sub(r"\1", line),
                        "hold": hold, "act": act, "speaker": who, "shot": shot})
            hold, act = None, None
    return out


def frames(a, sr):
    h = int(sr * 0.01)
    return np.array([np.sqrt(np.mean(a[i:i + h] ** 2)) for i in range(0, len(a) - h, h)]), h


def tight(a, sr, floor=0.01, keep=0.03):
    e, h = frames(a, sr)
    loud = np.nonzero(e >= floor)[0]
    if not len(loud):
        return a
    return a[max(0, loud[0] * h - int(keep * sr)): (loud[-1] + 1) * h + int(keep * sr)]


def squeeze(a, sr, most, floor=0.01):
    e, h = frames(a, sr)
    keep, cut, run = np.ones(len(a), dtype=bool), int(most * 100), 0
    for i, q in enumerate(list(e < floor) + [False]):
        if q:
            run += 1
            continue
        if run > cut:
            mid = (i - run) * h + cut * h // 2
            keep[mid: mid + (run - cut) * h] = False
        run = 0
    return a[keep]


def to_rate(a, sr, rate):
    if sr == rate:
        return a.astype(np.float32)
    return np.interp(np.arange(0, len(a), sr / rate), np.arange(len(a)), a).astype(np.float32)


def score(whisper, audio, sr, spoken, min_wpm, max_wpm=999) -> dict:
    a16 = to_rate(audio, sr, 16000)
    # made-up names (towns, characters) would otherwise be spelled a new way every time
    segs, _ = whisper.transcribe(a16, word_timestamps=True, beam_size=5, language="en", hotwords=NAMES)
    words = [w for s in segs for w in s.words]
    heard = " ".join(w.word.strip() for w in words)
    e, _ = frames(a16, 16000)
    talking = max(0.1, (e >= 0.01).sum() / 100)
    wpm = len(re.findall(r"[A-Za-z0-9']+", spoken)) / talking * 60
    # Whisper's doubt about the first word or a number is about spelling ("Day 1" / "Day one"), not clarity.
    judged = [w for k, w in enumerate(words) if k > 0 and not re.search(r"\d", w.word)
              and squash(w.word) not in NUMBER_WORDS]
    worst = float(min((w.probability for w in judged), default=1.0))
    weak = [w.word.strip() for w in judged if w.probability < 0.6]
    exact = bool(squash(heard) == squash(spoken))
    return {"heard": heard, "exact": exact, "wpm": int(round(wpm)), "worst": round(worst, 2), "weak": weak,
            "passes": bool(exact and min_wpm <= wpm <= max_wpm and worst >= 0.6)}


PITCH_AS = {}


def pitch(a, sr) -> float:
    """Median fundamental frequency (Hz) of the voiced 40 ms frames, by autocorrelation."""
    a = to_rate(a, sr, 16000)
    n, out = 640, []
    for i in range(0, len(a) - n, n // 2):
        f = a[i:i + n] - a[i:i + n].mean()
        if np.sqrt(np.mean(f * f)) < 0.03:
            continue
        ac = np.correlate(f, f, "full")[n - 1:]
        lo, hi = 16000 // 400, 16000 // 70
        k = lo + int(np.argmax(ac[lo:hi]))
        if ac[k] > 0.4 * ac[0]:
            out.append(16000 / k)
    return float(np.median(out)) if out else 0.0


def cents(f, ref):
    return 0.0 if not f or not ref else abs(1200 * np.log2(f / ref))


def generate(tts, kind, ln):
    model, voice, base = CAST[ln["speaker"]]
    note = " ".join(x for x in (base, ln["act"] or "") if x)
    if kind == "custom":
        w, sr = tts.generate_custom_voice(text=ln["spoken"], language="English", speaker=voice, instruct=note)
    else:
        w, sr = tts.generate_voice_design(text=ln["spoken"], language="English", instruct=f"{voice} {note}".strip())
    return np.asarray(w[0], np.float32), sr


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("script")
    p.add_argument("out")
    p.add_argument("--takes", type=int, default=2, help="takes per line before choosing")
    p.add_argument("--max-takes", type=int, default=7, help="keep trying up to this many if none pass")
    p.add_argument("--flow", type=float, default=0.3, help="longest pause kept inside a line")
    p.add_argument("--beat", type=float, default=0.22, help="breath between lines")
    p.add_argument("--pace", type=int, default=210, help="narrator words per minute to aim for")
    p.add_argument("--redo", help="line numbers to record again even if cached, e.g. 6,9")
    a = p.parse_args()
    load_cast(Path(a.script).resolve().parent.parent)

    lines = script_lines(Path(a.script).read_text())
    cache = Path(a.out).with_name(Path(a.out).stem + "_lines")
    redo = {int(x) for x in a.redo.split(",") if x.strip()} if a.redo else set()
    for i, ln in enumerate(lines):
        model, voice, base = CAST[ln["speaker"]]
        key = f"{ln['spoken']}|{model}|{voice}|{base}|{ln['act']}"
        ln["dir"] = cache / hashlib.sha1(key.encode()).hexdigest()[:12]
        if i + 1 in redo and (ln["dir"] / "choice.json").exists():
            (ln["dir"] / "choice.json").unlink()
    todo = [i for i, ln in enumerate(lines) if not (ln["dir"] / "choice.json").exists()]
    pitch_refs = json.loads((Path(a.script).resolve().parent.parent / "voice_pitch.json").read_text()) \
        if (Path(a.script).resolve().parent.parent / "voice_pitch.json").exists() else {}
    for i, ln in enumerate(lines):
        f = ln["dir"] / "choice.json"
        if i in todo or ln["speaker"] != "NARRATOR":
            continue
        ch = json.loads(f.read_text())
        if ch.get("pace", 210) != a.pace and all("hz" in r for r in ch["all"]):
            ref = pitch_refs.get("NARRATOR")
            ch["best"] = max(ch["all"], key=lambda r: (r["passes"], r["exact"],
                                                         -(cents(r["hz"], ref) / 100 + abs(r["wpm"] - a.pace) / 40)))
            ch["pace"] = a.pace
            f.write_text(json.dumps(ch, indent=1))
    print(f"{len(todo)} of {len(lines)} lines to record")

    pitch_file = Path(a.script).resolve().parent.parent / "voice_pitch.json"
    refs = json.loads(pitch_file.read_text()) if pitch_file.exists() else {}
    t0, whisper = time.time(), None
    for kind in ("custom", "design"):
        mine = [i for i in todo if CAST[lines[i]["speaker"]][0] == kind]
        if not mine:
            continue
        from qwen_tts import Qwen3TTSModel
        if whisper is None:
            from faster_whisper import WhisperModel
            whisper = WhisperModel("small.en", device="cpu", compute_type="int8")
        dev = "mps" if torch.backends.mps.is_available() else "cpu"
        tts = Qwen3TTSModel.from_pretrained(MODELS[kind], device_map=dev, dtype=torch.bfloat16,
                                            attn_implementation="sdpa")
        print(f"{kind} model loaded for {len(mine)} line(s), {time.time() - t0:.0f}s", flush=True)
        for i in mine:
            ln = lines[i]
            ln["dir"].mkdir(parents=True, exist_ok=True)
            narr = ln["speaker"] == "NARRATOR"
            # short dramatic lines ("Names. Faces. Yourself.") are meant to be slow; long ones must not drawl
            short = len(ln["spoken"].split()) < 8
            min_wpm, max_wpm = ((115 if short else 160), max(270, a.pace + 45)) if narr else (90, 999)
            who = PITCH_AS.get(ln["speaker"], ln["speaker"])
            results = []
            ref_now = refs.get(PITCH_AS.get(ln["speaker"], ln["speaker"]))
            for k in range(1, a.max_takes + 1):
                f = ln["dir"] / f"take{k}.wav"
                if f.exists():
                    audio, sr = sf.read(f, dtype="float32")
                else:
                    audio, sr = generate(tts, kind, ln)
                    sf.write(f, audio, sr)
                r = score(whisper, audio, sr, ln["spoken"], min_wpm, max_wpm) | {"take": f.name,
                                                                                 "hz": round(pitch(audio, sr), 1)}
                if ref_now is not None and r["hz"] and cents(r["hz"], ref_now) > 300:
                    r["passes"] = False            # more than 3 semitones off: sounds like another person
                results.append(r)
                print(f"  {i + 1:2d}.{k} {ln['speaker']:8} {'pass' if r['passes'] else 'fail'}  {r['wpm']:3d} wpm"
                      f"  worst {r['worst']:.2f}{'' if r['exact'] else '  heard: ' + r['heard']}"
                      f"{'  weak: ' + str(r['weak']) if r['weak'] else ''}   ({time.time() - t0:.0f}s)", flush=True)
                if k >= a.takes and any(x["passes"] for x in results):
                    break
            # among passing takes: closest to this speaker's voice so far, then (narrator) a calm ~210 wpm
            ref = refs.get(who)
            best = max(results, key=lambda r: (r["passes"], r["exact"],
                                               -(cents(r["hz"], ref) / 100 + (abs(r["wpm"] - a.pace) / 40 if narr else 0))))
            if ref is None and best["hz"]:
                refs[who] = best["hz"]
                pitch_file.write_text(json.dumps(refs, indent=1))
            print(f"     chose {best['take']}  {best['hz']} Hz (reference {refs.get(who)})", flush=True)
            if not best["passes"]:
                print(f"  !! line {i + 1}: no take passed in {a.max_takes}; using the closest. LISTEN: {ln['shown']}")
            (ln["dir"] / "choice.json").write_text(json.dumps({"best": best, "all": results, "pace": a.pace}, indent=1))
        del tts
        gc.collect()
        if torch.backends.mps.is_available():
            torch.mps.empty_cache()

    parts, t, report, timeline = [], 0.0, [], []
    for i, ln in enumerate(lines):
        if i:
            gap = a.beat if ln["hold"] is None else ln["hold"]
            parts.append(np.zeros(int(gap * SR), np.float32))
            t += gap
        best = json.loads((ln["dir"] / "choice.json").read_text())["best"]
        audio, sr = sf.read(ln["dir"] / best["take"], dtype="float32")
        audio = squeeze(tight(to_rate(audio, sr, SR), SR), SR, a.flow)
        # even loudness: scale the talking part to one RMS level (whispers stay softer in tone, not volume)
        talk = audio[np.abs(audio) > 0.02 * np.abs(audio).max()]
        audio = audio * (0.12 / max(1e-6, float(np.sqrt(np.mean(talk ** 2)))))
        audio = audio / max(1.0, np.abs(audio).max() / 0.95)
        print(f"  {i + 1:2d} {t:6.2f}s {ln['speaker']:8} {best['take']:9} {'ok ' if best['passes'] else 'CHECK'}"
              f"  {ln['shown'][:55]}")
        if not best["passes"]:
            report.append(i + 1)
        timeline.append({"line": i + 1, "start": round(t, 3), "end": round(t + len(audio) / SR, 3),
                         "speaker": ln["speaker"], "shot": ln["shot"], "text": ln["shown"]})
        parts.append(audio)
        t += len(audio) / SR
    sf.write(a.out, np.concatenate(parts), SR)
    Path(a.out).with_suffix(".lines.json").write_text(json.dumps(timeline, indent=1))
    Path(a.out).with_suffix(".captions.txt").write_text("\n".join(ln["shown"] for ln in lines) + "\n")
    print(f"{a.out}: {t:.1f}s, {len(todo)} line(s) recorded, {time.time() - t0:.0f}s"
          + (f", lines to check: {report}" if report else ", every line passed"))


if __name__ == "__main__":
    main()
