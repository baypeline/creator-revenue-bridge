'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, ERC20_ABI } from '../constants/contracts';
import RevenueBridgeABI from '../generated/contracts/RevenueBridge.abi.json';
import { Loader2 } from 'lucide-react';
import { useProduct } from '../hooks/useProduct';

interface InvestFormProps {
  productId: string;
}

export function InvestForm({ productId }: InvestFormProps) {
  const [units, setUnits] = useState('');
  const { address, isConnected } = useAccount();
  const { product } = useProduct(productId);

  // Read mUSD Allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACT_ADDRESSES.MUSD,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESSES.REVENUE_BRIDGE] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Write Transaction
  const { data: hash, isPending: isWritePending, writeContract } = useWriteContract();

  // Wait for Transaction Receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed) {
      refetchAllowance();
      setUnits('');
    }
  }, [isConfirmed, refetchAllowance]);

  if (!isConnected || !product) {
    return (
      <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-4 rounded-xl cursor-not-allowed mt-4">
        지갑을 먼저 연결해주세요
      </button>
    );
  }

  const unitPriceRaw = BigInt(product.terms.unitPrice.raw); // e.g. 100_000_000 for 100 mUSD
  const parsedUnits = units ? BigInt(units) : BigInt(0);
  const requiredAmount = parsedUnits * unitPriceRaw;
  const currentAllowance = allowance ? (allowance as bigint) : BigInt(0);
  
  const needsApproval = requiredAmount > BigInt(0) && requiredAmount > currentAllowance;

  const handleApprove = () => {
    if (!units || requiredAmount <= BigInt(0)) return;
    writeContract({
      address: CONTRACT_ADDRESSES.MUSD,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.REVENUE_BRIDGE, requiredAmount],
    });
  };

  const handleInvest = () => {
    if (!units || requiredAmount <= BigInt(0)) return;
    writeContract({
      address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
      abi: RevenueBridgeABI,
      functionName: 'invest',
      args: [BigInt(productId), parsedUnits],
    });
  };

  const isPending = isWritePending || isConfirming;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mt-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">투자할 수량 (단위: 구좌)</h3>
      <div className="flex gap-3">
        <input
          type="number"
          min="0"
          step="1"
          placeholder="예: 10 (구좌)"
          value={units}
          onChange={(e) => setUnits(e.target.value)}
          disabled={isPending}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
        />
        
        {needsApproval ? (
          <button 
            onClick={handleApprove}
            disabled={isPending || !units || requiredAmount <= BigInt(0)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 승인 중...</>
            ) : (
              '승인 (Approve)'
            )}
          </button>
        ) : (
          <button 
            onClick={handleInvest}
            disabled={isPending || !units || requiredAmount <= BigInt(0)}
            className="bg-gray-900 hover:bg-black text-white font-bold px-6 py-3 rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> 처리 중...</>
            ) : (
              '투자하기'
            )}
          </button>
        )}
      </div>
      
      <div className="mt-3 flex justify-between">
        <p className="text-xs text-gray-500">
          필요 금액: {units ? formatUnits(requiredAmount, 6) : '0'} mUSD
        </p>
        {currentAllowance > BigInt(0) && (
          <p className="text-xs text-green-600 font-medium flex items-center gap-1">
            ✓ 승인 한도: {formatUnits(currentAllowance, 6)} mUSD
          </p>
        )}
      </div>
      
      {isConfirmed && (
        <p className="text-xs text-blue-600 mt-2 font-medium">
          트랜잭션이 성공적으로 처리되었습니다!
        </p>
      )}
    </div>
  );
}
