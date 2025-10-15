const container = document.getElementById('toast');
export function toast(msg){
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(()=>{ el.classList.add('show'); },10);
  setTimeout(()=>{
    el.classList.remove('show');
    setTimeout(()=>el.remove(),200);
  }, 2500);
}
