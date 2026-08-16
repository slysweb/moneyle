# Resize the complete USD scans in public/money/usd/ into web-sized game assets.
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "public" / "money" / "usd"

JOBS = [
    # bills → max width 1400
    ("United_States_one_dollar_bill,_obverse.jpg", "bill-1.jpg", 1400),
    ("US_$2_obverse.jpg", "bill-2.jpg", 1400),
    ("US_$5_Series_2006_obverse.jpg", "bill-5.jpg", 1400),
    ("US10dollarbill-Series_2004A.jpg", "bill-10.jpg", 1400),
    ("US20-front.jpg", "bill-20.jpg", 1400),
    ("50_USD_Series_2004_Note_Front.jpg", "bill-50.jpg", 1400),
    ("Obverse_of_the_series_2009_$100_Federal_Reserve_Note.jpg", "bill-100.jpg", 1400),
    # coins → max 700
    ("2005-Penny-Uncirculated-Obverse-cropped.png", "coin-penny.png", 700),
    ("2005_Dime_Obv_Unc_P.png", "coin-dime.png", 700),
    ("2006_Quarter_Proof.png", "coin-quarter.png", 700),
    ("2005_Half_Dollar_Obv_Unc_P.png", "coin-half.png", 700),
    ("Presidential_dollar_coin_reverse.png", "coin-dollar.png", 700),
]


def fit(im: Image.Image, max_side: int) -> Image.Image:
    w, h = im.size
    scale = min(1.0, max_side / max(w, h))
    if scale >= 1:
        return im
    return im.resize((round(w * scale), round(h * scale)), Image.Resampling.LANCZOS)


for src_name, dest_name, max_side in JOBS:
    src = SRC / src_name
    dest = SRC / dest_name
    if not src.exists():
        print(f"MISSING {src_name}")
        continue
    im = Image.open(src)
    im = fit(im, max_side)
    dest_path = dest
    if dest.suffix.lower() in {".jpg", ".jpeg"}:
        im = im.convert("RGB")
        im.save(dest_path, "JPEG", quality=85, optimize=True)
    else:
        if im.mode not in ("RGB", "RGBA"):
            im = im.convert("RGBA")
        im.save(dest_path, "PNG", optimize=True)
    kb = dest_path.stat().st_size / 1024
    print(f"OK {dest_name} {im.size[0]}x{im.size[1]} ({kb:.0f} KB)")
