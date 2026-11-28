from __future__ import annotations

import math

import skia

from kit import (GOLD, H, INK, W, Face, Look, blink_at, box, bust_at, clamp, dim, draw_bust,
                 label, lerp, line, linear, mix, oval, paint, poly, radial, rrect,
                 shape, soft_vignette)

DANIEL = Look(skin="#C68B59", hair="#1B1A1F", hair_style="short", outfit="hoodie",
              top="#2F3B45", top2="#1E262D", shirt="#F2EEE6", accent="#C9463D", stubble=True)
KARIS = Look(skin="#E2B18C", hair="#4A3628", hair_style="parted", outfit="cardigan",
             top="#6E4A52", top2="#54363E", shirt="#EFE3CF")

def paper(c, cx, cy, w, h, rot=0.0, color="#F6F1E4"):
    c.save()
    c.rotate(rot, cx, cy)
    c.drawRRect(skia.RRect.MakeRectXY(skia.Rect.MakeXYWH(cx - w / 2 + 14, cy - h / 2 + 18, w, h), 8, 8),
                paint("#000000", 0.28, blur=14))
    shape(c, box(cx - w / 2, cy - h / 2, w, h, 8), color, lw=5)
    c.restore()
    return cx - w / 2, cy - h / 2


def bust(c, x, look, name, face=None, seed=0.0, **kw):
    f = face or Face()
    f.mouth = max(f.mouth, x.talk(name))
    f.blink = max(f.blink, blink_at(x.t, seed))
    draw_bust(c, look, f, x.t, seed=seed, **kw)


def horse_side(c, cx, cy, s=1.0, color="#EDE7D8", a=1.0, eye=True):
    shape(c, oval(cx, cy, 185 * s, 92 * s), color, a=a)
    shape(c, poly((cx + 105 * s, cy - 45 * s), (cx + 185 * s, cy - 205 * s),
                  (cx + 245 * s, cy - 215 * s), (cx + 165 * s, cy - 25 * s)), color, a=a)
    shape(c, oval(cx + 255 * s, cy - 235 * s, 76 * s, 50 * s), color, a=a)
    shape(c, oval(cx + 305 * s, cy - 215 * s, 42 * s, 30 * s), mix(color, "#B9B2A4", 0.25), a=a)
    for dx in (-28, 18):
        shape(c, poly((cx + 235 * s + dx * s, cy - 270 * s), (cx + 250 * s + dx * s, cy - 340 * s),
                      (cx + 272 * s + dx * s, cy - 272 * s)), color, a=a, lw=5)
    for j in range(5):
        line(c, cx + (150 + j * 18) * s, cy - (110 + j * 18) * s,
             cx + (185 + j * 18) * s, cy - (150 + j * 18) * s, lw=6 * s, color=mix(color, INK, 0.35), a=a)
    for dx in (-110, -35, 55, 130):
        line(c, cx + dx * s, cy + 70 * s, cx + (dx + 12) * s, cy + 300 * s, lw=18 * s, color=color, a=a)
        line(c, cx + (dx + 12) * s, cy + 300 * s, cx + (dx + 12) * s, cy + 300 * s, lw=18 * s, color=INK, a=a)
    shape(c, poly((cx - 180 * s, cy - 20 * s), (cx - 300 * s, cy - 130 * s),
                  (cx - 275 * s, cy + 90 * s)), color, a=a)
    if eye:
        c.drawCircle(cx + 272 * s, cy - 248 * s, 9 * s, paint(INK, a))
        c.drawCircle(cx + 275 * s, cy - 251 * s, 3 * s, paint("#FFFFFF", a))


def horse_head(c, cx, cy, s=1.0, a=1.0, turn=0.0):
    c.save()
    c.rotate(-7 * turn, cx, cy)
    shape(c, oval(cx, cy, 205 * s, 165 * s), "#EDE7D8", a=a)
    shape(c, oval(cx + 150 * s, cy + 65 * s, 105 * s, 82 * s), "#DCD5C6", a=a)
    shape(c, poly((cx - 95 * s, cy - 125 * s), (cx - 55 * s, cy - 250 * s),
                  (cx - 5 * s, cy - 120 * s)), "#EDE7D8", a=a)
    shape(c, poly((cx + 55 * s, cy - 130 * s), (cx + 105 * s, cy - 240 * s),
                  (cx + 130 * s, cy - 105 * s)), "#EDE7D8", a=a)
    for j in range(6):
        line(c, cx - 150 * s + j * 55 * s, cy - 130 * s, cx - 120 * s + j * 55 * s, cy - 205 * s,
             lw=10 * s, color="#B9B2A4", a=a)
    ex = cx + (55 + 35 * turn) * s
    c.drawPath(oval(ex, cy - 15 * s, 34 * s, 30 * s), paint("#FBFAF6", a))
    c.drawCircle(ex + 5 * s, cy - 15 * s, 17 * s, paint(INK, a))
    c.drawCircle(ex + 10 * s, cy - 22 * s, 5 * s, paint("#FFFFFF", a))
    c.drawCircle(cx + 225 * s, cy + 55 * s, 8 * s, paint(INK, a))
    c.restore()


def bg_night_window(c, x):
    c.drawRect(skia.Rect.MakeWH(W, H), paint("#11151D"))
    for k in range(0, W, 120):
        line(c, k, 0, k, H, lw=3, color="#171D27")
    shape(c, box(110, 150, 860, 980, 10), "#202A33")
    c.drawRect(skia.Rect.MakeXYWH(140, 180, 800, 920), paint("#0B1420"))
    c.drawCircle(790, 330, 92, paint("#D9E2E8", 0.85, blur=18))
    for j, tx in enumerate((170, 300, 760, 880)):
        shape(c, poly((tx - 55, 1100), (tx + 55, 1100), (tx + 30, 520 + (j % 2) * 90),
                      (tx - 25, 560 + (j % 2) * 70)), "#101A22", lw=0)
    a = max(x.kw("white", 0.5), x.kw("know", 0.5))
    horse_side(c, 535, 900, 0.82, a=a)
    breath = x.kw("breathed", 0.5)
    for j in range(3):
        r = 26 + j * 22 + 18 * breath
        c.drawCircle(820 + j * 34, 690 - j * 12, r, paint("#DCE7EA", 0.20 * breath * (1 - j / 3), stroke=5))
    line(c, 540, 180, 540, 1100, lw=16, color="#202A33")
    line(c, 140, 640, 940, 640, lw=16, color="#202A33")
    shape(c, box(100, 1100, 880, 36, 8), "#2C3740")
    dim(c, 0.18)
    if x.line and x.line.get("speaker") == "DANIEL":
        bust_at(c, DANIEL, Face(brows="worried", smile=-0.1, mouth=x.talk("DANIEL")), x.t,
                cx=540, head_y=1180, s=0.52, seed=0.3)


def bg_road(c, x):
    c.drawRect(skia.Rect.MakeWH(W, H), linear(0, 0, 0, 1200, ["#25334A", "#4A5361"]))
    for j in range(12):
        tx = -40 + j * 100
        shape(c, oval(tx, 760, 70, 150 + (j * 37) % 60), "#1B2733", lw=0)
    shape(c, poly((-20, 1180), (W + 20, 1180), (760, 700), (320, 700)), "#3A414B", lw=0)
    for j in range(6):
        y = 760 + j * j * 22
        shape(c, box(520 - 8 - j * 2, y, 40 + j * 6, 18 + j * 3, 4), "#D9D3BC", lw=0)
    line(c, 850, 1180, 850, 420, lw=14, color="#1B2028")
    shape(c, box(800, 400, 100, 36, 10), "#1B2028")
    c.drawCircle(850, 455, 150, paint("#F6D7A0", 0.22, blur=40))
    shape(c, box(60, 620, 260, 560, 4), "#1A222C", lw=0)
    shape(c, poly((30, 640), (190, 500), (350, 640)), "#1A222C", lw=0)
    shape(c, box(150, 820, 80, 140, 4), "#E9B949", a=0.35)
    k = x.kw("seven", 0.4)
    rrect(c, 360, 250, 360, 120, 20, paint("#0D1014", 0.82 * k))
    label(c, "7 DAYS", 540, 335, 62, color=GOLD, weight=800, a=k)
    dim(c, 0.18)


def bg_forest(c, night=0.0, path=0.0):
    c.drawRect(skia.Rect.MakeWH(W, H), linear(0, 0, 0, 1200,
               [mix("#8FA9A0", "#1B2430", night), mix("#D7C9A6", "#26313A", night)]))
    shape(c, box(-20, 1120, W + 40, 820), mix("#6E7A5A", "#1B241F", night), lw=0)
    if path > 0:
        shape(c, poly((470, 620), (610, 620), (1040, 1920), (40, 1920)), "#B9A47C", a=path, lw=0)
    for j, tx in enumerate((30, 170, 330, 760, 920, 1040)):
        w = 42 + (j % 3) * 18
        shape(c, box(tx, 180 + (j % 2) * 90, w, 1100, 8), mix("#4A3A2E", "#141B1D", night), lw=0)
        shape(c, oval(tx + w / 2, 300 + (j % 2) * 90, 150, 95), mix("#5E7A5C", "#1D2A25", night), lw=0)
    for j in range(9):
        c.drawPath(oval(80 + j * 120, 1180 + (j % 3) * 60, 90, 28), paint(mix("#8FA06E", "#26332A", night), 0.7))
    dim(c, night * 0.5)


def daniel_walker(c, x, cx, cy, s=1.0, night=0.0, flashlight=False):
    swing = math.sin(x.t * 5.2) * 38 * s
    if flashlight:
        c.drawPath(poly((cx + 70 * s, cy - 150 * s), (cx + 560 * s, cy - 430 * s),
                        (cx + 620 * s, cy + 60 * s)), paint("#F6E7B8", 0.20, blur=30))
    line(c, cx - 30 * s, cy + 80 * s, cx - 30 * s + swing, cy + 330 * s, lw=34 * s, color="#1E262D")
    line(c, cx + 30 * s, cy + 80 * s, cx + 30 * s - swing, cy + 330 * s, lw=34 * s, color="#1E262D")
    shape(c, poly((cx - 95 * s, cy - 190 * s), (cx + 95 * s, cy - 190 * s),
                  (cx + 120 * s, cy + 100 * s), (cx - 120 * s, cy + 100 * s)), DANIEL.top, lw=7)
    shape(c, oval(cx, cy - 265 * s, 78 * s, 88 * s), DANIEL.skin, lw=7)
    shape(c, oval(cx, cy - 320 * s, 82 * s, 42 * s), DANIEL.hair, lw=0)
    line(c, cx + 80 * s, cy - 120 * s, cx + 190 * s, cy - 40 * s + swing * 0.3, lw=30 * s, color=DANIEL.top)
    if flashlight:
        shape(c, box(cx + 175 * s, cy - 60 * s, 70 * s, 34 * s, 8), "#D8C38A", lw=5)
        c.drawCircle(cx + 210 * s, cy - 43 * s, 12 * s, paint("#FFF2C2", 0.9))
    dim(c, night * 0.12)


def person_seated(c, cx, cy, s=1.0, look=KARIS, face=None):
    f = face or Face(smile=-0.05, brows="worried")
    shape(c, oval(cx, cy + 120 * s, 150 * s, 46 * s), "#3A2A22", lw=0)
    shape(c, poly((cx - 120 * s, cy - 60 * s), (cx + 120 * s, cy - 60 * s),
                  (cx + 150 * s, cy + 120 * s), (cx - 150 * s, cy + 120 * s)), look.top, lw=7)
    shape(c, oval(cx, cy - 170 * s, 74 * s, 84 * s), look.skin, lw=7)
    shape(c, oval(cx, cy - 220 * s, 78 * s, 40 * s), look.hair, lw=0)
    for sx in (-1, 1):
        line(c, cx + sx * 90 * s, cy - 20 * s, cx + sx * 45 * s, cy + 95 * s, lw=26 * s, color=look.top2)
        c.drawCircle(cx + sx * 45 * s, cy + 100 * s, 22 * s, paint(look.skin, stroke=5))
    c.drawPath(oval(cx, cy - 160 * s, 52 * s, 58 * s), paint(look.skin))
    line(c, cx - 18 * s, cy - 165 * s, cx + 18 * s, cy - 165 * s, lw=5)
    line(c, cx - 18 * s, cy - 140 * s, cx + 18 * s, cy - 140 * s, lw=5)


def person_standing(c, cx, cy, s=1.0, look=DANIEL, face=None):
    shape(c, poly((cx - 100 * s, cy - 240 * s), (cx + 100 * s, cy - 240 * s),
                  (cx + 125 * s, cy + 180 * s), (cx - 125 * s, cy + 180 * s)), look.top, lw=7)
    shape(c, oval(cx, cy - 330 * s, 78 * s, 88 * s), look.skin, lw=7)
    shape(c, oval(cx, cy - 385 * s, 82 * s, 42 * s), look.hair, lw=0)
    for sx in (-1, 1):
        line(c, cx + sx * 55 * s, cy + 170 * s, cx + sx * 70 * s, cy + 430 * s, lw=34 * s, color="#1E262D")


def s_window_horse(c, x):
    bg_night_window(c, x)


def s_road(c, x):
    bg_road(c, x)
    daniel_walker(c, x, 540, 1180, 0.72, night=0.25)


def s_search(c, x):
    night = 0.15 if x.n == 0 else 0.62
    bg_forest(c, night=night)
    daniel_walker(c, x, 540, 1120, 0.95, night=night, flashlight=True)
    if x.n == 1:
        for j in range(3):
            r = 90 + ((x.lt * 180 + j * 70) % 210)
            c.drawArc(skia.Rect.MakeXYWH(540 - r, 760 - r, 2 * r, 2 * r), -35, 70, False,
                      paint("#DCE7EA", 0.25 * (1 - (r - 90) / 210), stroke=5))


def s_poster(c, x):
    c.drawRect(skia.Rect.MakeWH(W, H), paint("#6C7A5A"))
    shape(c, box(470, 0, 140, 1920, 0), "#4A3A2E", lw=0)
    px, py = paper(c, 540, 860, 620, 760, rot=-2)
    rrect(c, px + 40, py + 40, 540, 420, 8, paint("#BFDDE6"))
    shape(c, oval(px + 310, py + 250, 120, 140), "#C68B59", lw=6)
    shape(c, oval(px + 310, py + 175, 128, 62), "#4A3628", lw=0)
    label(c, "KARIS", px + 310, py + 590, 72, color=INK, weight=800)
    cut = x.kw("cut", 0.4)
    for sx in (px + 90, px + 430):
        shape(c, box(sx, py - 20, 110, 70, 4), "#E9D9A8", lw=4)
        if cut > 0:
            shape(c, poly((sx + 110 * cut, py - 20), (sx + 110, py - 20),
                          (sx + 110, py + 20 * cut)), "#E9D9A8", lw=0)
    if cut > 0.2:
        line(c, px + 60, py - 5, px + 560, py + 45, lw=8, color="#C0392B", a=cut)


def s_horse_eyes(c, x):
    c.drawRect(skia.Rect.MakeWH(W, H), radial(W / 2, 900, 1100, ["#2A3138", "#10151B"]))
    a = max(x.kw("horse", 0.4), x.kw("choice", 0.4))
    turn = max(x.kw("turned", 0.5), x.kw("choice", 0.5))
    horse_head(c, 540, 900, 1.55, a=a, turn=turn)
    breath = x.kw("breathed", 0.5)
    for j in range(3):
        r = 30 + j * 26 + 20 * breath
        c.drawCircle(850 + j * 20, 1030 - j * 18, r, paint("#DCE7EA", 0.18 * breath * (1 - j / 3), stroke=5))
    soft_vignette(c, 0.35)


def s_forest_path(c, x):
    path = x.kw("before", 0.7)
    bg_forest(c, night=0.28, path=path)
    walk = x.kw("followed", 1.2)
    horse_side(c, 540, 760, 0.62, a=max(0.25, path))
    daniel_walker(c, x, 540 - 170 * (1 - walk), 1150, 0.78, night=0.28)
    k = x.kw("sign", 0.4)
    shape(c, box(120, 760, 210, 150, 8), "#C9B27A", a=k, lw=6)
    label(c, "KEEP OUT", 225, 855, 34, color=INK, weight=800, a=k)


def s_clearing(c, x):
    bg_forest(c, night=0.22, path=0.35)
    a = x.kw("sitting", 0.5)
    horse_side(c, 800, 980, 0.72, a=a)
    person_seated(c, 430, 1180, 1.05, face=Face(brows="worried", smile=-0.05))
    c.drawPath(oval(540, 1320, 430, 90), paint("#D9C9A0", 0.25 * a))


def s_karis(c, x):
    bg_forest(c, night=0.18, path=0.25)
    face = Face(brows="worried" if x.n == 0 else "neutral", smile=-0.1 if x.n == 0 else 0.1,
                eyes="open", look=(0.0, 0.0))
    bust(c, x, KARIS, "KARIS", face, seed=2.1, cx=540, cy=880, s=0.95)


def s_clearing_wide(c, x):
    bg_forest(c, night=0.3, path=0.3)
    person_standing(c, 220, 1080, 0.82, face=Face(brows="worried"))
    person_seated(c, 540, 1210, 0.92, face=Face(brows="worried", smile=-0.05))
    horse_side(c, 860, 1020, 0.68)
    shadow = max(x.kw("answer", 0.5), x.kw("understood", 0.5))
    if shadow > 0:
        shape(c, oval(700, 1180, 120 * shadow, 210 * shadow), "#0B1014", a=0.55 * shadow, lw=0)
        for j in range(3):
            r = 90 + ((x.lt * 120 + j * 60) % 180)
            c.drawCircle(700, 1180, r, paint("#8FB3D9", 0.18 * shadow * (1 - (r - 90) / 180), stroke=4))


def s_horse_hoof(c, x):
    c.drawRect(skia.Rect.MakeWH(W, H), paint("#4E5A45"))
    for j in range(14):
        line(c, -20 + j * 90, 1250, 40 + j * 90, 1180, lw=6, color="#6B7A58")
    t1, t2 = x.word("once"), x.word("twice")
    h1, h2 = x.kw("once", 0.18), x.kw("twice", 0.18)
    if t2 < 1e8 and x.lt >= t2 - 0.25:
        y = lerp(760, 1010, h2)
    elif h1 > 0:
        lift = clamp((x.lt - (t1 + 0.25)) / 0.25) if t1 < 1e8 else 0.0
        y = lerp(1010, 760, lift)
    else:
        y = lerp(760, 1010, h1)
    shape(c, box(430, y, 220, 300, 70), "#EDE7D8", lw=8)
    shape(c, box(455, y + 230, 170, 70, 26), "#B9B2A4", lw=7)
    for hit in (h1, h2):
        if hit > 0:
            for j in range(3):
                r = 80 + j * 70 + 40 * hit
                c.drawArc(skia.Rect.MakeXYWH(540 - r, 1320 - r * 0.35, 2 * r, r * 0.7), 0, 180, False,
                          paint("#D9C9A0", 0.45 * hit * (1 - j / 3), stroke=6))


def s_unseen(c, x):
    bg_forest(c, night=0.45, path=0.2)
    step = x.kw("third", 0.4)
    block = x.kw("horse", 0.4)
    for j in range(11):
        lx = 90 + j * 95
        ly = 1280 + (j % 3) * 55
        shape(c, oval(lx, ly, 46, 16), mix("#6B7A58", "#26332A", 0.4), lw=0)
    if step > 0:
        shape(c, oval(760, 1290, 70 * step, 26 * step), "#0B1014", a=0.85 * step, lw=0)
        for j in range(3):
            c.drawCircle(760, 1290, 70 + j * 60 + 30 * step, paint("#8FB3D9", 0.22 * step * (1 - j / 3), stroke=5))
    if block > 0:
        horse_side(c, 700, 1080, 0.78, a=block)
        soft_vignette(c, 0.5 * block)


SHOTS = {
    "window_horse": s_window_horse,
    "road": s_road,
    "search": s_search,
    "poster": s_poster,
    "horse_eyes": s_horse_eyes,
    "forest_path": s_forest_path,
    "clearing": s_clearing,
    "karis": s_karis,
    "clearing_wide": s_clearing_wide,
    "horse_hoof": s_horse_hoof,
    "unseen": s_unseen,
}

AMBIENCE = {k: "wind" for k in SHOTS}
WALKING = {"search", "forest_path", "road"}
QUIET = {"window_horse", "horse_eyes", "unseen"}
SCARE = {"unseen"}
LINGER = {"horse_hoof", "unseen"}
CLOSE_Z = {"poster": 1.12, "horse_eyes": 1.15, "karis": 1.1, "unseen": 1.12}
CUES = {
    "window_horse": [(0.0, "creak_short", 0.28)],
    "horse_hoof": [(0.0, "thud", 0.35)],
    "unseen": [(0.0, "drop", 0.45)],
    "endcard": [(0.0, "impact", 0.35)],
}
WORD_SFX = {
    "poster": [("cut", "click")],
    "horse_hoof": [("once", "thud"), ("twice", "thud")],
    "unseen": [("third", "drop")],
}
