// Simple scan history service using localStorage and a basic event listener pattern
const STORAGE_KEY = 'nutri_scans_v1';

let listeners = [];

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { scans: [] };
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read scans from storage', e);
    return { scans: [] };
  }
}

function saveStorage(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    listeners.forEach(l => l(state.scans));
  } catch (e) {
    console.error('Failed to save scans to storage', e);
  }
}

const scanService = {
  load() {
    const state = readStorage();
    return state.scans || [];
  },
  getAll() {
    return this.load();
  },
  subscribe(fn) {
    listeners.push(fn);
    // emit initial
    fn(this.load());
    return () => {
      listeners = listeners.filter(l => l !== fn);
    };
  },
  addScan(scan) {
    const state = readStorage();
    state.scans = state.scans || [];
    // prepend newest
    state.scans.unshift(scan);
    // cap at 200 items to avoid unbounded growth
    if (state.scans.length > 200) state.scans = state.scans.slice(0, 200);
    saveStorage(state);
  },
  clear() {
    const state = { scans: [] };
    saveStorage(state);
  }
};

export default scanService;
