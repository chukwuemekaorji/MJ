const KEY = 'mj_couple';

export type CoupleStore = {
  coupleId: string;
  code: string;
};

export function getStoredCouple(): CoupleStore | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function storeCouple(data: CoupleStore) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

export function clearCouple() {
  localStorage.removeItem(KEY);
}
