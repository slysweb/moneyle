# Turn downloaded bill/coin photos into game-ready WebP files.
# Coins: the background is flood-filled from the edges, so polygonal and
# scalloped coins keep their shape. Bills: plain margins are trimmed.
# Originals are moved to drafts/money-src/<currency>/ (not deployed).
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
MONEY = ROOT / "public" / "money"
ARCHIVE = ROOT / "drafts" / "money-src"

COIN_MAX = 360
BILL_MAX_W = 800

# currency -> {source file: output name}
JOBS = {
    "aud": {
        "australia-5-cents-2024.jpg": "coin-cents-5",
        "australia-10-cents-2024.jpg": "coin-cents-10",
        "australia-20-cents-2024.jpg": "coin-cents-20",
        "australia-50-cents-2024.jpg": "coin-cents-50",
        "australia-1-dollar-2023.jpg": "coin-dollar-1",
        "australia-2-dollars-2024.jpg": "coin-dollars-2",
        "bill-5.webp": "bill-5",
        "bill-10.webp": "bill-10",
        "bill-20.webp": "bill-20",
        "bill-50.webp": "bill-50",
        "bill-100.webp": "bill-100",
    },
    "inr": {
        "india-1-rupee-2023.jpg": "coin-rupee-1",
        "india-2-rupees-2019.jpg": "coin-rupees-2",
        "india-5-rupees-2021.jpg": "coin-rupees-5",
        "india-10-rupees-2012.jpg": "coin-rupees-10",
        "india-20-rupees-2020.jpg": "coin-rupees-20",
        "India_new_10_INR,_MG_series,_2018,_obverse.jpg": "bill-10",
        "India_new_20_INR,_MG_series,_2019,_obverse.jpg": "bill-20",
        "India_new_50_INR,_MG_series,_2018,_obverse.jpg": "bill-50",
        "Rs_100_note_front_view.jpg": "bill-100",
        "India,_200_INR,_2018,_obverse.jpg": "bill-200",
        "India_new_500_INR,_MG_series,_2016,_reverse.jpg": "bill-500",
    },
    "hkd": {
        "472309f790529822720ef4acfa806ccb0a46f21f7e03.webp": "coin-cents-10",
        "hong_kong-20-cents-1994.jpg": "coin-cents-20",
        "hong_kong-50-cents-1993.jpg": "coin-cents-50",
        "hong_kong-1-dollar-1993.jpg": "coin-dollar-1",
        "hong_kong-2-dollars-2015.jpg": "coin-dollars-2",
        "hong_kong-5-dollars-1998.jpg": "coin-dollars-5",
        "hong_kong-10-dollars-1995.jpg": "coin-dollars-10",
        "bill-20.webp": "bill-20",
        "bill-50.webp": "bill-50",
        "bill-100.webp": "bill-100",
        "bill-500.webp": "bill-500",
        "bill-1000.webp": "bill-1000",
    },
    "sgd": {
        "singapore-5-cents-2015.jpg": "coin-cents-5",
        "singapore-10-cents-2013.jpg": "coin-cents-10",
        "singapore-20-cents-2014.jpg": "coin-cents-20",
        "singapore-50-cents-2015.jpg": "coin-cents-50",
        "singapore-1-dollar-2013.jpg": "coin-dollar-1",
        "bill-2.webp": "bill-2",
        "bill-5.webp": "bill-5",
        "bill-10.webp": "bill-10",
        "bill-50.webp": "bill-50",
        "bill-100.webp": "bill-100",
    },
    "sek": {
        "sweden-1-krona-2016.jpg": "coin-krona-1",
        "sweden-5-kronor-2016.jpg": "coin-kronor-5",
        "sweden-10-kronor-1991.jpg": "coin-kronor-10",
        "0b46f21fbe096b63bb66866700338744ebf8ac8e.webp": "bill-50",
        "77c6a7efce1b9d16684d4256ffdeb48f8c54647b.webp": "bill-100",
        "86d6277f9e2f07083745f237e524b899a901f241.webp": "bill-200",
        "96dda144ad345982c7123da500f431adcbef8469.webp": "bill-500",
        "8718367adab44aed38f066d3bf1c8701a18bfb4f.webp": "bill-1000",
    },
}

# Rows/columns to shave off before trimming (top, right, bottom, left).
PRE_CROP = {("inr", "Rs_100_note_front_view.jpg"): (0, 0, 4, 0)}

# Coins whose outline is not a circle keep the flood-filled shape.
SHAPED_COINS = {
    ("aud", "coin-cents-50"),
    ("hkd", "coin-cents-20"),
    ("hkd", "coin-dollars-2"),
    ("sgd", "coin-dollar-1"),
    ("inr", "coin-rupees-20"),
}

# Coins that touch the photo edge: circle at the image centre, radius as a fraction of the short side.
CENTRED_COINS = {("inr", "coin-rupees-2"): 0.497}

# Bill photos with plain margins to trim; the others are already cropped.
TRIM_BILLS = {"inr"}


def border_color(rgb: np.ndarray) -> np.ndarray:
    edge = np.concatenate([rgb[:3].reshape(-1, 3), rgb[-3:].reshape(-1, 3), rgb[:, :3].reshape(-1, 3), rgb[:, -3:].reshape(-1, 3)])
    return np.median(edge, axis=0)


def flood_mask(im: Image.Image, threshold: float = 34.0) -> np.ndarray:
    rgb = np.asarray(im.convert("RGB")).astype(np.float32)
    bg = border_color(rgb)
    near = (np.linalg.norm(rgb - bg, axis=2) < threshold).astype(np.uint8) * 255
    mask = ImageOps.expand(Image.fromarray(near, "L"), 1, fill=255)
    ImageDraw.floodfill(mask, (0, 0), 128)
    return np.asarray(mask)[1:-1, 1:-1] != 128


def circle_alpha(w: int, h: int, cx: float, cy: float, radius: float) -> Image.Image:
    yy, xx = np.ogrid[:h, :w]
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    feather = max(1.6, radius * 0.012)
    a = np.clip((radius - dist) / feather, 0, 1)
    a = a * a * (3 - 2 * a)
    return Image.fromarray((a * 255).astype(np.uint8), "L")


def cutout_coin(im: Image.Image, shaped: bool, centred: float | None) -> Image.Image:
    w, h = im.size
    if centred is not None:
        alpha = circle_alpha(w, h, (w - 1) / 2, (h - 1) / 2, min(w, h) * centred)
    else:
        coin = flood_mask(im)
        if shaped:
            alpha = Image.fromarray(np.where(coin, 255, 0).astype(np.uint8), "L")
            alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.9))
        else:
            ys, xs = np.nonzero(coin)
            radius = np.sqrt(len(xs) / np.pi) * 0.99
            alpha = circle_alpha(w, h, xs.mean(), ys.mean(), radius)
    out = im.convert("RGBA")
    out.putalpha(alpha)
    bbox = alpha.point(lambda v: 255 if v > 8 else 0).getbbox()
    out = out.crop(bbox)
    out.thumbnail((COIN_MAX, COIN_MAX), Image.LANCZOS)
    return out


def trim_bill(im: Image.Image, threshold: float = 40.0) -> Image.Image:
    rgb = np.asarray(im.convert("RGB")).astype(np.float32)
    bg = border_color(rgb)
    content = np.linalg.norm(rgb - bg, axis=2) > threshold
    rows = np.where(content.mean(axis=1) > 0.03)[0]
    cols = np.where(content.mean(axis=0) > 0.03)[0]
    out = im.convert("RGB").crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))
    if out.width > BILL_MAX_W:
        out = out.resize((BILL_MAX_W, round(out.height * BILL_MAX_W / out.width)), Image.LANCZOS)
    return out


def main(only: set[str]) -> None:
    for currency, files in JOBS.items():
        if only and currency not in only:
            continue
        folder = MONEY / currency
        archive = ARCHIVE / currency
        archive.mkdir(parents=True, exist_ok=True)
        for src_name, out_name in files.items():
            src = folder / src_name
            kept = archive / src_name
            if src.exists() and not kept.exists():
                shutil.move(src, kept)
            if not kept.exists():
                print("MISSING", currency, src_name)
                continue
            im = Image.open(kept)
            crop = PRE_CROP.get((currency, src_name))
            if crop:
                t, r, b, l = crop
                im = im.crop((l, t, im.width - r, im.height - b))
            key = (currency, out_name)
            if out_name.startswith("coin-"):
                result = cutout_coin(im, key in SHAPED_COINS, CENTRED_COINS.get(key))
                result.save(folder / f"{out_name}.webp", "WEBP", quality=88, method=6)
            elif currency in TRIM_BILLS:
                result = trim_bill(im)
                result.save(folder / f"{out_name}.webp", "WEBP", quality=86, method=6)
            else:
                result = im
                shutil.copyfile(kept, folder / f"{out_name}.webp")
            size = (folder / f"{out_name}.webp").stat().st_size / 1024
            print(f"{currency}/{out_name}.webp {result.width}x{result.height} {size:.0f}KB")


if __name__ == "__main__":
    main(set(sys.argv[1:]))
