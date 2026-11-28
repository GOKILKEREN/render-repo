"""Render one episode of a stickman-stories series to a 1080x1920 MP4.

    python -I render.py SERIES/EPISODE [--still 12.5] [--from 10 --to 20] [--out file]

The episode folder needs voice.wav + voice.lines.json (voice.py), words.json (words.py) and card.json
({"day": "DAY 0", "next": "DAY 1", "question": ..., "a": ..., "b": ...}).
The series folder (the episode's parent) needs shots.py: SHOTS = {name: draw_fn(canvas, ctx)} plus the
optional tables documented in references/animation.md (AMBIENCE, WALKING, QUIET, SCARE, LINGER, CLOSE_Z,
CUES, WORD_SFX).
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import math
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path

import numpy as np
import skia
import soundfile as sf

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import kit as K  # noqa: E402
import sfx  # noqa: E402

SHOTS, AMBIENCE, WALKING, QUIET, SCARE, LINGER, CLOSE_Z, CUES, WORD_SFX = {}, {}, set(), set(), set(), set(), {}, {}, {}


def load_series(folder: Path):
    """Import SERIES/shots.py and take its tables. Shots may be plain functions or (fn, None) pairs."""
    global SHOTS, AMBIENCE, WALKING, QUIET, SCARE, LINGER, CLOSE_Z, CUES, WORD_SFX
    path = folder / "shots.py"
    if not path.exists():
        raise SystemExit(f"No shots.py in {folder}: the series folder must define SHOTS")
    sys.path.insert(0, str(folder))
    spec = importlib.util.spec_from_file_location("shots", path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules["shots"] = mod
    spec.loader.exec_module(mod)
    SHOTS = {k: (v if isinstance(v, tuple) else (v, None)) for k, v in mod.SHOTS.items()}
    AMBIENCE, CLOSE_Z, CUES, WORD_SFX = (dict(getattr(mod, n, {})) for n in ("AMBIENCE", "CLOSE_Z", "CUES", "WORD_SFX"))
    WALKING, QUIET, SCARE, LINGER = (set(getattr(mod, n, ())) for n in ("WALKING", "QUIET", "SCARE", "LINGER"))


def ffmpeg():
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except ImportError:
        return "ffmpeg"


FF = ffmpeg()
SR = sfx.SR
SPEED = 0.6            # reveal timing inside shots
SUBCUT = 1.8           # seconds per framing change inside a long shot


@dataclass
class Seg:
    shot: str
    start: float
    end: float
    lines: list


class Episode:
    def __init__(self, folder: Path):
        self.dir = folder
        self.lines = json.loads((folder / "voice.lines.json").read_text())
        self.card = json.loads((folder / "card.json").read_text())
        words = json.loads((folder / "words.json").read_text())
        self.voice, sr = sf.read(folder / "voice.wav", dtype="float32")
        assert sr == SR, sr
        self.duration = self.lines[-1]["end"] + 1.2
        self.segs = []
        for ln in self.lines:
            start = 0.0 if not self.segs else max(self.segs[-1].start + 0.3, ln["start"] - 0.12)
            if self.segs and self.segs[-1].shot in LINGER and self.segs[-1].shot != ln["shot"]:
                start = min(start + 0.6, ln["end"] - 0.6)          # let the X sit on screen before cutting
            if self.segs and self.segs[-1].shot == ln["shot"]:
                self.segs[-1].lines.append(ln)
                continue
            if self.segs:
                self.segs[-1].end = start
            self.segs.append(Seg(ln["shot"], start, self.duration, [ln]))
        # lip-sync envelope at 100 Hz
        h = SR // 100
        n = len(self.voice) // h
        e = np.sqrt(np.mean(self.voice[: n * h].reshape(n, h) ** 2, axis=1))
        self.env = np.convolve(e, np.ones(4) / 4, mode="same")
        self.captions = self._chunks(words)
        self.words = words

    def _chunks(self, words):
        out, cur = [], []
        for i, w in enumerate(words):
            cur.append(w)
            nxt = words[i + 1] if i + 1 < len(words) else None
            text = " ".join(x["text"] for x in cur)
            brk = (w["text"][-1:] in ".,?!:;…" or len(cur) >= 4 or len(text) > 20 or nxt is None
                   or (nxt and nxt["start"] - w["end"] > 0.35))
            if brk:
                out.append((cur[0]["start"], cur[-1]["end"], text))
                cur = []
        return out

    def seg_at(self, t):
        for s in self.segs:
            if s.start <= t < s.end:
                return s
        return self.segs[-1]

    def mouth(self, t):
        q = int(round(t * 12)) / 12                       # mouth shapes change 12x a second, like 2D animation
        i = min(len(self.env) - 1, int(q * 100))
        v = (self.env[i] - 0.015) / 0.11
        return round(max(0.0, min(1.0, v)) * 3) / 3


def _norm(s):
    return "".join(ch for ch in s.lower() if ch.isalnum())


def seg_word(ep, seg, w, nth=0):
    """Episode time when word w (prefix match) is said inside this segment's lines, or +inf."""
    lo, hi = seg.lines[0]["start"] - 0.05, seg.lines[-1]["end"] + 0.05
    hits = [q["start"] for q in ep.words if lo <= q["start"] <= hi and _norm(q["text"]).startswith(w)]
    return hits[nth] if len(hits) > nth else 1e9


class Ctx:
    def __init__(self, ep: Episode, seg: Seg, t: float):
        self.ep, self.seg, self.t = ep, seg, t
        self.lt, self.dur = t - seg.start, seg.end - seg.start
        self.n = max(0, sum(1 for ln in seg.lines if ln["start"] <= t + 0.05) - 1)
        self.line = next((ln for ln in ep.lines if ln["start"] <= t <= ln["end"]), None)

    def talk(self, name):
        if self.line and self.line["speaker"] == name:
            return self.ep.mouth(self.t)
        return 0.0

    def word(self, w, nth=0):
        """Seconds into this shot when the narrator starts word w (prefix match), or never."""
        return seg_word(self.ep, self.seg, w, nth) - self.seg.start

    def kw(self, w, dur=0.25, nth=0, lead=0.0):
        """0..1, eased, starting `lead` seconds before word w is said."""
        return K.ease_out(K.clamp((self.lt - self.word(w, nth) + lead) / max(1e-6, dur)))

    def seg_is(self, name):
        return self.seg.shot == name

    def k(self, start, dur):
        # every reveal inside a shot runs at 60% of its written timing: the cut pace the user asked for
        return K.ease_out(K.clamp((self.lt - start * SPEED) / max(1e-6, dur * SPEED)))


def draw_frame(c, ep: Episode, t):
    seg = ep.seg_at(t)
    x = Ctx(ep, seg, t)
    if seg.shot == "endcard":
        card = ep.card
        # the A and B boxes appear as the narrator says "Option A" / "Option B"
        at = [ln["start"] - seg.start for ln in seg.lines] + [99.0] * 4
        ends = [ln["end"] - seg.start for ln in seg.lines] + [99.0] * 4
        lit = lambda i: K.clamp((x.lt - at[i]) / 0.2) * (1 - K.clamp((x.lt - ends[i] - 0.1) / 0.3))  # noqa: E731
        both = 0.5 + 0.5 * math.sin(x.lt * 6) if x.lt > at[3] else 0.0
        K.end_card(c, x.lt, card["next"], card["question"], card["a"], card["b"], at_a=at[1], at_b=at[2], at_end=at[3],
                   hl_a=max(lit(1), both), hl_b=max(lit(2), both), title=card.get("title", "30 DAYS"))
        return
    fn, _ = SHOTS[seg.shot]
    c.save()
    # A long shot is cut into ~2.2 s pieces that alternate wide and close framing, so the picture changes
    # as often as it would with a camera operator. Each piece pushes in, and a cut snaps in then settles.
    n = max(1, round(x.dur / SUBCUT))
    piece = min(n - 1, int(x.lt / (x.dur / n)))
    pt = x.lt - piece * x.dur / n
    close = piece % 2 == 1
    x.close = close
    z = (CLOSE_Z.get(seg.shot, 1.32) if close else 1.0) + 0.06 * K.clamp(pt / (x.dur / n)) + 0.05 * (1 - K.clamp(pt / 0.18))
    sx = sy = 0.0
    if seg.shot in SCARE and x.lt < 0.45:
        sx, sy = math.sin(x.lt * 90) * 14 * (1 - x.lt / 0.45), math.cos(x.lt * 70) * 10 * (1 - x.lt / 0.45)
    c.translate(K.W / 2 + sx, K.H * 0.45 + sy)
    c.scale(z, z)
    c.translate(-K.W / 2, -K.H * 0.45)
    fn(c, x)
    c.restore()
    if x.lt < 0.08:                                        # a white flash frame on the scare cuts
        if seg.shot in SCARE:
            c.drawRect(skia.Rect.MakeWH(K.W, K.H), K.paint("#FFFFFF", 0.5))
    K.soft_vignette(c, 0.28)
    band = skia.Paint(Shader=skia.GradientShader.MakeLinear(
        [skia.Point(0, 1440), skia.Point(0, 1720)], [K.rgb("#000000", 0), K.rgb("#000000", 0.42)]))
    c.drawRect(skia.Rect.MakeXYWH(0, 1440, K.W, K.H - 1440), band)   # keeps bottom captions readable
    if t < 1.9:
        K.title_band(c, ep.card["day"], a=1.0 - K.clamp((t - 1.5) / 0.4), title=ep.card.get("title", "30 DAYS"))
    for s0, s1, text in ep.captions:
        if s0 - 0.05 <= t <= s1 + 0.15:
            K.caption(c, text)
            break


def soundtrack(ep: Episode, music_level=0.11):
    n = int((ep.duration + 0.3) * SR)
    v = np.zeros(n, np.float32)
    v[: len(ep.voice)] = ep.voice[:n]
    fx = np.zeros(n, np.float32)
    for s in ep.segs:
        cues = [(at, sfx.SOUNDS[name](), g) for at, name, g in CUES.get(s.shot, [])]
        if s.start > 0.1:
            cues = [(-0.12, sfx.whoosh(), 0.5)] + cues
        for w, kind in WORD_SFX.get(s.shot, []):
            tw = seg_word(ep, s, w)
            if tw < 1e8:
                clip, g = sfx.SOUNDS[kind](), {"x": 0.9, "pop": 0.5, "click": 0.8}.get(kind, 1.0)
                cues.append((tw - s.start, clip, g))
        for at, clip, g in cues:
            sfx.place(fx, clip, s.start + at, g)
    bed = sfx.music_bed(n)
    amb = np.zeros(n, np.float32)
    bed_gain = np.ones(n, np.float32)
    for s in ep.segs:
        i0, i1 = int(s.start * SR), min(n, int(s.end * SR))
        if i1 <= i0:
            continue
        fade = np.minimum(1, np.minimum(np.arange(i1 - i0), np.arange(i1 - i0)[::-1]) / (0.12 * SR)).astype(np.float32)
        if s.shot in AMBIENCE:
            amb[i0:i1] += sfx.ambience(AMBIENCE[s.shot], i1 - i0, s.start) * fade * 0.35
        if s.shot in WALKING:
            amb[i0:i1] += sfx.footsteps(i1 - i0) * fade
        if s.shot in QUIET:                                    # silence on purpose: only the voice and the knock
            bed_gain[i0:i1] = 0.12
    bed_gain = np.convolve(bed_gain, np.ones(int(0.4 * SR)) / int(0.4 * SR), mode="same")
    k = int(0.3 * SR)
    talking = np.convolve((np.abs(v) > 0.02).astype(np.float32), np.ones(k) / k, mode="same")
    duck = 1 - 0.35 * np.clip(talking * 3, 0, 1)
    end = ep.segs[-1].start
    swell = np.clip((np.arange(n) / SR - end) / 0.8, 0, 1) * 0.8 + 1   # bed lifts a little on the end card
    mix = v + fx * 0.35 + amb + bed * music_level * duck * swell * bed_gain
    peak = np.max(np.abs(mix))
    return (mix / peak * 0.95 if peak > 0.95 else mix).astype(np.float32)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("ep")
    p.add_argument("--still", type=float)
    p.add_argument("--from", dest="t0", type=float, default=0.0)
    p.add_argument("--to", dest="t1", type=float)
    p.add_argument("--out")
    a = p.parse_args()
    folder = Path(a.ep).resolve()
    load_series(folder.parent)
    ep = Episode(folder)
    surf_arr = np.zeros((K.H, K.W, 4), dtype=np.uint8)
    surf = skia.Surface(surf_arr)
    c = surf.getCanvas()
    if a.still is not None:
        c.clear(skia.ColorBLACK)
        draw_frame(c, ep, a.still)
        out = a.out or str(folder / f"still_{a.still:06.2f}.png")
        surf.makeImageSnapshot().save(out)
        print(out)
        return
    t1 = a.t1 if a.t1 is not None else ep.duration
    out = Path(a.out or folder / "render.mp4")
    audio = soundtrack(ep)
    wav = folder / "_mix.wav"
    sf.write(wav, audio[int(a.t0 * SR): int(t1 * SR)], SR)
    cmd = [FF, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{K.W}x{K.H}",
           "-r", str(K.FPS), "-i", "-", "-i", str(wav), "-c:v", "libx264", "-preset", "medium", "-crf", "18",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest", str(out)]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    frames = range(int(a.t0 * K.FPS), int(t1 * K.FPS))
    t0 = time.time()
    for i in frames:
        c.clear(skia.ColorBLACK)
        draw_frame(c, ep, i / K.FPS)
        ff.stdin.write(surf_arr.tobytes())
    ff.stdin.close()
    ff.wait()
    wav.unlink(missing_ok=True)
    print(f"{out}  {len(frames)} frames, {ep.duration:.1f}s, rendered in {time.time() - t0:.0f}s")


if __name__ == "__main__":
    main()
