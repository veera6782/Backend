const STORAGE_KEY = 'nutriowl_profile';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load profile', e);
    return null;
  }
}

function save(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    // dispatch a storage event for same-window subscribers (optional)
    window.dispatchEvent(new Event('nutriowl-profile-updated'));
  } catch (e) {
    console.error('Failed to save profile', e);
  }
}

function clear() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('nutriowl-profile-updated'));
  } catch (e) {
    console.error('Failed to clear profile', e);
  }
}

export default {
  load,
  save,
  clear
};
