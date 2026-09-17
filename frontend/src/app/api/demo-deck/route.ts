import { NextResponse } from 'next/server';
import {
  createPublicClient,
  createWalletClient,
  formatUnits,
  http,
  keccak256,
  stringToHex,
  type Abi,
  type Address,
  type Hash,
} from 'viem';
import { foundry } from 'viem/chains';
import { CONTRACT_ADDRESSES, IS_LOCAL_CHAIN } from '@/constants/contracts';
import deployment from '@/generated/contracts/deployment.json';
import RevenueBridgeABI from '@/generated/contracts/RevenueBridge.abi.json';
import MockSettlementTokenABI from '@/generated/contracts/MockSettlementToken.abi.json';

export const dynamic = 'force-dynamic';

const OFFERING_ID = BigInt(deployment.demo.offeringId);
const GROSS_REVENUE = BigInt(1_000_000_000);

type DemoAction = 'fund' | 'activate' | 'settle' | 'close' | 'claim' | 'reset';

type OfferingState = {
  status: number;
  unitsForSale: bigint;
  unitPrice: bigint;
  raisedUnits: bigint;
  investorRevenueTotal: bigint;
  totalClaimed: bigint;
  nextPeriodIndex: bigint;
  fundingDeadline: bigint;
  revenueStart: bigint;
  revenueEnd: bigint;
  revenueShareBps: number;
  advanceWithdrawn: boolean;
};

declare global {
  var crbDemoSnapshotId: string | undefined;
}

function isEnabled() {
  return process.env.DEMO_CONTROL_ENABLED === 'true' && IS_LOCAL_CHAIN;
}

function rpcUrl() {
  return process.env.WEB3_RPC_URL ?? 'http://anvil:8545';
}

function publicClient() {
  return createPublicClient({ chain: foundry, transport: http(rpcUrl()) });
}

function walletClient(account: Address) {
  return createWalletClient({ account, chain: foundry, transport: http(rpcUrl()) });
}

async function rpc(method: string, params: unknown[] = []) {
  const response = await fetch(rpcUrl(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method, params }),
    cache: 'no-store',
  });
  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(body.error?.message ?? `Anvil RPC 요청 실패: ${method}`);
  }
  return body.result;
}

async function ensureSnapshot() {
  if (!globalThis.crbDemoSnapshotId) {
    globalThis.crbDemoSnapshotId = String(await rpc('evm_snapshot'));
  }
}

async function waitFor(hash: Hash) {
  await publicClient().waitForTransactionReceipt({ hash });
}

async function readState() {
  const client = publicClient();
  const investor = deployment.accounts.investor as Address;
  const [offeringRaw, periodEndsRaw, targetRaise, claimable, escrowLiability, revenueLiability, block] =
    await Promise.all([
      client.readContract({
        address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
        abi: RevenueBridgeABI as Abi,
        functionName: 'getOffering',
        args: [OFFERING_ID],
      }),
      client.readContract({
        address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
        abi: RevenueBridgeABI as Abi,
        functionName: 'getPeriodEnds',
        args: [OFFERING_ID],
      }),
      client.readContract({
        address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
        abi: RevenueBridgeABI as Abi,
        functionName: 'targetRaise',
        args: [OFFERING_ID],
      }),
      client.readContract({
        address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
        abi: RevenueBridgeABI as Abi,
        functionName: 'claimable',
        args: [OFFERING_ID, investor],
      }),
      client.readContract({
        address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
        abi: RevenueBridgeABI as Abi,
        functionName: 'totalEscrowLiability',
      }),
      client.readContract({
        address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
        abi: RevenueBridgeABI as Abi,
        functionName: 'totalRevenueLiability',
      }),
      client.getBlock(),
    ]);

  const offering = offeringRaw as OfferingState;
  const periodEnds = periodEndsRaw as bigint[];
  const statusLabels = ['없음', '모집 중', '운영 중', '모집 실패', '정산 중', '종료'];

  return {
    offeringId: Number(OFFERING_ID),
    status: offering.status,
    statusLabel: statusLabels[offering.status] ?? '알 수 없음',
    unitsForSale: offering.unitsForSale.toString(),
    raisedUnits: offering.raisedUnits.toString(),
    targetRaise: formatUnits(targetRaise as bigint, 6),
    investorRevenue: formatUnits(offering.investorRevenueTotal, 6),
    totalClaimed: formatUnits(offering.totalClaimed, 6),
    claimable: formatUnits(claimable as bigint, 6),
    escrowLiability: formatUnits(escrowLiability as bigint, 6),
    revenueLiability: formatUnits(revenueLiability as bigint, 6),
    nextPeriodIndex: Number(offering.nextPeriodIndex),
    periodCount: periodEnds.length,
    advanceWithdrawn: offering.advanceWithdrawn,
    chainTime: new Date(Number(block.timestamp) * 1000).toISOString(),
    fundingDeadline: new Date(Number(offering.fundingDeadline) * 1000).toISOString(),
    revenueStart: new Date(Number(offering.revenueStart) * 1000).toISOString(),
    revenueEnd: new Date(Number(offering.revenueEnd) * 1000).toISOString(),
  };
}

async function fundOffering() {
  const state = (await publicClient().readContract({
    address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
    abi: RevenueBridgeABI as Abi,
    functionName: 'getOffering',
    args: [OFFERING_ID],
  })) as OfferingState;
  if (state.status !== 1 || state.raisedUnits >= state.unitsForSale) {
    throw new Error('현재 단계에서는 모집 수량을 채울 수 없습니다.');
  }

  const investor = deployment.accounts.investor as Address;
  const wallet = walletClient(investor);
  const remainingUnits = state.unitsForSale - state.raisedUnits;
  const amount = remainingUnits * state.unitPrice;
  const approveHash = await wallet.writeContract({
    address: CONTRACT_ADDRESSES.MUSD,
    abi: MockSettlementTokenABI as Abi,
    functionName: 'approve',
    args: [CONTRACT_ADDRESSES.REVENUE_BRIDGE, amount],
  });
  await waitFor(approveHash);
  const investHash = await wallet.writeContract({
    address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
    abi: RevenueBridgeABI as Abi,
    functionName: 'invest',
    args: [OFFERING_ID, remainingUnits],
  });
  await waitFor(investHash);
}

async function activateOffering() {
  const admin = walletClient(deployment.accounts.admin as Address);
  const creator = walletClient(deployment.accounts.creator as Address);
  const finalizeHash = await admin.writeContract({
    address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
    abi: RevenueBridgeABI as Abi,
    functionName: 'finalizeFunding',
    args: [OFFERING_ID],
  });
  await waitFor(finalizeHash);
  const withdrawHash = await creator.writeContract({
    address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
    abi: RevenueBridgeABI as Abi,
    functionName: 'withdrawAdvance',
    args: [OFFERING_ID],
  });
  await waitFor(withdrawHash);
}

async function settleNextPeriod() {
  const client = publicClient();
  const [offeringRaw, periodEndsRaw] = await Promise.all([
    client.readContract({
      address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
      abi: RevenueBridgeABI as Abi,
      functionName: 'getOffering',
      args: [OFFERING_ID],
    }),
    client.readContract({
      address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
      abi: RevenueBridgeABI as Abi,
      functionName: 'getPeriodEnds',
      args: [OFFERING_ID],
    }),
  ]);
  const offering = offeringRaw as OfferingState;
  const periodEnds = periodEndsRaw as bigint[];
  const periodIndex = Number(offering.nextPeriodIndex);
  if (![2, 4].includes(offering.status) || periodIndex >= periodEnds.length) {
    throw new Error('정산할 수 있는 기간이 없습니다.');
  }

  const latestBlock = await client.getBlock();
  if (latestBlock.timestamp < periodEnds[periodIndex]) {
    await rpc('evm_setNextBlockTimestamp', [`0x${periodEnds[periodIndex].toString(16)}`]);
    await rpc('evm_mine');
  }

  const investorAmount = GROSS_REVENUE * BigInt(offering.revenueShareBps) / BigInt(10_000);
  const settler = walletClient(deployment.accounts.settler as Address);
  const approveHash = await settler.writeContract({
    address: CONTRACT_ADDRESSES.MUSD,
    abi: MockSettlementTokenABI as Abi,
    functionName: 'approve',
    args: [CONTRACT_ADDRESSES.REVENUE_BRIDGE, investorAmount],
  });
  await waitFor(approveHash);
  const settleHash = await settler.writeContract({
    address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
    abi: RevenueBridgeABI as Abi,
    functionName: 'settlePeriod',
    args: [OFFERING_ID, BigInt(periodIndex), GROSS_REVENUE, keccak256(stringToHex(`demo-deck-${periodIndex}`))],
  });
  await waitFor(settleHash);
}

async function closeOffering() {
  const wallet = walletClient(deployment.accounts.admin as Address);
  const hash = await wallet.writeContract({
    address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
    abi: RevenueBridgeABI as Abi,
    functionName: 'closeOffering',
    args: [OFFERING_ID],
  });
  await waitFor(hash);
}

async function claimRevenue() {
  const wallet = walletClient(deployment.accounts.investor as Address);
  const hash = await wallet.writeContract({
    address: CONTRACT_ADDRESSES.REVENUE_BRIDGE,
    abi: RevenueBridgeABI as Abi,
    functionName: 'claim',
    args: [OFFERING_ID],
  });
  await waitFor(hash);
}

async function resetDemo() {
  if (!globalThis.crbDemoSnapshotId) {
    throw new Error('초기 스냅샷이 없습니다. 로컬 배포를 다시 실행해주세요.');
  }
  const reverted = await rpc('evm_revert', [globalThis.crbDemoSnapshotId]);
  if (!reverted) {
    globalThis.crbDemoSnapshotId = undefined;
    throw new Error('스냅샷을 복원할 수 없습니다. 로컬 배포를 다시 실행해주세요.');
  }
  globalThis.crbDemoSnapshotId = String(await rpc('evm_snapshot'));
}

export async function GET() {
  if (!isEnabled()) {
    return NextResponse.json({ error: '개발용 Anvil 환경에서만 사용할 수 있습니다.' }, { status: 404 });
  }
  try {
    await ensureSnapshot();
    return NextResponse.json(await readState());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isEnabled()) {
    return NextResponse.json({ error: '개발용 Anvil 환경에서만 사용할 수 있습니다.' }, { status: 404 });
  }
  try {
    await ensureSnapshot();
    const { action } = await request.json() as { action?: DemoAction };
    if (action === 'fund') await fundOffering();
    else if (action === 'activate') await activateOffering();
    else if (action === 'settle') await settleNextPeriod();
    else if (action === 'close') await closeOffering();
    else if (action === 'claim') await claimRevenue();
    else if (action === 'reset') await resetDemo();
    else return NextResponse.json({ error: '지원하지 않는 데모 동작입니다.' }, { status: 400 });

    return NextResponse.json(await readState());
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 409 });
  }
}
