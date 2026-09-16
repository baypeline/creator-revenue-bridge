'use client';

import { useState } from 'react';
import { WalletConnect } from "../components/WalletConnect";
import { Marketplace } from "../components/Marketplace";
import { Portfolio } from "../components/Portfolio";
import { AdminPanel } from "../components/AdminPanel";

export default function Home() {
  const [activeTab, setActiveTab] = useState<'marketplace' | 'portfolio'>('marketplace');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-24">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-xl font-bold tracking-tight">Creator Revenue Bridge</h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">RWA 기반 선지급 데모</p>
            </div>
            <div className="hidden sm:flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
                  activeTab === 'marketplace' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                마켓플레이스
              </button>
              <button
                onClick={() => setActiveTab('portfolio')}
                className={`px-4 py-2 text-sm font-bold rounded-md transition-all ${
                  activeTab === 'portfolio' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                내 포트폴리오
              </button>
            </div>
          </div>
          <WalletConnect />
        </div>
      </header>
      
      {/* 모바일 탭 */}
      <div className="sm:hidden bg-white border-b border-gray-200 p-3 flex gap-2">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all border ${
            activeTab === 'marketplace' ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}
        >
          마켓플레이스
        </button>
        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all border ${
            activeTab === 'portfolio' ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-600 border-gray-200'
          }`}
        >
          내 포트폴리오
        </button>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {activeTab === 'marketplace' ? <Marketplace /> : <Portfolio />}
      </main>
      
      <AdminPanel />
    </div>
  );
}
