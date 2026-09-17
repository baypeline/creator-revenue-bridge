'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAccount, usePublicClient, useReadContract, useWriteContract } from 'wagmi';
import { formatUnits } from 'viem';
import { ERC20_ABI, IS_LOCAL_CHAIN } from '../constants/contracts';
import { useActiveContracts } from '../hooks/useActiveContracts';
import RevenueBridgeABI from '../generated/contracts/RevenueBridge.abi.json';
import { Loader2 } from 'lucide-react';
import { useProduct } from '../hooks/useProduct';

interface InvestFormProps {
  productId: string;
}

export function InvestForm({ productId }: InvestFormProps) {
  const [units, setUnits] = useState('');
  const [flowStatus, setFlowStatus] = useState<'idle' | 'approving' | 'investing' | 'success'>('idle');
  const [flowError, setFlowError] = useState('');
  const queryClient = useQueryClient();
  const publicClient = usePublicClient();
  const { address, isConnected } = useAccount();
  const { product } = useProduct(productId);
  const { addresses } = useActiveContracts();

  // Read mUSD Allowance
  const { data: allowance, refetch: refetchAllowance, isFetching: isFetchingAllowance } = useReadContract({
    address: addresses.MUSD,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, addresses.REVENUE_BRIDGE] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Read whitelist status
  const { data: isAllowed, refetch: refetchAllowed } = useReadContract({
    address: addresses.REVENUE_BRIDGE,
    abi: RevenueBridgeABI,
    functionName: 'allowedInvestors',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    }
  });

  // Read offering data to calculate remaining units (always at top level)
  const { data: offeringData, refetch: refetchOffering } = useReadContract({
    address: addresses.REVENUE_BRIDGE,
    abi: RevenueBridgeABI,
    functionName: 'getOffering',
    args: [BigInt(productId)],
    query: {
      enabled: !!productId,
    }
  });

  const { writeContractAsync } = useWriteContract();

  // 외부에서 투자자 등록이나 토큰 지급이 완료된 뒤 상태를 재반영한다.
  useEffect(() => {
    const handleFocus = () => {
      refetchAllowed();
      refetchAllowance();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchAllowed, refetchAllowance]);

  if (!isConnected || !product) {
    return (
      <button disabled className="w-full bg-gray-200 text-gray-500 font-bold py-4 rounded-xl cursor-not-allowed mt-4">
        지갑을 먼저 연결해주세요
      </button>
    );
  }

  if (isAllowed === false) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-5 shadow-sm mt-4 text-center">
        <p className="text-red-600 font-bold mb-2">⚠️ 투자를 위한 초기 세팅이 필요합니다</p>
        {IS_LOCAL_CHAIN ? (
          <p className="text-sm text-red-500">우측 상단의 <span className="font-bold bg-green-100 text-green-700 px-1 rounded">💰 테스트 돈 받기</span> 버튼을 눌러 먼저 지갑을 등록해주세요!</p>
        ) : (
          <p className="text-sm text-red-500">현재 연결한 지갑은 투자자로 등록되어 있지 않습니다. 서비스 운영자에게 등록을 요청해주세요.</p>
        )}
      </div>
    );
  }

  const offering = offeringData as { status?: number; raisedUnits?: bigint } | undefined;
  const raisedUnits = offering?.raisedUnits ? Number(offering.raisedUnits) : 0;
  const remainingUnits = product.terms.unitsForSale - raisedUnits;
  const isFunding = offering?.status === undefined || Number(offering.status) === 1;

  const unitPriceRaw = BigInt(product.terms.unitPrice.raw); // e.g. 100_000_000 for 100 mUSD
  const hasValidUnits = /^\d+$/.test(units) && BigInt(units) > BigInt(0);
  const parsedUnits = hasValidUnits ? BigInt(units) : BigInt(0);
  const requiredAmount = parsedUnits * unitPriceRaw;
  const currentAllowance = allowance ? (allowance as bigint) : BigInt(0);

  const isExceedingCapacity = Number(parsedUnits) > remainingUnits;
  
  const needsApproval = requiredAmount > BigInt(0) && requiredAmount > currentAllowance;

  const handleInvest = async () => {
    if (!hasValidUnits || isExceedingCapacity || !publicClient) return;

    try {
      setFlowError('');

      if (needsApproval) {
        setFlowStatus('approving');
        const approvalHash = await writeContractAsync({
          address: addresses.MUSD,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [addresses.REVENUE_BRIDGE, requiredAmount],
        });
        const approvalReceipt = await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        if (approvalReceipt.status !== 'success') throw new Error('approval reverted');
      }

      setFlowStatus('investing');
      const investmentHash = await writeContractAsync({
        address: addresses.REVENUE_BRIDGE,
        abi: RevenueBridgeABI,
        functionName: 'invest',
        args: [BigInt(productId), parsedUnits],
      });
      const investmentReceipt = await publicClient.waitForTransactionReceipt({ hash: investmentHash });
      if (investmentReceipt.status !== 'success') throw new Error('investment reverted');

      setUnits('');
      await Promise.all([
        refetchAllowance(),
        refetchOffering(),
        queryClient.invalidateQueries(),
      ]);
      setFlowStatus('success');
    } catch (reason) {
      const message = reason instanceof Error ? reason.message.toLowerCase() : '';
      await Promise.allSettled([refetchAllowance(), refetchOffering()]);
      setFlowStatus('idle');
      setFlowError(
        message.includes('user rejected') || message.includes('user denied')
          ? '지갑에서 트랜잭션 요청이 취소되었습니다.'
          : '투자 처리에 실패했습니다. 지갑과 네트워크 상태를 확인한 뒤 다시 시도해주세요.',
      );
    }
  };

  const isPending = flowStatus === 'approving' || flowStatus === 'investing' || isFetchingAllowance;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mt-4">
      <div className="flex justify-between items-end mb-3">
        <h3 className="text-sm font-bold text-gray-900">투자할 수량 (단위: 구좌)</h3>
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
          잔여: {remainingUnits.toLocaleString()} 구좌
        </span>
      </div>
      <div className="flex gap-3">
        <input
          type="number"
          min="1"
          max={remainingUnits}
          step="1"
          placeholder={`최대 ${remainingUnits} 구좌`}
          value={units}
          onChange={(e) => {
            setUnits(e.target.value);
            setFlowStatus('idle');
            setFlowError('');
          }}
          disabled={isPending || remainingUnits === 0 || !isFunding}
          className={`flex-1 bg-gray-50 border ${isExceedingCapacity ? 'border-red-400 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500'} rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:bg-white transition-all disabled:opacity-50`}
        />
        
        <button
          onClick={handleInvest}
          disabled={isPending || !isFunding || !hasValidUnits || isExceedingCapacity || remainingUnits === 0}
          className="bg-gray-900 hover:bg-black text-white font-bold px-6 py-3 rounded-lg transition-all flex items-center gap-2 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> {isFetchingAllowance ? '동기화 중...' : flowStatus === 'approving' ? 'mUSD 승인 중...' : '투자 처리 중...'}</>
          ) : !isFunding ? (
            '모집 종료'
          ) : remainingUnits === 0 ? (
            '모집 마감'
          ) : (
            '투자하기'
          )}
        </button>
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <div className="flex flex-col gap-1">
          <p className="text-xs text-gray-500">
            필요 금액: {units ? formatUnits(requiredAmount, 6) : '0'} mUSD
          </p>
          {isExceedingCapacity && (
            <p className="text-xs text-red-500 font-bold">
              잔여 구좌({remainingUnits})를 초과할 수 없습니다.
            </p>
          )}
          {units && !hasValidUnits && (
            <p className="text-xs text-red-500 font-bold">
              1 이상의 정수 구좌를 입력해주세요.
            </p>
          )}
          {needsApproval && hasValidUnits && !isPending && (
            <p className="text-xs text-gray-500">
              첫 투자에서는 mUSD 승인 후 투자 확인 요청이 이어집니다.
            </p>
          )}
        </div>
        {currentAllowance > BigInt(0) && (
          <p className="text-xs text-green-600 font-medium flex items-center gap-1">
            ✓ 승인 한도: {formatUnits(currentAllowance, 6)} mUSD
          </p>
        )}
      </div>
      
      {flowStatus === 'success' && (
        <p className="text-xs text-blue-600 mt-2 font-medium">
          투자가 완료되어 모집 현황에 반영되었습니다.
        </p>
      )}
      {flowError && <p className="text-xs text-red-600 mt-2 font-medium">{flowError}</p>}
    </div>
  );
}
