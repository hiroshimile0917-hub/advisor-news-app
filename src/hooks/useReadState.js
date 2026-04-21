import { useState, useEffect } from 'react';

const STORAGE_KEY = 'advisor_read_articles';

export function useReadState() {
  const [read, setRead] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]'));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...read]));
  }, [read]);

  const markRead = (id) => setRead((prev) => new Set([...prev, id]));
  const isRead = (id) => read.has(id);

  return { markRead, isRead };
}
