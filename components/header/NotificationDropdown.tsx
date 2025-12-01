'use client';

import { useState, useRef, useEffect } from 'react';
import { RiNotification3Line, RiCheckDoubleLine } from '@remixicon/react';

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center w-10 h-10 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
      >
        <RiNotification3Line className="w-5 h-5" />
        {/* 通知バッジ */}
        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-error-500"></span>
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 dark:bg-gray-800 dark:border-gray-700 z-50 overflow-hidden">
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">通知</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">新着 0 件</p>
            </div>
            <button className="text-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 flex items-center gap-1">
              <RiCheckDoubleLine className="w-4 h-4" />
              すべて既読
            </button>
          </div>

          {/* 通知リスト */}
          <div className="max-h-80 overflow-y-auto">
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <RiNotification3Line className="w-8 h-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                通知はありません
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                新しい通知があるとここに表示されます
              </p>
            </div>
          </div>

          {/* フッター */}
          <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <button className="w-full text-center text-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 font-medium py-1">
              すべての通知を見る
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
