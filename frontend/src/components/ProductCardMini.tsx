/* eslint-disable @next/next/no-img-element */
'use client';

import { Calendar, TrendingUp } from 'lucide-react';
import { OfferingResponse } from '../types/product';
import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '../constants/contracts';
import RevenueBridgeABI from '../generated/contracts/RevenueBridge.abi.json';
import { formatUnits } from 'viem';

interface ProductCardMiniProps {
  product: OfferingResponse;
  onClick: (productId: number) => void;
}

export function ProductCardMini({ product, onClick }: ProductCardMiniProps) {
  const { data: offeringData } = useReadContract({
    address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
    abi: RevenueBridgeABI,
    functionName: 'getOffering',
    args: [BigInt(product.offeringId)],
    query: {
      enabled: !!product,
    }
  });

  const offering = offeringData as { raisedUnits?: bigint } | undefined;
  const unitPriceRaw = Number(formatUnits(BigInt(product.terms.unitPrice.raw), 6));
  const raisedUnits = offering?.raisedUnits ? Number(offering.raisedUnits) : 0;
  const currentAmount = raisedUnits * unitPriceRaw;
  const targetAmount = Number(product.terms.targetRaise.display);
  const progressPercent = Math.min((currentAmount / targetAmount) * 100, 100) || 0;
  
  return (
    <div 
      onClick={() => onClick(product.offeringId)}
      className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100 hover:-translate-y-1 group flex flex-col h-full"
    >
      <div className="h-40 overflow-hidden relative bg-gray-900 shrink-0">
        <img 
          src={product.creator.imageUrl} 
          alt={product.title} 
          className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-gray-900 px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm">
          {product.statusLabel}
        </div>
      </div>
      <div className="p-5 flex-1 flex flex-col">
        <div className="text-xs text-blue-600 font-bold mb-1 tracking-wide">{product.creator.name}</div>
        <h3 className="text-gray-900 font-bold leading-tight mb-4 line-clamp-2">{product.title}</h3>
        
        <div className="mt-auto">
          <div className="flex justify-between items-center mb-3">
            <div className="bg-blue-50 px-2 py-1 rounded border border-blue-100/50 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-blue-700" />
              <span className="text-blue-900 text-xs font-bold">수익 분배 {product.terms.revenueSharePercent}%</span>
            </div>
            <div className="flex items-center gap-1 text-gray-500 text-xs">
              <Calendar className="w-3 h-3" />
              {new Date(product.terms.revenueEnd).getFullYear()}년 정산
            </div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5 overflow-hidden">
            <div 
              className={`h-1.5 rounded-full ${product.status === 'Funding' ? 'bg-blue-600' : 'bg-gray-400'}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[10px] font-medium">
            <span className="text-gray-900">{currentAmount.toLocaleString()} mUSD</span>
            <span className="text-gray-400">{progressPercent.toFixed(0)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
