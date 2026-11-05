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
    "idr": {
        "indonesia-100-rupiah-2016.jpg": "coin-rupiah-100",
        "indonesia-200-rupiah-2016.jpg": "coin-rupiah-200",
        "indonesia-500-rupiah-2016.jpg": "coin-rupiah-500",
        "indonesia-1000-rupiah-2016.jpg": "coin-rupiah-1000",
        "Indonesia_2016_1000r_o.jpg": "bill-1000",
        "Indonesia_2016_2000r_o.jpg": "bill-2000",
        "Indonesia_2016_5000r_o.jpg": "bill-5000",
        "Indonesia_2016_10000r_o.jpg": "bill-10000",
        "Indonesia_2016_20000r_o.jpg": "bill-20000",
        "Indonesia_2016_50000r_o.jpg": "bill-50000",
        "Indonesian_75000_Rupiah_2020,_Obverse.jpg": "bill-75000",
        "Indonesia_2016_100000IDR.jpg": "bill-100000",
    },
    "sar": {
        "saudi_arabia-1-halala-2016.jpg": "coin-halala-1",
        "saudi_arabia-5-halalas-2016.jpg": "coin-halalas-5",
        "saudi_arabia-10-halalas-2016.jpg": "coin-halalas-10",
        "saudi_arabia-25-halalas-2016.jpg": "coin-halalas-25",
        "saudi_arabia-50-halalas-2016.jpg": "coin-halalas-50",
        "saudi_arabia-1-riyal-2016.jpg": "coin-riyal-1",
        "saudi_arabia-2-riyals-2016.jpg": "coin-riyals-2",
        "d4628535e5dde71190ef79dec6a5d91b9d16fdfacbcb.webp": "bill-5",
        "fd039245d688d43f955310ac741ed21b0ff43bf1.webp": "bill-10",
        "d788d43f8794a4c27d1e93f479bf0cd5ad6edcc49393.webp": "bill-20",
        "cb8065380cd791233a33152aa4345982b3b78099.webp": "bill-50",
        "e1fe9925bc315c60ea1feab184b1cb13485477e2.webp": "bill-100",
        "b3b7d0a20cf431adcbefe1e7897abbaf2edda2cc3292.webp": "bill-200",
        "7e3e6709c93d70cf3a902a53f1dcd100baa12b01.webp": "bill-500",
    },
    "ils": {
        "israel-10-agorot-2009.jpg": "coin-agorot-10",
        "israel-1-2-new-sheqel-1992.jpg": "coin-1-2",
        "israel-1-new-sheqel-2006.jpg": "coin-shekel-1",
        "israel-2-new-sheqalim-2010.jpg": "coin-shekels-2",
        "israel-5-new-sheqalim-2013.jpg": "coin-shekels-5",
        "israel-10-new-shekels-2022.jpg": "coin-shekels-10",
        "6159252dd42a28348fcb8e9850b5c9ea15cebf30.webp": "bill-20",
        "e4dde71190ef76c6d61bdf919416fdfaae5167ba.webp": "bill-50",
        "aa18972bd40735faacbef62a95510fb30e2408d2.webp": "bill-100",
        "aec379310a55b31935baa3cf4aa98226cefc17cc.webp": "bill-200",
    },
    "nzd": {
        "new_zealand-10-cents-2024.jpg": "coin-cents-10",
        "new_zealand-20-cents-2024.jpg": "coin-cents-20",
        "new_zealand-50-cents-2024.jpg": "coin-cents-50",
        "new_zealand-1-dollar-2024.jpg": "coin-dollar-1",
        "new_zealand-2-dollars-2024.jpg": "coin-dollars-2",
        "aec379310a55b3191d5e404f4da98226cffc1761.webp": "bill-5",
        "08f790529822720e365c20c075cb0a46f21fab7e.webp": "bill-10",
        "f9198618367adab442c2d67985d4b31c8701e4fe.webp": "bill-20",
        "9d82d158ccbf6c81248ce1d2b23eb13533fa4055.webp": "bill-50",
        "c8177f3e6709c93dc814c3cd913df8dcd1005422.webp": "bill-100",
    },
    "dkk": {
        "denmark-50-ore-1997.jpg": "coin-ore-50",
        "denmark-1-krone-2025.jpg": "coin-krone-1",
        "denmark-2-kroner-2025.jpg": "coin-kroner-2",
        "denmark-5-kroner-2025.jpg": "coin-kroner-5",
        "denmark-10-kroner-2025.jpg": "coin-kroner-10",
        "denmark-20-kroner-2025.jpg": "coin-kroner-20",
        "d01373f082025aaf6b905371f2edab64024f1aed.webp": "bill-50",
        "37d3d539b6003af301bbf1da3c2ac65c1038b602.webp": "bill-100",
        "024f78f0f736afc3ae8112dfba19ebc4b64512fe.webp": "bill-200",
        "b8014a90f603738d4d772098ba1bb051f819ec4f.webp": "bill-500",
        "cc11728b4710b9126ecfda44cafdfc0392452279.webp": "bill-1000",
    },
    "myr": {
        "malaysia-5-sen-2019.jpg": "coin-sen-5",
        "malaysia-10-sen-2014.jpg": "coin-sen-10",
        "malaysia-20-sen-2014.jpg": "coin-sen-20",
        "malaysia-50-sen-2014.jpg": "coin-sen-50",
        "f11f3a292df5e0fecd548430506034a85edf72b6.webp": "bill-1",
        "9f2f070828381f303f8b8098a5014c086e06f075.webp": "bill-5",
        "342ac65c10385343e5528a109f13b07eca808865.webp": "bill-10",
        "b21bb051f8198618fec3e2b546ed2e738bd4e67f.webp": "bill-20",
        "377adab44aed2e7340c88a1d8b01a18b87d6fada.webp": "bill-50",
        "0ff41bd5ad6eddc4c233b9ca35dbb6fd5266332e.webp": "bill-100",
    },
    "php": {
        "philippines-1-sentimo-2017.jpg": "coin-sentimo-1",
        "philippines-5-sentimos-2017.jpg": "coin-sentimos-5",
        "philippines-10-sentimos-1997.jpg": "coin-sentimos-10",
        "philippines-25-sentimos-2024.jpg": "coin-sentimos-25",
        "philippines-1-piso-2025.jpg": "coin-piso-1",
        "philippines-5-piso-2019.jpg": "coin-piso-5",
        "philippines-10-piso-2018.jpg": "coin-piso-10",
        "42166d224f4a20a44623f5ebb5188f22720e0cf37ace.webp": "bill-50",
        "730e0cf3d7ca7bcb0a46f6029b437c63f6246b6002ce.webp": "bill-100",
        "d6ca7bcb0a46f21fbe096d7ed36e7c600c33874400ce.webp": "bill-200",
        "0b46f21fbe096b63f624637d29799044ebf81a4c06ce.webp": "bill-500",
        "bf096b63f6246b600c338d59ceb20d4c510fd9f904ce.webp": "bill-1000",
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

# Coins with a centre hole. The hole is punched after the outer circle is fitted.
HOLED_COINS = {
    ("dkk", "coin-krone-1"),
    ("dkk", "coin-kroner-2"),
    ("dkk", "coin-kroner-5"),
}

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


def punch_center_hole(im: Image.Image, alpha: Image.Image) -> Image.Image:
    """Clear the background showing through a centre hole, without eating the metal."""
    rgb = np.asarray(im.convert("RGB")).astype(np.float32)
    bg = border_color(rgb)
    h, w = rgb.shape[:2]
    cx, cy = w // 2, h // 2
    if float(np.linalg.norm(rgb[cy, cx] - bg)) > 42:
        return alpha
    near = (np.linalg.norm(rgb - bg, axis=2) < 32).astype(np.uint8) * 255
    # fromarray shares the numpy buffer, and floodfill writes do not stick there.
    mask = Image.fromarray(near, "L").copy()
    ImageDraw.floodfill(mask, (cx, cy), 128)
    hole = np.asarray(mask) == 128
    area = int(hole.sum())
    if area < (w * h) * 0.004 or area > (w * h) * 0.25:
        return alpha
    out = np.asarray(alpha).copy()
    out[hole] = 0
    return Image.fromarray(out, "L")


def cutout_coin(im: Image.Image, shaped: bool, centred: float | None, holed: bool = False) -> Image.Image:
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
    if holed:
        alpha = punch_center_hole(im, alpha)
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
                result = cutout_coin(im, key in SHAPED_COINS, CENTRED_COINS.get(key), key in HOLED_COINS)
                result.save(folder / f"{out_name}.webp", "WEBP", quality=88, method=6)
            elif currency in TRIM_BILLS:
                result = trim_bill(im)
                result.save(folder / f"{out_name}.webp", "WEBP", quality=86, method=6)
            else:
                result = im.convert("RGB")
                if result.width > BILL_MAX_W:
                    result = result.resize(
                        (BILL_MAX_W, round(result.height * BILL_MAX_W / result.width)),
                        Image.LANCZOS,
                    )
                result.save(folder / f"{out_name}.webp", "WEBP", quality=86, method=6)
            size = (folder / f"{out_name}.webp").stat().st_size / 1024
            print(f"{currency}/{out_name}.webp {result.width}x{result.height} {size:.0f}KB")


if __name__ == "__main__":
    main(set(sys.argv[1:]))
