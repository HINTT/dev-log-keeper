import { motivationStore, resumeStore, settingsStore } from './state/store.js';
import { showModal } from './ui/dialog.js';
import { toast } from './ui/toast.js';

// Motivation
const QUOTES = [
  "Small steps every day.",
  "Consistency beats intensity.",
  "Build before you brag.",
  "You don't need motivation, you need momentum.",
  "Done is better than perfect."
];

const quoteText = document.getElementById('quoteText');
const newQuoteBtn = document.getElementById('newQuote');
const saveQuoteBtn = document.getElementById('saveQuote');
const affIn = document.getElementById('affirmationInput');
const addAff = document.getElementById('addAffirmation');
const clrAff = document.getElementById('clearAffirmations');
const affList = document.getElementById('affirmationList');
const streakCount = document.getElementById('streakCount');
const checkInBtn = document.getElementById('checkIn');
const lastCheckIn = document.getElementById('lastCheckIn');

function randomQuote(){ return QUOTES[Math.floor(Math.random()*QUOTES.length)]; }
function setQuote(q){ quoteText.textContent = q; }
function renderAffirmations() {
  const list = motivationStore.listAffirmations();
  affList.innerHTML = list.map(x=>`<li>${escapeHtml(x.text)}</li>`).join('');
}
function renderStreak(){
  const s = motivationStore.getStreak();
  streakCount.textContent = s.days;
  lastCheckIn.textContent = s.lastDate ? `Last check-in: ${new Date(s.lastDate).toLocaleDateString()}` : '';
}

newQuoteBtn.addEventListener('click', ()=> setQuote(randomQuote()));
saveQuoteBtn.addEventListener('click', ()=> { motivationStore.addFavoriteQuote(quoteText.textContent || randomQuote()); toast('Saved to Favorites'); });
addAff.addEventListener('click', ()=>{
  const t = affIn.value.trim(); if (!t) return;
  motivationStore.addAffirmation(t); affIn.value=''; renderAffirmations(); toast('Affirmation added');
});
clrAff.addEventListener('click', ()=>{ motivationStore.clearAffirmations(); renderAffirmations(); toast('Cleared'); });
checkInBtn.addEventListener('click', ()=>{ motivationStore.checkIn(); renderStreak(); toast('Nice work! ✅'); });

setQuote(randomQuote()); renderAffirmations(); renderStreak();

// Resume quick bindings
const resName = document.getElementById('resName');
const resTitle = document.getElementById('resTitle');
const resSummary = document.getElementById('resSummary');
[resName,resTitle,resSummary].forEach(el => {
  el.addEventListener('input', () => {
    const r = resumeStore.get();
    if (el===resName) resumeStore.setField('name', el.textContent.trim());
    if (el===resTitle) resumeStore.setField('title', el.textContent.trim());
    if (el===resSummary) resumeStore.setField('summary', el.textContent.trim());
  });
});

// --- GitHub Quick Access (button + settings + g,g)
const btnGitHub = document.getElementById('btnGitHub');
const btnGitHubSet = document.getElementById('btnGitHubSet');

function getGitHubUrl() {
  const s = settingsStore.get();
  return s.githubUrl || 'https://github.com/HINTT';
}
function setGitHubUrl(url) {
  settingsStore.set({ githubUrl: url });
  btnGitHub.href = url;
}
(function initGitHubBtn(){ btnGitHub.href = getGitHubUrl(); })();

btnGitHubSet.addEventListener('click', () => {
  const current = getGitHubUrl();
  showModal({
    title: 'Set GitHub Quick Link',
    content: `
      <label class="stacked">GitHub URL
        <input id="ghUrl" class="input" value="${current}">
        <small class="muted">Examples:
          <br>Profile: https://github.com/HINTT
          <br>Repo: https://github.com/HINTT/dev-journey-hub
          <br>Issues: https://github.com/HINTT/dev-journey-hub/issues
        </small>
      </label>
    `,
    actions: [
      { label: 'Cancel', variant: 'ghost' },
      { label: 'Save', variant: 'primary', onClick: () => {
          const v = document.getElementById('ghUrl').value.trim();
          if (!/^https?:\/\/.+/i.test(v)) return alert('Enter a valid URL starting with http(s)://');
          setGitHubUrl(v);
        } }
    ]
  });
});

let lastG = 0;
document.addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() !== 'g') return;
  const now = performance.now();
  if (now - lastG < 500) { window.open(getGitHubUrl(), '_blank', 'noopener'); lastG = 0; }
  else { lastG = now; }
});

function escapeHtml(s){return s.replace(/[&<>"']/g,m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
