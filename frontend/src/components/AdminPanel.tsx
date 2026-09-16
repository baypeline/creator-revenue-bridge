'use client';

import { useState } from 'react';
import { createWalletClient, http, publicActions, parseUnits, type Account } from 'viem';
import { foundry } from 'viem/chains';
import { CONTRACT_ADDRESSES, ERC20_ABI } from '../constants/contracts';
import RevenueBridgeABI from '../generated/contracts/RevenueBridge.abi.json';
import { mnemonicToAccount } from 'viem/accounts';
import { Loader2, Settings, ShieldCheck } from 'lucide-react';

const ANVIL_MNEMONIC = 'test test test test test test test test test test test junk';

const ADMIN_ACCOUNT = mnemonicToAccount(ANVIL_MNEMONIC, { addressIndex: 0 });
const SETTLER_ACCOUNT = mnemonicToAccount(ANVIL_MNEMONIC, { addressIndex: 2 });
const CREATOR_ACCOUNT = mnemonicToAccount(ANVIL_MNEMONIC, { addressIndex: 4 });

const getClient = (account: Account) => {
  return createWalletClient({
    account,
    chain: foundry,
    transport: http('http://localhost:8545')
  }).extend(publicActions);
};

export function AdminPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [statusText, setStatusText] = useState('');

  const runAction = async (actionName: string, action: () => Promise<void>) => {
    try {
      setIsPending(true);
      setStatusText(actionName);
      await action();
      alert(`${actionName} 완료되었습니다!`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      alert(`에러 발생: ${msg}`);
    } finally {
      setIsPending(false);
      setStatusText('');
    }
  };

  // 1. 모금 확정 및 크리에이터 선지급금 수령 원클릭 처리
  const handleFinalizeAndWithdraw = () => {
    runAction('모금 확정 및 선지급 처리', async () => {
      const adminClient = getClient(ADMIN_ACCOUNT);
      const creatorClient = getClient(CREATOR_ACCOUNT);

      // 모금 확정
      const fHash = await adminClient.writeContract({
        account: ADMIN_ACCOUNT,
        address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
        abi: RevenueBridgeABI,
        functionName: 'finalizeFunding',
        args: [BigInt(1)],
      });
      await adminClient.waitForTransactionReceipt({ hash: fHash });

      // 크리에이터 선지급금 수령
      const wHash = await creatorClient.writeContract({
        account: CREATOR_ACCOUNT,
        address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
        abi: RevenueBridgeABI,
        functionName: 'withdrawAdvance',
        args: [BigInt(1)],
      });
      await creatorClient.waitForTransactionReceipt({ hash: wHash });
    });
  };

  // 2. 수익 정산 원클릭 처리 (자동 승인 + 정산 실행)
  const handleOneClickSettle = () => {
    runAction('수익 정산(1,000 mUSD 매출)', async () => {
      const settlerClient = getClient(SETTLER_ACCOUNT);
      const amount = parseUnits('1000', 6);

      // 토큰 지출 승인
      const approveHash = await settlerClient.writeContract({
        account: SETTLER_ACCOUNT,
        address: CONTRACT_ADDRESSES.MUSD,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESSES.REVENUE_BRIDGE, amount],
      });
      await settlerClient.waitForTransactionReceipt({ hash: approveHash });

      // 정산 실행
      const evidenceHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const settleHash = await settlerClient.writeContract({
        account: SETTLER_ACCOUNT,
        address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
        abi: RevenueBridgeABI,
        functionName: 'settlePeriod',
        args: [BigInt(1), BigInt(0), amount, evidenceHash],
      });
      await settlerClient.waitForTransactionReceipt({ hash: settleHash });
    });
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gray-900 text-white p-3.5 rounded-full shadow-2xl hover:bg-black hover:scale-105 transition-all z-50 flex items-center justify-center border border-gray-700"
        title="데모 관리자 패널"
      >
        <Settings className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col">
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-400" />
          <h3 className="font-bold text-sm">데모 시연용 원클릭 패널</h3>
        </div>
        <button 
          onClick={() => setIsOpen(false)} 
          className="text-gray-400 hover:text-white p-1 rounded transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="p-4 space-y-3 relative">
        {isPending && (
          <div className="absolute inset-0 bg-white/90 z-10 flex flex-col items-center justify-center gap-2 p-4 text-center">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <p className="font-bold text-xs text-gray-800">{statusText} 진행 중...</p>
          </div>
        )}

        <p className="text-xs text-gray-500 leading-relaxed">
          데모 발표 및 테스트 시 필요한 백엔드/운영자 작업을 원클릭으로 실행합니다.
        </p>

        {/* 1. 모금 마감 및 선지급 처리 */}
        <button 
          onClick={handleFinalizeAndWithdraw}
          disabled={isPending}
          className="w-full bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold py-3 px-4 rounded-xl text-xs flex flex-col items-start gap-1 border border-blue-200 transition-all text-left"
        >
          <span className="font-black text-blue-900">1. 모금 확정 & 크리에이터 지급</span>
          <span className="text-[11px] text-blue-600 font-normal">투자 모집을 마감하고 크리에이터에게 선지급금을 인출합니다.</span>
        </button>

        {/* 2. 수익 정산 실행 */}
        <button 
          onClick={handleOneClickSettle}
          disabled={isPending}
          className="w-full bg-green-50 hover:bg-green-100 text-green-800 font-bold py-3 px-4 rounded-xl text-xs flex flex-col items-start gap-1 border border-green-200 transition-all text-left"
        >
          <span className="font-black text-green-900">2. 원클릭 수익 정산 실행</span>
          <span className="text-[11px] text-green-600 font-normal">광고 매출(1,000 mUSD) 정산을 실행하여 투자자 수익금을 생성합니다.</span>
        </button>
      </div>
    </div>
  );
}
