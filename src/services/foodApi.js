const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
const USER_ID_KEY = 'nutriowl_profile';

function getCurrentUserId() {
  try {
    const raw = localStorage.getItem(USER_ID_KEY);
    if (!raw) return null;
    const profile = JSON.parse(raw);
    return profile?.id || profile?._id || null;
  } catch (error) {
    return null;
  }
}

function buildHeaders(extra = {}) {
  return {
    ...extra,
    'Content-Type': extra['Content-Type'] || 'application/json'
  };
}

function parseError(response, fallback) {
  return response.json().then((body) => body?.message || fallback).catch(() => fallback);
}

export async function analyzeFood(image, { fileName = 'food-image.jpg' } = {}) {
  const userId = getCurrentUserId();
  if (!userId) {
    throw new Error('Authentication required to analyze a food image.');
  }

  const form = new FormData();
  const file = image instanceof File ? image : new File([image], fileName, { type: image?.type || 'image/jpeg' });
  form.append('image', file, fileName);
  form.append('foodNameHint', fileName || 'food-image');

  const response = await fetch(`${API_BASE}/api/food/analyze`, {
    method: 'POST',
    headers: { 'x-user-id': userId },
    body: form
  });

  if (!response.ok) {
    const message = await parseError(response, 'I could not analyze that food image.');
    throw new Error(message);
  }

  const data = await response.json();
  return {
    status: data.status,
    foods: data.foods || [],
    totalNutrition: data.totalNutrition || {},
    totalMicronutrients: data.totalMicronutrients || {},
    confidence: data.confidence || 0,
    notes: data.notes || [],
    scanId: data.scanId,
    createdAt: data.createdAt
  };
}

export async function getRecentScans() {
  const userId = getCurrentUserId();
  if (!userId) {
    return [];
  }

  const response = await fetch(`${API_BASE}/api/food/recent`, {
    headers: { 'x-user-id': userId }
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export async function getScan(scanId) {
  const userId = getCurrentUserId();
  if (!userId) {
    return null;
  }

  const response = await fetch(`${API_BASE}/api/food/scans/${scanId}`, {
    headers: { 'x-user-id': userId }
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

export async function deleteScan(scanId) {
  const userId = getCurrentUserId();
  if (!userId) {
    return false;
  }

  const response = await fetch(`${API_BASE}/api/food/scans/${scanId}`, {
    method: 'DELETE',
    headers: { 'x-user-id': userId }
  });

  return response.ok;
}
