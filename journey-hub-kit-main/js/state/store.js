import { safeStorage } from '../utils/storage.js';

const KEY = 'dev-journey-hub';
const VERSION = 1;

const defaultState = () => ({
  version: VERSION,
  projects: [],
  resume: {
    name: 'Your Name',
    title: 'Front-End Developer',
    summary: 'Focused on accessible UI, performance, and clean vanilla JavaScript.',
    skills: ['HTML', 'CSS', 'JavaScript'],
    experience: [],
    education: [],
    spotlightProjectIds: []
  },
  settings: { theme: document.documentElement.dataset.theme || 'light', githubUrl: 'https://github.com/HINTT' },
  motivation: { favorites: [], affirmations: [], streak: { days: 0, lastDate: null } }
});

let state = hydrate();

function hydrate() {
  const s = safeStorage.get(KEY);
  if (!s) return defaultState();
  if (!('version' in s) || s.version !== VERSION) { s.version = VERSION; }
  return s;
}
function persist() { safeStorage.set(KEY, state); }

// --- Projects CRUD
export function listProjects() { return [...state.projects]; }
export function addProject(p) {
  const now = new Date().toISOString();
  const proj = {
    id: crypto.randomUUID(),
    title: p.title?.trim() || 'Untitled',
    description: p.description || '',
    stack: p.stack || [],
    tags: p.tags || [],
    status: p.status || 'Planned',
    createdAt: p.createdAt || now,
    updatedAt: p.updatedAt || now,
    startDate: p.startDate || '',
    endDate: p.endDate || '',
    links: p.links || { github: '', live: '' },
    attachments: p.attachments || []
  };
  state.projects.push(proj); persist(); return proj;
}
export function updateProject(id, patch) {
  const i = state.projects.findIndex(x => x.id === id);
  if (i === -1) return null;
  state.projects[i] = { ...state.projects[i], ...patch, updatedAt: new Date().toISOString() };
  persist(); return state.projects[i];
}
export function removeProject(id) { state.projects = state.projects.filter(x => x.id !== id); persist(); }
export function bulkUpdate(ids, patch) {
  const set = new Set(ids);
  state.projects = state.projects.map(p => set.has(p.id) ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p);
  persist();
}

// --- Resume
export const resumeStore = {
  get: () => structuredClone(state.resume),
  setField: (k, v) => { state.resume[k] = v; persist(); },
  setExperience: arr => { state.resume.experience = arr; persist(); },
  setEducation: arr => { state.resume.education = arr; persist(); },
  setSpotlight: ids => { state.resume.spotlightProjectIds = ids; persist(); }
};

// --- Settings (includes GitHub quick link)
export const settingsStore = {
  get: () => structuredClone(state.settings),
  set: (patch) => { state.settings = { ...state.settings, ...patch }; persist(); }
};

// --- Motivation
export const motivationStore = {
  addFavoriteQuote: (q) => { state.motivation.favorites.push({ q, date: new Date().toISOString() }); persist(); },
  listFavorites: () => [...state.motivation.favorites],
  addAffirmation: (text) => { state.motivation.affirmations.push({ text, id: crypto.randomUUID() }); persist(); },
  clearAffirmations: () => { state.motivation.affirmations = []; persist(); },
  listAffirmations: () => [...state.motivation.affirmations],
  checkIn: () => {
    const today = new Date().toISOString().slice(0,10);
    if (state.motivation.streak.lastDate === today) return state.motivation.streak.days;
    const prev = state.motivation.streak.lastDate;
    const inc = (prev && daysBetween(prev, today) === 1) ? 1 : 0;
    state.motivation.streak.days = inc ? state.motivation.streak.days + 1 : 1;
    state.motivation.streak.lastDate = today; persist();
    return state.motivation.streak.days;
  },
  getStreak: () => ({...state.motivation.streak})
};

function daysBetween(a,b){ return Math.round((new Date(b) - new Date(a)) / 86400000); }

// --- Import/Export
export function exportJSON() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement('a'), { href: url, download: 'dev-journey-data.json' });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}
export async function importJSON(file) {
  const text = await file.text();
  const incoming = JSON.parse(text);
  if (!incoming || typeof incoming !== 'object') throw new Error('Invalid file');
  state = { ...defaultState(), ...incoming, version: VERSION };
  persist(); return hydrate();
}

// expose for debugging
window.__store = { listProjects, addProject, updateProject, removeProject, bulkUpdate, exportJSON, importJSON, settingsStore };
