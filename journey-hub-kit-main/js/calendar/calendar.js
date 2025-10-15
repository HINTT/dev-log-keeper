import { listProjects } from '../state/store.js';

const root = document.getElementById('calendarRoot');
const panel = document.getElementById('calendarSidepanel');

let current = new Date(); current.setDate(1);

function events() {
  const map = new Map(); // yyyy-mm-dd -> [{type, project}]
  const push = (date, type, project) => {
    if (!date) return;
    const key = toKey(date);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ type, project });
  };
  for (const p of listProjects()) {
    push(p.createdAt, 'Created', p);
    push(p.updatedAt, 'Updated', p);
    push(p.endDate,   'Target',  p);
  }
  return map;
}
function toKey(d){
  const dt = typeof d === 'string' ? new Date(d) : d;
  const y = dt.getFullYear(), m = String(dt.getMonth()+1).padStart(2,'0'), day = String(dt.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function render() {
  const ev = events();
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(start.getDate() - ((start.getDay()+6)%7)); // Monday start

  let html = `
    <div class="calendar-head">
      <button class="button ghost" id="prev">‹</button>
      <h2>${firstDay.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h2>
      <button class="button ghost" id="next">›</button>
    </div>
    <div class="calendar-weekdays">
      ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<div>${d}</div>`).join('')}
    </div>
    <div class="calendar-cells">
  `;

  const todayKey = toKey(new Date());
  for (let i=0;i<42;i++){
    const d = new Date(start); d.setDate(start.getDate()+i);
    const key = toKey(d);
    const outside = d.getMonth() !== month;
    const dayEvents = ev.get(key) || [];
    html += `
      <button class="cell ${outside?'muted':''} ${key===todayKey?'today':''}" data-date="${key}">
        <span class="num">${d.getDate()}</span>
        <span class="dots">${dayEvents.map(e=>`<i title="${e.type}">•</i>`).join('')}</span>
      </button>
    `;
  }
  html += `</div>`;

  root.innerHTML = html;
  root.querySelector('#prev').onclick = ()=>{ current.setMonth(current.getMonth()-1); render(); };
  root.querySelector('#next').onclick = ()=>{ current.setMonth(current.getMonth()+1); render(); };
  root.querySelectorAll('.cell').forEach(c=>c.addEventListener('click', ()=>openDay(c.dataset.date, ev)));
}
function openDay(key, ev){
  const list = (ev.get(key) || []).sort((a,b)=>a.type.localeCompare(b.type));
  panel.innerHTML = `
    <h3>${new Date(key).toLocaleDateString()}</h3>
    ${list.length ? `<ul>${list.map(({type, project}) => `
      <li><strong>${type}</strong> — ${escapeHtml(project.title)} <span class="muted">(${project.status})</span></li>`).join('')}
    </ul>` : `<p class="muted">No events.</p>`}
  `;
}
function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
render();
