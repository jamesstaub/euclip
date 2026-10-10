#!/usr/bin/env python3
"""Check that the hosted sample library matches the list the app seeds from.

  scripts/verify-audio-bucket.py                       # default bucket
  scripts/verify-audio-bucket.py --root https://example.com/Drum%20Machines%20mp3
  scripts/verify-audio-bucket.py --origin https://euclip.app --show 50

Reads server/db/seeds/mp3filepaths.txt (what the app indexes), HEADs every audio
file under --root (the same URL the client builds: ROOT + "/" + path), and reports
missing files, wrong content types, and whether browsers on --origin may read them (CORS).
Exit status is 0 only if nothing is missing and CORS looks right. Stdlib only.
"""
import argparse
import collections
import concurrent.futures as futures
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

DEFAULT_ROOT = "https://storage.googleapis.com/euclidean-cracked.appspot.com/Drum%20Machines%20mp3"
AUDIO_EXT = (".mp3", ".wav")
HERE = os.path.dirname(os.path.abspath(__file__))
LIST = os.path.join(HERE, "..", "server", "db", "seeds", "mp3filepaths.txt")


def head(url, origin):
    req = urllib.request.Request(url, method="HEAD", headers={"Origin": origin})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return r.status, r.headers
    except urllib.error.HTTPError as e:
        return e.code, e.headers
    except Exception as e:  # network error, timeout
        return 0, {"error": str(e)}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", default=os.environ.get("AUDIO_CDN_ROOT_FULL", DEFAULT_ROOT), help="base URL of the 'Drum Machines mp3' folder")
    ap.add_argument("--origin", default="http://localhost:4200", help="Origin header to test CORS with")
    ap.add_argument("--list", default=LIST)
    ap.add_argument("--workers", type=int, default=32)
    ap.add_argument("--show", type=int, default=20, help="how many missing paths to print")
    args = ap.parse_args()

    with open(args.list, encoding="utf-8") as f:
        paths = [l.rstrip("\n") for l in f if l.strip()]
    audio = [p for p in paths if p.lower().endswith(AUDIO_EXT)]
    print(f"{len(audio)} audio files expected ({len(paths) - len(audio)} non-audio lines in the list ignored)")
    print(f"root:   {args.root}\norigin: {args.origin}\n")

    def check(path):
        url = args.root.rstrip("/") + "/" + urllib.parse.quote(path)
        status, headers = head(url, args.origin)
        return path, status, headers

    missing, errors, bad_type = [], [], []
    cors = collections.Counter()
    done = 0
    with futures.ThreadPoolExecutor(max_workers=args.workers) as ex:
        for path, status, headers in ex.map(check, audio):
            done += 1
            if done % 1000 == 0:
                print(f"  ...{done}/{len(audio)}", file=sys.stderr)
            if status == 0:
                errors.append((path, headers.get("error")))
            elif status != 200:
                missing.append((path, status))
            else:
                ctype = (headers.get("content-type") or "").split(";")[0]
                if not ctype.startswith("audio/"):
                    bad_type.append((path, ctype))
                acao = headers.get("access-control-allow-origin")
                cors["ok" if acao in ("*", args.origin) else "missing/other"] += 1

    present = len(audio) - len(missing) - len(errors)
    print(f"present: {present}/{len(audio)}   missing: {len(missing)}   request errors: {len(errors)}")

    if missing:
        by_dir = collections.Counter(p.split("/")[0] for p, _ in missing)
        print("\nmissing by top-level folder:")
        for d, n in by_dir.most_common(15):
            print(f"  {n:5d}  {d}")
        print(f"\nfirst {min(args.show, len(missing))} missing:")
        for p, s in missing[: args.show]:
            print(f"  [{s}] {p}")
    if errors:
        print(f"\nfirst {min(5, len(errors))} request errors:")
        for p, e in errors[:5]:
            print(f"  {p}: {e}")
    if bad_type:
        print(f"\n{len(bad_type)} files with a non-audio content-type (e.g. {bad_type[0]}); the client rejects these")

    print(f"\nCORS for origin {args.origin}: {dict(cors) or 'n/a (no files found)'}")
    if cors.get("missing/other"):
        print("  -> apply infra/gcs-cors.json to the bucket (see README, 'Audio files and CORS')")

    ok = not missing and not errors and not bad_type and not cors.get("missing/other") and present > 0
    print("\nOK" if ok else "\nNOT READY")
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
