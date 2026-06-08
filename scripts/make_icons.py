"""Generuje kwadratowe ikony PWA z logo Onyx (public/icon-source.png).
Złote logo na ciemnym tle (#0f172a), wyśrodkowane z marginesem.
"""
from PIL import Image
import os

SRC = "public/icon-source.png"
ICONS_DIR = "public/icons"
os.makedirs(ICONS_DIR, exist_ok=True)

BG = (255, 255, 255, 255)  # białe tło — logo Onyx ma białe tło, robimy czysty kafelek

logo = Image.open(SRC).convert("RGBA")


def make(size, pad_ratio, out_path):
    canvas = Image.new("RGBA", (size, size), BG)
    inner = int(size * (1 - 2 * pad_ratio))
    lw, lh = logo.size
    scale = min(inner / lw, inner / lh)
    nw, nh = max(1, int(lw * scale)), max(1, int(lh * scale))
    resized = logo.resize((nw, nh), Image.LANCZOS)
    x = (size - nw) // 2
    y = (size - nh) // 2
    canvas.alpha_composite(resized, (x, y))
    canvas.save(out_path)
    print("wrote", out_path, f"{size}x{size}")


# Ikony do manifestu PWA (logo ma własny margines, więc dokładamy mało)
make(192, 0.04, os.path.join(ICONS_DIR, "icon-192.png"))
make(512, 0.04, os.path.join(ICONS_DIR, "icon-512.png"))
# Maskable — większy margines (safe-zone), OS zaokrągla bez obcinania logo
make(512, 0.14, os.path.join(ICONS_DIR, "icon-512-maskable.png"))

# Auto-ikony Next.js App Router
make(256, 0.04, "src/app/icon.png")
make(180, 0.04, "src/app/apple-icon.png")

print("OK")
