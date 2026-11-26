import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "public" / "friends-3d" / "raw"
OUT = ROOT / "public" / "friends-3d" / "vo"
TARGETS = [10, 15, 15, 20, 20, 15, 20, 5]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for index, seconds in enumerate(TARGETS, start=1):
        source = RAW / f"vo-{index:02d}.mp3"
        target = OUT / f"vo-{index:02d}.mp3"
        if not source.exists():
            raise SystemExit(f"missing {source}")
        command = [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-i",
            str(source),
            "-af",
            f"apad=whole_dur={seconds},atrim=duration={seconds}",
            "-t",
            str(seconds),
            "-ar",
            "48000",
            "-ac",
            "1",
            "-c:a",
            "libmp3lame",
            "-b:a",
            "128k",
            str(target),
        ]
        subprocess.run(command, check=True)
        print(f"{target.name} {seconds}s")


if __name__ == "__main__":
    main()
