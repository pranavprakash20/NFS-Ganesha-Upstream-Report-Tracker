
# NFS-Ganesha-Upstream-Report-Tracker-Futuristic

A futuristic, static dashboard for automation results across **GPFS** and **CephFS**, hosted on **GitHub Pages**.

## Features
- Live **top widgets** showing the **latest build** and **pass/fail/skip** counts for GPFS and CephFS.
- **Filters**: Run Type (GPFS/CephFS), Build, and Test.
- **Results table** with Bugzilla links.

## Project structure
```
index.html
assets/
  style.css
  script.js
gpfs/
  manifest.json
  v9.2.json
  v9.1.json
  v9.0.json
ceph/
  manifest.json
  v8.1.json
  v8.0.json
  v7.9.json
scripts/
  generate_manifests.py
.github/workflows/update_dashboard.yml
```

