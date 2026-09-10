'use client';

import { useAccount, useConnect, useDisconnect, useReadContract, useSwitchChain } from 'wagmi';
import { Wallet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatUnits, parseAbi } from 'viem';
import { CONTRACT_ADDRESSES } from '../constants/contracts';

export function WalletConnect() {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true); }, []);

  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  const { data: balanceData, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.MUSD as `0x${string}`,
    abi: parseAbi(['function balanceOf(address) view returns (uint256)']),
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: isConnected && !!address,
    }
  });

  const [isFunding, setIsFunding] = useState(false);

  const formattedBalance = balanceData !== undefined 
    ? Number(formatUnits(balanceData as bigint, 6)).toFixed(2) 
    : '0.00';

  const handleConnect = () => {
    if (!connectors || connectors.length === 0) {
      alert("활성화된 지갑 커넥터가 없습니다. 지갑 앱(MetaMask 등)이 설치되어 있는지 확인해주세요.");
      return;
    }
    
    // 첫 번째 커넥터(보통 injected/메타마스크)로 바로 연결 시도
    connect(
      { connector: connectors[0] },
      {
        onError: (err) => alert("지갑 연결 에러:\n" + err.message),
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

  if (!mounted) return <div className="w-32 h-10 bg-gray-200 animate-pulse rounded-lg"></div>;

  if (isConnected) {
    return (
      <div className="flex items-center gap-4">
        {chainId !== 31337 && (
          <button 
            onClick={() => switchChain({ chainId: 31337 })}
            className="text-xs text-white font-bold bg-red-500 hover:bg-red-600 px-3 py-1.5 rounded transition-colors shadow-sm"
          >
            Switch to Anvil
          </button>
        )}
        <button 
          onClick={handleFaucet}
          disabled={isFunding}
          className="text-xs font-bold bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1.5 rounded transition-colors shadow-sm disabled:opacity-50"
        >
          {isFunding ? '충전 중...' : '💰 테스트 돈 받기'}
        </button>
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
          className="p-2 text-gray-500 hover:text-gray-900 transition-colors"
          title="Disconnect"
        >
          <Wallet className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
      >
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </button>
      {connectError && (
        <span className="text-xs text-red-500 mt-1 max-w-xs text-right break-words">
          {connectError.message}
        </span>
      )}
    </div>
  );
}
