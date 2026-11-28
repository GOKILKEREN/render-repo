"""Shared drawing engine for the Survival Odds Shorts.

Frames are 1080x1920 drawn with skia. Everything here is episode-independent:
easing, colours, the main character, HUD boxes, label pills, captions.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import skia

W, H, FPS = 1080, 1920, 30
HERE = Path(__file__).resolve().parent
ANTON = skia.Typeface.MakeFromFile(str(HERE / "fonts" / "Anton-Regular.ttf"))
OSWALD = skia.Typeface.MakeFromFile(str(HERE / "fonts" / "Oswald.ttf"))


# ---------------------------------------------------------------- basics

def rgb(hexstr: str, a: float = 1.0) -> int:
    h = hexstr.lstrip("#")
    return skia.Color(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), int(255 * max(0, min(1, a))))


def mix(c1: str, c2: str, t: float) -> str:
    a = [int(c1.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)]
    b = [int(c2.lstrip("#")[i:i + 2], 16) for i in (0, 2, 4)]
    return "#" + "".join(f"{round(x + (y - x) * t):02x}" for x, y in zip(a, b))


def paint(color: str | int, a: float = 1.0, stroke: float = 0, blur: float = 0) -> skia.Paint:
    p = skia.Paint(AntiAlias=True)
    p.setColor(rgb(color, a) if isinstance(color, str) else color)
    if stroke:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(stroke)
        p.setStrokeCap(skia.Paint.kRound_Cap)
        p.setStrokeJoin(skia.Paint.kRound_Join)
    if blur:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    return p


def linear(x0, y0, x1, y1, colors: list[str], alpha: float = 1.0) -> skia.Paint:
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeLinear(
        [skia.Point(x0, y0), skia.Point(x1, y1)], [rgb(c, alpha) for c in colors]))
    return p


def radial(cx, cy, r, colors: list[str], alphas: list[float] | None = None) -> skia.Paint:
    alphas = alphas or [1.0] * len(colors)
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeRadial(
        skia.Point(cx, cy), r, [rgb(c, a) for c, a in zip(colors, alphas)]))
    return p


def rrect(c: skia.Canvas, x, y, w, h, r, p: skia.Paint) -> None:
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r), p)


def capsule(c: skia.Canvas, x0, y0, x1, y1, width, p: skia.Paint) -> None:
    q = skia.Paint(p)
    q.setStyle(skia.Paint.kStroke_Style)
    q.setStrokeWidth(width)
    q.setStrokeCap(skia.Paint.kRound_Cap)
    c.drawLine(x0, y0, x1, y1, q)


# ---------------------------------------------------------------- time

def clamp(x, lo=0.0, hi=1.0):
    return max(lo, min(hi, x))


def prog(t, start, dur):
    return clamp((t - start) / dur) if dur > 0 else float(t >= start)


def ease_out(x):
    return 1 - (1 - x) ** 3


def ease_in_out(x):
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def back_out(x, k=1.70158):
    x -= 1
    return 1 + (k + 1) * x ** 3 + k * x ** 2


def lerp(a, b, x):
    return a + (b - a) * x


def wobble(t, freq=1.0, amp=1.0, seed=0.0):
    return amp * (math.sin(t * freq * 2 * math.pi + seed) * 0.6 + math.sin(t * freq * 3.7 + seed * 2) * 0.4)


# ---------------------------------------------------------------- character

@dataclass
class Look:
    skin: str = "#C68B59"
    skin_shade: str = "#A9703F"
    hair: str = "#15141A"
    top: str = "#1B1B21"          # black hoodie
    top_shade: str = "#2C2C35"
    pants: str = "#F1F1EE"        # white sweatpants
    pants_shade: str = "#D6D6D2"
    shoes: str = "#2A2A30"
    hood: bool = True
    strings: bool = True
    hair_style: str = "short"     # short | kid


YOU = Look()
KID = Look(top="#F2B630", top_shade="#D99A16", pants="#3D6FB6", pants_shade="#2F5A97",
           shoes="#E8E8E8", hood=False, strings=False, hair_style="kid")


@dataclass
class Pose:
    arm_l: float = 8        # degrees from straight down; positive swings outward/up
    arm_r: float = 8
    leg_l: float = 3
    leg_r: float = 3
    tilt: float = 0         # whole-body lean, degrees
    look: tuple = (0.0, 0.0)  # pupil offset -1..1
    face: str = "neutral"   # neutral | worried | scared | shout | determined | gasp | calm
    blink: bool = False
    hold_breath: bool = False


def draw_person(c: skia.Canvas, x: float, y: float, s: float, pose: Pose, look: Look = YOU,
                legs: bool = True) -> None:
    """Front-view chibi figure. (x, y) is between the feet; s=1 is about 430 px tall."""
    c.save()
    c.translate(x, y)
    c.rotate(pose.tilt)
    c.scale(s, s)

    # legs + shoes
    hip_y, leg_len = -120, 112
    if legs:
        for side, ang in ((-1, pose.leg_l), (1, pose.leg_r)):
            hx = side * 26
            a = math.radians(ang) * side
            fx, fy = hx + math.sin(a) * leg_len, hip_y + math.cos(a) * leg_len
            capsule(c, hx, hip_y, fx, fy - 12, 46, paint(look.pants))
            capsule(c, hx + side * 9, hip_y + 18, fx + side * 9, fy - 22, 8, paint(look.pants_shade))
            rrect(c, fx - 30 + side * 8, fy - 22, 60, 26, 13, paint(look.shoes))
            rrect(c, fx - 30 + side * 8, fy - 2, 60, 6, 3, paint("#FFFFFF", 0.55))

    # torso
    top_y, tw, th = -262, 136, 150
    arms = []
    for side, ang in ((-1, pose.arm_l), (1, pose.arm_r)):
        sx, sy = side * 58, top_y + 34
        a = math.radians(min(ang, 145))               # past ~145 the hand hides behind the head
        ex, ey = sx + side * math.sin(a) * 104, sy + math.cos(a) * 104
        arms.append((sx, sy, ex, ey))
    for sx, sy, ex, ey in arms:                       # arms behind torso edge
        capsule(c, sx, sy, ex, ey, 40, paint(look.top))
    c.drawPath(_torso_path(tw, th, top_y), paint(look.top))
    c.drawPath(_torso_path(tw, th, top_y), paint(look.top_shade, stroke=4))
    if look.hood:
        rrect(c, -40, top_y + 92, 80, 34, 12, paint(look.top_shade))          # pocket
        c.drawArc(skia.Rect.MakeXYWH(-56, top_y - 26, 112, 64), 10, 160, False, paint(look.top_shade, stroke=12))
    if look.strings:
        for sx in (-16, 16):
            capsule(c, sx, top_y + 18, sx + (sx / 16) * 2, top_y + 62, 5, paint("#F4F4F4"))
            c.drawCircle(sx + (sx / 16) * 2, top_y + 64, 4, paint("#F4F4F4"))
    for sx, sy, ex, ey in arms:                       # hands
        c.drawCircle(ex, ey, 21, paint(look.skin))
        c.drawCircle(ex, ey, 21, paint(look.skin_shade, stroke=3))

    # head
    hy, r = top_y - 92, 100
    c.drawCircle(-r + 4, hy + 6, 18, paint(look.skin))                       # ears
    c.drawCircle(r - 4, hy + 6, 18, paint(look.skin))
    c.drawCircle(0, hy, r, paint(look.skin))
    c.drawCircle(0, hy + 10, r, radial(-30, hy - 30, r * 1.4, [look.skin, look.skin_shade], [0, 0.55]))
    _hair(c, hy, r, look)
    _face(c, hy, r, pose)
    c.restore()


def _torso_path(tw, th, top_y) -> skia.Path:
    p = skia.Path()
    p.moveTo(-tw / 2 + 18, top_y)
    p.lineTo(tw / 2 - 18, top_y)
    p.quadTo(tw / 2 + 6, top_y + 4, tw / 2 + 2, top_y + 40)
    p.lineTo(tw / 2 - 2, top_y + th - 10)
    p.quadTo(tw / 2 - 4, top_y + th + 4, tw / 2 - 22, top_y + th + 4)
    p.lineTo(-tw / 2 + 22, top_y + th + 4)
    p.quadTo(-tw / 2 + 4, top_y + th + 4, -tw / 2 + 2, top_y + th - 10)
    p.lineTo(-tw / 2 - 2, top_y + 40)
    p.quadTo(-tw / 2 - 6, top_y + 4, -tw / 2 + 18, top_y)
    p.close()
    return p


def _hair(c, hy, r, look: Look) -> None:
    p = skia.Path()
    if look.hair_style == "kid":
        p.addCircle(0, hy - 8, r * 1.0)
        c.save()
        clip = skia.Path()
        clip.addRect(skia.Rect.MakeXYWH(-r * 1.2, hy - r * 1.3, r * 2.4, r * 0.95))
        c.clipPath(clip, doAntiAlias=True)
        c.drawPath(p, paint(look.hair))
        c.restore()
        c.drawCircle(r * 0.78, hy - r * 0.55, r * 0.32, paint(look.hair))   # little bun
        return
    # short, slightly messy crop with a fringe
    p.moveTo(-r * 1.02, hy + r * 0.05)
    p.cubicTo(-r * 1.12, hy - r * 0.9, -r * 0.45, hy - r * 1.22, r * 0.12, hy - r * 1.12)
    p.cubicTo(r * 0.75, hy - r * 1.08, r * 1.14, hy - r * 0.62, r * 1.02, hy + r * 0.02)
    p.lineTo(r * 0.86, hy - r * 0.18)
    p.quadTo(r * 0.7, hy - r * 0.5, r * 0.42, hy - r * 0.46)   # fringe tufts
    p.quadTo(r * 0.3, hy - r * 0.3, r * 0.12, hy - r * 0.42)
    p.quadTo(-r * 0.05, hy - r * 0.28, -r * 0.24, hy - r * 0.44)
    p.quadTo(-r * 0.45, hy - r * 0.3, -r * 0.6, hy - r * 0.46)
    p.quadTo(-r * 0.8, hy - r * 0.42, -r * 0.86, hy - r * 0.14)
    p.close()
    c.drawPath(p, paint(look.hair))
    c.drawArc(skia.Rect.MakeXYWH(-r * 0.6, hy - r * 1.0, r * 0.7, r * 0.4), 200, 60, False,
              paint("#FFFFFF", 0.18, stroke=6))                                # shine


def _face(c, hy, r, pose: Pose) -> None:
    f = pose.face
    ey = hy + r * 0.12
    lx, ly = pose.look
    big = f in ("scared", "gasp", "shout")
    ew, eh = (r * 0.25, r * 0.31) if big else (r * 0.21, r * 0.25)
    for side in (-1, 1):
        ex = side * r * 0.38
        if pose.blink or pose.hold_breath and f == "calm":
            c.drawArc(skia.Rect.MakeXYWH(ex - ew, ey - 4, ew * 2, 18), 200, 140, False, paint("#16161C", stroke=7))
        else:
            c.drawOval(skia.Rect.MakeXYWH(ex - ew, ey - eh, ew * 2, eh * 2), paint("#FFFFFF"))
            pr = ew * (0.42 if big else 0.55)
            c.drawCircle(ex + lx * ew * 0.4, ey + ly * eh * 0.35, pr, paint("#16161C"))
            c.drawCircle(ex + lx * ew * 0.4 + pr * 0.35, ey + ly * eh * 0.35 - pr * 0.4, pr * 0.32, paint("#FFFFFF"))
        # brows
        by = ey - eh - r * 0.12
        inner, outer = ex - side * ew * 0.9, ex + side * ew * 0.9   # inner end is nearer the nose
        if f in ("worried", "scared", "gasp"):
            c.drawLine(inner, by - 14, outer, by + 2, paint("#16161C", stroke=9))      # inner raised
        elif f in ("determined", "shout"):
            c.drawLine(inner, by + 8, outer, by - 10, paint("#16161C", stroke=10))     # inner lowered
        else:
            c.drawLine(ex - ew * 0.8, by - 4, ex + ew * 0.8, by - 4, paint("#16161C", stroke=8))
    my = hy + r * 0.62
    mouth = paint("#5A2318")
    if f in ("scared", "shout", "gasp"):
        w, h = (r * 0.3, r * 0.26) if f != "shout" else (r * 0.36, r * 0.3)
        c.drawOval(skia.Rect.MakeXYWH(-w / 2, my - h / 2, w, h), mouth)
        c.drawOval(skia.Rect.MakeXYWH(-w * 0.3, my, w * 0.6, h * 0.35), paint("#D9605A"))
    elif pose.hold_breath:
        c.drawOval(skia.Rect.MakeXYWH(-r * 0.12, my - 8, r * 0.24, 16), paint("#5A2318", stroke=6))
        for side in (-1, 1):                      # puffed cheeks
            c.drawCircle(side * r * 0.55, my - 10, r * 0.2, paint("#E07A6B", 0.35))
    elif f == "worried":
        c.drawArc(skia.Rect.MakeXYWH(-r * 0.2, my - 2, r * 0.4, r * 0.22), 200, 140, False, paint("#5A2318", stroke=7))
    elif f in ("calm", "neutral"):
        c.drawArc(skia.Rect.MakeXYWH(-r * 0.18, my - r * 0.14, r * 0.36, r * 0.2), 20, 140, False, paint("#5A2318", stroke=7))
    elif f == "determined":
        c.drawLine(-r * 0.16, my, r * 0.16, my - 3, paint("#5A2318", stroke=8))


# ---------------------------------------------------------------- HUD

def hud_box(c, x, y, w, h, label: str, value: str, value_color="#FFFFFF", pulse: float = 0.0,
            bar: float | None = None, bar_color="#E8463C") -> None:
    """Dark navy rounded box with a tiny label over a big number (the examples' HUD)."""
    if pulse:
        c.save()
        c.translate(x + w / 2, y + h / 2)
        c.scale(1 + 0.08 * pulse, 1 + 0.08 * pulse)
        c.translate(-(x + w / 2), -(y + h / 2))
    rrect(c, x + 4, y + 8, w, h, 22, paint("#000000", 0.35, blur=10))
    rrect(c, x, y, w, h, 22, paint("#0E1A2B", 0.92))
    rrect(c, x, y, w, h, 22, paint("#3A4E6B", 0.9, stroke=3))
    text(c, label, x + 24, y + 42, 26, "#9FB0C8", font=OSWALD)
    text(c, value, x + 22, y + h - (40 if bar is not None else 22), 74, value_color)
    if bar is not None:
        n, gap = 10, 6
        bw = (w - 44 - gap * (n - 1)) / n
        for i in range(n):
            on = i < round(bar * n)
            rrect(c, x + 22 + i * (bw + gap), y + h - 30, bw, 14, 4,
                  paint(bar_color if on else "#2A3A52", 1.0 if on else 0.9))
    if pulse:
        c.restore()


def odds_color(v: float) -> str:
    return "#E8463C" if v < 30 else "#F5C518" if v < 60 else "#5BD46A"


def pill(c, cx, cy, label: str, border="#E8463C", size=44, appear: float = 1.0, fill="#0E1A2B") -> None:
    """Dark rounded label with a coloured border, centred on (cx, cy)."""
    if appear <= 0:
        return
    f = skia.Font(ANTON, size)
    tw = f.measureText(label)
    w, h = tw + size * 1.1, size * 1.55
    s = back_out(appear) if appear < 1 else 1
    c.save()
    c.translate(cx, cy)
    c.scale(s, s)
    rrect(c, -w / 2 + 3, -h / 2 + 7, w, h, h / 2, paint("#000000", 0.35, blur=8))
    rrect(c, -w / 2, -h / 2, w, h, h / 2, paint(fill, 0.95))
    rrect(c, -w / 2, -h / 2, w, h, h / 2, paint(border, stroke=5))
    c.drawString(label, -tw / 2, size * 0.36, f, paint("#FFFFFF"))
    c.restore()


def text(c, s: str, x, y, size, color="#FFFFFF", font=None, align="left", outline: float = 0,
         shadow: bool = False, alpha: float = 1.0) -> float:
    f = skia.Font(font or ANTON, size)
    w = f.measureText(s)
    if align == "center":
        x -= w / 2
    elif align == "right":
        x -= w
    if shadow:
        c.drawString(s, x + 4, y + 8, f, paint("#000000", 0.55 * alpha, blur=7))
    if outline:
        c.drawString(s, x, y, f, paint("#101018", alpha, stroke=outline))
    c.drawString(s, x, y, f, paint(color, alpha))
    return w


# ---------------------------------------------------------------- captions

@dataclass
class Word:
    text: str
    start: float
    end: float


@dataclass
class Caption:
    words: list[Word]
    hot: set[int] = field(default_factory=set)   # indexes of highlighted words
    hot_color: str = "#F5C518"

    @property
    def start(self):
        return self.words[0].start

    @property
    def end(self):
        return self.words[-1].end


def draw_caption(c, cap: Caption, t: float, y=1390, size=104) -> None:
    """2-3 words, white with dark outline, one highlighted word, pop-in per chunk."""
    f = skia.Font(ANTON, size)
    words = [w.text.upper() for w in cap.words]
    space = f.measureText(" ")
    widths = [f.measureText(w) for w in words]
    total = sum(widths) + space * (len(words) - 1)
    fit = min(1.0, 960 / total)                     # long chunks shrink to stay on screen
    pop = prog(t, cap.start - 0.03, 0.12)
    s = lerp(1.18, 1.0, ease_out(pop)) * fit
    c.save()
    c.translate(W / 2, y)
    c.scale(s, s)
    x = -total / 2
    for i, (wtxt, ww) in enumerate(zip(words, widths)):
        col = cap.hot_color if i in cap.hot else "#FFFFFF"
        c.drawString(wtxt, x + 5, 10, f, paint("#000000", 0.55, blur=8))
        c.drawString(wtxt, x, 0, f, paint("#101018", stroke=16))
        c.drawString(wtxt, x, 0, f, paint(col))
        x += ww + space
    c.restore()


# ---------------------------------------------------------------- frame helpers

def new_surface() -> tuple[skia.Surface, np.ndarray]:
    arr = np.zeros((H, W, 4), dtype=np.uint8)
    return skia.Surface(arr), arr


def shake(t: float, start: float, dur=0.35, amp=26) -> tuple[float, float]:
    k = prog(t, start, dur)
    if k <= 0 or k >= 1:
        return 0.0, 0.0
    d = (1 - k) ** 2 * amp
    return math.sin(t * 91) * d, math.cos(t * 77) * d


def vignette(c, strength=0.55) -> None:
    c.drawRect(skia.Rect.MakeWH(W, H), radial(W / 2, H / 2, H * 0.72, ["#000000", "#000000"], [0, strength]))


def flash(c, t, start, dur=0.18, color="#FFFFFF", peak=0.85) -> None:
    k = prog(t, start, dur)
    if 0 < k < 1:
        c.drawRect(skia.Rect.MakeWH(W, H), paint(color, peak * (1 - k)))
