#!/usr/bin/env bash
# One-time setup for stickman-stories. Makes two virtual environments:
#   ~/.cache/stickman-stories/anim  drawing, rendering, captions (about 400 MB)
#   ~/.cache/stickman-stories/tts   Qwen3-TTS voices (about 2 GB of packages; the 1.7B voice model, about
#                                   4 GB, downloads from Hugging Face on the first recording)
# Usage: bash setup.sh [anim|tts|all]   (default all)
set -euo pipefail
ROOT="${STICKMAN_HOME:-$HOME/.cache/stickman-stories}"
WHAT="${1:-all}"
mkdir -p "$ROOT"

mkvenv() {   # mkvenv DIR PACKAGES...
  local dir="$1"; shift
  if command -v uv >/dev/null; then
    uv venv -q --python 3.12 "$dir"
    uv pip install -q --python "$dir/bin/python" "$@"
  else
    python3 -m venv "$dir"
    "$dir/bin/python" -m pip install -q --upgrade pip
    "$dir/bin/python" -m pip install -q "$@"
  fi
}

if [[ "$WHAT" == anim || "$WHAT" == all ]]; then
  echo "== anim: skia-python, numpy, soundfile, imageio-ffmpeg, faster-whisper"
  mkvenv "$ROOT/anim" "skia-python>=144" numpy soundfile imageio-ffmpeg faster-whisper
fi
if [[ "$WHAT" == tts || "$WHAT" == all ]]; then
  echo "== tts: qwen-tts (torch, transformers), faster-whisper, soundfile"
  mkvenv "$ROOT/tts" qwen-tts faster-whisper soundfile numpy
fi
echo "Done. ANIM=$ROOT/anim/bin/python  TTS=$ROOT/tts/bin/python"
