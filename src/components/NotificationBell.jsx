import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function NotificationBell({ count = 3 }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 text-gray-600 hover:text-blue-600"
        aria-label="通知"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {count > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {count}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-3">
          <p className="text-xs text-gray-500 mb-2">最新通知</p>
          <p className="text-sm text-gray-700">新しいニュースが {count} 件あります</p>
          <Link to="/notifications" className="block mt-2 text-xs text-blue-600 hover:underline">
            通知設定へ
          </Link>
        </div>
      )}
    </div>
  );
}
