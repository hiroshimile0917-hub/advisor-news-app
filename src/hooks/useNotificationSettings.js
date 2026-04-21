import { useState, useEffect } from 'react';

const STORAGE_KEY = 'advisor_notification_settings';

const DEFAULT_SETTINGS = {
  permission: 'default',
  categories: {},      // { [categoryId]: boolean }
  importance: { '高': true, '中': false, '低': false },
  quietStart: '',      // HH:MM or ''
  quietEnd: '',
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const update = (patch) => setSettings((prev) => ({ ...prev, ...patch }));

  const toggleCategory = (id) =>
    setSettings((prev) => ({
      ...prev,
      categories: { ...prev.categories, [id]: !prev.categories[id] },
    }));

  const toggleImportance = (level) =>
    setSettings((prev) => ({
      ...prev,
      importance: { ...prev.importance, [level]: !prev.importance[level] },
    }));

  const requestPermission = async () => {
    if (!('Notification' in window)) return 'unsupported';
    const result = await Notification.requestPermission();
    update({ permission: result });
    return result;
  };

  const sendTest = () => {
    if (Notification.permission !== 'granted') return;
    new Notification('Advisor News テスト通知', {
      body: '通知が正常に設定されています。',
      icon: '/favicon.ico',
    });
  };

  return { settings, update, toggleCategory, toggleImportance, requestPermission, sendTest };
}
