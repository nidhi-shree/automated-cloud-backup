/* Frontend editing + saving for content.json (with localStorage persistence) */
(function () {
  const DATA_PATH = 'data/content.json';
  const state = {
    data: null,
    editMode: false,
    busy: false,
  };

  function $(sel, root = document) { return root.querySelector(sel); }
  function $all(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

  async function loadData() {
    const local = localStorage.getItem('content.json');
    if (local) {
      try { state.data = JSON.parse(local); return; } catch {}
    }
    const res = await fetch(`${DATA_PATH}?cb=${Date.now()}`).catch(() => null);
    if (!res || !res.ok) throw new Error('Failed to load content.json');
    state.data = await res.json();
  }

  function set(bind, value) {
    // For input/textarea, set value; otherwise textContent
    const el = document.querySelector(`[data-bind="${bind}"]`);
    if (!el) return;
    if ('value' in el) el.value = value ?? '';
    else el.textContent = value ?? '';
  }

  function render() {
    const root = document;
    if (!state.data) return;
    // Home
    set('home.title', state.data?.home?.title);
    set('home.subtitle', state.data?.home?.subtitle);
    // Features list
    const host = document.querySelector('[data-repeat="home.features"]');
    const tmpl = document.getElementById('featureTemplate');
    if (host && tmpl) {
      host.innerHTML = '';
      (state.data?.home?.features || []).forEach((f, idx) => {
        const node = tmpl.content.cloneNode(true);
        const item = node.querySelector('[data-repeat-item]');
        if (item) item.dataset.index = String(idx);
        const t = node.querySelector('[data-feature="title"]');
        const d = node.querySelector('[data-feature="desc"]');
        if (t) t.textContent = f.title || '';
        if (d) d.textContent = f.desc || '';
        host.appendChild(node);
      });
    }
    // About
    set('about.intro', state.data?.about?.intro);
    const wf = document.querySelector('[data-repeat="about.workflow"]');
    if (wf) {
      wf.innerHTML = '';
      (state.data?.about?.workflow || []).forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        wf.appendChild(li);
      });
    }
    // Contact
    set('contact.email', state.data?.contact?.email);
    set('contact.message', state.data?.contact?.message);

    applyEditMode(state.editMode);
  }

  function applyEditMode(on) {
    const bindables = $all('[data-bind]:not(input):not(textarea), [data-feature]');
    bindables.forEach(el => {
      el.setAttribute('contenteditable', on ? 'true' : 'false');
      if (on) {
        el.classList.add('editable');
      } else {
        el.classList.remove('editable');
      }
    });
    const btn = $('#editToggle');
    if (btn) btn.textContent = on ? 'Exit Edit Mode' : '🖋️ Edit Mode';
    const saveBtn = $('#saveChanges');
    if (saveBtn) saveBtn.disabled = !on;
  }

  function collectDataFromDOM() {
    const data = JSON.parse(JSON.stringify(state.data || {}));
    const get = (bind) => {
      const el = document.querySelector(`[data-bind="${bind}"]`);
      if (!el) return '';
      return 'value' in el ? (el.value ?? '') : (el.textContent ?? '');
    };
    data.home = data.home || {};
    data.home.title = get('home.title');
    data.home.subtitle = get('home.subtitle');
    const host = document.querySelector('[data-repeat="home.features"]');
    if (host) {
      data.home.features = Array.from(host.querySelectorAll('[data-repeat-item]')).map(item => ({
        title: item.querySelector('[data-feature="title"]')?.textContent?.trim() || '',
        desc: item.querySelector('[data-feature="desc"]')?.textContent?.trim() || ''
      }));
    }
    data.about = data.about || {};
    data.about.intro = get('about.intro');
    // workflow stays as-is unless edited via future UI
    data.contact = data.contact || {};
    data.contact.email = get('contact.email');
    data.contact.message = get('contact.message');
    return data;
  }

  async function saveToFileSystem(jsonString) {
    // Try to use the File System Access API for direct overwrite
    if ('showOpenFilePicker' in window) {
      try {
        const [handle] = await window.showOpenFilePicker({
          types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }]
        });
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        toast('✅ Changes saved to file', 'success');
        return true;
      } catch (e) {
        // User cancelled or not allowed; fall through to download
      }
    }
    return false;
  }

  function downloadFile(name, text) {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    let payload = {};
    try {
      payload = await res.json();
    } catch {
      // ignore parse errors
    }
    if (!res.ok) {
      const message = payload.message || res.statusText || 'Request failed';
      throw new Error(message);
    }
    return payload;
  }

  async function onSave() {
    try {
      const updated = collectDataFromDOM();
      const jsonString = JSON.stringify(updated, null, 2);
      localStorage.setItem('content.json', jsonString);
      const resp = await postJSON('/save-content', updated);
      toast(resp.message || 'Changes saved and backed up to cloud successfully!', 'success');
      const wrote = await saveToFileSystem(jsonString);
      if (!wrote) {
        downloadFile('content.json', jsonString);
        toast('Downloaded content.json — replace file in docs/data (optional backup).', 'info');
      }
      state.data = updated;
    } catch (e) {
      toast('Save failed', 'error');
      console.error(e);
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard?.writeText(text).then(
      () => toast('Command copied', 'success'),
      () => toast('Copy failed', 'error')
    );
  }

  function wireToolbar() {
    const edit = $('#editToggle');
    const save = $('#saveChanges');
    const backup = $('#backupNow');
    const disaster = $('#simulateDisaster');
    const restore = $('#restoreNow');

    if (edit) edit.addEventListener('click', () => {
      state.editMode = !state.editMode;
      applyEditMode(state.editMode);
    });
    if (save) save.addEventListener('click', onSave);
    if (backup) backup.addEventListener('click', async () => {
      try {
        backup.disabled = true;
        backup.textContent = '☁️ Backing up...';
        const resp = await postJSON('/backup', {});
        toast(resp.message || '☁️ Backup complete.', 'success');
      } catch (err) {
        toast(`Backup failed: ${err.message}`, 'error');
        console.error(err);
      } finally {
        backup.disabled = false;
        backup.textContent = '☁️ Backup';
      }
    });
    if (disaster) disaster.addEventListener('click', () => {
      copyToClipboard('Remove-Item -Recurse -Force docs');
      toast('⚠️ Simulated disaster (command copied)', 'warning');
    });
    if (restore) restore.addEventListener('click', async () => {
      try {
        restore.disabled = true;
        restore.textContent = '🔁 Restoring...';
        const resp = await postJSON('/restore', {});
        toast(resp.message || '🔁 Restore complete.', 'success');
      } catch (err) {
        toast(`Restore failed: ${err.message}`, 'error');
        console.error(err);
      } finally {
        restore.disabled = false;
        restore.textContent = '🔁 Restore';
      }
    });
  }

  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await loadData();
      render();
      wireToolbar();
    } catch (e) {
      console.error(e);
      toast('Failed to load content.json', 'error');
    }
  });
})();


