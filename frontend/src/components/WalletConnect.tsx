'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, CircleDollarSign, Copy, LogOut, Wallet } from 'lucide-react';
import { formatUnits, parseAbi } from 'viem';
import { baseSepolia, foundry } from 'viem/chains';
import { useAccount, useConnect, useDisconnect, useReadContract, useSwitchChain } from 'wagmi';
import { CHAIN_ID, IS_LOCAL_CHAIN } from '../constants/contracts';
import { useActiveContracts } from '../hooks/useActiveContracts';
import { formatAddress, formatNumber } from '../lib/format';

const TARGET_CHAIN_NAME = IS_LOCAL_CHAIN ? 'Anvil 로컬' : 'Base Sepolia';

const getConnectErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();
  if (normalized.includes('already pending') || normalized.includes('request already pending')) return '메타마스크에서 진행 중인 지갑 연결 요청을 먼저 확인해주세요.';
  if (normalized.includes('user rejected') || normalized.includes('user denied')) return '지갑 연결 요청이 취소되었습니다.';
  return '지갑 연결에 실패했습니다. 메타마스크 상태를 확인한 뒤 다시 시도해주세요.';
};

export function WalletConnect() {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const closeOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOutside);
    return () => document.removeEventListener('mousedown', closeOutside);
  }, [isOpen]);

  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, error: connectError, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const { addresses } = useActiveContracts();
  const isCorrectChain = chainId === CHAIN_ID;

  const { data: balanceData, refetch } = useReadContract({
    address: addresses.MUSD,
    abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: mounted && isConnected && !!address },
  });

  const balance = balanceData !== undefined ? Number(formatUnits(balanceData as bigint, 6)) : 0;

  const handleConnect = () => {
    if (isConnectPending) {
      alert('메타마스크에서 진행 중인 지갑 연결 요청을 먼저 확인해주세요.');
      return;
    }
    if (!connectors?.length) {
      alert('브라우저에 MetaMask 확장 프로그램을 설치한 뒤 다시 시도해주세요.');
      return;
    }
    connect({ connector: connectors[0] }, { onError: (error) => alert(getConnectErrorMessage(error.message)) });
  };

  const handleFaucet = async () => {
    if (!address) return;
    setIsFunding(true);
    try {
      const response = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
      });
      if (!response.ok) throw new Error(await response.text());
      await refetch();
      alert('테스트용 ETH와 mUSD가 충전되었습니다.');
    } catch (error) {
      alert(`충전에 실패했습니다: ${error}`);
    } finally {
      setIsFunding(false);
    }
  };

  const copyAddress = async () => {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  if (mounted && isConnected && address) {
    return (
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isCorrectChain ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-600'}`}><Wallet className="h-4 w-4" /></span>
          <span className="hidden min-w-0 sm:block">
            <span className="numeric block text-xs font-extrabold text-gray-950">{formatNumber(balance)} mUSD</span>
            <span className="block text-[10px] font-medium text-gray-500">{formatAddress(address)}</span>
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-[calc(100%+10px)] z-40 w-[min(320px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-[0_22px_60px_-20px_rgba(15,23,42,0.45)]">
            <div className="border-b border-gray-100 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-bold text-gray-600"><span className={`h-2 w-2 rounded-full ${isCorrectChain ? 'bg-emerald-500' : 'bg-red-500'}`} />{isCorrectChain ? TARGET_CHAIN_NAME : '네트워크 불일치'}</span>
                <button type="button" onClick={copyAddress} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-950">
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}{copied ? '복사됨' : formatAddress(address)}
                </button>
              </div>
              <p className="numeric mt-4 text-2xl font-black tracking-tight text-gray-950">{formatNumber(balance)} <span className="text-sm font-bold text-gray-500">mUSD</span></p>
              <p className="mt-1 text-[11px] text-gray-500">투자에 사용할 수 있는 잔액</p>
            </div>

            <div className="space-y-2 p-3">
              {!isCorrectChain && (
                <button type="button" onClick={() => switchChain({ chainId: CHAIN_ID as typeof foundry.id | typeof baseSepolia.id })} className="flex w-full items-center justify-center rounded-xl bg-red-600 px-4 py-3 text-xs font-extrabold text-white transition hover:bg-red-700">{TARGET_CHAIN_NAME}로 전환</button>
              )}
              {IS_LOCAL_CHAIN && (
                <button type="button" onClick={handleFaucet} disabled={isFunding} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50">
                  <CircleDollarSign className="h-4 w-4 text-emerald-600" />{isFunding ? '테스트 자산 충전 중' : '테스트 자산 받기'}
                </button>
              )}
              <button type="button" onClick={() => { disconnect(); setIsOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold text-gray-600 transition hover:bg-gray-50 hover:text-red-600">
                <LogOut className="h-4 w-4" />지갑 연결 해제
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button type="button" onClick={handleConnect} disabled={!mounted || isConnectPending} className="flex items-center gap-2 rounded-xl bg-gray-950 px-4 py-2.5 text-sm font-extrabold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">
        <Wallet className="h-4 w-4" />{isConnectPending ? '연결 승인 대기 중' : '지갑 연결'}
      </button>
      {connectError && <span className="mt-1.5 max-w-xs text-right text-[11px] text-red-600">{getConnectErrorMessage(connectError.message)}</span>}
    </div>
  );
}
