import json
import os
import pathlib
import urllib.request

VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17"
MODEL_ID = "eleven_multilingual_v2"
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "friends-3d" / "raw"

LINES = [
    "Hari pertama mereka hilang, gua kira cuma drama. Tapi pas gua buka HP, lantai kamar gua mulai glitch kayak game error.",
    "Hari pertama. Gua keluar rumah. Mobil-mobil melayang di udara, tapi semuanya berhenti. Gak ada satu manusia pun.",
    "Hari ketiga. Nyari ke kampus. Malah nemu hologram raksasa. Muka mereka statusnya merah: OFFLINE.",
    "Hari ketujuh. Tanah mulai retak. Di bawahnya ruang hampa isi kode biru. Gua harus lompat-lompatan kayak di game biar gak kejeblos.",
    "Hari ke-30. Gua diserang kloningan mereka! Badannya kotak-kotak glitch, ngejar bawa kapak. Gua lari kenceng banget!",
    "Hari ke-60. Nemu server raksasa. Ada tombol 'Reboot Sistem'. Gua pencet dengan penuh harapan.",
    "Layar loading selesai. Tapi yang muncul... mereka! Lagi santai minum kopi di ruangan VIP, sambil liatin gua panik di CCTV. Salah satu bilang: 'Woy, kunci pintunya'.",
    "Ternyata mereka pura-pura hilang biar ngehindarin gua. Sistem pun nendang gua karena terlalu nyebelin.",
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
