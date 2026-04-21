import { useState, useEffect } from 'react';

const KEYWORDS_KEY = 'advisor_watch_keywords';
const CATEGORIES_KEY = 'advisor_watch_categories';
const MAX_ITEMS = 100;

export function useWatchList() {
  const [keywords, setKeywords] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEYWORDS_KEY) ?? '[]'); }
    catch { return []; }
  });

  const [watchedCategories, setWatchedCategories] = useState(() => {
    try { return JSON.parse(localStorage.getItem(CATEGORIES_KEY) ?? '[]'); }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(KEYWORDS_KEY, JSON.stringify(keywords));
  }, [keywords]);

  useEffect(() => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(watchedCategories));
  }, [watchedCategories]);

  const addKeyword = (kw) => {
    const trimmed = kw.trim();
    if (!trimmed || keywords.includes(trimmed) || keywords.length >= MAX_ITEMS) return false;
    setKeywords((prev) => [trimmed, ...prev]);
    return true;
  };

  const removeKeyword = (kw) => setKeywords((prev) => prev.filter((k) => k !== kw));

  const toggleCategory = (id) =>
    setWatchedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );

  const isCategoryWatched = (id) => watchedCategories.includes(id);

  // legacy article-id based watch (kept for backward compat)
  const watchList = keywords;

  return {
    keywords,
    watchList,
    watchedCategories,
    addKeyword,
    removeKeyword,
    toggleCategory,
    isCategoryWatched,
    isFull: keywords.length >= MAX_ITEMS,
    count: keywords.length,
  };
}
