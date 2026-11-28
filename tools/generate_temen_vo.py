import json
import os
import pathlib
import urllib.request

VOICE_ID = "CwhRBWXzGAHq8TQ4Fs17"
MODEL_ID = "eleven_multilingual_v2"
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "temen-hilang-3d" / "raw"

LINES = [
    'Hari pertama. Temen gue, Bimo, hilang. Chat terakhirnya cuma dua kata: "Gue ke dulu ya." Gue bales pakai emoji, dikirim, centangnya biru. Satu jam, dua jam, besoknya... tetap biru. Gue belum sadar kalau itu pamit.',
    "Hari kedua. Gue telepon lima belas kali. Nggak diangkat, langsung masuk voicemail. Story-nya masih dua jam lalu, lokasinya... kebun? Gue nggak pernah denger dia suka kebun. Gue mulai nanya-nanya ke temen satu geng. Semua bilang nggak tahu.",
    'Hari ketiga. Gue lapor ke kantor polisi. Petugasnya bilang, "Sabar, Pak, baru tiga hari." Gue bilang, "Itu temen gue, bukan kucing!" Dia cuma kasih formulir dan suruh pulang. Gue pulang bawa kertas, bukan harapan.',
    'Hari kelima. Gue mimpi dia manggil-manggil dari kejauhan. Bangun, keringetan, dan... ada jejak kuda di depan pintu. Gue pikir, "Gue udah gila ya?" Terus gue sapu jejaknya. Takut istri kosan gue lihat.',
    "Hari ketujuh. Tujuh hari, bro. Poster udah nempel di semua tiang, grup WA udah gue spam sampai di mute, tukang bubur juga gue tanya. Nada. Nggak ada. Gue mulai nerima kalau dia memang pergi.",
    "Gue buka chat lama, cari alamat. Nemu foto dia. Naik kuda. Waktu liburan tahun lalu. Gue nggak ngeh waktu itu. Kenapa baru sekarang gue ngeh? Di foto itu, dia senyum... tapi tangannya pegang tali kuda erat banget.",
    "Terus... gue denger suara. Dari kebun sebelah. Rodok... rodok... rodok. Gue takut, tapi gue buka juga pintunya. Jantung gue mau copot. Kebun gelap, rumput bergerak, dan ada bayangan besar makin dekat.",
    'Dan dia ada di sana. Naik kuda. Utuh. Sehat. Bimo: "Bro, gue cuma nyewa kuda tujuh hari. Rodok-rodok terus, gak bisa turun, HP gue ketinggalan di rumah." Gue: "KOK NGGAK BILANG?!" Dia: "Gue kirim chat kok."',
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
