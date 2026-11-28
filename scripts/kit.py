"""Drawing kit for the story look (see references/animation.md).

Flat vector with dark outlines, muted warm palette, chest-up characters facing camera with
lip-sync, blinks and swapped expressions, small white sentence-case captions, a serif title
band and a dark end card. Frames are 1080x1920.
"""
from __future__ import annotations

import math
from dataclasses import dataclass, field, replace

import skia

from engine import (FPS, H, HERE, W, clamp, ease_in_out, ease_out, lerp, linear, mix, paint,  # noqa: F401
                    prog, radial, rgb, rrect)

INK = "#2A2320"
LW = 7
INTER = {w: skia.Typeface.MakeFromFile(str(HERE / "fonts" / f"Inter-{w}.ttf")) for w in (600, 700, 800)}
CINZEL = skia.Typeface.MakeFromFile(str(HERE / "fonts" / "Cinzel-600.ttf"))
HAND = skia.Typeface.MakeFromFile(str(HERE / "fonts" / "Caveat-600.ttf"))
GOLD = "#E6D7A8"

# ---------------------------------------------------------------- shapes


def oval(cx, cy, rx, ry) -> skia.Path:
    p = skia.Path()
    p.addOval(skia.Rect.MakeLTRB(cx - rx, cy - ry, cx + rx, cy + ry))
    return p


def box(x, y, w, h, r=0) -> skia.Path:
    p = skia.Path()
    p.addRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(x, y, w, h), r, r))
    return p


def poly(*pts, close=True) -> skia.Path:
    p = skia.Path()
    p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    if close:
        p.close()
    return p


def shape(c, path, fill, lw=LW, ink=INK, a=1.0):
    c.drawPath(path, paint(fill, a))
    if lw:
        c.drawPath(path, paint(ink, a, stroke=lw))


def line(c, x0, y0, x1, y1, lw=LW, color=INK, a=1.0):
    c.drawLine(x0, y0, x1, y1, paint(color, a, stroke=lw))


def label(c, s, x, y, size, color="#FFFFFF", weight=700, align="center", spacing=0.0, font=None, a=1.0,
          outline=0.0, outline_color="#14100E"):
    f = skia.Font(font or INTER[weight], size)
    if spacing:
        widths = [f.measureText(ch) + spacing * size for ch in s]
        total = sum(widths) - spacing * size
        x0 = x - total / 2 if align == "center" else (x - total if align == "right" else x)
        for ch, w in zip(s, widths):
            if outline:
                c.drawString(ch, x0, y, f, paint(outline_color, a, stroke=outline))
            c.drawString(ch, x0, y, f, paint(color, a))
            x0 += w
        return total
    w = f.measureText(s)
    x0 = x - w / 2 if align == "center" else (x - w if align == "right" else x)
    if outline:
        c.drawString(s, x0, y, f, paint(outline_color, a, stroke=outline))
    c.drawString(s, x0, y, f, paint(color, a))
    return w


def wrap(s, size, width, weight=700, font=None) -> list[str]:
    f = skia.Font(font or INTER[weight], size)
    out, cur = [], ""
    for word in s.split():
        trial = (cur + " " + word).strip()
        if f.measureText(trial) > width and cur:
            out.append(cur)
            cur = word
        else:
            cur = trial
    return out + ([cur] if cur else [])


def dim(c, a, color="#0B1226"):
    if a > 0:
        c.drawRect(skia.Rect.MakeWH(W, H), paint(color, a))


def soft_vignette(c, a=0.45):
    c.drawRect(skia.Rect.MakeWH(W, H), radial(W / 2, H * 0.48, H * 0.75, ["#000000", "#000000"], [0, a]))


# ---------------------------------------------------------------- characters


@dataclass
class Look:
    skin: str = "#C68B59"
    hair: str = "#1B1A1F"
    hair_style: str = "short"          # short | bun | bald | swept | parted | long
    eyes: str = "#3B2A20"
    glasses: bool = False
    outfit: str = "hoodie"             # hoodie | suit | cardigan | vest | sweater | coat
    top: str = "#232328"
    top2: str = "#3A3A42"
    shirt: str = "#F2EEE6"
    accent: str = "#C9463D"
    tag: str = ""
    grey: str = ""                     # temple / streak colour
    stubble: bool = False


YOU = Look()                       # the default main character; the rest are the 30 DAYS cast, reusable as presets
MOM = Look(hair_style="bun", outfit="cardigan", top="#8A3F45", top2="#6E2F35", shirt="#EFE3CF", grey="#8E8C93")
HALE = Look(skin="#EDC9A8", hair="#E9E6E0", hair_style="bald", eyes="#5A6B7A", glasses=True, outfit="sweater",
            top="#7B5B3E", top2="#5F452F", shirt="#B9CCE0")
TOM = Look(skin="#F1CDAA", hair="#D9B66A", hair_style="swept", eyes="#4C6A8A", outfit="vest", top="#C8463C",
           top2="#A8372F", shirt="#F4F1EA", tag="TOM")
ANCHOR = Look(skin="#E2B18C", hair="#4A3628", hair_style="parted", eyes="#4A3628", outfit="suit", top="#25314D",
              top2="#1A2338", shirt="#F3F1EC", accent="#B5383A", grey="#9C9AA0")


@dataclass
class Face:
    mouth: float = 0.0        # 0 closed .. 1 wide open
    smile: float = 0.25       # -1 frown .. 1 big smile (closed mouth curve)
    brows: str = "neutral"    # neutral | worried | scared | angry | raised
    eyes: str = "open"        # open | wide | half | blank
    blink: float = 0.0
    tears: bool = False
    pale: float = 0.0
    look: tuple = (0.0, 0.0)


def blink_at(t, seed=0.0) -> float:
    """A blink every ~3.3 s, 0.14 s long, offset per character."""
    period = 3.3 + (seed % 1.0) * 1.4
    k = ((t + seed * 1.7) % period) / 0.14
    return max(0.0, 1 - abs(k - 0.5) * 2) if k < 1 else 0.0


def _skin(look, face):
    return mix(look.skin, "#B8BEC0", face.pale * 0.75)


def _torso(cx, top=1185) -> skia.Path:
    p = skia.Path()
    p.moveTo(cx - 420, H + 40)
    p.lineTo(cx - 405, top + 220)
    p.cubicTo(cx - 400, top + 70, cx - 260, top + 18, cx - 85, top)
    p.lineTo(cx + 85, top)
    p.cubicTo(cx + 260, top + 18, cx + 400, top + 70, cx + 405, top + 220)
    p.lineTo(cx + 420, H + 40)
    p.close()
    return p


def _outfit(c, look: Look, cx, top=1185):
    torso = _torso(cx, top)
    if look.outfit == "hoodie":
        shape(c, torso, look.top)
        hood = skia.Path()
        hood.moveTo(cx - 175, top + 12)
        hood.cubicTo(cx - 150, top + 120, cx + 150, top + 120, cx + 175, top + 12)
        hood.cubicTo(cx + 110, top - 40, cx - 110, top - 40, cx - 175, top + 12)
        shape(c, hood, look.top2)
        for s in (-1, 1):
            line(c, cx + s * 48, top + 95, cx + s * 58, top + 330, lw=9, color="#F1F1EE")
            c.drawCircle(cx + s * 58, top + 338, 9, paint("#F1F1EE"))
        line(c, cx - 230, H - 150, cx + 230, H - 150, lw=5, color="#17171B")
    elif look.outfit == "suit":
        shape(c, torso, look.top)
        shape(c, poly((cx - 95, top + 2), (cx + 95, top + 2), (cx, top + 330)), look.shirt)
        shape(c, poly((cx - 26, top + 40), (cx + 26, top + 40), (cx + 34, top + 300), (cx, top + 340),
                      (cx - 34, top + 300)), look.accent)
        for s in (-1, 1):
            shape(c, poly((cx + s * 95, top + 2), (cx + s * 175, top + 40), (cx + s * 70, top + 300),
                          (cx + s * 20, top + 330)), look.top2)
    elif look.outfit == "cardigan":
        shape(c, torso, look.top)
        shape(c, poly((cx - 110, top + 2), (cx + 110, top + 2), (cx, top + 300)), look.shirt)
        line(c, cx, top + 300, cx, H, lw=6)
        for k in range(3):
            c.drawCircle(cx + 18, top + 360 + k * 120, 11, paint(look.top2))
            c.drawCircle(cx + 18, top + 360 + k * 120, 11, paint(INK, stroke=4))
    elif look.outfit == "vest":
        shape(c, torso, look.shirt)
        for s in (-1, 1):
            vest = poly((cx + s * 80, top + 40), (cx + s * 300, top + 70), (cx + s * 410, top + 260),
                        (cx + s * 420, H + 40), (cx + s * 45, H + 40), (cx + s * 45, top + 260))
            shape(c, vest, look.top)
        if look.tag:
            rrect(c, cx - 300, top + 300, 170, 74, 10, paint("#F7F4EC"))
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(cx - 300, top + 300, 170, 74), 10, 10),
                        paint(INK, stroke=5))
            label(c, look.tag, cx - 215, top + 352, 40, color="#2A2320", weight=800)
    elif look.outfit == "sweater":
        shape(c, torso, look.shirt)
        vest = skia.Path()
        vest.moveTo(cx - 330, top + 60)
        vest.lineTo(cx - 90, top + 30)
        vest.lineTo(cx, top + 260)
        vest.lineTo(cx + 90, top + 30)
        vest.lineTo(cx + 330, top + 60)
        vest.lineTo(cx + 380, H + 40)
        vest.lineTo(cx - 380, H + 40)
        vest.close()
        shape(c, vest, look.top)
        for s in (-1, 1):
            shape(c, poly((cx + s * 20, top + 4), (cx + s * 110, top + 10), (cx + s * 70, top + 90)), look.shirt)
        for k in range(6):
            line(c, cx - 300 + k * 120, top + 420, cx - 300 + k * 120, H, lw=3, color=look.top2)
    else:  # coat
        shape(c, torso, look.top)
        shape(c, poly((cx - 90, top), (cx + 90, top), (cx, top + 210)), look.shirt)


def _hair_region(look: Look, hx, hy, rx, ry) -> skia.Path | None:
    """Hair as a cap: a slightly larger head oval cut by the hairline."""
    cap = oval(hx, hy - 12, rx + 16, ry + 18)
    if look.hair_style == "bald":
        return None
    if look.hair_style == "short":
        cut = skia.Path()
        cut.moveTo(hx - rx - 30, hy + 10)
        cut.lineTo(hx - rx + 18, hy - 20)
        for k in range(9):            # textured fringe
            x = hx - rx + 40 + k * (2 * rx - 80) / 8
            cut.lineTo(x - 18, hy - 120 + (k % 2) * 26)
        cut.lineTo(hx + rx - 18, hy - 20)
        cut.lineTo(hx + rx + 30, hy + 10)
        cut.lineTo(hx + rx + 40, hy - ry - 60)
        cut.lineTo(hx - rx - 40, hy - ry - 60)
        cut.close()
    elif look.hair_style in ("bun", "long", "parted"):
        cut = skia.Path()
        cut.moveTo(hx - rx - 30, hy + (60 if look.hair_style == "long" else -10))
        cut.cubicTo(hx - rx + 40, hy - 150, hx - 60, hy - 170, hx - 10, hy - 185)
        cut.cubicTo(hx + 60, hy - 165, hx + rx - 40, hy - 140, hx + rx + 30, hy + (60 if look.hair_style == "long" else -10))
        cut.lineTo(hx + rx + 40, hy - ry - 60)
        cut.lineTo(hx - rx - 40, hy - ry - 60)
        cut.close()
    else:  # swept
        cut = skia.Path()
        cut.moveTo(hx - rx - 30, hy - 30)
        cut.cubicTo(hx - 120, hy - 110, hx + 40, hy - 190, hx + rx + 30, hy - 60)
        cut.lineTo(hx + rx + 40, hy - ry - 60)
        cut.lineTo(hx - rx - 40, hy - ry - 60)
        cut.close()
    return skia.Op(cap, cut, skia.PathOp.kIntersect_PathOp)


def _eye(c, x, y, look: Look, face: Face, skin):
    wide = face.eyes == "wide"
    rx, ry = (48, 46) if wide else (42, 38)
    sclera = oval(x, y, rx, ry)
    c.drawPath(sclera, paint("#FBFAF6"))
    c.save()
    c.clipPath(sclera, doAntiAlias=True)
    dx, dy = face.look
    if face.eyes != "blank":
        c.drawCircle(x + dx * 14, y + dy * 10, 21, paint(look.eyes))
        c.drawCircle(x + dx * 14, y + dy * 10, 11 if not wide else 8, paint("#14100E"))
        c.drawCircle(x + dx * 14 - 7, y + dy * 10 - 8, 6, paint("#FFFFFF"))
    lid = max(face.blink, 0.42 if face.eyes == "half" else 0.0)
    if lid > 0:
        c.drawRect(skia.Rect.MakeLTRB(x - rx - 2, y - ry - 2, x + rx + 2, y - ry + 2 * ry * lid), paint(skin))
        line(c, x - rx, y - ry + 2 * ry * lid, x + rx, y - ry + 2 * ry * lid, lw=6)
    c.restore()
    c.drawPath(sclera, paint(INK, stroke=6))


def _brow(c, x, y, side, face: Face, color):
    inner, outer = (x - side * 40, y), (x + side * 48, y)
    lift = {"neutral": (0, 0), "worried": (-22, 4), "scared": (-30, -8), "angry": (18, -12), "raised": (-16, -18)}
    di, do = lift.get(face.brows, (0, 0))
    p = skia.Path()
    p.moveTo(inner[0], inner[1] + di)
    p.quadTo(x, y - 14 + (di + do) / 2, outer[0], outer[1] + do)
    q = paint(color, stroke=15)
    c.drawPath(p, q)


def _mouth(c, x, y, face: Face):
    o = clamp(face.mouth)
    if o < 0.12:
        s = face.smile
        p = skia.Path()
        p.moveTo(x - 58, y - s * 6)
        p.quadTo(x, y + s * 34, x + 58, y - s * 6)
        c.drawPath(p, paint(INK, stroke=7))
        return
    w, h = 44 + 44 * o + max(0, face.smile) * 16, 16 + 62 * o
    m = skia.Path()
    m.moveTo(x - w, y - h * 0.25)
    m.cubicTo(x - w * 0.6, y - h * 0.55, x + w * 0.6, y - h * 0.55, x + w, y - h * 0.25)
    m.cubicTo(x + w * 0.8, y + h, x - w * 0.8, y + h, x - w, y - h * 0.25)
    c.drawPath(m, paint("#6B2422"))
    c.save()
    c.clipPath(m, doAntiAlias=True)
    c.drawRect(skia.Rect.MakeLTRB(x - w, y - h, x + w, y - h * 0.32 + 12), paint("#FBFAF6"))
    c.drawPath(oval(x, y + h * 0.75, w * 0.6, h * 0.42), paint("#D46A6A"))
    c.restore()
    c.drawPath(m, paint(INK, stroke=6))


def draw_bust(c, look: Look, face: Face, t=0.0, cx=W / 2, cy=905, s=1.0, seed=0.0, tilt=0.0):
    """A chest-up character facing camera. cy is the head centre at s=1."""
    c.save()
    c.translate(cx, H)
    c.scale(s, s)
    c.translate(-cx, -H)
    breathe = math.sin(t * 1.7 + seed) * 3
    c.translate(0, breathe)
    sway = math.sin(t * 0.8 + seed * 2.1) * 1.1 + tilt
    skin = _skin(look, face)
    _outfit(c, look, cx)
    # neck
    shape(c, box(cx - 66, cy + 200, 132, 110), skin)
    c.drawPath(oval(cx, cy + 222, 74, 26), paint(mix(skin, "#000000", 0.18)))
    c.save()
    c.rotate(sway, cx, cy + 280)
    hx, hy, rx, ry = cx, cy, 258, 268
    if look.hair_style == "bun":
        shape(c, oval(hx, hy - ry - 30, 88, 74), look.hair)
    if look.hair_style == "long":
        shape(c, box(hx - rx - 26, hy - 60, 2 * rx + 52, 400, 60), look.hair)
    for sgn in (-1, 1):                                   # ears
        shape(c, oval(hx + sgn * (rx - 6), hy + 30, 36, 50), skin)
    head = oval(hx, hy, rx, ry)
    shape(c, head, skin)
    hair = _hair_region(look, hx, hy, rx, ry)
    if hair is not None:
        shape(c, hair, look.hair)
        c.save()
        c.clipPath(hair, doAntiAlias=True)
        c.drawPath(oval(hx - 70, hy - 210, 90, 26), paint("#FFFFFF", 0.14))
        if look.grey:
            for sgn in (-1, 1):
                c.drawPath(oval(hx + sgn * (rx - 10), hy - 40, 34, 70), paint(look.grey))
        c.restore()
    else:                                                  # bald: white tufts over the ears, shine on top
        c.drawPath(oval(hx - 80, hy - 190, 70, 22), paint("#FFFFFF", 0.35))
        for sgn in (-1, 1):
            tuft = skia.Path()
            tuft.moveTo(hx + sgn * (rx - 34), hy - 120)
            tuft.cubicTo(hx + sgn * (rx + 26), hy - 120, hx + sgn * (rx + 22), hy - 10, hx + sgn * (rx - 6), hy - 2)
            tuft.lineTo(hx + sgn * (rx - 30), hy - 60)
            tuft.close()
            shape(c, tuft, look.hair, lw=5)
    if look.stubble:
        for k in range(40):
            a = k * 2.399
            r = 60 + (k * 37 % 90)
            c.drawCircle(hx + math.cos(a) * r * 1.3, hy + 150 + abs(math.sin(a)) * r * 0.6, 3, paint("#5A4636", 0.6))
    # face
    ey = hy + 22
    c.drawPath(oval(hx - 138, hy + 110, 44, 22), paint("#E58C8C", 0.42 * (1 - face.pale)))
    c.drawPath(oval(hx + 138, hy + 110, 44, 22), paint("#E58C8C", 0.42 * (1 - face.pale)))
    for sgn in (-1, 1):
        _eye(c, hx + sgn * 100, ey, look, face, skin)
        _brow(c, hx + sgn * 100, ey - 78, sgn, face, mix(look.hair, "#000000", 0.25) if look.hair_style != "bald" else "#BDB8B0")
    nose = skia.Path()
    nose.moveTo(hx - 6, hy + 60)
    nose.quadTo(hx + 22, hy + 96, hx - 10, hy + 104)
    c.drawPath(nose, paint(INK, stroke=6))
    if face.tears:
        for sgn in (-1, 1):
            tear = skia.Path()
            tear.moveTo(hx + sgn * 80, ey + 36)
            tear.cubicTo(hx + sgn * 86, ey + 90, hx + sgn * 74, ey + 150, hx + sgn * 82, ey + 210)
            c.drawPath(tear, paint("#9FD0EA", 0.9, stroke=12))
    _mouth(c, hx, hy + 170, face)
    if look.glasses:
        for sgn in (-1, 1):
            c.drawCircle(hx + sgn * 100, ey, 66, paint("#FFFFFF", 0.12))
            c.drawCircle(hx + sgn * 100, ey, 66, paint(INK, stroke=7))
        br = skia.Path()
        br.moveTo(hx - 34, ey - 6)
        br.quadTo(hx, ey - 24, hx + 34, ey - 6)
        c.drawPath(br, paint(INK, stroke=7))
        line(c, hx - 166, ey - 6, hx - rx + 6, ey - 16, lw=7)
        line(c, hx + 166, ey - 6, hx + rx - 6, ey - 16, lw=7)
    c.restore()
    c.restore()


def bust_at(c, look: Look, face: Face, t=0.0, cx=W / 2, head_y=900, s=1.0, seed=0.0):
    """draw_bust scales about the bottom of the frame; this puts the head centre at head_y instead."""
    # the torso is fixed to the rig (shoulders at y=1185), so move the whole figure rather than the head
    c.save()
    c.translate(0, head_y - (H + (905 - H) * s))
    draw_bust(c, look, face, t, cx=cx, cy=905, s=s, seed=seed)
    c.restore()


# ---------------------------------------------------------------- captions, title, end card


def caption(c, s, a=1.0, y=1590):   # bottom of the frame, just above the Shorts title/buttons
    lines = wrap(s, 50, 900, weight=800)
    for k, ln in enumerate(lines[:2]):
        yy = y + k * 62 - (len(lines[:2]) - 1) * 31
        label(c, ln, W / 2, yy + 3, 50, color="#000000", weight=800, a=0.35 * a)
        label(c, ln, W / 2, yy, 50, color="#FFFFFF", weight=800, a=a, outline=9)


def title_band(c, day: str, a=1.0, title="30 DAYS"):
    c.drawRect(skia.Rect.MakeWH(W, 330), linear(0, 0, 0, 330, ["#0E1418", "#0E1418"], 1.0))
    c.drawRect(skia.Rect.MakeWH(W, 330), paint("#0E1418", 0.55 * a))
    p = linear(0, 250, 0, 420, ["#0E1418", "#0E1418"])
    p.setShader(skia.GradientShader.MakeLinear([skia.Point(0, 300), skia.Point(0, 420)],
                                               [rgb("#0E1418", 0.55 * a), rgb("#0E1418", 0)]))
    c.drawRect(skia.Rect.MakeXYWH(0, 300, W, 120), p)
    size = 112 if len(title) <= 12 else max(58, int(112 * 12 / len(title)))
    label(c, title, W / 2, 175, size, color=GOLD, font=CINZEL, spacing=0.12, a=a)
    label(c, day, W / 2, 250, 38, color="#FFFFFF", weight=700, spacing=0.28, a=a)


def end_card(c, t, day_label, question, a_text, b_text, at_a=1.0, at_b=2.0, at_end=3.2, hl_a=0.0, hl_b=0.0,
             title="30 DAYS"):
    c.drawRect(skia.Rect.MakeWH(W, H), paint("#0D1014"))
    k = lambda d: ease_out(prog(t, d, 0.5))  # noqa: E731
    size = 104 if len(title) <= 12 else max(54, int(104 * 12 / len(title)))
    label(c, title, W / 2, 560, size, color=GOLD, font=CINZEL, spacing=0.12, a=k(0.0))
    line(c, W / 2 - 150 * k(0.1), 615, W / 2 + 150 * k(0.1), 615, lw=3, color=GOLD)
    label(c, day_label, W / 2, 705, 36, color=GOLD, weight=700, spacing=0.26, a=k(0.3))
    for j, ln in enumerate(wrap(question, 56, 880, 800)):
        label(c, ln, W / 2, 800 + j * 70, 56, color="#FFFFFF", weight=800, a=k(0.5))
    for j, (letter, txt, col, d) in enumerate((("A", a_text, "#E9B949", at_a), ("B", b_text, "#D9534F", at_b))):
        y0 = 940 + j * 230
        aa = k(d)
        hl = (hl_a, hl_b)[j]                                  # lit while the narrator reads this option
        c.save()
        c.translate(540, y0 + 95)
        c.scale(1 + 0.05 * hl, 1 + 0.05 * hl)
        c.translate(-540, -(y0 + 95))
        if hl > 0:
            c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(100, y0 - 10, 880, 210), 30, 30), paint(col, 0.35 * hl, blur=24))
            rrect(c, 110, y0, 860, 190, 26, paint(col, 0.16 * hl))
        rrect(c, 110, y0, 860, 190, 26, paint("#FFFFFF", 0.06 * aa))
        c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(110, y0, 860, 190), 26, 26), paint(col, aa, stroke=4))
        c.drawCircle(200, y0 + 95, 52, paint(col, aa))
        label(c, letter, 200, y0 + 117, 62, color="#0D1014", weight=800, a=aa)
        rows = wrap(txt, 44, 640, 700)
        for r, ln in enumerate(rows[:3]):
            label(c, ln, 285, y0 + 105 - (len(rows[:3]) - 1) * 26 + r * 52, 44, color="#FFFFFF", weight=700,
                  align="left", a=aa)
        c.restore()
    aa = k(at_end)
    rrect(c, W / 2 - 230, 1470, 460, 96, 48, paint(GOLD, aa))
    label(c, "COMMENT  A  OR  B", W / 2, 1532, 38, color="#0D1014", weight=800, a=aa)
    label(c, "+ FOLLOW so you don't miss tomorrow", W / 2, 1650, 34, color="#A9A9AE", weight=600, a=aa)
