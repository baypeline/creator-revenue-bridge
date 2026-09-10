import { NextResponse } from 'next/server';
import { createWalletClient, http, parseEther, parseUnits, encodeFunctionData } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';
import { CONTRACT_ADDRESSES } from '@/constants/contracts';

// Anvil 기본 제공 0번 계정 (10,000 ETH 보유)
const account = privateKeyToAccount('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');

export async function POST(request: Request) {
  try {
    const { address } = await request.json();
    if (!address) return NextResponse.json({ error: 'No address' }, { status: 400 });

    const client = createWalletClient({
      account,
      chain: foundry,
      transport: http('http://anvil:8545') // 도커 내부망 주소
    });

    // 1. 가스비용 10 ETH 전송
    await client.sendTransaction({
      to: address,
      value: parseEther('10')
    });

    // 2. 투자용 100,000 mUSD 발행 (MockSettlementToken.mint)
    const data = encodeFunctionData({
      abi: [{
        type: 'function',
        name: 'mint',
        inputs: [{ type: 'address' }, { type: 'uint256' }],
        outputs: [],
        stateMutability: 'nonpayable'
      }],
      functionName: 'mint',
      args: [address as `0x${string}`, parseUnits('100000', 6)],
    });

    await client.sendTransaction({
      to: CONTRACT_ADDRESSES.MUSD as `0x${string}`,
      data,
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
