import { useState, useEffect } from 'react';

const FAVS_KEY = 'advisor_favorites';
const MEMOS_KEY = 'advisor_memos';

export function useFavorites() {
  const [favorites, setFavorites] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(FAVS_KEY) ?? '[]')); }
    catch { return new Set(); }
  });

  const [memos, setMemos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(MEMOS_KEY) ?? '{}'); }
    catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem(FAVS_KEY, JSON.stringify([...favorites]));
  }, [favorites]);

  useEffect(() => {
    localStorage.setItem(MEMOS_KEY, JSON.stringify(memos));
  }, [memos]);

  const toggleFavorite = (id) =>
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const isFavorite = (id) => favorites.has(id);

  const setMemo = (id, text) =>
    setMemos((prev) => ({ ...prev, [id]: text }));

  const getMemo = (id) => memos[id] ?? '';

  return { toggleFavorite, isFavorite, setMemo, getMemo };
}
