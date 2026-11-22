import base64
import json
import os
import re
import subprocess
import urllib.request
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
VOICE_ID = os.environ.get("ELEVENLABS_VOICE_ID", "TX3LPaxmHKxFdv7VOQHJ")
MODEL = os.environ.get("ELEVENLABS_MODEL", "eleven_multilingual_v2")
API_KEY = os.environ.get("ELEVENLABS_API_KEY")
TEXT = (ROOT / "content/voiceover.txt").read_text().strip()
RAW = ROOT / "public/audio/voice_raw.mp3"
WAV = ROOT / "sound/vo/voice.wav"
WORDS = ROOT / "sound/vo/words.json"
META = ROOT / "sound/vo/voice_meta.json"
PUBLIC_VOICE = ROOT / "public/audio/voice.mp3"


def word_timings(alignment):
    chars = alignment["characters"]
    starts = alignment["character_start_times_seconds"]
    ends = alignment["character_end_times_seconds"]
    result = []
    current = ""
    start = 0.0
    end = 0.0
    for ch, s, e in zip(chars, starts, ends):
        if re.match(r"[\w']", ch):
            if not current:
                start = s
            current += ch
            end = e
        elif current:
            result.append({"w": current, "s": round(start, 4), "e": round(end, 4)})
            current = ""
    if current:
        result.append({"w": current, "s": round(start, 4), "e": round(end, 4)})
    return result


def main():
    if not API_KEY:
        raise SystemExit("ELEVENLABS_API_KEY is required")
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}/with-timestamps?output_format=mp3_44100_128"
    body = json.dumps({
        "text": TEXT,
        "model_id": MODEL,
        "voice_settings": {
            "stability": 0.4,
            "similarity_boost": 0.8,
            "style": 0.35,
            "use_speaker_boost": True,
            "speed": 1.0,
        },
    }).encode()
    request = urllib.request.Request(url, data=body, headers={
        "xi-api-key": API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    })
    with urllib.request.urlopen(request, timeout=300) as response:
        payload = json.loads(response.read())
        credits = response.headers.get("elevenlabs-credits-used")

    RAW.write_bytes(base64.b64decode(payload["audio_base64"]))
    PUBLIC_VOICE.write_bytes(RAW.read_bytes())
    words = word_timings(payload["alignment"])
    WORDS.write_text(json.dumps(words, indent=2) + "\n")

    subprocess.run([
        "ffmpeg", "-loglevel", "error", "-y", "-i", str(RAW),
        "-ac", "1", "-ar", "48000", str(WAV),
    ], check=True)

    with wave.open(str(WAV), "rb") as wf:
        duration = round(wf.getnframes() / wf.getframerate(), 3)

    META.write_text(json.dumps({
        "voice_id": VOICE_ID,
        "model": MODEL,
        "characters": len(TEXT),
        "duration": duration,
        "credits": credits,
        "words": len(words),
    }, indent=2) + "\n")
    print(json.dumps({"duration": duration, "words": len(words), "credits": credits}))


if __name__ == "__main__":
    main()
