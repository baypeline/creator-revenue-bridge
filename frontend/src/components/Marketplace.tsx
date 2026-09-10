'use client';

import { useState } from 'react';
import { useProducts } from '../hooks/useProduct';
import { ProductCardMini } from './ProductCardMini';
import { ProductCard } from './ProductCard';
import { Search, X } from 'lucide-react';

export function Marketplace() {
  const { products, isLoading } = useProducts();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="text-gray-400 font-medium animate-pulse">마켓플레이스 불러오는 중...</span>
      </div>
    );
  }

  // 필터링 로직
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.includes(searchQuery) || product.creatorName.includes(searchQuery);
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* 1. 검색 및 필터 영역 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">수익권 마켓플레이스</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm shadow-sm transition-all"
              placeholder="크리에이터 이름이나 상품명을 검색해보세요"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 hide-scrollbar">
            {['all', 'funding', 'active', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors border ${
                  selectedStatus === status 
                    ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {status === 'all' ? '전체 보기' : 
                 status === 'funding' ? '모집 중' : 
                 status === 'active' ? '운영 중' : '정산 완료'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. 상품 그리드 영역 */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-gray-500 font-medium">검색 결과가 없습니다.</p>
          <button 
            onClick={() => { setSearchQuery(''); setSelectedStatus('all'); }}
            className="mt-4 text-blue-600 font-semibold hover:underline"
          >
            초기화하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map(product => (
            <ProductCardMini 
              key={product.id} 
              product={product} 
              onClick={(id) => setSelectedProductId(id)} 
            />
          ))}
        </div>
      )}

      {/* 3. 모달 오버레이 (상세 화면) */}
      {selectedProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl my-auto animate-[fadeIn_0.2s_ease-out]">
            {/* 닫기 버튼 */}
            <button 
              onClick={() => setSelectedProductId(null)}
              className="absolute -top-4 -right-4 z-10 bg-white text-gray-900 rounded-full p-2 shadow-xl hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* 상세 카드 컴포넌트 재활용 */}
            <ProductCard productId={selectedProductId} />
          </div>
        </div>
      )}
    </div>
  );
}
