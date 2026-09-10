'use client';

import { Calendar, TrendingUp } from 'lucide-react';
import { Product } from '../types/product';

interface ProductCardMiniProps {
  product: Product;
  onClick: (productId: string) => void;
}

export function ProductCardMini({ product, onClick }: ProductCardMiniProps) {
  const progressPercent = Math.min((product.currentAmount / product.targetAmount) * 100, 100);
  
  return (
    <div 
      onClick={() => onClick(product.id)}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:-translate-y-1 group flex flex-col h-full"
    >
      <div className="h-40 overflow-hidden relative bg-gray-900 shrink-0">
        <img 
          src={product.imageUrl} 
          alt={product.title} 
          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-gray-900 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">
          {product.status === 'funding' ? '모집 중' : product.status === 'active' ? '운영 중' : '정산 완료'}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="text-xs text-blue-600 font-bold mb-1 tracking-wide">{product.creatorName}</div>
        <h3 className="text-gray-900 font-bold leading-tight mb-4 line-clamp-2">{product.title}</h3>
        
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-3">
            <div className="bg-blue-50 px-2 py-1 rounded border border-blue-100/50 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-blue-700" />
              <span className="text-blue-900 text-xs font-bold">APY {product.expectedApy}%</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Calendar className="w-3 h-3" />
              {new Date(product.maturityDate).getFullYear()}년 정산
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full ${product.status === 'funding' ? 'bg-blue-600' : 'bg-gray-400'}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] font-medium">
            <span className="text-gray-900">{product.currentAmount.toLocaleString()} mUSD</span>
            <span className="text-gray-400">{progressPercent.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
