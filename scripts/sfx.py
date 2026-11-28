"""Procedural sound effects (numpy only, no samples to license)."""
from __future__ import annotations

import numpy as np

SR = 24000
rng = np.random.default_rng(1)


def _t(dur):
    return np.arange(int(dur * SR)) / SR


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x)
    acc = 0.0
    for i, v in enumerate(x):          # one-pole; clips are short so a loop is fine
        acc = (1 - a) * v + a * acc
        y[i] = acc
    return y


def env(n, attack=0.005, decay=0.3):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(attack, 1e-4)) * np.exp(-t / decay)


def noise(dur):
    return rng.uniform(-1, 1, int(dur * SR))


def splash(dur=1.2):
    x = lowpass(noise(dur), 1800) * env(int(dur * SR), 0.01, 0.35) * 2.5
    return x + lowpass(noise(dur), 400) * env(int(dur * SR), 0.005, 0.15) * 3


def impact(dur=0.8, pitch=55):
    t = _t(dur)
    boom = np.sin(2 * np.pi * pitch * t * np.exp(-t * 2)) * np.exp(-t / 0.25)
    return boom * 1.2 + lowpass(noise(dur), 2500) * env(len(t), 0.002, 0.06)


def metal_crash(dur=0.7):
    t = _t(dur)
    ring = sum(np.sin(2 * np.pi * f * t) for f in (610, 1190, 1730)) * np.exp(-t / 0.18) * 0.25
    return ring + impact(dur, 70) * 0.8 + noise(dur) * env(len(t), 0.001, 0.05) * 0.6


def bubble(dur=0.09, f0=500):
    t = _t(dur)
    f = f0 * (1 + 3 * t / dur)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(t), 0.003, dur / 3) * 0.5


def ring_tone(dur=1.6):
    t = _t(dur)
    on = ((t % 0.8) < 0.4).astype(float)
    return (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * 0.25 * on


def drop_tone(dur=0.6):
    t = _t(dur)
    f = 220 * np.exp(-t * 1.5)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.3) * 0.8


def rise_tone(dur=0.45):
    t = _t(dur)
    f = 520 * np.exp(t * 1.6)
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + np.sin(2 * np.pi * np.cumsum(f * 2) / SR) * 0.2) * np.exp(-t / 0.22)


def thud(dur=0.25):
    return impact(dur, 90) * 0.7


def heartbeat(dur=0.9):
    out = np.zeros(int(dur * SR))
    for off in (0.0, 0.22):
        b = impact(0.25, 48) * 0.9
        i = int(off * SR)
        out[i:i + len(b)] += b[: len(out) - i]
    return out


def click(dur=0.08):
    t = _t(dur)
    return (np.sin(2 * np.pi * 2400 * t) + noise(dur) * 0.6) * np.exp(-t / 0.01) * 0.9


def whir(dur=1.2):
    t = _t(dur)
    f = 140 + 20 * np.sin(t * 30)
    return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.08 * np.minimum(1, t * 8) * np.minimum(1, (dur - t) * 8)


def crack(dur=0.35):
    t = _t(dur)
    x = np.zeros(len(t))
    for i in rng.integers(0, len(t), 14):
        x[i:i + 60] += rng.uniform(-1, 1, len(x[i:i + 60])) * np.exp(-np.arange(len(x[i:i + 60])) / 12)
    return x * 0.9


def shatter(dur=1.0):
    t = _t(dur)
    tinkles = np.zeros(len(t))
    for _ in range(40):
        s = rng.integers(0, int(len(t) * 0.7))
        f = rng.uniform(2500, 6000)
        n = min(1500, len(t) - s)
        tinkles[s:s + n] += np.sin(2 * np.pi * f * np.arange(n) / SR) * np.exp(-np.arange(n) / 300) * 0.25
    return tinkles + noise(dur) * env(len(t), 0.001, 0.12) * 0.9 + impact(dur, 60) * 0.5


def whoosh_soft(dur=0.5):
    t = _t(dur)
    shape = np.sin(np.pi * t / dur) ** 2
    return lowpass(noise(dur), 1200) * shape * 1.6


def tick(dur=0.03):
    t = _t(dur)
    return np.sin(2 * np.pi * 1800 * t) * np.exp(-t / 0.005) * 0.35


def rumble(dur):
    return lowpass(noise(dur), 120) * 1.8


def place(track: np.ndarray, clip: np.ndarray, at: float, gain: float = 1.0) -> None:
    i = int(at * SR)
    if i >= len(track) or i < 0:
        return
    n = min(len(clip), len(track) - i)
    track[i:i + n] += clip[:n] * gain


# ------------------------------------------------ cues used by render.py (named in a series' CUES table)

def music_bed(n):
    """A low, slow minor drone with breathing noise: always there, never loud."""
    t = np.arange(n) / SR
    bed = np.zeros(n, np.float32)
    for f, a in ((55.0, 0.5), (82.41, 0.35), (110.0, 0.25), (130.81, 0.18), (164.81, 0.08)):
        lfo = 0.6 + 0.4 * np.sin(2 * np.pi * (0.05 + f / 4000) * t + f)
        bed += (a * lfo * np.sin(2 * np.pi * f * t + 0.3 * np.sin(2 * np.pi * 0.2 * t))).astype(np.float32)
    rng = np.random.default_rng(3)
    noise = np.convolve(rng.standard_normal(n).astype(np.float32), np.ones(400) / 400, mode="same")
    bed += noise * 2.5 * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t)).astype(np.float32)
    return bed / np.max(np.abs(bed))


def alert_tone(dur=1.6):
    t = np.arange(int(dur * SR)) / SR
    tone = 0.5 * np.sin(2 * np.pi * 853 * t) + 0.5 * np.sin(2 * np.pi * 960 * t)
    gate = (np.floor(t * 4) % 2 == 0).astype(np.float32)
    return (tone * gate * np.minimum(1, (dur - t) * 8)).astype(np.float32)


def knocks(n=3, gap=0.28):
    out = np.zeros(int((n * gap + 0.4) * SR), np.float32)
    for k in range(n):
        place(out, thud(), k * gap, 1.0)
    return out


def jingle():
    out = np.zeros(int(0.9 * SR), np.float32)
    rng = np.random.default_rng(7)
    for k in range(9):
        t0 = k * 0.07 + rng.uniform(0, 0.04)
        f = rng.uniform(2800, 5200)
        tt = np.arange(int(0.12 * SR)) / SR
        ping = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 40)
        place(out, ping.astype(np.float32), t0, 0.5)
    return out


def creak(dur=1.2):
    """An old door hinge: a low buzzy tone that wobbles in pitch."""
    t = np.arange(int(dur * SR)) / SR
    rng = np.random.default_rng(4)
    f = 140 + 60 * np.sin(2 * np.pi * 0.7 * t) + np.convolve(rng.standard_normal(len(t)), np.ones(800) / 800, "same") * 400
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = np.sign(np.sin(ph)) * 0.4 + np.sin(ph * 2) * 0.3
    env = np.minimum(1, t / 0.05) * np.minimum(1, (dur - t) / 0.2)
    return np.convolve(tone * env, np.ones(6) / 6, "same").astype(np.float32) * 0.6


def pop(dur=0.09):
    t = np.arange(int(dur * SR)) / SR
    f = 900 - 500 * t / dur
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45)).astype(np.float32)


def whoosh(dur=0.35):
    rng = np.random.default_rng(11)
    t = np.arange(int(dur * SR)) / SR
    noise = rng.standard_normal(len(t)).astype(np.float32)
    noise = np.convolve(noise, np.ones(12) / 12, mode="same")
    env = np.sin(np.pi * t / dur) ** 2
    return (noise * env).astype(np.float32)


def ambience(kind, n, t0):
    rng = np.random.default_rng(int(t0 * 100) + 5)
    t = np.arange(n) / SR
    if kind == "store":          # a crowd's murmur, the odd checkout beep
        noise = rng.standard_normal(n).astype(np.float32)
        band = np.convolve(noise, np.ones(8) / 8, mode="same") - np.convolve(noise, np.ones(60) / 60, mode="same")
        syll = np.interp(t, np.arange(0, t[-1] + 0.2, 0.18), rng.uniform(0.3, 1.0, len(np.arange(0, t[-1] + 0.2, 0.18))))
        out = band * syll * 0.5
        for b in np.arange(rng.uniform(0.5, 2.0), t[-1], 3.1):
            i = int(b * SR)
            tt = np.arange(int(0.09 * SR)) / SR
            out[i:i + len(tt)] += (0.12 * np.sin(2 * np.pi * 2400 * tt))[: max(0, n - i)]
        return out.astype(np.float32)
    if kind == "tv":             # the same commercial jingle, muffled through a door, over and over
        out = np.zeros(n, np.float32)
        notes = [523.3, 659.3, 784.0, 659.3, 698.5, 880.0]
        for start in np.arange(0, t[-1], 1.8):
            for j, f in enumerate(notes):
                i = int((start + j * 0.22) * SR)
                tt = np.arange(int(0.2 * SR)) / SR
                tone = (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(4 * np.pi * f * tt)) * np.exp(-tt * 9)
                m = min(len(tt), n - i)
                if m > 0:
                    out[i:i + m] += tone[:m].astype(np.float32)
        return np.convolve(out, np.ones(30) / 30, mode="same").astype(np.float32) * 0.8
    if kind == "wind":
        noise = rng.standard_normal(n).astype(np.float32)
        low = np.convolve(noise, np.ones(200) / 200, mode="same")
        return (low * 6 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.15 * t + t0))).astype(np.float32)
    if kind == "tap":            # water running into the tub, filling as it goes
        noise = rng.standard_normal(n).astype(np.float32)
        hiss = noise - np.convolve(noise, np.ones(12) / 12, mode="same")
        burble = np.convolve(noise, np.ones(40) / 40, mode="same") * 3
        fade = np.minimum(1, t / 0.3)
        return ((hiss * 0.35 + burble) * fade * (0.85 + 0.15 * np.sin(2 * np.pi * 5.3 * t))).astype(np.float32)
    return np.zeros(n, np.float32)


def footsteps(n):
    out = np.zeros(n, np.float32)
    for st in np.arange(0.1, n / SR, 1 / 2.9):
        place(out, thud(0.12), st, 0.35)
    return out



SOUNDS = {      # name -> zero-argument factory, for CUES and WORD_SFX in a series' shots.py
    "alert": alert_tone, "alert_short": lambda: alert_tone(1.2), "ring": ring_tone, "jingle": jingle,
    "drop": drop_tone, "rise": rise_tone, "tick": tick, "knocks": knocks, "knocks_slow": lambda: knocks(3, 0.42),
    "rumble": lambda: rumble(2.0), "creak": creak, "creak_short": lambda: creak(1.0), "thud": thud,
    "impact": impact, "x": lambda: impact(0.5, 70), "pop": pop, "click": click, "whir": whir, "crack": crack,
    "shatter": shatter, "splash": splash, "heartbeat": heartbeat, "bubble": bubble, "metal": metal_crash,
}
