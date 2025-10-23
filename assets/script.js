
const BUGZILLA_BASE = "https://bugzilla.redhat.com/show_bug.cgi?id="; // change if needed

async function loadJSON(path){
  const res = await fetch(path);
  if(!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

function byTimestampDesc(a,b){ return new Date(b.timestamp) - new Date(a.timestamp); }

function setWidget(elId, backendName, latest){
  const el = document.getElementById(elId);
  const p = latest.summary.passed;
  const f = latest.summary.failed;
  const s = latest.summary.skipped;
  el.querySelector('.title').textContent = `${backendName.toUpperCase()} — Latest: ${latest.build_id}`;
  el.querySelector('.pass .val').textContent = p;
  el.querySelector('.fail .val').textContent = f;
  el.querySelector('.skip .val').textContent = s;
}

function unique(arr){ return [...new Set(arr)]; }

async function main(){
  // Load manifests
  const [gpfsManifest, cephManifest] = await Promise.all([
    loadJSON('./gpfs/manifest.json'),
    loadJSON('./ceph/manifest.json'),
  ]);

  // Determine latest for each
  const gpfsLatest = gpfsManifest.builds.sort(byTimestampDesc)[0];
  const cephLatest = cephManifest.builds.sort(byTimestampDesc)[0];
  setWidget('gpfs-widget', 'gpfs', gpfsLatest);
  setWidget('ceph-widget', 'ceph', cephLatest);

  // Populate run type filter
  const runType = document.getElementById('run-type');
  // Default options already present
  // Populate builds & tests based on selected run type
  const buildSelect = document.getElementById('build-filter');
  const testSelect = document.getElementById('test-filter');
  const tbody = document.querySelector('#results-table tbody');

  async function refreshFilters(){
    const rt = runType.value; // 'gpfs' or 'ceph'
    const manifest = rt === 'gpfs' ? gpfsManifest : cephManifest;
    // Fill builds
    buildSelect.innerHTML = '<option value="all">All builds</option>';
    manifest.builds.sort(byTimestampDesc).forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.build_id;
      opt.textContent = `${b.build_id}`;
      buildSelect.appendChild(opt);
    });
    // Fill tests (need to scan all build files for names)
    const testNames = new Set();
    for(const b of manifest.builds){
      const full = await loadJSON(`./${rt}/${b.file}`);
      for(const t of full.tests){ testNames.add(t.name); }
    }
    testSelect.innerHTML = '<option value="all">All tests</option>';
    Array.from(testNames).sort().forEach(name => {
      const opt = document.createElement('option');
      opt.value = name; opt.textContent = name;
      testSelect.appendChild(opt);
    });
  }

  async function renderTable(){
    const rt = runType.value;
    const manifest = rt === 'gpfs' ? gpfsManifest : cephManifest;
    const build = buildSelect.value;
    const test = testSelect.value;

    tbody.innerHTML = '';
    const builds = manifest.builds.sort(byTimestampDesc);
    for(const b of builds){
      if(build !== 'all' && b.build_id !== build) continue;
      const full = await loadJSON(`./${rt}/${b.file}`);
      for(const t of full.tests){
        if(test !== 'all' && t.name !== test) continue;
        const tr = document.createElement('tr');
        const color = t.status === 'passed' ? 'pass' : (t.status === 'failed' ? 'fail' : 'skip');
        const bugHtml = t.bug ? `<a href="${BUGZILLA_BASE}${(t.bug||'').toString().split('-').pop()}" target="_blank">${t.bug}</a>` : '-';
        tr.innerHTML = `
          <td>${rt.toUpperCase()}</td>
          <td>${b.build_id}</td>
          <td>${t.name}</td>
          <td><span class="pill ${color}">${t.status}</span></td>
          <td>${bugHtml}</td>
          <td>${new Date(full.timestamp).toLocaleString()}</td>
        `;
        tbody.appendChild(tr);
      }
    }
  }

  document.getElementById('reset').addEventListener('click', async () => {
    runType.value = 'gpfs';
    await refreshFilters();
    await renderTable();
  });

  runType.addEventListener('change', async () => { await refreshFilters(); await renderTable(); });
  buildSelect.addEventListener('change', renderTable);
  testSelect.addEventListener('change', renderTable);

  await refreshFilters();
  await renderTable();
}

window.addEventListener('DOMContentLoaded', main);
