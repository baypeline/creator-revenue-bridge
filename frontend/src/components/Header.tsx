'use client';

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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-[#f5f7fb]/95 backdrop-blur-xl">
      <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-5 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <div className="min-w-0">
            <h1 className="text-base font-black tracking-[-0.035em] text-gray-950 sm:text-lg">
              <span className="sm:hidden">CRB</span>
              <span className="hidden sm:inline">Creator Revenue Bridge</span>
            </h1>
            <p className="mt-0.5 hidden text-[11px] font-semibold text-gray-500 md:block">크리에이터 수익을 오늘의 자산으로</p>
          </div>

          <nav aria-label="주요 메뉴" className="hidden items-center gap-1 sm:flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-pressed={activeTab === tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`rounded-lg px-3.5 py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  activeTab === tab.id
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200'
                    : 'text-gray-500 hover:bg-white/70 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <WalletConnect />
      </div>

      <nav aria-label="모바일 주요 메뉴" className="flex gap-2 border-t border-slate-200 px-5 py-2.5 sm:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-pressed={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 rounded-lg py-2 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              activeTab === tab.id
                ? 'bg-white text-blue-700 shadow-sm ring-1 ring-gray-200'
                : 'text-gray-600 hover:bg-white/70'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
