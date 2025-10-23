import os, json


def scan_dir (d):
    builds = []
    for fn in os.listdir(d):
        if not fn.endswith('.json'): continue
        if fn == 'manifest.json': continue
        path = os.path.join(d, fn)
        with open(path) as f:
            try:
                data = json.load(f)
            except Exception as e:
                print(f"Skip {fn}: {e}")
                continue
        builds.append({
            "build_id": data.get("build_id", fn.replace('.json', '')),
            "timestamp": data.get("timestamp", ""),
            "file": fn,
            "summary": data.get("summary", {})
        })
    # sort newest first
    builds.sort(key=lambda b: b.get("timestamp", ""), reverse=True)
    with open(os.path.join(d, 'manifest.json'), 'w') as f:
        json.dump({"backend": os.path.basename(d), "builds": builds}, f, indent=2)


def main():
    for b in ['gpfs', 'ceph']:
        if os.path.isdir(b):
            scan_dir(b)


if __name__ == '__main__':
    main()
