#!/usr/bin/env python3
import os, sys, json, urllib.parse, urllib.request


BUGZILLA_BASE = os.environ.get("BUGZILLA_BASE", "https://bugzilla.redhat.com")
API_URL = os.environ["BUGZILLA_API_URL"]
API_KEY = os.environ.get("BUGZILLA_API_KEY", "").strip()


def _http_get(url, api_key=None):
    headers = {"Accept": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read().decode("utf-8")


def normalize(b):
    def first(x):
        """Helper: return first element if list, else value."""
        if isinstance(x, list) and x:
            return x[0]
        return x or "-"

    bid = b.get("id")
    return {
        "id": f"BZ-{bid}" if bid else "-",
        "product": "ceph",
        "title": b.get("summary") or b.get("short_desc") or "-",
        "introduced_in": first(b.get("version")) or first(b.get("target_milestone")) or "-",
        "fixed_in": first(b.get("cf_fixed_in")) or first(b.get("fixed_in")) or "-",
        "status": first(b.get("status")) or first(b.get("bug_status")) or "-",
        "last_updated": first(b.get("last_change_time")) or first(b.get("delta_ts")) or "-",
        "link": f"{BUGZILLA_BASE}/show_bug.cgi?id={bid}" if bid else None
    }


def main():
    print(API_KEY)
    print(API_URL)
    url = API_URL  # no need to append ?api_key=
    raw = _http_get(url, API_KEY)
    data = json.loads(raw)
    bugs = data.get("bugs", [])
    items = [normalize(b) for b in bugs]

    os.makedirs("bugs", exist_ok=True)
    with open("bugs/live.json", "w") as f:
        json.dump({"bugs": items}, f, indent=2)
    print(f"Wrote bugs/live.json with {len(items)} bugs")


if __name__ == "__main__":
    if "BUGZILLA_API_URL" not in os.environ:
        print("ERROR: BUGZILLA_API_URL env is required", file=sys.stderr)
        sys.exit(2)
    main()
