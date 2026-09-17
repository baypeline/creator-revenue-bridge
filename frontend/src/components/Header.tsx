'use client';

import { Landmark } from 'lucide-react';
import { WalletConnect } from './WalletConnect';

export type MainTab = 'marketplace' | 'portfolio';

interface HeaderProps {
  activeTab: MainTab;
  onTabChange: (tab: MainTab) => void;
}

const tabs: Array<{ id: MainTab; label: string }> = [
  { id: 'marketplace', label: '마켓플레이스' },
  { id: 'portfolio', label: '내 포트폴리오' },
];

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50">
      <div className="mx-auto flex min-h-20 max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-gray-900 text-white shadow-sm">
              <Landmark className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-black tracking-tight text-gray-950 sm:text-lg">
                <span className="sm:hidden">CRB</span>
                <span className="hidden sm:inline">Creator Revenue Bridge</span>
              </h1>
              <p className="mt-0.5 hidden text-xs font-medium text-gray-500 md:block">크리에이터 수익을 오늘의 자산으로</p>
            </div>
          </div>

          <nav aria-label="주요 메뉴" className="hidden rounded-xl border border-gray-200 bg-white/80 p-1 shadow-sm sm:flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <WalletConnect />
      </div>

      <nav aria-label="모바일 주요 메뉴" className="flex gap-2 border-t border-gray-200 px-4 py-3 sm:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 rounded-lg border py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              activeTab === tab.id
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
