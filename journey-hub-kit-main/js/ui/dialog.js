const modal = document.getElementById('modal');

export function showModal({ title, content, actions = [] }) {
  modal.innerHTML = `
    <div class="modal-content card" role="document">
      <h3 id="modalTitle">${title}</h3>
      <div class="modal-body">${content}</div>
      <div class="modal-actions">
        ${actions.map((a,i)=>`<button class="button ${a.variant==='ghost'?'ghost':''}" data-i="${i}">${a.label}</button>`).join('')}
      </div>
    </div>`;
  modal.classList.remove('hidden');
  modal.addEventListener('click', onBackdrop);
  modal.querySelectorAll('.modal-actions .button').forEach((b,i)=> b.addEventListener('click', ()=>{
    const act = actions[i];
    if (act?.onClick) act.onClick();
    close();
  }));
  document.addEventListener('keydown', onEsc);
}
function onBackdrop(e){ if (e.target === modal) close(); }
function onEsc(e){ if (e.key==='Escape') close(); }
export function close(){
  modal.classList.add('hidden');
  modal.removeEventListener('click', onBackdrop);
  document.removeEventListener('keydown', onEsc);
}
