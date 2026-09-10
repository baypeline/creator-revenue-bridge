'use client';

import { useProduct } from '../hooks/useProduct';
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react';

export function ProductCard({ productId }: { productId: string }) {
  const { product, isLoading } = useProduct(productId);

  if (isLoading || !product) {
    return (
      <div className="w-full max-w-2xl mx-auto h-[500px] bg-white animate-pulse rounded-2xl shadow-sm border border-gray-100 flex items-center justify-center">
        <span className="text-gray-400 font-medium">상품 정보를 불러오는 중...</span>
      </div>
    );
  }

  const progressPercent = Math.min((product.currentAmount / product.targetAmount) * 100, 100);

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
      {/* 썸네일 영역 */}
      <div className="h-64 overflow-hidden relative bg-gray-900">
        <img 
          src={product.imageUrl} 
          alt={product.title} 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
          {product.status === 'funding' ? '모집 중' : '모집 완료'}
        </div>
      </div>

      {/* 정보 영역 */}
      <div className="p-8">
        <div className="text-sm text-blue-600 font-bold mb-2 tracking-wide">{product.creatorName}</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4 tracking-tight">{product.title}</h2>
        <p className="text-gray-600 text-sm mb-6 leading-relaxed">
          {product.description}
        </p>

        {/* 핵심 지표 */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100/50">
            <div className="flex items-center gap-2 text-blue-700 text-xs font-bold mb-1 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" /> 예상 연 수익률
            </div>
            <div className="text-3xl font-black text-blue-900">{product.expectedApy}%</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2 text-gray-600 text-xs font-bold mb-1 uppercase tracking-wider">
              <Calendar className="w-4 h-4" /> 정산 만기일
            </div>
            <div className="text-xl font-bold text-gray-900 mt-1">
              {new Date(product.maturityDate).toLocaleDateString('ko-KR')}
            </div>
          </div>
        </div>

        {/* 진행 상태 (Progress Bar) */}
        <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex justify-between items-end mb-3">
            <span className="text-gray-900 font-bold">모집 현황</span>
            <span className="text-blue-600 text-xl font-black">{progressPercent.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-3 overflow-hidden">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out relative" 
              style={{ width: `${progressPercent}%` }}
            >
              <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
            </div>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span className="text-gray-900">{product.currentAmount.toLocaleString()} mUSD 모임</span>
            <span className="text-gray-500">목표 {product.targetAmount.toLocaleString()} mUSD</span>
          </div>
        </div>

        {/* 투자 버튼 (현재 껍데기) */}
        <button className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
          투자하기 (Approve & Invest)
        </button>

        {/* 위험 고지 */}
        <div className="mt-5 flex items-start gap-2 text-xs text-gray-400 bg-gray-50/50 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="leading-relaxed">본 상품은 스마트 컨트랙트를 통해 투명하게 관리되지만, 크리에이터의 실제 수익에 따라 원금 손실이 발생할 수 있습니다.</p>
        </div>
      </div>
    </div>
  );
}
