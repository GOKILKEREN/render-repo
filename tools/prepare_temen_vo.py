import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "public" / "temen-hilang-3d" / "raw"
OUT = ROOT / "public" / "temen-hilang-3d" / "vo"
SCENE_TARGET_SECONDS = [17, 16, 15, 15, 15, 17, 18, 18]


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for index, seconds in enumerate(SCENE_TARGET_SECONDS, start=1):
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
