# Punch coin photos onto a transparent background with a soft circular edge.
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "public" / "money" / "usd"

COINS = [
    "coin-penny.png",
    "coin-dime.png",
    "coin-quarter.png",
    "coin-half.png",
    "coin-dollar.png",
    "coin-nickel.jpg",
]


def cutout(path: Path) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    arr = np.asarray(im).copy()
    h, w = arr.shape[:2]
    cy, cx = (h - 1) / 2, (w - 1) / 2
    yy, xx = np.ogrid[:h, :w]
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)

    corners = np.stack(
        [
            arr[:16, :16, :3],
            arr[:16, -16:, :3],
            arr[-16:, :16, :3],
            arr[-16:, -16:, :3],
        ]
    )
    bg = corners.reshape(-1, 3).mean()
    rgb = arr[:, :, :3].astype(np.float32)

    if bg < 80:
        coin = rgb.max(axis=2) > 28
    else:
        coin = np.linalg.norm(rgb - 255, axis=2) > 18

    ys, xs = np.where(coin)
    if len(xs) < 50:
        radius = min(w, h) * 0.48
    else:
        radius = float(np.percentile(np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2), 99.0))
        radius *= 0.992

    feather = max(1.6, radius * 0.018)
    alpha = np.clip((radius - dist) / feather, 0, 1)
    alpha = alpha * alpha * (3 - 2 * alpha)
    arr[:, :, 3] = (alpha * 255).astype(np.uint8)
    return Image.fromarray(arr)


for name in COINS:
    src = ROOT / name
    if not src.exists():
        print("MISSING", name)
        continue
    out = ROOT / (src.stem + ".png")
    cutout(src).save(out, "PNG", optimize=True)
    print(f"OK {out.name} ({out.stat().st_size / 1024:.0f} KB)")
