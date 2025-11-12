// Theme toggle, navbar highlighting, content loader, footer meta
(function () {
  const storageKey = 'cloud-backup-theme';
  const saved = localStorage.getItem(storageKey);
  const root = document.documentElement;
  if (saved === 'light') {
    root.classList.add('light');
  }
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const isLight = root.classList.toggle('light');
      localStorage.setItem(storageKey, isLight ? 'light' : 'dark');
      btn.textContent = isLight ? '🌞' : '🌙';
    });
    btn.textContent = root.classList.contains('light') ? '🌞' : '🌙';
  }
  const year = document.getElementById('year');
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // Navbar highlighting
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
    else a.classList.remove('active');
  });

  // Load content.json (with localStorage override)
  async function loadContent() {
    const local = localStorage.getItem('content.json');
    if (local) {
      try { return JSON.parse(local); } catch {}
    }
    try {
      const res = await fetch('data/content.json?' + Date.now());
      if (!res.ok) throw new Error('Failed to fetch content.json');
      return await res.json();
    } catch (e) {
      console.warn(e);
      return null;
    }
  }

  function setText(selector, value) {
    const el = document.querySelector(selector);
    if (el) el.textContent = value ?? '';
  }

  function fillIndex(data) {
    if (!data) return;
    if (!data.home) return;
    setText('[data-bind="home.title"]', data.home.title);
    setText('[data-bind="home.subtitle"]', data.home.subtitle);
    // Features
    const host = document.querySelector('[data-repeat="home.features"]');
    const tmpl = document.getElementById('featureTemplate');
    if (host && tmpl) {
      host.innerHTML = '';
      (data.home.features || []).forEach(f => {
        const node = tmpl.content.cloneNode(true);
        node.querySelector('[data-feature="title"]').textContent = f.title || '';
        node.querySelector('[data-feature="desc"]').textContent = f.desc || '';
        host.appendChild(node);
      });
    }
    // Dashboard metrics
    if (data.meta) {
      setText('[data-metric="lastBackup"]', data.meta.lastBackup || '—');
      setText('[data-metric="lastRestore"]', data.meta.lastRestore || '—');
      setText('[data-metric="backupStatus"]', data.meta.backupStatus || 'Idle');
      setText('[data-metric="totalFiles"]', String(data.meta.totalFiles ?? '—'));
    }
  }

  function fillAbout(data) {
    if (!data?.about) return;
    setText('[data-bind="about.intro"]', data.about.intro);
    const list = document.querySelector('[data-repeat="about.workflow"]');
    if (list) {
      list.innerHTML = '';
      (data.about.workflow || []).forEach(step => {
        const li = document.createElement('li');
        li.textContent = step;
        list.appendChild(li);
      });
    }
  }

  function fillContact(data) {
    if (!data?.contact) return;
    const emailEl = document.querySelector('[data-bind="contact.email"]');
    const msgEl = document.querySelector('[data-bind="contact.message"]');
    if (emailEl && 'value' in emailEl) emailEl.value = data.contact.email || '';
    if (msgEl && 'value' in msgEl) msgEl.value = data.contact.message || '';
  }

  function fillFooter(data) {
    if (!data?.meta) return;
    const el = document.getElementById('lastBackupFooter');
    if (el) el.textContent = data.meta.lastBackup || '—';
  }

  document.addEventListener('DOMContentLoaded', async () => {
    const data = await loadContent();
    if (!data) return;
    fillIndex(data);
    fillAbout(data);
    fillContact(data);
    fillFooter(data);
    window.__CONTENT_JSON__ = data;
  });
})();


