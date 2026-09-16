import { useQuery } from '@tanstack/react-query';
import { OfferingResponse } from '../types/product';

// 백엔드가 제공하는 OfferingResponse 구조에 맞춘 가짜 데이터 (ID 2부터)
const MOCK_PRODUCTS: OfferingResponse[] = [
  {
    offeringId: 2,
    status: 'Active',
    statusLabel: '모집 완료',
    assetKey: 'SHUKA-2026',
    creator: { name: '슈카월드 (가상 데모)', platform: 'youtube', handle: '@syukaworld', imageUrl: 'https://unavatar.io/youtube/@syukaworld' },
    title: '경제/금융 채널 2026 상반기 광고 수익권',
    description: '대한민국 대표 경제 유튜브 채널 슈카월드의 2026년 상반기 예상 수익을 기반으로 한 안전 자산 성격의 상품입니다.',
    settlementCurrency: { symbol: 'mUSD', decimals: 6 },
    terms: { unitsForSale: 200, unitPrice: { raw: '100000000', decimals: 6, display: '100.000000' }, targetRaise: { raw: '20000000000', decimals: 6, display: '20000.000000' }, revenueShareBps: 1500, revenueSharePercent: 15.0, fundingDeadline: '2026-06-30T23:59:59Z', revenueStart: '2026-07-01T00:00:00Z', revenueEnd: '2026-12-31T23:59:59Z' }
  },
  {
    offeringId: 3,
    status: 'Funding',
    statusLabel: '모집 중',
    assetKey: 'TZUYANG-2028',
    creator: { name: '쯔양 (가상 데모)', platform: 'youtube', handle: '@tzuyang6145', imageUrl: 'https://unavatar.io/youtube/@tzuyang6145' },
    title: '글로벌 먹방 채널 글로벌 확장 펀딩',
    description: '해외 구독자 비율이 급증하고 있는 쯔양 채널의 글로벌 진출 펀딩을 위한 브릿지 상품입니다.',
    settlementCurrency: { symbol: 'mUSD', decimals: 6 },
    terms: { unitsForSale: 500, unitPrice: { raw: '100000000', decimals: 6, display: '100.000000' }, targetRaise: { raw: '50000000000', decimals: 6, display: '50000.000000' }, revenueShareBps: 2000, revenueSharePercent: 20.0, fundingDeadline: '2028-12-31T23:59:59Z', revenueStart: '2029-01-01T00:00:00Z', revenueEnd: '2029-12-31T23:59:59Z' }
  },
  // 더 많은 목업 데이터 생략...
];

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const fetchProducts = async (): Promise<OfferingResponse[]> => {
  try {
    // 백엔드에서 1번 상품(실제 컨트랙트 연동 데모)을 가져옵니다.
    const res = await fetch(`${API_BASE}/api/offerings/1`);
    if (res.ok) {
      const realProduct: OfferingResponse = await res.json();
      return [realProduct, ...MOCK_PRODUCTS];
    }
  } catch (error) {
    console.warn("Failed to fetch real product from backend", error);
  }
  return MOCK_PRODUCTS;
};

const fetchProduct = async (productId: string): Promise<OfferingResponse | null> => {
  try {
    if (productId === '1') {
      const res = await fetch(`${API_BASE}/api/offerings/1`);
      if (res.ok) return await res.json();
    } else {
      const mock = MOCK_PRODUCTS.find(p => p.offeringId.toString() === productId);
      if (mock) return mock;
    }
  } catch (error) {
    console.error("Failed to fetch product", error);
  }
  return null;
};

export function useProducts() {
  const { data: products, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
  });

  return { products: products || [], isLoading };
}

export function useProduct(productId: string | null) {
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => fetchProduct(productId!),
    enabled: !!productId,
  });

  return { product, isLoading };
}
