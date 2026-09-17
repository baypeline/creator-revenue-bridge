'use client';

import { useAccount, useConnect, useDisconnect, useReadContract, useSwitchChain } from 'wagmi';
import { Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatUnits, parseAbi } from 'viem';
import { baseSepolia, foundry } from 'viem/chains';
import { CHAIN_ID, CONTRACT_ADDRESSES, IS_LOCAL_CHAIN } from '../constants/contracts';

const TARGET_CHAIN_NAME = IS_LOCAL_CHAIN ? 'Anvil' : 'Base Sepolia';

const getConnectErrorMessage = (message: string) => {
  const normalized = message.toLowerCase();

  if (normalized.includes('already pending') || normalized.includes('request already pending')) {
    return '메타마스크에서 진행 중인 지갑 연결 요청을 먼저 확인해주세요.';
  }
  if (normalized.includes('user rejected') || normalized.includes('user denied')) {
    return '지갑 연결 요청이 취소되었습니다.';
  }

  return '지갑 연결에 실패했습니다. 메타마스크 상태를 확인한 뒤 다시 시도해주세요.';
};

export function WalletConnect() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, error: connectError, isPending: isConnectPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const { data: balanceData, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.MUSD as `0x${string}`,
    abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: mounted && isConnected && !!address,
    }
  });

  const [isFunding, setIsFunding] = useState(false);

  const formattedBalance = balanceData !== undefined
    ? Number(formatUnits(balanceData as bigint, 6)).toFixed(2)
    : '0.00';

  const handleConnect = () => {
    if (isConnectPending) {
      alert('메타마스크에서 진행 중인 지갑 연결 요청을 먼저 확인해주세요.');
      return;
    }

    if (!connectors || connectors.length === 0) {
      alert("활성화된 지갑 커넥터가 없습니다. 브라우저에 MetaMask(메타마스크) 확장 프로그램이 설치되어 있는지 확인해주세요.");
      return;
    }

    // 첫 번째 커넥터(메타마스크/injected)로 연결 시도
    connect(
      { connector: connectors[0] },
      {
        onError: (err) => alert(getConnectErrorMessage(err.message)),
      }
    );
  };

  const handleFaucet = async () => {
    if (!address) return;
    setIsFunding(true);
    try {
      const res = await fetch('/api/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });
      if (!res.ok) throw new Error(await res.text());
      alert('테스트용 ETH와 mUSD 충전이 완료되었습니다!');
      refetch();
    } catch (e) {
      alert('충전 실패: ' + e);
    } finally {
      setIsFunding(false);
    }
  };

  // 마운트 완료 후 지갑이 연결되어 있을 때만 지갑 정보 표시
  if (mounted && isConnected) {
    return (
      <div className="flex items-center gap-4">
        {chainId !== CHAIN_ID && (
          <button
            onClick={() => switchChain({ chainId: CHAIN_ID as typeof foundry.id | typeof baseSepolia.id })}
            className="text-xs text-white font-bold bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded transition-colors shadow-sm"
          >
            {TARGET_CHAIN_NAME}로 전환
          </button>
        )}
        {IS_LOCAL_CHAIN && (
          <button
            onClick={handleFaucet}
            disabled={isFunding}
            className="text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isFunding ? '충전 중...' : '💰 테스트 돈 받기'}
          </button>
        )}
        <div className="flex flex-col items-end">
          <span className="text-sm font-semibold text-gray-900">
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </span>
          <span className="text-xs text-gray-500">
            {formattedBalance} mUSD
          </span>
        </div>
        <button
          onClick={() => disconnect()}
          className="p-2 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
          title="Disconnect"
        >
          <Wallet className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // 지갑이 연결되지 않았거나 초기 로딩 중일 때는 항상 깔끔한 Connect Wallet 버튼 표시
  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
      >
        <Wallet className="w-4 h-4" />
        {isConnectPending ? '지갑 연결 대기 중' : '지갑 연결'}
      </button>
      {connectError && (
        <span className="text-xs text-red-500 mt-1 max-w-xs text-right break-words">
          {getConnectErrorMessage(connectError.message)}
        </span>
      )}
    </div>
  );
}
