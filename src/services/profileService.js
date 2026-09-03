const STORAGE_KEY = 'nutriowl_profile';
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to load profile', error);
    return null;
  }
}

function cache(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event('nutriowl-profile-updated'));
}

async function save(profile) {
  try {
    const response = await fetch(`${API_URL}/api/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || `Profile request failed (${response.status})`);
    }

    const data = await response.json();
    const savedProfile = { ...profile, id: data.user.id };
    cache(savedProfile);
    return { profile: savedProfile, synced: true };
  } catch (error) {
    console.warn('Profile API unavailable; saving locally instead.', error);
    cache(profile);
    return { profile, synced: false };
  }
}

function clear() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('nutriowl-profile-updated'));
}

export default { load, save, clear };
