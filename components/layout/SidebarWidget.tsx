'use client';

import React from 'react';
import { RiSparklingLine, RiArrowRightLine, RiHeartPulseLine } from '@remixicon/react';

export default function SidebarWidget() {
  return (
    <div className="mx-auto mb-6 w-full rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-emerald-600 p-5 text-white overflow-hidden relative">
      {/* 背景装飾 - 柔らかい形状 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-sm" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-sm" />
      <div className="absolute top-1/2 right-4 w-16 h-16 bg-emerald-400/20 rounded-full blur-md" />

      {/* コンテンツ */}
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 bg-white/20 rounded-lg">
            <RiHeartPulseLine className="w-4 h-4 text-white" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-white/90">
            ヒント
          </span>
        </div>
        <h3 className="font-bold text-white mb-2 text-lg">診断を始めよう</h3>
        <p className="text-sm text-white/85 mb-4 leading-relaxed">
          AIがあなたのリードを自動評価。簡単3ステップで診断完了！
        </p>
        <button className="flex items-center gap-2 text-sm font-semibold text-brand-700 bg-white hover:bg-white/90 rounded-xl px-4 py-2.5 transition-all shadow-sm hover:shadow-md">
          今すぐ始める
          <RiArrowRightLine className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
