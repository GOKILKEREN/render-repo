import json
import os
import pathlib
import urllib.request

VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17"
MODEL_ID = "eleven_multilingual_v2"
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "deaf-3d" / "raw"

LINES = [
    "Day one. Sound vanished at 8:12 a.m. My alarm flashed, my coffee machine blinked, and the whole city forgot how to make noise.",
    "I stepped outside. Cars opened their mouths but released nothing. A bus hissed in pantomime. Pigeons flapped silently. A street musician sawed his violin like a mime. I checked my ears. Still there.",
    "Day three. Every call became a circle. Messages arrived empty. My name blinked red: OFFLINE. A crowd signed fast, but my hands were useless. For the first time, silence had a shape. It stood in front of me.",
    "Day seven. The city moved like a muted film. Doors slammed in slow motion. A conductor waved a baton at silence. The stock exchange rang with invisible bells. Even the dogs looked betrayed, staring at their own open mouths. I started to suspect this was not an accident.",
    "Day thirty. I found the source under a glass dome: a single switch labeled QUIET MODE. A countdown read: three billion opted in, one opted out. I stared at the tiny number. It was me. Someone had made silence a subscription, and almost everyone had renewed.",
    "Day sixty. I tried to warn them. My words rose as glass bubbles, then popped. A girl signed fast. I guessed wrong. She signed it again, slower, like explaining a door to a wall.",
    "Then came the twist. A child tapped my shoulder and signed: you are the only one still wearing headphones. The system had not broken the world. It had simply put everyone else on mute, and left the loudest person on Earth with a working microphone. I checked. Still on.",
    "She signed one last thing: you talk too much. Then black.",
]


def api_key():
    env = os.environ.get("ELEVENLABS_API_KEY")
    if env:
        return env.strip()
    path = pathlib.Path("/home/putera/animation/apikeyelevenlabs.txt")
    lines = [line.strip() for line in path.read_text().splitlines() if line.strip()]
    return next((line for line in lines if line.startswith("sk_")), max(lines, key=len))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    key = api_key()
    for index, text in enumerate(LINES, start=1):
        body = json.dumps(
            {
                "text": text,
                "model_id": MODEL_ID,
                "voice_settings": {
                    "stability": 0.5,
                    "similarity_boost": 0.75,
                    "style": 0.0,
                    "speed": 1.0,
                },
            }
        ).encode("utf-8")
        request = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE_ID}",
            data=body,
            headers={
                "xi-api-key": key,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=120) as response:
            payload = response.read()
        target = OUT / f"vo-{index:02d}.mp3"
        target.write_bytes(payload)
        print(f"{target.name} {len(payload)} bytes")


if __name__ == "__main__":
    main()
