import asyncio
import json
import subprocess
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[1]
VOICE = "en-US-GuyNeural"
RATE = "+0%"
PITCH = "+0Hz"
TEXT = (ROOT / "content/voiceover.txt").read_text().strip()
RAW = ROOT / "public/audio/voice_raw.mp3"
WAV = ROOT / "sound/vo/voice.wav"
WORDS = ROOT / "sound/vo/words.json"
META = ROOT / "sound/vo/voice_meta.json"
PUBLIC_VOICE = ROOT / "public/audio/voice.mp3"


async def generate():
    audio = bytearray()
    words = []
    communicate = edge_tts.Communicate(TEXT, VOICE, rate=RATE, pitch=PITCH)
    async for chunk in communicate.stream():
        kind = chunk.get("type")
        if kind == "audio":
            audio.extend(chunk["data"])
        elif kind == "WordBoundary":
            data = chunk["data"]
            start = int(data["offset"]) / 10_000_000
            end = (int(data["offset"]) + int(data["duration"])) / 10_000_000
            words.append({"w": data["text"], "s": round(start, 4), "e": round(end, 4)})
    return audio, words


def main():
    audio, words = asyncio.run(generate())
    RAW.parent.mkdir(parents=True, exist_ok=True)
    WAV.parent.mkdir(parents=True, exist_ok=True)
    META.parent.mkdir(parents=True, exist_ok=True)
    RAW.write_bytes(audio)
    PUBLIC_VOICE.write_bytes(audio)
    WORDS.write_text(json.dumps(words, indent=2) + "\n")

    subprocess.run([
        "ffmpeg", "-loglevel", "error", "-y", "-i", str(RAW),
        "-ac", "1", "-ar", "48000", str(WAV),
    ], check=True)

    duration = float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "csv=p=0", str(RAW),
    ], text=True).strip())

    META.write_text(json.dumps({
        "voice": VOICE,
        "rate": RATE,
        "pitch": PITCH,
        "characters": len(TEXT),
        "duration": round(duration, 3),
        "words": len(words),
    }, indent=2) + "\n")
    print(json.dumps({"voice": VOICE, "duration": round(duration, 3), "words": len(words)}))


if __name__ == "__main__":
    main()
