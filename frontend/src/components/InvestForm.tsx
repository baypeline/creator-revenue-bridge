'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { CONTRACT_ADDRESSES, ERC20_ABI } from '../constants/contracts';
import { Loader2 } from 'lucide-react';

interface InvestFormProps {
  productId: string;
}

export function InvestForm({ productId }: InvestFormProps) {
  const [amount, setAmount] = useState('');
  const { address, isConnected } = useAccount();

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

  // Write Approve Transaction
  const { data: hash, isPending: isWritePending, writeContract } = useWriteContract();

  // Wait for Transaction Receipt
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  useEffect(() => {
    if (isConfirmed) {
      refetchAllowance();
      setAmount('');
    }
  }, [isConfirmed, refetchAllowance]);

  if (!isConnected) {
    return (
      <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-4 rounded-xl cursor-not-allowed mt-4">
        지갑을 먼저 연결해주세요
      </button>
    );
  }

  const parsedAmount = amount ? parseUnits(amount, 6) : 0n;
  const currentAllowance = allowance ? (allowance as bigint) : 0n;
  
  // 입력한 금액이 0보다 크고, 승인된 한도보다 클 경우에만 Approve 버튼 표시
  const needsApproval = parsedAmount > 0n && parsedAmount > currentAllowance;

  const handleApprove = () => {
    if (!amount || parsedAmount <= 0n) return;
    writeContract({
      address: CONTRACT_ADDRESSES.MUSD,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESSES.REVENUE_BRIDGE, parsedAmount],
    });
  };

  const isPending = isWritePending || isConfirming;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mt-4">
      <h3 className="text-sm font-bold text-gray-900 mb-3">투자할 수량 (mUSD)</h3>
      <div className="flex gap-3">
        <input
          type="number"
          min="0"
          step="1"
          placeholder="예: 1000"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={isPending}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
        />
        
        {needsApproval ? (
          <button 
            onClick={handleApprove}
            disabled={isPending || !amount || parsedAmount <= 0n}
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
            disabled
            className="bg-gray-900 text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 shadow-md opacity-50 cursor-not-allowed whitespace-nowrap"
          >
            투자하기
          </button>
        )}
      </div>
      
      {currentAllowance > 0n && (
        <p className="text-xs text-green-600 mt-3 font-medium flex items-center gap-1">
          ✓ 현재 승인된 한도: {formatUnits(currentAllowance, 6)} mUSD
        </p>
      )}
      {isConfirmed && (
        <p className="text-xs text-blue-600 mt-2 font-medium">
          승인이 완료되었습니다! (5단계에서 투자 기능이 활성화됩니다)
        </p>
      )}
    </div>
  );
}
