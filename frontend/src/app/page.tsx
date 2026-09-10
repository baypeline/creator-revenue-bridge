import { WalletConnect } from "../components/WalletConnect";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Creator Revenue Bridge</h1>
            <p className="text-xs text-gray-500 font-medium mt-0.5">RWA 기반 선지급 데모</p>
          </div>
          <WalletConnect />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* 콘텐츠 영역 */}
      </main>
    </div>
  );
}
