import json
import re
import shutil
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

ROOT = Path(__file__).resolve().parents[1]
SKILL_SOUND = Path("/home/putera/.agents/skills/video-sound")
SKILL_SFX = Path("/home/putera/.agents/skills/motion-sound-design")
VOICE_META = ROOT / "sound/vo/voice_meta.json"
WORDS_FILE = ROOT / "sound/vo/words.json"
SFX_LIB = ROOT / "sound/sfx_lib"
SFX_OUT = ROOT / "sound/sfx"
MUSIC_OUT = ROOT / "sound/music/bed.wav"
ROOM_OUT = ROOT / "sound/sfx/room.wav"
CUES = ROOT / "sound/cues.json"
MIX_WAV = ROOT / "sound/mix.wav"
MIX_MP3 = ROOT / "public/audio/mix.mp3"
TIMING = ROOT / "src/data/timing.json"
SR = 48000


def norm(word):
    return re.sub(r"[^a-z0-9]", "", word.lower())


def find_phrase(words, phrase, start=0):
    target = [norm(w) for w in phrase]
    for i in range(start, len(words) - len(target) + 1):
        if [norm(words[i + j]["w"]) for j in range(len(target))] == target:
            return words[i]["s"]
    return None


def write_wav(path, data):
    wavfile.write(path, SR, np.clip(data, -1.0, 1.0).astype(np.float32))


def make_music(duration):
    n = int(duration * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(17)
    drone = (
        0.42 * np.sin(2 * np.pi * 55 * t)
        + 0.24 * np.sin(2 * np.pi * 82.5 * t + 0.6)
        + 0.16 * np.sin(2 * np.pi * 110 * t + 1.2)
    )
    pulse = 0.18 * np.sin(2 * np.pi * 1.5 * t) * np.sin(2 * np.pi * 220 * t)
    noise = sosfilt(butter(2, 900, "lp", fs=SR, output="sos"), rng.standard_normal(n)) * 0.12
    body = drone + pulse + noise
    lfo = 0.85 + 0.15 * np.sin(2 * np.pi * 0.055 * t)
    fade = np.minimum(1.0, t / 1.2) * np.minimum(1.0, (duration - t) / 2.5)
    mono = body * lfo * np.clip(fade, 0.0, 1.0)
    mono = mono / (np.max(np.abs(mono)) + 1e-9) * 0.58
    stereo = np.stack([mono, np.roll(mono, 240) * 0.94], axis=1)
    write_wav(MUSIC_OUT, stereo)


def make_room(duration):
    n = int(duration * SR)
    rng = np.random.default_rng(29)
    noise = sosfilt(butter(2, [90, 3200], "bp", fs=SR, output="sos"), rng.standard_normal(n))
    noise = noise / (np.max(np.abs(noise)) + 1e-9) * 0.2
    write_wav(ROOM_OUT, np.stack([noise, noise], axis=1))


def make_scene_starts(anchors, duration):
    day1 = anchors["day1"]
    day7 = anchors["day7"]
    day30 = anchors["day30"]
    day90 = anchors["day90"]
    day365 = anchors["day365"]
    reveal = anchors["reveal"]
    raw = [
        0.0,
        min(2.5, day1 - 0.1),
        day1,
        min(day1 + 7.0, day7 - 0.2),
        min(day1 + 14.0, day7 - 0.1),
        day7,
        day30,
        min(day30 + 6.0, day90 - 0.2),
        day90,
        day365,
        min(day365 + 16.0, reveal - 0.2),
        reveal,
    ]
    starts = []
    for value in raw:
        if not starts:
            starts.append(max(0.0, value))
        else:
            starts.append(max(starts[-1] + 0.5, min(value, duration - 1.0)))
    while len(starts) < 12:
        starts.append(duration - 1.0)
    return starts


def main():
    meta = json.loads(VOICE_META.read_text())
    words = json.loads(WORDS_FILE.read_text())
    voice_duration = float(meta["duration"])
    duration = round(max(150.0, voice_duration + 2.0), 3)

    anchors = {
        "hook": words[0]["s"] if words else 0.0,
        "day1": find_phrase(words, ["Day", "one"]) or 8.0,
        "day7": find_phrase(words, ["Day", "seven"]) or 30.0,
        "day30": find_phrase(words, ["By", "day", "thirty"]) or 48.0,
        "day90": find_phrase(words, ["Day", "ninety"]) or 70.0,
        "day365": find_phrase(words, ["Day", "three"]) or 100.0,
        "reveal": find_phrase(words, ["But", "here"]) or 130.0,
    }
    starts = make_scene_starts(anchors, duration)
    scenes = []
    for i, start in enumerate(starts):
        end = starts[i + 1] if i + 1 < len(starts) else duration
        scenes.append({
            "id": f"S{i + 1:02d}",
            "start": round(start, 3),
            "end": round(end, 3),
        })

    TIMING.parent.mkdir(parents=True, exist_ok=True)
    TIMING.write_text(json.dumps({
        "fps": 30,
        "width": 1080,
        "height": 1920,
        "durationSec": duration,
        "totalFrames": round(duration * 30),
        "anchors": anchors,
        "scenes": scenes,
    }, indent=2) + "\n")

    make_music(duration)
    make_room(8.0)

    if not any(SFX_LIB.glob("*.wav")):
        subprocess.run([sys.executable, str(SKILL_SFX / "scripts/sfx.py"), "synth", str(SFX_LIB)], check=True)

    copies = {
        "tick_1.wav": "tick.wav",
        "click_1.wav": "click.wav",
        "swish_1.wav": "swish.wav",
        "whoosh_1.wav": "whoosh.wav",
        "thud_1.wav": "thud.wav",
        "chime_1.wav": "chime.wav",
        "shine_1.wav": "shine.wav",
        "pop_1.wav": "pop.wav",
    }
    for src, dst in copies.items():
        source = SFX_LIB / src
        if source.exists():
            shutil.copyfile(source, SFX_OUT / dst)

    sfx_events = [
        ("tick", anchors["hook"] + 0.05, "first iron atom pulse"),
        ("click", starts[1], "train freezes"),
        ("thud", starts[2] + 0.4, "bridge collapse"),
        ("whoosh", starts[4] + 0.2, "oxygen leaves blood"),
        ("click", starts[5] + 0.5, "farm tools fail"),
        ("swish", starts[6] + 0.4, "shelves empty"),
        ("thud", starts[7] + 0.3, "hospital overload"),
        ("whoosh", starts[8] + 0.2, "time jump to day 90"),
        ("pop", starts[8] + 3.0, "stone tool appears"),
        ("chime", starts[9] + 0.3, "day 365 village reveal"),
        ("shine", starts[10] + 0.4, "fire ignites"),
        ("chime", starts[11] + 0.5, "final star reveal"),
    ]
    tracks = [
        {"id": "voice", "role": "voice", "file": "vo/voice.wav", "start": 0.0, "gain_db": 0},
        {"id": "bed", "role": "music", "file": "music/bed.wav", "start": 0.0, "gain_db": -11, "fade_in": 0.5, "fade_out": 2.5, "length": duration},
        {"id": "room", "role": "ambience", "file": "sfx/room.wav", "start": 0.0, "loop": True, "gain_db": -34},
    ]
    for i, (kind, at, moment) in enumerate(sfx_events):
        tracks.append({
            "id": f"sfx{i + 1:02d}",
            "role": "sfx",
            "file": f"sfx/{kind}.wav",
            "start": round(min(at, duration - 1.5), 3),
            "at": round(min(at, duration - 1.5), 3),
            "gain_db": -5,
            "moment": moment,
        })

    CUES.write_text(json.dumps({
        "duration": duration,
        "fps": 30,
        "platform": "youtube",
        "target": {"lufs": -14, "true_peak": -1.0},
        "duck": {"depth_db": 12, "ramp": 0.25},
        "checks": {"voice_over_music_db": 14},
        "tracks": tracks,
    }, indent=2) + "\n")

    subprocess.run([
        sys.executable, str(SKILL_SOUND / "scripts/sound.py"),
        "mix", str(CUES), "-o", str(MIX_WAV),
    ], check=True)
    subprocess.run([
        "ffmpeg", "-loglevel", "error", "-y", "-i", str(MIX_WAV),
        "-codec:a", "libmp3lame", "-q:a", "2", str(MIX_MP3),
    ], check=True)

    check = subprocess.run([
        sys.executable, str(SKILL_SOUND / "scripts/sound.py"),
        "check", str(MIX_WAV), "--cues", str(CUES),
    ], capture_output=True, text=True)
    (ROOT / "sound/check.json").write_text(check.stdout or check.stderr)
    print(json.dumps({"duration": duration, "scenes": len(scenes), "check_exit": check.returncode}))


if __name__ == "__main__":
    main()
