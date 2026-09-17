'use client';

import { useState } from 'react';
import { Marketplace } from "../components/Marketplace";
import { Portfolio } from "../components/Portfolio";
import { AdminPanel } from "../components/AdminPanel";
import { Footer } from "../components/Footer";
import { Header, type MainTab } from "../components/Header";
import { DEMO_FACTORY_ADDRESS } from "../constants/contracts";

export default function Home() {
  const [activeTab, setActiveTab] = useState<MainTab>('marketplace');

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-gray-900">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto w-full max-w-6xl flex-1 bg-white px-5 py-10 sm:px-6 sm:py-14">
        {activeTab === 'marketplace' ? <Marketplace /> : <Portfolio />}
      </main>

      <Footer />

      {DEMO_FACTORY_ADDRESS && <AdminPanel />}
    </div>
  );
}
