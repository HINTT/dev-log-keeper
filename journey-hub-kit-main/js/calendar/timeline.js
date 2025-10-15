import { listProjects } from '../state/store.js';

const root = document.getElementById('timelineRoot');
let ascending = true;

function render() {
  const projects = listProjects().slice().sort((a,b)=> new Date(a.createdAt) - new Date(b.createdAt));
  if (!ascending) projects.reverse();
  root.innerHTML = `
    <div class="row between">
      <h2>Timeline</h2>
      <button class="button ghost" id="toggleOrder">
        ${ascending ? 'Oldest → Newest' : 'Newest → Oldest'}
      </button>
    </div>
    <ol class="timeline-list">
      ${projects.map(p => `
        <li>
          <div class="dot"></div>
          <div class="content">
            <strong>${escapeHtml(p.title)}</strong>
            <div class="muted small">Created: ${new Date(p.createdAt).toLocaleDateString()} • Updated: ${new Date(p.updatedAt).toLocaleDateString()}</div>
            <div class="chips small">${[...p.stack, ...p.tags].map(x=>`<span class="chip small">${escapeHtml(x)}</span>`).join('')}</div>
          </div>
        </li>
      `).join('')}
    </ol>
  `;
  root.querySelector('#toggleOrder').onclick = () => { ascending = !ascending; render(); };
}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
render();
