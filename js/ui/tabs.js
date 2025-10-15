const tabs = document.querySelectorAll('.tabbar .tab');
const panels = {
  projects: document.getElementById('tab-projects'),
  resume: document.getElementById('tab-resume'),
  calendar: document.getElementById('tab-calendar'),
  motivation: document.getElementById('tab-motivation')
};
tabs.forEach(btn => btn.addEventListener('click', () => {
  tabs.forEach(t=>{ t.classList.remove('active'); t.setAttribute('aria-selected','false'); });
  btn.classList.add('active'); btn.setAttribute('aria-selected','true');
  const target = btn.dataset.tab;
  Object.entries(panels).forEach(([k,el]) => el.classList.toggle('hidden', k!==target));
}));
