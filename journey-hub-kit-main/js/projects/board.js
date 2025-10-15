import { listProjects, updateProject, addProject, exportJSON, importJSON } from '../state/store.js';
import { showModal } from '../ui/dialog.js';
import { toast } from '../ui/toast.js';

const columns = [...document.querySelectorAll('.kanban .column')];
const boardView = document.getElementById('boardView');
const listView = document.getElementById('listView');
const galleryView = document.getElementById('galleryView');

const sortSelect = document.getElementById('sortSelect');
const tagFilter = document.getElementById('tagFilter');
const stackFilter = document.getElementById('stackFilter');
const globalSearch = document.getElementById('globalSearch');

document.getElementById('btnNewProject').addEventListener('click', openNewProjectModal);
document.getElementById('btnExport').addEventListener('click', exportJSON);
document.getElementById('btnImport').addEventListener('click', async () => {
  const input = Object.assign(document.createElement('input'), { type: 'file', accept: 'application/json' });
  input.onchange = async () => {
    try { await importJSON(input.files[0]); toast('Data imported.'); render(); }
    catch(e){ toast('Import failed.'); }
  };
  input.click();
});

for (const el of document.querySelectorAll('.view-switch .chip')) {
  el.addEventListener('click', () => {
    document.querySelectorAll('.view-switch .chip').forEach(c=>c.classList.remove('active'));
    el.classList.add('active');
    const v = el.dataset.view;
    boardView.classList.toggle('hidden', v!=='board');
    listView.classList.toggle('hidden', v!=='list');
    galleryView.classList.toggle('hidden', v!=='gallery');
    render();
  });
}

[sortSelect, tagFilter, stackFilter, globalSearch].forEach(el => el.addEventListener('input', () => render()));

function getFilters() {
  return {
    sort: sortSelect.value,
    tag: tagFilter.value.trim().toLowerCase(),
    stack: stackFilter.value.trim().toLowerCase(),
    q: globalSearch.value.trim().toLowerCase()
  };
}

function applyFilters(projects) {
  const f = getFilters();
  let items = projects.filter(p => {
    const tagOk = !f.tag || p.tags.some(t => t.toLowerCase().includes(f.tag));
    const stackOk = !f.stack || p.stack.some(s => s.toLowerCase().includes(f.stack));
    const qOk = !f.q || (p.title + ' ' + p.description).toLowerCase().includes(f.q);
    return tagOk && stackOk && qOk;
  });
  const byDate = (a,b,field) => new Date(a[field]) - new Date(b[field]);
  switch (f.sort) {
    case 'created-asc': items.sort((a,b)=>byDate(a,b,'createdAt')); break;
    case 'created-desc': items.sort((a,b)=>byDate(b,a,'createdAt')); break;
    case 'updated-desc': items.sort((a,b)=>byDate(b,a,'updatedAt')); break;
    case 'alpha-asc': items.sort((a,b)=>a.title.localeCompare(b.title)); break;
  }
  return items;
}

function renderBoard(projects) {
  columns.forEach(col => col.querySelector('.column-body').innerHTML = '');
  for (const p of projects) {
    const col = columns.find(c => c.dataset.status === p.status) || columns[0];
    col.querySelector('.column-body').append(cardEl(p));
  }
  enableDnD();
}

function cardEl(p) {
  const el = document.createElement('article');
  el.className = 'card project-card';
  el.tabIndex = 0;
  el.setAttribute('role','listitem');
  el.dataset.id = p.id;
  el.innerHTML = `
    <div class="row between">
      <strong>${escapeHtml(p.title)}</strong>
      <span class="muted">${p.status}</span>
    </div>
    <p class="muted small">${escapeHtml(p.description||'')}</p>
    <div class="chips">${[...p.stack, ...p.tags].map(x=>`<span class="chip small">${escapeHtml(x)}</span>`).join('')}</div>
    <div class="row small muted">
      <span title="Created">🗓 ${new Date(p.createdAt).toLocaleDateString()}</span>
      <span title="Updated">• Updated ${timeAgo(p.updatedAt)}</span>
    </div>
  `;
  el.addEventListener('keydown', (e) => {
    if (!['ArrowLeft','ArrowRight'].includes(e.key)) return;
    e.preventDefault();
    const order = ['Planned','In Progress','Done'];
    const idx = order.indexOf(p.status);
    const next = e.key === 'ArrowRight' ? Math.min(idx+1,2) : Math.max(idx-1,0);
    if (next !== idx) { updateProject(p.id, { status: order[next] }); render(); }
  });
  return el;
}

function enableDnD() {
  const draggables = [...document.querySelectorAll('.project-card')];
  draggables.forEach(d => {
    d.setAttribute('draggable','true');
    d.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', d.dataset.id));
  });
  const dropzones = [...document.querySelectorAll('.column-body')];
  dropzones.forEach(z => {
    z.addEventListener('dragover', e => e.preventDefault());
    z.addEventListener('drop', e => {
      e.preventDefault();
      const id = e.dataTransfer.getData('text/plain');
      const status = z.closest('.column').dataset.status;
      updateProject(id, { status }); render();
    });
  });
}

function renderList(projects) {
  listView.innerHTML = `
    <table class="table">
      <thead><tr><th>Title</th><th>Status</th><th>Stack</th><th>Tags</th><th>Created</th><th>Updated</th></tr></thead>
      <tbody>${projects.map(p=>`
        <tr>
          <td>${escapeHtml(p.title)}</td>
          <td>${p.status}</td>
          <td>${p.stack.join(', ')}</td>
          <td>${p.tags.join(', ')}</td>
          <td>${new Date(p.createdAt).toLocaleDateString()}</td>
          <td>${new Date(p.updatedAt).toLocaleString()}</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

function renderGallery(projects) {
  galleryView.innerHTML = projects.map(p => `
    <div class="card">
      <h3>${escapeHtml(p.title)}</h3>
      <p class="muted small">${escapeHtml(p.description||'')}</p>
      <div class="chips">${[...p.stack, ...p.tags].map(x=>`<span class="chip small">${escapeHtml(x)}</span>`).join('')}</div>
    </div>
  `).join('');
}

function render() {
  const items = applyFilters(listProjects());
  if (!boardView.classList.contains('hidden')) renderBoard(items);
  if (!listView.classList.contains('hidden')) renderList(items);
  if (!galleryView.classList.contains('hidden')) renderGallery(items);
}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function timeAgo(iso){
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff<60) return `${Math.round(diff)}s ago`;
  if (diff<3600) return `${Math.round(diff/60)}m ago`;
  if (diff<86400) return `${Math.round(diff/3600)}h ago`;
  return `${Math.round(diff/86400)}d ago`;
}

function openNewProjectModal() {
  showModal({
    title: 'New Project',
    content: `
      <label class="stacked">Title<input id="npTitle" class="input"></label>
      <label class="stacked">Description<textarea id="npDesc" class="input" rows="3"></textarea></label>
      <label class="stacked">Stack (comma-sep)<input id="npStack" class="input"></label>
      <label class="stacked">Tags (comma-sep)<input id="npTags" class="input"></label>
      <label class="stacked">Status
        <select id="npStatus" class="input">
          <option>Planned</option><option>In Progress</option><option>Done</option>
        </select>
      </label>
    `,
    actions: [
      { label: 'Cancel', variant: 'ghost' },
      { label: 'Create', variant: 'primary', onClick: () => {
          const p = {
            title: document.getElementById('npTitle').value,
            description: document.getElementById('npDesc').value,
            stack: splitCSV(document.getElementById('npStack').value),
            tags: splitCSV(document.getElementById('npTags').value),
            status: document.getElementById('npStatus').value
          };
          addProject(p); toast('Project added.'); render();
        } }
    ]
  });
}
function splitCSV(s){ return s.split(',').map(x=>x.trim()).filter(Boolean); }

render();
